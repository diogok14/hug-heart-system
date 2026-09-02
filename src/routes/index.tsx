import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertOctagon,
  ArrowRight,
  Banknote,
  Gauge,
  Network,
  ShieldAlert,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  BarChart,
  Bar,
} from "recharts";
import { KpiCard } from "@/components/radar/KpiCard";
import { RiskBadge } from "@/components/radar/RiskBadge";
import { BadgeProveniencia } from "@/components/radar/BadgeProveniencia";
import {
  RISK_META,
  arestasVinculos,
  empresaByCnpj,
  formatBRL,
  licitacoes,
  riskLevelOf,
  scoreOf,
  vencedora,
  type RiskLevel,
} from "@/data/radar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel de Inteligência — Radar de Integridade" },
      {
        name: "description",
        content:
          "Indicadores macro de risco em contratações públicas: volume auditado, certames sob suspeita, score médio e alertas críticos.",
      },
      { property: "og:title", content: "Painel de Inteligência — Radar de Integridade" },
      {
        property: "og:description",
        content:
          "Dashboard analítico de risco em licitações públicas com dados abertos do governo federal.",
      },
    ],
  }),
  component: Painel,
});

const COR_RISCO: Record<RiskLevel, string> = {
  BAIXO: "var(--risk-low)",
  MEDIO: "var(--risk-medium)",
  ALTO: "var(--risk-high)",
  CRITICO: "var(--risk-critical)",
};

function Painel() {
  const registros = licitacoes.map((l) => {
    const score = scoreOf(l);
    return { licitacao: l, score, nivel: riskLevelOf(score) };
  });

  const totalAuditado = registros.reduce((s, r) => s + r.licitacao.valor_homologado, 0);
  const suspeitos = registros.filter((r) => r.score >= 30);
  const criticos = registros.filter((r) => r.nivel === "CRITICO" || r.nivel === "ALTO");
  const valorSobAlerta = criticos.reduce((s, r) => s + r.licitacao.valor_homologado, 0);
  const scoreMedio = Math.round(registros.reduce((s, r) => s + r.score, 0) / registros.length);

  const distribuicao = (Object.keys(RISK_META) as RiskLevel[]).map((nivel) => ({
    nivel: RISK_META[nivel].label,
    faixa: RISK_META[nivel].faixa,
    total: registros.filter((r) => r.nivel === nivel).length,
    cor: COR_RISCO[nivel],
  }));

  const dispersao = registros.map((r) => ({
    valor: r.licitacao.valor_homologado / 1_000_000,
    score: r.score,
    nome: r.licitacao.numero_edital,
    municipio: `${r.licitacao.municipio}/${r.licitacao.uf}`,
    cor: COR_RISCO[r.nivel],
  }));

  const prioritarios = [...registros].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Painel geral de inteligência</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {registros.length} certames monitorados · {arestasVinculos().length} vínculos
            societários detectados entre licitantes
          </p>
        </div>
        <Link
          to="/certames"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Abrir explorador de certames <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Volume financeiro auditado"
          value={formatBRL(totalAuditado, true)}
          hint="Soma dos valores homologados analisados"
          icon={Banknote}
        />
        <KpiCard
          label="Certames sob suspeita"
          value={`${suspeitos.length} de ${registros.length}`}
          hint={`${Math.round((suspeitos.length / registros.length) * 100)}% com score ≥ 30`}
          icon={ShieldAlert}
          tone="medium"
        />
        <KpiCard
          label="Score médio de risco"
          value={`${scoreMedio}/100`}
          hint="Média ponderada das 5 dimensões analíticas"
          icon={Gauge}
          tone="high"
        />
        <KpiCard
          label="Valor sob alerta cautelar"
          value={formatBRL(valorSobAlerta, true)}
          hint={`${criticos.length} certames em risco alto ou crítico`}
          icon={AlertOctagon}
          tone="critical"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <section className="panel p-5">
          <h2 className="text-sm font-semibold">Dispersão: valor do certame × score de risco</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Cada ponto é um certame homologado. O quadrante superior direito concentra contratos de
            alto vulto com maior probabilidade de irregularidade.
          </p>
          <div className="mt-4 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="valor"
                  name="Valor homologado"
                  unit=" mi"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  label={{
                    value: "Valor homologado (R$ milhões)",
                    position: "insideBottom",
                    offset: -14,
                    style: { fontSize: 11, fill: "var(--muted-foreground)" },
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="score"
                  name="Score"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <ZAxis range={[90, 90]} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number, name: string) =>
                    name === "Valor homologado"
                      ? [`R$ ${value.toFixed(2)} mi`, name]
                      : [value, name]
                  }
                  labelFormatter={() => ""}
                />
                <Scatter data={dispersao} name="Certames">
                  {dispersao.map((d) => (
                    <Cell key={d.nome} fill={d.cor} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="text-sm font-semibold">Distribuição por faixa de risco</h2>
          <div className="mt-4 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribuicao} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="nivel"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ display: "none" }} />
                <Bar dataKey="total" name="Certames" radius={[4, 4, 0, 0]}>
                  {distribuicao.map((d) => (
                    <Cell key={d.nivel} fill={d.cor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
            {distribuicao.map((d) => (
              <li key={d.nivel} className="flex justify-between">
                <span>
                  {d.nivel} <span className="tabular">({d.faixa} pts)</span>
                </span>
                <span className="tabular font-medium text-foreground">{d.total}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold">Certames prioritários para fiscalização</h2>
          <Link
            to="/vinculos"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <Network className="size-3.5" aria-hidden /> Ver grafo de conluio
          </Link>
        </div>
        <ul className="mt-4 divide-y">
          {prioritarios.map((r) => {
            const emp = empresaByCnpj(vencedora(r.licitacao).cnpj_fornecedor);
            return (
              <li key={r.licitacao.id} className="flex flex-wrap items-center gap-3 py-3">
                <RiskBadge level={r.nivel} score={r.score} />
                <div className="min-w-[240px] flex-1">
                  <p className="text-sm font-medium">{r.licitacao.objeto}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="tabular">{r.licitacao.numero_edital}</span> ·{" "}
                    {r.licitacao.municipio}/{r.licitacao.uf} · vencedora:{" "}
                    {emp?.razao_social ?? "—"}
                  </p>
                </div>
                <span className="tabular text-sm font-semibold">
                  {formatBRL(r.licitacao.valor_homologado)}
                </span>
                <Link
                  to="/certames"
                  search={{ certame: r.licitacao.id }}
                  className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium transition hover:bg-accent"
                >
                  Abrir dossiê <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <BadgeProveniencia />
    </div>
  );
}
