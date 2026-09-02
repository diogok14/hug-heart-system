import { useMemo, useState } from "react";
import {
  formatCNPJ,
  riskLevelOf,
  scoreOf,
  vencedora,
} from "@/data/radar";
import { useRadar } from "@/data/radar-context";
import { cn } from "@/lib/utils";

const W = 900;
const H = 520;

/** Grafo societário renderizado em SVG: nós = CNPJs, arestas = sócio/endereço em comum. */
export function GrafoVinculos() {
  const { empresas, licitacoes, empresaByCnpj, sociosByCnpj, arestasVinculos } = useRadar();
  const arestas = useMemo(() => arestasVinculos(), []);
  const [selecionado, setSelecionado] = useState<string | null>(null);

  const conectados = useMemo(
    () => new Set(arestas.flatMap((a) => [a.a, a.b])),
    [arestas],
  );

  const nos = useMemo(() => {
    const lista = empresas.filter((e) => conectados.has(e.cnpj));
    const cx = W / 2;
    const cy = H / 2;
    const r = Math.min(W, H) / 2 - 90;
    return lista.map((e, i) => {
      const ang = (i / lista.length) * Math.PI * 2 - Math.PI / 2;
      return { empresa: e, x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) };
    });
  }, [conectados]);

  const posicao = (cnpj: string) => nos.find((n) => n.empresa.cnpj === cnpj);
  const empresaSel = selecionado ? empresaByCnpj(selecionado) : null;
  const vinculosSel = arestas.filter((a) => a.a === selecionado || a.b === selecionado);

  const riscoDoCnpj = (cnpj: string) => {
    const certames = licitacoes.filter((l) =>
      l.propostas.some((p) => p.cnpj_fornecedor === cnpj),
    );
    const max = certames.reduce((acc, l) => Math.max(acc, scoreOf(l)), 0);
    return riskLevelOf(max);
  };

  const corNo = (cnpj: string) => {
    const n = riscoDoCnpj(cnpj);
    return n === "CRITICO"
      ? "var(--risk-critical)"
      : n === "ALTO"
        ? "var(--risk-high)"
        : n === "MEDIO"
          ? "var(--risk-medium)"
          : "var(--risk-low)";
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="panel overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full bg-surface"
          role="img"
          aria-label="Grafo de vínculos societários entre empresas licitantes"
        >
          {arestas.map((a) => {
            const p1 = posicao(a.a);
            const p2 = posicao(a.b);
            if (!p1 || !p2) return null;
            const ativo = selecionado === a.a || selecionado === a.b;
            return (
              <line
                key={a.a + a.b}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={
                  a.tipo === "socio_comum" ? "var(--risk-critical)" : "var(--risk-high)"
                }
                strokeWidth={ativo ? 3 : 1.5}
                strokeOpacity={selecionado && !ativo ? 0.15 : 0.7}
                strokeDasharray={a.tipo === "endereco_comum" ? "6 4" : undefined}
              />
            );
          })}
          {nos.map((n) => {
            const ativo = selecionado === n.empresa.cnpj;
            const nome = n.empresa.razao_social.split(" ").slice(0, 3).join(" ");
            return (
              <g
                key={n.empresa.cnpj}
                className="cursor-pointer"
                onClick={() =>
                  setSelecionado(selecionado === n.empresa.cnpj ? null : n.empresa.cnpj)
                }
              >
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={ativo ? 20 : 15}
                  fill={corNo(n.empresa.cnpj)}
                  stroke="var(--card)"
                  strokeWidth={3}
                />
                <text
                  x={n.x}
                  y={n.y + 36}
                  textAnchor="middle"
                  className="fill-foreground text-[11px] font-medium"
                >
                  {nome}
                </text>
                <text
                  x={n.x}
                  y={n.y + 50}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px]"
                >
                  {formatCNPJ(n.empresa.cnpj)}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="flex flex-wrap items-center gap-4 border-t p-3 text-xs text-muted-foreground">
          <Legenda cor="var(--risk-critical)" texto="Sócio / procurador em comum" />
          <Legenda cor="var(--risk-high)" texto="Mesmo endereço fiscal" tracejado />
          <span>Clique em um nó para isolar os vínculos.</span>
        </div>
      </div>

      <aside className="panel p-4">
        {empresaSel ? (
          <>
            <p className="label-caps">Nó selecionado</p>
            <h3 className="mt-1 text-sm font-semibold">{empresaSel.razao_social}</h3>
            <p className="tabular text-xs text-muted-foreground">
              {formatCNPJ(empresaSel.cnpj)}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              {empresaSel.logradouro}, {empresaSel.numero} — {empresaSel.municipio}/
              {empresaSel.uf}
            </p>
            <p className="label-caps mt-4">Quadro societário</p>
            <ul className="mt-1 space-y-1 text-xs">
              {sociosByCnpj(empresaSel.cnpj).map((s) => (
                <li key={s.nome_socio}>
                  {s.nome_socio} —{" "}
                  <span className="text-muted-foreground">{s.qualificacao_socio}</span>
                </li>
              ))}
            </ul>
            <p className="label-caps mt-4">Vínculos detectados</p>
            <ul className="mt-1 space-y-2 text-xs">
              {vinculosSel.map((v) => (
                <li key={v.a + v.b} className="rounded-md bg-surface p-2.5">
                  <p>{v.detalhe}</p>
                  {v.licitacao && (
                    <p className="mt-1 text-muted-foreground">
                      Concorreram juntas em {v.licitacao}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <p className="label-caps">Vínculos mapeados</p>
            <p className="tabular mt-1 text-2xl font-semibold">{arestas.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Pares de licitantes com sócio, procurador ou endereço fiscal em comum entre as{" "}
              {empresas.length} empresas monitoradas.
            </p>
            <ul className="mt-4 space-y-2 text-xs">
              {arestas.map((v) => {
                const e1 = empresaByCnpj(v.a);
                const e2 = empresaByCnpj(v.b);
                return (
                  <li key={v.a + v.b} className="rounded-md bg-surface p-2.5">
                    <p className="font-medium">
                      {e1?.razao_social} ↔ {e2?.razao_social}
                    </p>
                    <p className="mt-1 text-muted-foreground">{v.detalhe}</p>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              Certames com disputa simulada:{" "}
              <span className="font-medium text-foreground">
                {
                  licitacoes.filter((l) =>
                    arestas.some(
                      (a) =>
                        l.propostas.some((p) => p.cnpj_fornecedor === a.a) &&
                        l.propostas.some((p) => p.cnpj_fornecedor === a.b),
                    ),
                  ).length
                }
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Vencedoras envolvidas:{" "}
              {licitacoes
                .filter((l) => arestas.some((a) => vencedora(l).cnpj_fornecedor === a.a))
                .map((l) => l.numero_edital)
                .join(", ") || "—"}
            </p>
          </>
        )}
      </aside>
    </div>
  );
}

function Legenda({
  cor,
  texto,
  tracejado,
}: {
  cor: string;
  texto: string;
  tracejado?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn("h-0 w-6 border-t-2", tracejado && "border-dashed")}
        style={{ borderColor: cor }}
      />
      {texto}
    </span>
  );
}
