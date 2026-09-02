/**
 * Motor de score de risco — cálculo determinístico dos 5 fatores da
 * especificação a partir dos dados brutos (CNPJ Aberto, QSA, sanções CGU e
 * propostas do certame). Módulo puro: nenhum acesso a rede ou banco.
 */
import type { Empresa, Licitacao, SancaoCGU, Socio } from "@/data/radar";
import { diasEntre, formatBRL } from "@/data/radar";

export type FatorKey =
  | "fator_empresa_fantasma"
  | "fator_tempo_constituicao"
  | "fator_capital_desproporcional"
  | "fator_conluio_societario"
  | "fator_clausula_restritiva";

export interface ResultadoScore {
  fatores: Record<FatorKey, number>;
  evidencias: Record<FatorKey, string>;
  score: number;
  resumo: string;
}

export interface EntradaScore {
  licitacao: Pick<
    Licitacao,
    "propostas" | "data_publicacao" | "valor_homologado" | "valor_estimado" | "numero_edital"
  >;
  empresas: Empresa[];
  socios: Socio[];
  sancoes: SancaoCGU[];
  /** Score de restrição editalícia (0–15) produzido pela análise semântica de IA. */
  scoreRestricaoIA: number;
}

const clamp = (v: number, max: number) => Math.max(0, Math.min(max, Math.round(v)));

/** Fator 1 — indícios de empresa de fachada (0–25). */
function fantasma(e: Empresa | undefined): [number, string] {
  if (!e) return [0, "Empresa vencedora não localizada na base de CNPJ."];
  let p = 0;
  const notas: string[] = [];
  if (e.status_localizacao === "LOTE_VAGO") {
    p += 25;
    notas.push("endereço fiscal em lote vago");
  } else if (e.status_localizacao === "RESIDENCIA_UNIFAMILIAR") {
    p += 18;
    notas.push("endereço fiscal em residência unifamiliar");
  } else if (e.status_localizacao === "NAO_VALIDADO") {
    p += 6;
    notas.push("endereço fiscal ainda não validado geograficamente");
  }
  if (e.places_estabelecimentos_raio_50m === 0) {
    p += 5;
    notas.push("nenhum estabelecimento comercial em raio de 50 m");
  }
  if (e.fachada !== "comercial") {
    p += 4;
    notas.push(`fachada classificada como ${e.fachada}`);
  }
  return [
    clamp(p, 25),
    notas.length ? `Auditoria geográfica: ${notas.join("; ")}.` : "Estabelecimento comercial confirmado no endereço fiscal.",
  ];
}

/** Fator 2 — constituição recente em relação à publicação do edital (0–20). */
function tempoConstituicao(e: Empresa | undefined, dataPublicacao: string): [number, string] {
  if (!e) return [0, "Sem data de abertura disponível."];
  const dias = diasEntre(e.data_abertura, dataPublicacao);
  const escala: [number, number][] = [
    [90, 20],
    [180, 16],
    [365, 12],
    [730, 6],
  ];
  const faixa = escala.find(([limite]) => dias < limite);
  const pontos = faixa ? faixa[1] : 0;
  return [
    pontos,
    `Empresa constituída ${dias} dia(s) antes da publicação do edital.`,
  ];
}

/** Fator 3 — capacidade financeira incompatível com o valor adjudicado (0–20). */
function capital(e: Empresa | undefined, valorAdjudicado: number): [number, string] {
  if (!e || e.capital_social <= 0) return [0, "Capital social não informado."];
  const razao = valorAdjudicado / e.capital_social;
  const escala: [number, number][] = [
    [100, 20],
    [50, 17],
    [20, 13],
    [10, 8],
    [5, 4],
  ];
  const faixa = escala.find(([limite]) => razao >= limite);
  const pontos = faixa ? faixa[1] : 0;
  return [
    pontos,
    `Valor adjudicado (${formatBRL(valorAdjudicado, true)}) equivale a ${razao.toFixed(1)}x o capital social (${formatBRL(e.capital_social, true)}).`,
  ];
}

