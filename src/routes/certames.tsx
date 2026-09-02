import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpDown, Search } from "lucide-react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/radar/RiskBadge";
import { DossieLicitacao } from "@/components/radar/DossieLicitacao";
import {
  formatBRL,
  formatDate,
  riskLevelOf,
  scoreOf,
  vencedora,
  type Licitacao,
  type RiskLevel,
} from "@/data/radar";
import { useRadar } from "@/data/radar-context";

const searchSchema = z.object({ certame: z.string().optional() });

export const Route = createFileRoute("/certames")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Explorador de Certames — Radar de Integridade" },
      {
        name: "description",
        content:
          "Tabela auditável de licitações públicas com filtros por município, modalidade e faixa de risco, e dossiê analítico completo por certame.",
      },
      { property: "og:title", content: "Explorador de Certames — Radar de Integridade" },
      {
        property: "og:description",
        content:
          "Filtre certames por risco, modalidade e município e abra o dossiê analítico de cada licitação.",
      },
    ],
  }),
  component: Explorador,
});

type Ordenacao = "score" | "valor" | "data";

function Explorador() {
  const { licitacoes, empresaByCnpj } = useRadar();
  const { certame } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [busca, setBusca] = useState("");
  const [risco, setRisco] = useState<RiskLevel | "TODOS">("TODOS");
  const [modalidade, setModalidade] = useState("TODAS");
  const [ordem, setOrdem] = useState<Ordenacao>("score");

  const modalidades = useMemo(
    () => Array.from(new Set(licitacoes.map((l) => l.modalidade))).sort(),
    [],
  );

  const linhas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return licitacoes
      .map((l) => {
        const score = scoreOf(l);
        return { licitacao: l, score, nivel: riskLevelOf(score) };
      })
      .filter((r) => {
        const emp = empresaByCnpj(vencedora(r.licitacao).cnpj_fornecedor);
        const alvo = `${r.licitacao.objeto} ${r.licitacao.municipio} ${r.licitacao.orgao_comprador} ${r.licitacao.numero_edital} ${emp?.razao_social ?? ""}`.toLowerCase();
        if (termo && !alvo.includes(termo)) return false;
        if (risco !== "TODOS" && r.nivel !== risco) return false;
        if (modalidade !== "TODAS" && r.licitacao.modalidade !== modalidade) return false;
        return true;
      })
      .sort((a, b) => {
        if (ordem === "valor") return b.licitacao.valor_homologado - a.licitacao.valor_homologado;
        if (ordem === "data")
          return (
            new Date(b.licitacao.data_publicacao).getTime() -
            new Date(a.licitacao.data_publicacao).getTime()
          );
        return b.score - a.score;
      });
  }, [busca, risco, modalidade, ordem]);

  const selecionada: Licitacao | null = certame
    ? (licitacoes.find((l) => l.id === certame) ?? null)
    : null;

  const abrir = (id?: string) =>
    navigate({ search: id ? { certame: id } : {}, replace: true });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Explorador de certames</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Base consolidada de licitações e contratos (Transferegov / Portal da Transparência)
          cruzada com CNPJ/QSA da Receita Federal e sanções da CGU.
        </p>
      </div>

      <div className="panel flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[240px] flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por objeto, município, órgão, edital ou fornecedor"
            className="pl-9"
            aria-label="Busca textual"
          />
        </div>
        <Select value={risco} onValueChange={(v) => setRisco(v as RiskLevel | "TODOS")}>
          <SelectTrigger className="w-[170px]" aria-label="Faixa de risco">
            <SelectValue placeholder="Faixa de risco" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todas as faixas</SelectItem>
            <SelectItem value="BAIXO">Risco baixo</SelectItem>
            <SelectItem value="MEDIO">Risco moderado</SelectItem>
            <SelectItem value="ALTO">Risco alto</SelectItem>
            <SelectItem value="CRITICO">Risco crítico</SelectItem>
          </SelectContent>
        </Select>
        <Select value={modalidade} onValueChange={setModalidade}>
          <SelectTrigger className="w-[200px]" aria-label="Modalidade">
            <SelectValue placeholder="Modalidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODAS">Todas as modalidades</SelectItem>
            {modalidades.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={ordem} onValueChange={(v) => setOrdem(v as Ordenacao)}>
          <SelectTrigger className="w-[190px]" aria-label="Ordenação">
            <ArrowUpDown className="size-3.5" aria-hidden />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="score">Maior score de risco</SelectItem>
            <SelectItem value="valor">Maior valor homologado</SelectItem>
            <SelectItem value="data">Publicação mais recente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="panel overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[130px]">Risco</TableHead>
              <TableHead>Objeto / órgão</TableHead>
              <TableHead>Edital</TableHead>
              <TableHead>Município</TableHead>
              <TableHead>Modalidade</TableHead>
              <TableHead className="text-right">Homologado</TableHead>
              <TableHead>Vencedora</TableHead>
              <TableHead className="text-right">Publicação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.map((r) => {
              const emp = empresaByCnpj(vencedora(r.licitacao).cnpj_fornecedor);
              return (
                <TableRow
                  key={r.licitacao.id}
                  onClick={() => abrir(r.licitacao.id)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <RiskBadge level={r.nivel} score={r.score} />
                  </TableCell>
                  <TableCell className="max-w-[320px]">
                    <p className="truncate font-medium">{r.licitacao.objeto}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.licitacao.orgao_comprador}
                    </p>
                  </TableCell>
                  <TableCell className="tabular text-xs">{r.licitacao.numero_edital}</TableCell>
                  <TableCell className="text-xs">
                    {r.licitacao.municipio}/{r.licitacao.uf}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {r.licitacao.modalidade}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular text-right text-sm font-medium">
                    {formatBRL(r.licitacao.valor_homologado)}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs">
                    {emp?.razao_social ?? "—"}
                  </TableCell>
                  <TableCell className="tabular text-right text-xs">
                    {formatDate(r.licitacao.data_publicacao)}
                  </TableCell>
                </TableRow>
              );
            })}
            {linhas.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum certame corresponde aos filtros aplicados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        {linhas.length} de {licitacoes.length} certames exibidos. Clique em uma linha para abrir o
        dossiê analítico.
      </p>

      <DossieLicitacao
        licitacao={selecionada}
        onOpenChange={(open) => {
          if (!open) abrir();
        }}
      />
    </div>
  );
}
