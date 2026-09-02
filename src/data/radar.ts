/**
 * Radar de Integridade — camada de dados mock integrando as 5 fontes
 * governamentais mapeadas na especificação:
 *  1. Portal da Transparência / Transferegov (MGI)  -> licitacoes, propostas
 *  2. CNPJ Aberto (Receita Federal)                 -> empresas
 *  3. QSA (Receita Federal)                         -> socios
 *  4/5. Sanções CGU (CEIS, CNEP, CEPIM)             -> sancoes
 * Estruturas espelham o DDL PostgreSQL da especificação técnica.
 */

export type RiskLevel = "BAIXO" | "MEDIO" | "ALTO" | "CRITICO";

export interface Empresa {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  data_abertura: string;
  capital_social: number;
  cnae_principal: string;
  cnae_descricao: string;
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  latitude: number;
  longitude: number;
  status_localizacao:
    | "NAO_VALIDADO"
    | "ESTABELECIMENTO_CONFIRMADO"
    | "RESIDENCIA_UNIFAMILIAR"
    | "LOTE_VAGO";
  places_estabelecimentos_raio_50m: number;
  fachada: "comercial" | "residencial" | "lote-vago";
}

export interface Socio {
  cnpj: string;
  nome_socio: string;
  cpf_mascarado: string;
  qualificacao_socio: string;
  data_entrada: string;
}

export interface SancaoCGU {
  tipo_sancao: "CEIS" | "CNEP" | "CEPIM";
  cpf_cnpj_sancionado: string;
  nome_sancionado: string;
  orgao_sancionador: string;
  motivo: string;
  data_inicio_sancao: string;
  data_fim_sancao?: string;
  ativo: boolean;
}

export interface Proposta {
  cnpj_fornecedor: string;
  valor_proposta: number;
  classificacao: number;
  vencedora: boolean;
  desconto_percentual: number;
}

export interface AnaliseIA {
  tem_clausulas_restritivas: boolean;
  score_restricao: number;
  motivos: string[];
  exigencias_atipicas: { clausula: string; impacto_concorrencia: string }[];
  sintese_objeto: string;
}

export interface Licitacao {
  id: string;
  numero_edital: string;
  orgao_comprador: string;
  municipio: string;
  municipio_ibge: string;
  uf: string;
  modalidade: string;
  objeto: string;
  valor_estimado: number;
  valor_homologado: number;
  data_publicacao: string;
  data_homologacao: string;
  link_edital_pdf: string;
  propostas: Proposta[];
  auditoria: {
    fator_empresa_fantasma: number;
    fator_tempo_constituicao: number;
    fator_capital_desproporcional: number;
    fator_conluio_societario: number;
    fator_clausula_restritiva: number;
    resumo_analise_ia: string;
    /** Evidência textual por fator, produzida pelo motor de score server-side. */
    evidencias?: Partial<Record<string, string>>;
  };

  analise_ia: AnaliseIA;
}

export const FATORES = [
  { key: "fator_empresa_fantasma", label: "Empresa de fachada / fantasma", peso: 25 },
  { key: "fator_tempo_constituicao", label: "Constituição temporal recente", peso: 20 },
  { key: "fator_capital_desproporcional", label: "Capacidade financeira incompatível", peso: 20 },
  { key: "fator_conluio_societario", label: "Vínculos societários & conluio", peso: 20 },
  { key: "fator_clausula_restritiva", label: "Direcionamento editalício (IA)", peso: 15 },
] as const;

export const FONTES_DADOS = [
  { sigla: "Transferegov / Portal da Transparência", orgao: "MGI" },
  { sigla: "CNPJ Aberto & QSA", orgao: "Receita Federal" },
  { sigla: "CEIS", orgao: "CGU" },
  { sigla: "CNEP", orgao: "CGU" },
  { sigla: "CEPIM", orgao: "CGU" },
];

export interface RadarDataset {
  empresas: Empresa[];
  socios: Socio[];
  sancoes: SancaoCGU[];
  licitacoes: Licitacao[];
}

export function scoreOf(l: Licitacao): number {
  const a = l.auditoria;
  return (
    a.fator_empresa_fantasma +
    a.fator_tempo_constituicao +
    a.fator_capital_desproporcional +
    a.fator_conluio_societario +
    a.fator_clausula_restritiva
  );
}

