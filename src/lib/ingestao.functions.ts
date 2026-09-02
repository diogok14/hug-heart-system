import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Ingestão de dados abertos reais e auditoria geográfica.
 *
 * Fontes:
 *  - Contratações Lei 14.133/2021 (PNCP) via API de Dados Abertos de Compras (MGI)
 *  - CNPJ + QSA (Receita Federal) via API pública de consulta
 *  - Google Maps Platform: Geocoding, Places (raio de 50 m) e Street View
 */

const API_CONTRATACOES =
  "https://dadosabertos.compras.gov.br/modulo-contratacoes/1_consultarContratacoes_PNCP_14133";

/** Prefixo que identifica registros vindos de ingestão real (vs. acervo de demonstração). */
export const PREFIXO_REAL = "PNCP-";

const dia = (iso: string | null | undefined, fallback: string) =>
  iso ? String(iso).slice(0, 10) : fallback;

const entradaIngestao = z.object({
  dataInicial: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dataFinal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  codigoModalidade: z.number().int().min(1).max(14).default(6),
  uf: z.string().length(2).optional(),
  comprador: z.string().optional(),
  limite: z.number().int().min(1).max(200).default(50),
});

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/**
 * Sugestões de órgãos compradores para o filtro: lê os órgãos realmente
 * publicados na fonte (PNCP) para o intervalo/modalidade/UF escolhidos e
 * complementa com os órgãos já presentes no acervo.
 */
export const sugerirCompradores = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        termo: z.string().default(""),
        uf: z.string().optional(),
        dataInicial: z
          .string()
          .optional()
          .transform((v) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined)),
        dataFinal: z
          .string()
          .optional()
          .transform((v) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined)),
        codigoModalidade: z.number().int().min(1).max(14).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const termo = normalizar(data.termo);
    const vistos = new Set<string>();
    const sugestoes: string[] = [];

    const adicionar = (nome: string) => {
      const limpo = nome.trim();
      if (!limpo || limpo === "Não informado") return;
      const chave = normalizar(limpo);
      if (vistos.has(chave)) return;
      if (termo.length >= 2 && !chave.includes(termo)) return;
      vistos.add(chave);
      sugestoes.push(limpo);
    };

    // 1) Órgãos publicados na fonte no período consultado.
    //    A fonte não filtra por UF/nome, então é preciso varrer todas as
    //    páginas do período: sem isso, apenas os ~500 primeiros registros
    //    apareciam e municípios menores ficavam de fora da lista.
    if (data.dataInicial && data.dataFinal && data.codigoModalidade) {
      const buscarPagina = async (pagina: number) => {
        const params = new URLSearchParams({
          pagina: String(pagina),
          tamanhoPagina: "500",
          dataPublicacaoPncpInicial: data.dataInicial!,
          dataPublicacaoPncpFinal: data.dataFinal!,
          codigoModalidade: String(data.codigoModalidade),
        });
        const resp = await fetch(`${API_CONTRATACOES}?${params.toString()}`, {
          headers: { accept: "application/json" },
        });
        if (!resp.ok) return null;
        return (await resp.json()) as {
          resultado?: Record<string, unknown>[];
          totalPaginas?: number;
        };
      };

      const absorver = (registros: Record<string, unknown>[]) => {
        for (const r of registros) {
          if (data.uf && String(r["unidadeOrgaoUfSigla"] ?? "") !== data.uf) continue;
          adicionar(String(r["orgaoEntidadeRazaoSocial"] ?? ""));
          adicionar(String(r["unidadeOrgaoNomeUnidade"] ?? ""));
        }
      };

      try {
        const primeira = await buscarPagina(1);
        if (primeira) {
          absorver(primeira.resultado ?? []);
          const total = Math.min(Number(primeira.totalPaginas ?? 1), 40);
          const LOTE = 6;
          for (let inicio = 2; inicio <= total; inicio += LOTE) {
            const paginas = [];
            for (let p = inicio; p < inicio + LOTE && p <= total; p += 1) {
              paginas.push(buscarPagina(p));
            }
            const respostas = await Promise.all(paginas);
            for (const r of respostas) if (r) absorver(r.resultado ?? []);
          }
        }
      } catch {
        // fonte indisponível: segue com o acervo local
      }
    }

    // 2) Complementa com o acervo já ingerido.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("licitacoes").select("orgao_comprador, uf").limit(400);
    if (data.uf && data.uf.length === 2) q = q.eq("uf", data.uf);
    if (termo.length >= 2) q = q.ilike("orgao_comprador", `%${data.termo.trim()}%`);
    const { data: linhas } = await q;
    for (const l of linhas ?? []) adicionar(String(l.orgao_comprador ?? ""));

    return {
      sugestoes: sugestoes.sort((a, b) => a.localeCompare(b, "pt-BR")).slice(0, 300),
    };

  });


