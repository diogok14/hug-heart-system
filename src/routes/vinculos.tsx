import { createFileRoute } from "@tanstack/react-router";
import { GrafoVinculos } from "@/components/radar/GrafoVinculos";
import { BadgeProveniencia } from "@/components/radar/BadgeProveniencia";

export const Route = createFileRoute("/vinculos")({
  head: () => ({
    meta: [
      { title: "Grafo de Conluio Societário — Radar de Integridade" },
      {
        name: "description",
        content:
          "Visualização em grafo dos vínculos societários entre empresas concorrentes: sócios em comum, procuradores e endereços fiscais compartilhados.",
      },
      { property: "og:title", content: "Grafo de Conluio Societário — Radar de Integridade" },
      {
        property: "og:description",
        content:
          "Evidencie conluio em licitações por meio de sócios em comum e endereços fiscais compartilhados entre concorrentes.",
      },
    ],
  }),
  component: Vinculos,
});

function Vinculos() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Grafo de vínculos societários</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rede construída a partir do Quadro de Sócios e Administradores (QSA) da Receita Federal
          e dos endereços fiscais cadastrados. Arestas indicam sobreposição entre licitantes que
          disputaram o mesmo certame.
        </p>
      </div>
      <GrafoVinculos />
      <BadgeProveniencia />
    </div>
  );
}