export function riskLevelOf(score: number): RiskLevel {
  if (score >= 80) return "CRITICO";
  if (score >= 60) return "ALTO";
  if (score >= 30) return "MEDIO";
  return "BAIXO";
}

export const RISK_META: Record<
  RiskLevel,
  { label: string; faixa: string; token: string; soft: string }
> = {
  BAIXO: { label: "Baixo", faixa: "0\u201329", token: "risk-low", soft: "risk-low-soft" },
  MEDIO: { label: "Moderado", faixa: "30\u201359", token: "risk-medium", soft: "risk-medium-soft" },
  ALTO: { label: "Alto", faixa: "60\u201379", token: "risk-high", soft: "risk-high-soft" },
  CRITICO: {
    label: "Cr\u00edtico",
    faixa: "80\u2013100",
    token: "risk-critical",
    soft: "risk-critical-soft",
  },
};

const PROPOSTA_VAZIA: Proposta = {
  cnpj_fornecedor: "",
  valor_proposta: 0,
  classificacao: 0,
  vencedora: false,
  desconto_percentual: 0,
};

export function vencedora(l: Licitacao): Proposta {
  return l.propostas.find((p) => p.vencedora) ?? l.propostas[0] ?? PROPOSTA_VAZIA;
}


export function diasEntre(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function formatCNPJ(cnpj: string): string {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

/** Formatação determinística (idêntica no servidor e no navegador, evitando divergência de ICU). */
export function formatBRL(v: number, compact = false): string {
  if (compact) {
    const escalas: Array<[number, string]> = [
      [1_000_000_000, " bi"],
      [1_000_000, " mi"],
      [1_000, " mil"],
    ];
    for (const [divisor, sufixo] of escalas) {
      if (Math.abs(v) >= divisor) {
        const n = v / divisor;
        return `R$ ${n.toFixed(1).replace(".", ",")}${sufixo}`;
      }
    }
    return `R$ ${v.toFixed(0)}`;
  }
  const [inteiro, decimal] = Math.abs(v).toFixed(2).split(".");
  const milhares = (inteiro ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${v < 0 ? "-" : ""}R$ ${milhares},${decimal}`;
}

export function formatDate(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}


/** Pares de licitantes com s\u00f3cio ou endere\u00e7o em comum (base do grafo de conluio). */
export interface VinculoAresta {
  a: string;
  b: string;
  tipo: "socio_comum" | "endereco_comum";
  detalhe: string;
  licitacao?: string | undefined;
}

export function arestasVinculosDe(ds: RadarDataset): VinculoAresta[] {
  const out: VinculoAresta[] = [];
  const { empresas, socios, licitacoes } = ds;
  for (let i = 0; i < empresas.length; i++) {
    for (let j = i + 1; j < empresas.length; j++) {
      const e1 = empresas[i] as Empresa;
      const e2 = empresas[j] as Empresa;
      const s1 = socios.filter((s) => s.cnpj === e1.cnpj);
      const s2 = socios.filter((s) => s.cnpj === e2.cnpj);
      const comum = s1.find((s) => s2.some((o) => o.cpf_mascarado === s.cpf_mascarado));
      const certame = licitacoes.find(
        (l) =>
          l.propostas.some((p) => p.cnpj_fornecedor === e1.cnpj) &&
          l.propostas.some((p) => p.cnpj_fornecedor === e2.cnpj),
      );
      if (comum) {
        out.push({
          a: e1.cnpj,
          b: e2.cnpj,
          tipo: "socio_comum",
          detalhe: `S\u00f3cio em comum: ${comum.nome_socio} (${comum.cpf_mascarado})`,
          licitacao: certame?.numero_edital,
        });
      } else if (
        e1.cep === e2.cep &&
        e1.numero === e2.numero &&
        e1.logradouro === e2.logradouro
      ) {
        out.push({
          a: e1.cnpj,
          b: e2.cnpj,
          tipo: "endereco_comum",
          detalhe: `Mesmo endere\u00e7o fiscal: ${e1.logradouro}, ${e1.numero} \u2014 ${e1.municipio}/${e1.uf}`,
          licitacao: certame?.numero_edital,
        });
      }
    }
  }
  return out;
}
