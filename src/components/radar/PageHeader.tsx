import type { ReactNode } from "react";

/** Cabeçalho institucional de módulo: trilha, título em serifa e resumo normativo. */
export function PageHeader({
  modulo,
  titulo,
  descricao,
  meta,
  acoes,
}: {
  modulo: string;
  titulo: string;
  descricao: string;
  meta?: string;
  acoes?: ReactNode;
}) {
  return (
    <header className="rule-top panel px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="label-caps">Radar de Integridade · {modulo}</p>
          <h1 className="mt-1.5 text-xl font-bold tracking-tight lg:text-2xl">{titulo}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{descricao}</p>
        </div>
        {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
      </div>
      {meta && (
        <p className="tabular mt-3 border-t pt-3 text-[11px] text-muted-foreground">{meta}</p>
      )}
    </header>
  );
}