export const ingerirContratacoes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => entradaIngestao.parse(input))
  .handler(async ({ data }) => {
    const termoComprador = normalizar(data.comprador ?? "");
    const combina = (r: Record<string, unknown>) => {
      if (data.uf && String(r["unidadeOrgaoUfSigla"] ?? "") !== data.uf) return false;
      if (termoComprador.length >= 2) {
        const nomes = normalizar(
          `${String(r["orgaoEntidadeRazaoSocial"] ?? "")} ${String(r["unidadeOrgaoNomeUnidade"] ?? "")}`,
        );
        if (!nomes.includes(termoComprador)) return false;
      }
      return true;
    };

    const bruto: Record<string, unknown>[] = [];
    const filtrado: Record<string, unknown>[] = [];
    let totalPaginas = 1;

    // Varre as páginas do período até completar o limite pedido: o filtro por
    // UF/comprador é aplicado localmente, então parar na 1ª página deixaria
    // órgãos menores de fora.
    for (let pagina = 1; pagina <= Math.min(totalPaginas, 40); pagina += 1) {
      const params = new URLSearchParams({
        pagina: String(pagina),
        tamanhoPagina: "500",
        dataPublicacaoPncpInicial: data.dataInicial,
        dataPublicacaoPncpFinal: data.dataFinal,
        codigoModalidade: String(data.codigoModalidade),
      });
      const resp = await fetch(`${API_CONTRATACOES}?${params.toString()}`, {
        headers: { accept: "application/json" },
      });
      if (!resp.ok) {
        if (pagina === 1) {
          throw new Error(
            `Fonte de dados abertos indisponível (HTTP ${resp.status}). Tente outro intervalo de datas.`,
          );
        }
        break;
      }
      const payload = (await resp.json()) as {
        resultado?: Record<string, unknown>[];
        totalPaginas?: number;
      };
      if (pagina === 1) totalPaginas = Number(payload.totalPaginas ?? 1);
      const registros = payload.resultado ?? [];
      bruto.push(...registros);
      filtrado.push(...registros.filter(combina));
      if (filtrado.length >= data.limite || registros.length === 0) break;
    }


    const linhas = filtrado.slice(0, data.limite).map((r) => {
      const publicacao = dia(r["dataPublicacaoPncp"] as string, new Date().toISOString());
      const homologacao = dia(r["dataEncerramentoPropostaPncp"] as string, publicacao);
      const controle = String(r["numeroControlePNCP"] ?? r["idCompra"] ?? "");
      return {
        id: `${PREFIXO_REAL}${controle}`,
        numero_edital: `${String(r["numeroCompra"] ?? "s/n")}/${String(r["anoCompraPncp"] ?? "")}`,
        orgao_comprador: String(
          r["orgaoEntidadeRazaoSocial"] ?? r["unidadeOrgaoNomeUnidade"] ?? "Não informado",
        ),
        municipio: String(r["unidadeOrgaoMunicipioNome"] ?? "Não informado"),
        municipio_ibge: String(r["unidadeOrgaoCodigoIbge"] ?? ""),
        uf: String(r["unidadeOrgaoUfSigla"] ?? "BR"),
        modalidade: String(r["modalidadeNome"] ?? "Não informada"),
        objeto: String(r["objetoCompra"] ?? "Objeto não informado").slice(0, 900),
        valor_estimado: Number(r["valorTotalEstimado"] ?? 0),
        valor_homologado: Number(r["valorTotalHomologado"] ?? 0),
        data_publicacao: publicacao,
        data_homologacao: homologacao,
        link_edital_pdf: `https://pncp.gov.br/app/editais/${String(r["orgaoEntidadeCnpj"] ?? "")}/${String(r["anoCompraPncp"] ?? "")}/${String(r["sequencialCompraPncp"] ?? "")}`,
      };
    });

    if (linhas.length === 0) return { ingeridos: 0, totalFonte: bruto.length };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("licitacoes")
      .upsert(linhas, { onConflict: "id" });
    if (error) throw new Error(`Falha ao gravar as contratações: ${error.message}`);

    return { ingeridos: linhas.length, totalFonte: bruto.length };
  });

/**
 * Busca CNPJ + QSA nos espelhos públicos da Receita Federal e grava/atualiza
 * `empresas` e `socios`. Reutilizado pelo enriquecimento e pela auditoria.
 */
