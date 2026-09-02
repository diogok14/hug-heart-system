import { Database } from "lucide-react";
import { FONTES_DADOS } from "@/data/radar";

export function BadgeProveniencia({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-institutional-foreground/20 px-2 py-1 text-[11px] font-medium text-institutional-foreground/80">
        <Database className="size-3.5" aria-hidden />
        Dados abertos · dados.gov.br
      </span>
    );
  }
  return (
    <div className="panel p-4">
      <p className="label-caps flex items-center gap-2">
        <Database className="size-3.5" aria-hidden /> Proveniência dos dados
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Esta plataforma consome exclusivamente conjuntos de dados abertos publicados no portal
        dados.gov.br:
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {FONTES_DADOS.map((f) => (
          <li
            key={f.sigla}
            className="rounded-md border bg-surface px-2.5 py-1.5 text-xs font-medium"
          >
            {f.sigla} <span className="text-muted-foreground">· {f.orgao}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