/** Fator 4 — vínculos societários, endereço comum e sanções vigentes (0–20). */
function conluio(entrada: EntradaScore, cnpjVencedor: string | undefined): [number, string] {
  const { licitacao, empresas, socios, sancoes } = entrada;
  const participantes = licitacao.propostas
    .map((p) => empresas.find((e) => e.cnpj === p.cnpj_fornecedor))
    .filter((e): e is Empresa => Boolean(e));
  let p = 0;
  const notas: string[] = [];

  for (let i = 0; i < participantes.length; i++) {
    for (let j = i + 1; j < participantes.length; j++) {
      const a = participantes[i] as Empresa;
      const b = participantes[j] as Empresa;
      const sa = socios.filter((s) => s.cnpj === a.cnpj);
      const sb = socios.filter((s) => s.cnpj === b.cnpj);
      const comum = sa.find((s) => sb.some((o) => o.cpf_mascarado === s.cpf_mascarado));
      if (comum) {
        p += 12;
        notas.push(`sócio em comum entre licitantes (${comum.nome_socio})`);
      } else if (a.cep === b.cep && a.numero === b.numero && a.logradouro === b.logradouro) {
        p += 8;
        notas.push("licitantes distintos declaram o mesmo endereço fiscal");
      }
    }
  }

  const cnpjs = new Set(participantes.map((e) => e.cnpj));
  const sancionadas = sancoes.filter((s) => s.ativo && cnpjs.has(s.cpf_cnpj_sancionado));
  if (sancionadas.length) {
    p += 10;
    notas.push(
      `${sancionadas.length} sanção(ões) vigente(s) da CGU (${[...new Set(sancionadas.map((s) => s.tipo_sancao))].join(", ")})`,
    );
  }
  if (cnpjVencedor && sancionadas.some((s) => s.cpf_cnpj_sancionado === cnpjVencedor)) {
    p += 6;
    notas.push("a empresa vencedora possui sanção vigente");
  }

  return [
    clamp(p, 20),
    notas.length
      ? `Cruzamento QSA/CGU: ${[...new Set(notas)].join("; ")}.`
      : "Nenhum vínculo societário, endereço comum ou sanção vigente entre os licitantes.",
  ];
}

export function calcularScore(entrada: EntradaScore): ResultadoScore {
  const vencedora =
    entrada.licitacao.propostas.find((p) => p.vencedora) ?? entrada.licitacao.propostas[0];
  const empresa = vencedora
    ? entrada.empresas.find((e) => e.cnpj === vencedora.cnpj_fornecedor)
    : undefined;
  const valorAdjudicado =
    vencedora?.valor_proposta || entrada.licitacao.valor_homologado || entrada.licitacao.valor_estimado;

  const [f1, e1] = fantasma(empresa);
  const [f2, e2] = tempoConstituicao(empresa, entrada.licitacao.data_publicacao);
  const [f3, e3] = capital(empresa, valorAdjudicado);
  const [f4, e4] = conluio(entrada, vencedora?.cnpj_fornecedor);
  const f5 = clamp(entrada.scoreRestricaoIA, 15);

  const fatores: Record<FatorKey, number> = {
    fator_empresa_fantasma: f1,
    fator_tempo_constituicao: f2,
    fator_capital_desproporcional: f3,
    fator_conluio_societario: f4,
    fator_clausula_restritiva: f5,
  };
  const score = f1 + f2 + f3 + f4 + f5;

  const criticos = [
    f1 >= 15 ? "indícios de empresa de fachada" : null,
    f2 >= 12 ? "empresa constituída às vésperas do certame" : null,
    f3 >= 13 ? "capacidade financeira incompatível" : null,
    f4 >= 8 ? "vínculos societários ou sanções vigentes" : null,
    f5 >= 8 ? "cláusulas editalícias restritivas" : null,
  ].filter(Boolean) as string[];

  return {
    fatores,
    evidencias: {
      fator_empresa_fantasma: e1,
      fator_tempo_constituicao: e2,
      fator_capital_desproporcional: e3,
      fator_conluio_societario: e4,
      fator_clausula_restritiva:
        f5 > 0
          ? `Análise semântica do edital atribuiu ${f5}/15 ao risco de direcionamento.`
          : "Nenhuma exigência atípica relevante identificada no edital.",
    },
    score,
    resumo: criticos.length
      ? `Score ${score}/100 calculado sobre dados abertos. Alertas predominantes: ${criticos.join("; ")}.`
      : `Score ${score}/100 calculado sobre dados abertos. Nenhum alerta predominante identificado.`,
  };
}
