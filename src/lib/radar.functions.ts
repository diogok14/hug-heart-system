import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type {
  AnaliseIA,
  Empresa,
  Licitacao,
  Proposta,
  RadarDataset,
  SancaoCGU,
  Socio,
} from "@/data/radar";

const ANALISE_VAZIA: AnaliseIA = {
  tem_clausulas_restritivas: false,
  score_restricao: 0,
  motivos: [],
  exigencias_atipicas: [],
  sintese_objeto: "",
};

const num = (v: unknown) => Number(v ?? 0);

/**
 * Leitura pública do acervo do Radar (dados abertos): licitações, propostas,
 * auditoria de risco, empresas, QSA e sanções da CGU.
 */
export const carregarRadar = createServerFn({ method: "GET" }).handler(
  async (): Promise<RadarDataset> => {
    const url = process.env["SUPABASE_URL"]!;
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const db = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const [emp, soc, san, lic, pro, aud] = await Promise.all([
      db.from("empresas").select("*").order("razao_social"),
      db.from("socios").select("*"),
      db.from("sancoes_cgu").select("*"),
      db.from("licitacoes").select("*").order("id"),
      db.from("propostas_licitacao").select("*").order("classificacao"),
      db.from("auditoria_risco").select("*"),
    ]);

    const erro = [emp, soc, san, lic, pro, aud].find((r) => r.error)?.error;
    if (erro) throw new Error(`Falha ao carregar o acervo do Radar: ${erro.message}`);

    const empresas: Empresa[] = (emp.data ?? []).map((e) => ({
      cnpj: e.cnpj as string,
      razao_social: e.razao_social as string,
      ...(e.nome_fantasia ? { nome_fantasia: e.nome_fantasia as string } : {}),
      data_abertura: e.data_abertura as string,
      capital_social: num(e.capital_social),
      cnae_principal: e.cnae_principal as string,
      cnae_descricao: e.cnae_descricao as string,
      logradouro: e.logradouro as string,
      numero: e.numero as string,
      bairro: e.bairro as string,
      municipio: e.municipio as string,
      uf: e.uf as string,
      cep: e.cep as string,
      latitude: num(e.latitude),
      longitude: num(e.longitude),
      status_localizacao: e.status_localizacao as Empresa["status_localizacao"],
      places_estabelecimentos_raio_50m: num(e.places_estabelecimentos_raio_50m),
      fachada: e.fachada as Empresa["fachada"],
    }));

    const socios: Socio[] = (soc.data ?? []).map((s) => ({
      cnpj: s.cnpj as string,
      nome_socio: s.nome_socio as string,
      cpf_mascarado: s.cpf_mascarado as string,
      qualificacao_socio: s.qualificacao_socio as string,
      data_entrada: s.data_entrada as string,
    }));

    const sancoes: SancaoCGU[] = (san.data ?? []).map((s) => ({
      tipo_sancao: s.tipo_sancao as SancaoCGU["tipo_sancao"],
      cpf_cnpj_sancionado: s.cpf_cnpj_sancionado as string,
      nome_sancionado: s.nome_sancionado as string,
      orgao_sancionador: s.orgao_sancionador as string,
      motivo: s.motivo as string,
      data_inicio_sancao: s.data_inicio_sancao as string,
      ...(s.data_fim_sancao ? { data_fim_sancao: s.data_fim_sancao as string } : {}),
      ativo: Boolean(s.ativo),
    }));

    const propostasPorLicitacao = new Map<string, Proposta[]>();
    for (const p of pro.data ?? []) {
      const id = p.licitacao_id as string;
      const lista = propostasPorLicitacao.get(id) ?? [];
      lista.push({
        cnpj_fornecedor: p.cnpj_fornecedor as string,
        valor_proposta: num(p.valor_proposta),
        classificacao: num(p.classificacao),
        vencedora: Boolean(p.vencedora),
        desconto_percentual: num(p.desconto_percentual),
      });
      propostasPorLicitacao.set(id, lista);
    }

    const auditoriaPorLicitacao = new Map(
      (aud.data ?? []).map((a) => [a.licitacao_id as string, a]),
    );

    const licitacoes: Licitacao[] = (lic.data ?? []).map((l) => {
      const a = auditoriaPorLicitacao.get(l.id as string);
      return {
        id: l.id as string,
        numero_edital: l.numero_edital as string,
        orgao_comprador: l.orgao_comprador as string,
        municipio: l.municipio as string,
        municipio_ibge: l.municipio_ibge as string,
        uf: l.uf as string,
        modalidade: l.modalidade as string,
        objeto: l.objeto as string,
        valor_estimado: num(l.valor_estimado),
        valor_homologado: num(l.valor_homologado),
        data_publicacao: l.data_publicacao as string,
        data_homologacao: l.data_homologacao as string,
        link_edital_pdf: l.link_edital_pdf as string,
        propostas: propostasPorLicitacao.get(l.id as string) ?? [],
        auditoria: {
          fator_empresa_fantasma: num(a?.fator_empresa_fantasma),
          fator_tempo_constituicao: num(a?.fator_tempo_constituicao),
          fator_capital_desproporcional: num(a?.fator_capital_desproporcional),
          fator_conluio_societario: num(a?.fator_conluio_societario),
          fator_clausula_restritiva: num(a?.fator_clausula_restritiva),
          resumo_analise_ia: (a?.resumo_analise_ia as string) ?? "",
        },
        analise_ia: (a?.analise_ia as AnaliseIA | undefined) ?? ANALISE_VAZIA,
      };
    });

    return { empresas, socios, sancoes, licitacoes };
  },
);
