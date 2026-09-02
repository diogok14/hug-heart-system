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
  limite: z.number().int().min(1).max(200).default(50),
});

export const ingerirContratacoes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => entradaIngestao.parse(input))
  .handler(async ({ data }) => {
    const params = new URLSearchParams({
      pagina: "1",
      tamanhoPagina: String(Math.max(10, Math.min(500, data.limite))),
      dataPublicacaoPncpInicial: data.dataInicial,
      dataPublicacaoPncpFinal: data.dataFinal,
      codigoModalidade: String(data.codigoModalidade),
    });

    const resp = await fetch(`${API_CONTRATACOES}?${params.toString()}`, {
      headers: { accept: "application/json" },
    });
    if (!resp.ok) {
      throw new Error(
        `Fonte de dados abertos indisponível (HTTP ${resp.status}). Tente outro intervalo de datas.`,
      );
    }

    const payload = (await resp.json()) as { resultado?: Record<string, unknown>[] };
    const bruto = payload.resultado ?? [];

    const filtrado = data.uf
      ? bruto.filter((r) => String(r["unidadeOrgaoUfSigla"] ?? "") === data.uf)
      : bruto;

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
 * Enriquecimento cadastral: consulta CNPJ + QSA na base da Receita Federal e
 * grava/atualiza `empresas` e `socios`.
 */
export const enriquecerEmpresa = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ cnpj: z.string().min(14) }).parse(input),
  )
  .handler(async ({ data }) => {
    const cnpj = data.cnpj.replace(/\D/g, "");
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
  });

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
    const key = process.env["GOOGLE_MAPS_API_KEY"];
    if (!key) throw new Error("Chave da Google Maps Platform não configurada no ambiente.");
    const cnpj = data.cnpj.replace(/\D/g, "");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: emp, error } = await supabaseAdmin
      .from("empresas")
      .select("*")
      .eq("cnpj", cnpj)
      .maybeSingle();
    if (error) throw new Error(`Falha ao ler a empresa: ${error.message}`);
    if (!emp) throw new Error("Empresa não encontrada no acervo.");

    const endereco = `${emp.logradouro}, ${emp.numero} - ${emp.bairro}, ${emp.municipio} - ${emp.uf}, ${emp.cep}, Brasil`;

    const geoResp = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(endereco)}&region=br&key=${key}`,
    );
    const geo = (await geoResp.json()) as {
      status: string;
      results?: {
        geometry: { location: { lat: number; lng: number }; location_type: string };
        formatted_address: string;
      }[];
    };
    const primeiro = geo.results?.[0];
    if (geo.status !== "OK" || !primeiro) {
      throw new Error(`Geocodificação sem resultado para o endereço fiscal (${geo.status}).`);
    }

    const { lat, lng } = primeiro.geometry.location;
    const precisao = primeiro.geometry.location_type;

    const placesResp = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=50&type=establishment&key=${key}`,
    );
    const places = (await placesResp.json()) as {
      status: string;
      results?: { name: string; types?: string[] }[];
    };
    const estabelecimentos = places.results ?? [];

    const svResp = await fetch(
      `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${key}`,
    );
    const sv = (await svResp.json()) as { status: string };
    const temImagem = sv.status === "OK";

    let status_localizacao: string;
    let fachada: string;
    if (estabelecimentos.length >= 1) {
      status_localizacao = "ESTABELECIMENTO_CONFIRMADO";
      fachada = "comercial";
    } else if (temImagem) {
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
