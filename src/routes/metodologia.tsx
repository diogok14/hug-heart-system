import { createFileRoute } from "@tanstack/react-router";
import { Bot, MapPinned, ScrollText } from "lucide-react";
import { RiskBadge } from "@/components/radar/RiskBadge";
import { BadgeProveniencia } from "@/components/radar/BadgeProveniencia";
import { PageHeader } from "@/components/radar/PageHeader";
import { FATORES, RISK_META, type RiskLevel } from "@/data/radar";

export const Route = createFileRoute("/metodologia")({
  head: () => ({
    meta: [
      { title: "Metodologia e Fontes — Radar de Integridade" },
      {
        name: "description",
        content:
          "Como o score de risco de 0 a 100 é calculado: cinco dimensões analíticas, gatilhos algorítmicos, auditoria geográfica e análise semântica de editais.",
      },
      { property: "og:title", content: "Metodologia e Fontes — Radar de Integridade" },
      {
        property: "og:description",
        content:
          "Pesos, gatilhos e fontes de dados abertos que sustentam o score preditivo de risco em licitações.",
      },
    ],
  }),
  component: Metodologia,
});

const GATILHOS: Record<string, string> = {
  fator_empresa_fantasma:
    "Street View aponta lote vago ou residência unifamiliar modesta e Places API não indica estabelecimento comercial ativo no raio de 50 m, em contrato acima de R$ 500 mil.",
  fator_tempo_constituicao:
    "Abertura da empresa inferior a 180 dias antes da publicação do edital, ou alteração recente de CNAE específica para o escopo licitado.",
  fator_capital_desproporcional:
    "Valor adjudicado supera em mais de 20 vezes o capital social integralizado da vencedora.",
  fator_conluio_societario:
    "Concorrentes no mesmo certame compartilham sócios, procuradores ou endereço fiscal cadastrado.",
  fator_clausula_restritiva:
    "Análise semântica identifica exigências excessivas de habilitação técnica, prazos exíguos, amostras preliminares ou direcionamento de marca.",
};

function Metodologia() {
  return (
    <div className="space-y-6">
      <PageHeader
        modulo="Nota técnica"
        titulo="Metodologia do score preditivo"
        descricao="O Score Geral de Risco (0 a 100) resulta da soma ponderada de cinco dimensões analíticas, calculadas por heurísticas determinísticas sobre dados abertos e por análise semântica dos editais."
        meta="Documento metodológico · indícios de risco não constituem juízo de mérito sobre a regularidade do certame"
      />

      <section className="panel divide-y">
        {FATORES.map((f) => (
          <div key={f.key} className="flex flex-wrap gap-4 p-5">
            <div className="min-w-[220px] flex-1">
              <p className="text-sm font-semibold">{f.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{GATILHOS[f.key]}</p>
            </div>
            <span className="tabular self-start rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground">
              até {f.peso} pts
            </span>
          </div>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(RISK_META) as RiskLevel[]).map((nivel) => (
          <div key={nivel} className="panel p-5">
            <RiskBadge level={nivel} />
            <p className="tabular mt-3 text-lg font-semibold">{RISK_META[nivel].faixa} pontos</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {nivel === "BAIXO" && "Conformidade cadastral e editalícia íntegra."}
              {nivel === "MEDIO" && "Divergências pontuais de capital social ou data de abertura."}
              {nivel === "ALTO" &&
                "Sobreposição societária ou endereço suspeito em contratos relevantes."}
              {nivel === "CRITICO" &&
                "Múltiplos indícios concomitantes: empresa recém-aberta, sem fachada e ligada a concorrentes."}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <MapPinned className="size-4 text-primary" aria-hidden /> Auditoria geográfica
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Geocoding API:</strong> converte o endereço
              fiscal da Receita Federal em latitude/longitude.
            </li>
            <li>
              <strong className="text-foreground">Places API:</strong> busca estabelecimentos
              comerciais indexados no raio de 50 m compatíveis com o CNAE principal.
            </li>
            <li>
              <strong className="text-foreground">Street View Static API:</strong> gera a imagem da
              fachada embutida no dossiê, dispensando deslocamento de fiscais.
            </li>
          </ul>
        </div>

        <div className="panel p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Bot className="size-4 text-primary" aria-hidden /> Análise semântica de editais
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            O termo de referência é submetido a um auditor sênior sintético especializado na Lei
            14.133/2021, que retorna payload JSON estruturado com cláusulas restritivas, score de
            restrição (0–15) e impacto concorrencial de cada exigência atípica.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Verificações obrigatórias: certidões sem previsão legal, prazos de entrega inferiores a
            48 horas sem justificativa, amostras em fase preliminar e especificação direcionada a
            marca exclusiva.
          </p>
        </div>

        <div className="panel p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <ScrollText className="size-4 text-primary" aria-hidden /> Limites interpretativos
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            O score é um indicador de priorização de fiscalização, não um juízo de irregularidade.
            Toda sinalização exige apuração formal pelo órgão de controle competente, com
            contraditório e ampla defesa.
          </p>
        </div>
      </section>

      <BadgeProveniencia />
    </div>
  );
}