async function sincronizarEmpresa(cnpjBruto: string) {
  const cnpj = cnpjBruto.replace(/\D/g, "");
  if (cnpj.length !== 14) throw new Error("Informe um CNPJ válido com 14 dígitos.");

  // Espelhos públicos do mesmo conjunto aberto de CNPJ/QSA da Receita Federal.
  const espelhos = [
    `https://minhareceita.org/${cnpj}`,
    `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`,
  ];

  let c: Record<string, unknown> | null = null;
  let ultimoStatus = 0;
  for (const url of espelhos) {
    try {
      const resp = await fetch(url, { headers: { accept: "application/json" } });
      ultimoStatus = resp.status;
      if (resp.status === 404) {
        throw new Error("CNPJ não localizado na base da Receita Federal.");
      }
      if (!resp.ok) continue;
      c = (await resp.json()) as Record<string, unknown>;
      break;
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("CNPJ não localizado")) throw e;
    }
  }
  if (!c) throw new Error(`Base de CNPJ indisponível (HTTP ${ultimoStatus || 0}).`);

  const empresa = {
    cnpj,
    razao_social: String(c["razao_social"] ?? "Não informada"),
    nome_fantasia: (c["nome_fantasia"] as string) || null,
    data_abertura: dia(c["data_inicio_atividade"] as string, "1900-01-01"),
    capital_social: Number(c["capital_social"] ?? 0),
    cnae_principal: String(c["cnae_fiscal"] ?? ""),
    cnae_descricao: String(c["cnae_fiscal_descricao"] ?? ""),
    logradouro: `${String(c["descricao_tipo_de_logradouro"] ?? "")} ${String(c["logradouro"] ?? "")}`.trim(),
    numero: String(c["numero"] ?? "S/N"),
    bairro: String(c["bairro"] ?? ""),
    municipio: String(c["municipio"] ?? ""),
    uf: String(c["uf"] ?? ""),
    cep: String(c["cep"] ?? ""),
    latitude: 0,
    longitude: 0,
    status_localizacao: "NAO_VALIDADO",
    places_estabelecimentos_raio_50m: 0,
    fachada: "comercial",
  };

  const qsa = Array.isArray(c["qsa"]) ? (c["qsa"] as Record<string, unknown>[]) : [];
  const socios = qsa.map((s) => ({
    cnpj,
    nome_socio: String(s["nome_socio"] ?? "Não informado"),
    cpf_mascarado: String(s["cnpj_cpf_do_socio"] ?? "***"),
    qualificacao_socio: String(s["qualificacao_socio"] ?? "Sócio"),
    data_entrada: dia(s["data_entrada_sociedade"] as string, empresa.data_abertura),
  }));

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const up = await supabaseAdmin.from("empresas").upsert(empresa, { onConflict: "cnpj" });
  if (up.error) throw new Error(`Falha ao gravar a empresa: ${up.error.message}`);

  if (socios.length > 0) {
    await supabaseAdmin.from("socios").delete().eq("cnpj", cnpj);
    const ins = await supabaseAdmin.from("socios").insert(socios);
    if (ins.error) throw new Error(`Falha ao gravar o QSA: ${ins.error.message}`);
  }

  return {
    cnpj,
    razao_social: empresa.razao_social,
    socios: socios.length,
    capital_social: empresa.capital_social,
    data_abertura: empresa.data_abertura,
  };
}

/**
 * Enriquecimento cadastral: consulta CNPJ + QSA na base da Receita Federal e
 * grava/atualiza `empresas` e `socios`.
 */
export const enriquecerEmpresa = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ cnpj: z.string().min(14) }).parse(input),
  )
  .handler(async ({ data }) => sincronizarEmpresa(data.cnpj));


/**
 * Auditoria geográfica real: geocodifica o endereço fiscal, conta
 * estabelecimentos comerciais em raio de 50 m (Places) e verifica cobertura
 * de imagem (Street View) para classificar a fachada.
 */
