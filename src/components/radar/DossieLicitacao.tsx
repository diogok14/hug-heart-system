import {
  Building2,
  CalendarClock,
  ExternalLink,
  FileText,
  Gavel,
  MapPin,
  ScanEye,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RiskBadge, RiskBar } from "./RiskBadge";
import { FACHADAS, STATUS_LOCALIZACAO_LABEL } from "./fachadas";
import {
  FATORES,
  diasEntre,
  formatBRL,
  formatCNPJ,
  formatDate,
  riskLevelOf,
  scoreOf,
  vencedora,
  type Licitacao,
} from "@/data/radar";
import { useRadar } from "@/data/radar-context";

export function DossieLicitacao({
  licitacao,
  onOpenChange,
}: {
  licitacao: Licitacao | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={!!licitacao} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-none lg:w-[min(1180px,95vw)]">
        {licitacao && <DossieBody licitacao={licitacao} />}
      </SheetContent>
    </Sheet>
  );
}

function DossieBody({ licitacao }: { licitacao: Licitacao }) {
  const { empresaByCnpj, sociosByCnpj, sancoesByCnpj } = useRadar();
  const score = scoreOf(licitacao);
  const nivel = riskLevelOf(score);
  const prop = vencedora(licitacao);
  const empresa = empresaByCnpj(prop.cnpj_fornecedor);
  const socios = empresa ? sociosByCnpj(empresa.cnpj) : [];
  const sancoesEmpresa = empresa ? sancoesByCnpj(empresa.cnpj) : [];
  const sancoesAtivas = sancoesEmpresa.filter((s) => s.ativo);
  const idadeDias = empresa ? diasEntre(empresa.data_abertura, licitacao.data_publicacao) : 0;
  const multiplo = empresa ? licitacao.valor_homologado / empresa.capital_social : 0;

  return (
    <>
      <SheetHeader className="border-b bg-surface">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="tabular">
            {licitacao.numero_edital}
          </Badge>
          <Badge variant="secondary">{licitacao.modalidade}</Badge>
          <RiskBadge level={nivel} score={score} />
        </div>
        <SheetTitle className="text-left text-lg leading-snug">{licitacao.objeto}</SheetTitle>
        <SheetDescription className="text-left">
          {licitacao.orgao_comprador} · {licitacao.municipio}/{licitacao.uf} · IBGE{" "}
          {licitacao.municipio_ibge}
        </SheetDescription>
      </SheetHeader>

      <div className="grid gap-4 p-4 lg:grid-cols-3 lg:p-6">
        {/* Coluna esquerda — certame + IA */}
        <section className="space-y-4">
          <div className="panel p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Gavel className="size-4 text-primary" aria-hidden /> Dados do certame
            </h3>
            <dl className="mt-3 space-y-2.5 text-sm">
              <Row label="Valor estimado" value={formatBRL(licitacao.valor_estimado)} />
              <Row label="Valor homologado" value={formatBRL(licitacao.valor_homologado)} />
              <Row label="Publicação" value={formatDate(licitacao.data_publicacao)} />
              <Row label="Homologação" value={formatDate(licitacao.data_homologacao)} />
              <Row label="Licitantes" value={String(licitacao.propostas.length)} />
              <Row
                label="Desconto do vencedor"
                value={`${prop.desconto_percentual.toFixed(2)}%`}
              />
            </dl>
            <a
              href={licitacao.link_edital_pdf}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <FileText className="size-3.5" aria-hidden /> Edital em PDF (Transferegov)
              <ExternalLink className="size-3" aria-hidden />
            </a>
          </div>

          <div className="panel p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="size-4 text-primary" aria-hidden /> Análise semântica do edital
              (Gemini)
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Score de direcionamento editalício:{" "}
              <span className="tabular font-semibold text-foreground">
                {licitacao.analise_ia.score_restricao}/15
              </span>
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {licitacao.analise_ia.sintese_objeto}
            </p>
            {licitacao.analise_ia.tem_clausulas_restritivas ? (
              <div className="mt-3 space-y-3">
                <ul className="space-y-1.5 text-sm">
                  {licitacao.analise_ia.motivos.map((m) => (
                    <li key={m} className="flex gap-2">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-risk-high" />
                      {m}
                    </li>
                  ))}
                </ul>
                {licitacao.analise_ia.exigencias_atipicas.map((e) => (
                  <blockquote
                    key={e.clausula}
                    className="rounded-md border-l-2 border-risk-high bg-risk-high-soft/60 p-3 text-xs"
                  >
                    <p className="font-medium">{e.clausula}</p>
                    <p className="mt-1 text-muted-foreground">{e.impacto_concorrencia}</p>
                  </blockquote>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-md bg-risk-low-soft p-3 text-xs text-risk-low">
                Nenhuma cláusula restritiva relevante identificada na análise semântica.
              </p>
            )}
          </div>

          <div className="panel p-4">
            <h3 className="text-sm font-semibold">Decomposição do score</h3>
            <div className="mt-3 space-y-3">
              {FATORES.map((f) => {
                const valor = licitacao.auditoria[f.key];
                const evidencia = licitacao.auditoria.evidencias?.[f.key];
                return (
                  <div key={f.key}>
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span>{f.label}</span>
                      <span className="tabular text-muted-foreground">
                        {valor}/{f.peso}
                      </span>
                    </div>
                    <Progress value={(valor / f.peso) * 100} className="mt-1 h-1.5" />
                    {evidencia ? (
                      <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                        {evidencia}
                      </p>
                    ) : null}
                  </div>
                );
              })}

            </div>
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <span className="label-caps">Score geral</span>
              <span className="tabular text-xl font-semibold">{score}/100</span>
            </div>
            <RiskBar score={score} level={nivel} />
          </div>
        </section>

        {/* Coluna central — empresa vencedora */}
        <section className="space-y-4">
          <div className="panel p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="size-4 text-primary" aria-hidden /> Empresa vencedora (CNPJ
              Aberto RFB)
            </h3>
            {empresa ? (
              <>
                <p className="mt-2 font-medium">{empresa.razao_social}</p>
                <p className="tabular text-xs text-muted-foreground">
                  {formatCNPJ(empresa.cnpj)}
                </p>
                <dl className="mt-3 space-y-2.5 text-sm">
                  <Row label="CNAE principal" value={`${empresa.cnae_principal}`} />
                  <Row label="Atividade" value={empresa.cnae_descricao} />
                  <Row label="Abertura" value={formatDate(empresa.data_abertura)} />
                  <Row label="Capital social" value={formatBRL(empresa.capital_social)} />
                  <Row label="Valor adjudicado" value={formatBRL(prop.valor_proposta)} />
                </dl>

                <div className="mt-4 rounded-md bg-surface p-3">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="label-caps">Capacidade operacional</span>
                    <span className="tabular font-semibold">{multiplo.toFixed(1)}x</span>
                  </div>
                  <Progress
                    value={Math.min(100, (empresa.capital_social / prop.valor_proposta) * 100)}
                    className="mt-2 h-2"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    O contrato supera o capital social integralizado em {multiplo.toFixed(1)}{" "}
                    vezes. Gatilho de alerta acima de 20x.
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-md bg-surface p-3 text-xs">
                  <CalendarClock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span>
                    Empresa constituída{" "}
                    <strong className="tabular">{idadeDias} dias</strong> antes da publicação do
                    edital. Gatilho de alerta abaixo de 180 dias.
                  </span>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Fornecedor não cadastrado.</p>
            )}
          </div>

          <div className="panel p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="size-4 text-primary" aria-hidden /> Verificação de sanções
              CGU
            </h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(["CEIS", "CNEP", "CEPIM"] as const).map((tipo) => {
                const hit = sancoesAtivas.some((s) => s.tipo_sancao === tipo);
                return (
                  <div
                    key={tipo}
                    className={
                      hit
                        ? "rounded-md border border-risk-critical/30 bg-risk-critical-soft p-2.5 text-center"
                        : "rounded-md border border-risk-low/30 bg-risk-low-soft p-2.5 text-center"
                    }
                  >
                    <p className="text-xs font-semibold">{tipo}</p>
                    <p
                      className={
                        hit
                          ? "mt-0.5 text-[11px] font-medium text-risk-critical"
                          : "mt-0.5 text-[11px] font-medium text-risk-low"
                      }
                    >
                      {hit ? "Sanção ativa" : "Sem registro"}
                    </p>
                  </div>
                );
              })}
            </div>
            <ul className="mt-3 space-y-2">
              {sancoesEmpresa.length === 0 && (
                <li className="text-xs text-muted-foreground">
                  Nenhum registro nas bases CEIS, CNEP e CEPIM.
                </li>
              )}
              {sancoesEmpresa.map((s) => (
                <li key={s.tipo_sancao + s.data_inicio_sancao} className="rounded-md bg-surface p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={s.ativo ? "destructive" : "secondary"}>{s.tipo_sancao}</Badge>
                    <span className="tabular text-[11px] text-muted-foreground">
                      {formatDate(s.data_inicio_sancao)}
                      {s.data_fim_sancao ? ` — ${formatDate(s.data_fim_sancao)}` : " — vigente"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs">{s.motivo}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{s.orgao_sancionador}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Users className="size-4 text-primary" aria-hidden /> Quadro societário (QSA)
            </h3>
            <ul className="mt-3 divide-y">
              {socios.map((s) => (
                <li key={s.nome_socio + s.data_entrada} className="py-2 text-sm">
                  <p className="font-medium">{s.nome_socio}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="tabular">{s.cpf_mascarado}</span> · {s.qualificacao_socio} ·
                    desde {formatDate(s.data_entrada)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Coluna direita — auditoria geográfica + propostas */}
        <section className="space-y-4">
          <div className="panel overflow-hidden">
            <div className="p-4 pb-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <ScanEye className="size-4 text-primary" aria-hidden /> Auditoria física remota
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Google Street View Static API · Places API (raio de 50 m)
              </p>
            </div>
            {empresa && (
              <>
                <img
                  src={FACHADAS[empresa.fachada]}
                  alt={`Fachada registrada no endereço fiscal de ${empresa.razao_social}`}
                  loading="lazy"
                  width={1024}
                  height={576}
                  className="w-full border-y object-cover"
                />
                <div className="space-y-2.5 p-4 text-sm">
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span>
                      {empresa.logradouro}, {empresa.numero} — {empresa.bairro}
                      <br />
                      {empresa.municipio}/{empresa.uf} · CEP {empresa.cep}
                    </span>
                  </p>
                  <dl className="space-y-2.5">
                    <Row
                      label="Coordenadas"
                      value={`${empresa.latitude.toFixed(5)}, ${empresa.longitude.toFixed(5)}`}
                    />
                    <Row
                      label="Estabelecimentos em 50 m"
                      value={String(empresa.places_estabelecimentos_raio_50m)}
                    />
                  </dl>
                  <div
                    className={
                      empresa.status_localizacao === "ESTABELECIMENTO_CONFIRMADO"
                        ? "rounded-md bg-risk-low-soft p-3 text-xs font-medium text-risk-low"
                        : "rounded-md bg-risk-critical-soft p-3 text-xs font-medium text-risk-critical"
                    }
                  >
                    {STATUS_LOCALIZACAO_LABEL[empresa.status_localizacao]}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="panel p-4">
            <h3 className="text-sm font-semibold">Propostas e disputa</h3>
            <ul className="mt-3 space-y-2">
              {licitacao.propostas.map((p) => {
                const e = empresaByCnpj(p.cnpj_fornecedor);
                return (
                  <li
                    key={p.cnpj_fornecedor}
                    className={
                      p.vencedora
                        ? "rounded-md border border-primary/30 bg-accent/50 p-3"
                        : "rounded-md border p-3"
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{e?.razao_social ?? p.cnpj_fornecedor}</p>
                      {p.vencedora && <Badge className="shrink-0">Vencedora</Badge>}
                    </div>
                    <p className="tabular mt-1 text-xs text-muted-foreground">
                      {formatCNPJ(p.cnpj_fornecedor)} · {formatBRL(p.valor_proposta)} ·{" "}
                      {p.desconto_percentual.toFixed(2)}% de desconto · {p.classificacao}º lugar
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="panel bg-institutional p-4 text-institutional-foreground">
            <h3 className="text-sm font-semibold">Parecer consolidado do radar</h3>
            <p className="mt-2 text-sm leading-relaxed opacity-90">
              {licitacao.auditoria.resumo_analise_ia}
            </p>
          </div>
        </section>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium">{value}</dd>
    </div>
  );
}
