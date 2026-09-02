import { createFileRoute } from "@tanstack/react-router";
import { GrafoVinculos } from "@/components/radar/GrafoVinculos";
import { BadgeProveniencia } from "@/components/radar/BadgeProveniencia";
import { PageHeader } from "@/components/radar/PageHeader";

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
      <PageHeader
        modulo="Vínculos societários"
        titulo="Grafo de conluio entre licitantes"
        descricao="Rede construída a partir do Quadro de Sócios e Administradores (QSA) da Receita Federal e dos endereços fiscais cadastrados. Arestas indicam sobreposição entre licitantes que disputaram o mesmo certame."
        meta="Fonte: CNPJ Aberto & QSA (Receita Federal) · cruzamento automático de CPF mascarado e endereço fiscal"
      />
      <GrafoVinculos />
      <BadgeProveniencia />
    </div>
  );
}