export const auditarLocalizacao = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ cnpj: z.string().min(14) }).parse(input),
  )
  .handler(async ({ data }) => {
    // Conexão gerenciada do Google Maps: as chamadas vão pelo gateway, que
    // injeta a credencial de servidor (sem restrição por referenciador HTTP).
    const gateway = "https://connector-gateway.lovable.dev/google_maps";
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const connKey = process.env["GOOGLE_MAPS_API_KEY"];
    if (!lovableKey || !connKey) {
      throw new Error("Conexão da Google Maps Platform não configurada no ambiente.");
    }
    const auth = {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": connKey,
    };
    const cnpj = data.cnpj.replace(/\D/g, "");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ler = async () =>
      await supabaseAdmin.from("empresas").select("*").eq("cnpj", cnpj).maybeSingle();

    let { data: emp, error } = await ler();
    if (error) throw new Error(`Falha ao ler a empresa: ${error.message}`);

    // Empresa ainda não catalogada: sincroniza o cadastro público antes de auditar.
    if (!emp) {
      await sincronizarEmpresa(cnpj);
      ({ data: emp, error } = await ler());
      if (error) throw new Error(`Falha ao ler a empresa: ${error.message}`);
      if (!emp) throw new Error("Não foi possível catalogar a empresa para auditoria.");
    }

    const endereco = `${emp.logradouro}, ${emp.numero} - ${emp.bairro}, ${emp.municipio} - ${emp.uf}, ${emp.cep}, Brasil`;

    const geoResp = await fetch(
      `${gateway}/maps/api/geocode/json?address=${encodeURIComponent(endereco)}&region=br`,
      { headers: auth },
    );
    if (!geoResp.ok) {
      throw new Error(
        `Geocodificação falhou no gateway [${geoResp.status}]: ${await geoResp.text()}`,
      );
    }
    const geo = (await geoResp.json()) as {
      status: string;
      error_message?: string;
      results?: {
        geometry: { location: { lat: number; lng: number }; location_type: string };
        formatted_address: string;
      }[];
    };
    const primeiro = geo.results?.[0];
    if (geo.status !== "OK" || !primeiro) {
      throw new Error(
        `Geocodificação sem resultado para o endereço fiscal (${geo.status}).${geo.error_message ? " " + geo.error_message : ""}`,
      );
    }

    const { lat, lng } = primeiro.geometry.location;
    const precisao = primeiro.geometry.location_type;

    // Places API (New): estabelecimentos em raio de 50 m.
    const placesResp = await fetch(`${gateway}/places/v1/places:searchNearby`, {
      method: "POST",
      headers: {
        ...auth,
        "Content-Type": "application/json",
        "X-Goog-FieldMask": "places.displayName,places.types",
      },
      body: JSON.stringify({
        locationRestriction: {
          circle: { center: { latitude: lat, longitude: lng }, radius: 50 },
        },
        maxResultCount: 20,
      }),
    });
    if (!placesResp.ok) {
      throw new Error(
        `Consulta de estabelecimentos (Places) falhou [${placesResp.status}]: ${await placesResp.text()}`,
      );
    }
    const places = (await placesResp.json()) as {
      places?: { displayName?: { text?: string }; types?: string[] }[];
    };
    const estabelecimentos = (places.places ?? []).map((p) => ({
      name: p.displayName?.text ?? "Estabelecimento sem nome",
      types: p.types,
    }));

    const svResp = await fetch(
      `${gateway}/maps/api/streetview/metadata?location=${lat},${lng}`,
      { headers: auth },
    );
    // Street View é complementar: se a credencial não cobrir esse serviço, a
    // auditoria segue apenas com geocodificação + Places.
    const sv = svResp.ok ? ((await svResp.json()) as { status?: string }) : { status: "ERROR" };
    const svDisponivel = sv.status === "OK" || sv.status === "ZERO_RESULTS";
    const temImagem = sv.status === "OK";


    let status_localizacao: string;
    let fachada: string;
    if (estabelecimentos.length >= 1) {
      status_localizacao = "ESTABELECIMENTO_CONFIRMADO";
      fachada = "comercial";
    } else if (temImagem || !svDisponivel) {
      status_localizacao = "RESIDENCIA_UNIFAMILIAR";
      fachada = "residencial";
    } else {
      status_localizacao = "LOTE_VAGO";
      fachada = "lote-vago";
    }

    const upd = await supabaseAdmin
      .from("empresas")
      .update({
        latitude: lat,
        longitude: lng,
        status_localizacao,
        places_estabelecimentos_raio_50m: estabelecimentos.length,
        fachada,
      })
      .eq("cnpj", cnpj);
    if (upd.error) throw new Error(`Falha ao gravar a auditoria: ${upd.error.message}`);

    return {
      cnpj,
      razao_social: emp.razao_social,
      endereco_normalizado: primeiro.formatted_address,
      precisao,
      latitude: lat,
      longitude: lng,
      estabelecimentos_50m: estabelecimentos.length,
      vizinhos: estabelecimentos.slice(0, 5).map((e) => e.name),
      street_view: temImagem,
      status_localizacao,
      fachada,
    };
  });
