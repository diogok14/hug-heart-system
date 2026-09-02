import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Database, Building2, Loader2, Satellite } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/radar/PageHeader";
import {
  auditarLocalizacao,
  enriquecerEmpresa,
  ingerirContratacoes,
} from "@/lib/ingestao.functions";
import { recalcularScores } from "@/lib/radar.functions";

export const Route = createFileRoute("/ingestao")({
  head: () => ({
    meta: [
      { title: "Ingestão de Dados Abertos — Radar de Integridade" },
      {
        name: "description",
        content:
          "Painel de ingestão de contratações públicas do PNCP, enriquecimento cadastral de CNPJ/QSA da Receita Federal e auditoria geográfica remota de endereços fiscais.",
      },
      { property: "og:title", content: "Ingestão de Dados Abertos — Radar de Integridade" },
      {
        property: "og:description",
        content:
          "Carregue contratações reais do PNCP, enriqueça CNPJ e QSA e execute a auditoria geográfica dos endereços fiscais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Ingestao,
});

const MODALIDADES = [
  { codigo: "6", nome: "Dispensa" },
  { codigo: "8", nome: "Pregão eletrônico" },
  { codigo: "4", nome: "Concorrência eletrônica" },
  { codigo: "5", nome: "Inexigibilidade" },
  { codigo: "7", nome: "Concurso" },
];

const UFS = [
  ["AC", "Acre"], ["AL", "Alagoas"], ["AP", "Amapá"], ["AM", "Amazonas"],
  ["BA", "Bahia"], ["CE", "Ceará"], ["DF", "Distrito Federal"], ["ES", "Espírito Santo"],
  ["GO", "Goiás"], ["MA", "Maranhão"], ["MT", "Mato Grosso"], ["MS", "Mato Grosso do Sul"],
  ["MG", "Minas Gerais"], ["PA", "Pará"], ["PB", "Paraíba"], ["PR", "Paraná"],
  ["PE", "Pernambuco"], ["PI", "Piauí"], ["RJ", "Rio de Janeiro"], ["RN", "Rio Grande do Norte"],
  ["RS", "Rio Grande do Sul"], ["RO", "Rondônia"], ["RR", "Roraima"], ["SC", "Santa Catarina"],
  ["SP", "São Paulo"], ["SE", "Sergipe"], ["TO", "Tocantins"],
] as const;

const TODAS_UFS = "__todas__";

const hoje = new Date();
const ontem = new Date(hoje.getTime() - 86400000 * 30);
const iso = (d: Date) => d.toISOString().slice(0, 10);

function Ingestao() {
  return (
    <div className="space-y-5">
      <PageHeader
        modulo="Pipeline de dados"
        titulo="Ingestão de dados abertos"
        descricao="Carga incremental de contratações públicas (PNCP / Lei 14.133/2021), enriquecimento cadastral de CNPJ e QSA na base da Receita Federal e auditoria geográfica remota dos endereços fiscais declarados."
        meta="Toda carga é idempotente: registros já existentes são atualizados, não duplicados."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <CardContratacoes />
        <CardEmpresa />
      </div>
      <CardGeo />
      <CardRecalculo />
    </div>
  );
}

function Painel({
  icone,
  titulo,
  descricao,
  children,
}: {
  icone: React.ReactNode;
  titulo: string;
  descricao: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        {icone} {titulo}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">{descricao}</p>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function Resultado({ erro, texto }: { erro: string | null; texto: string | null }) {
  if (erro) {
    return (
      <p className="rounded-md border border-risk-high/30 bg-risk-high-soft/60 p-3 text-xs text-risk-high">
        {erro}
      </p>
    );
  }
  if (texto) {
    return (
      <p className="rounded-md border border-risk-low/30 bg-risk-low-soft p-3 text-xs text-risk-low">
        {texto}
      </p>
    );
  }
  return null;
}

function useAcao<T>() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [texto, setTexto] = useState<string | null>(null);

  async function executar(fn: () => Promise<T>, mensagem: (r: T) => string) {
    setCarregando(true);
    setErro(null);
    setTexto(null);
    try {
      const r = await fn();
      setTexto(mensagem(r));
      await router.invalidate();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Operação não concluída.");
    } finally {
      setCarregando(false);
    }
  }

  return { carregando, erro, texto, executar };
}

function CardContratacoes() {
  const [dataInicial, setDataInicial] = useState(iso(ontem));
  const [dataFinal, setDataFinal] = useState(iso(hoje));
  const [modalidade, setModalidade] = useState("6");
  const [uf, setUf] = useState(TODAS_UFS);
  const [comprador, setComprador] = useState("");
  const [limite, setLimite] = useState("25");
  const ufSelecionada = uf === TODAS_UFS ? "" : uf;
  const { carregando, erro, texto, executar } = useAcao<{
    ingeridos: number;
    totalFonte: number;
  }>();

  return (
    <Painel
      icone={<Database className="size-4 text-primary" aria-hidden />}
      titulo="Contratações públicas (PNCP)"
      descricao="API de Dados Abertos de Compras (MGI) — contratações divulgadas no PNCP sob a Lei 14.133/2021."
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="di" className="text-xs">
            Publicação de
          </Label>
          <Input
            id="di"
            type="date"
            value={dataInicial}
            onChange={(e) => setDataInicial(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="df" className="text-xs">
            até
          </Label>
          <Input
            id="df"
            type="date"
            value={dataFinal}
            onChange={(e) => setDataFinal(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Modalidade</Label>
          <Select value={modalidade} onValueChange={setModalidade}>
            <SelectTrigger aria-label="Modalidade">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODALIDADES.map((m) => (
                <SelectItem key={m.codigo} value={m.codigo}>
                  {m.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Estado (UF)</Label>
          <Select value={uf} onValueChange={setUf}>
            <SelectTrigger aria-label="Estado (UF)">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value={TODAS_UFS}>Todos os estados</SelectItem>
              {UFS.map(([sigla, nome]) => (
                <SelectItem key={sigla} value={sigla}>
                  {sigla} — {nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <AutocompleteComprador
            valor={comprador}
            aoMudar={setComprador}
            uf={ufSelecionada}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lim" className="text-xs">
            Limite de registros
          </Label>
          <Input
            id="lim"
            type="number"
            min={1}
            max={200}
            value={limite}
            onChange={(e) => setLimite(e.target.value)}
          />
        </div>
      </div>
      <Button
        onClick={() =>
          executar(
            () =>
              ingerirContratacoes({
                data: {
                  dataInicial,
                  dataFinal,
                  codigoModalidade: Number(modalidade),
                  limite: Math.max(1, Math.min(200, Number(limite) || 25)),
                  ...(uf.length === 2 ? { uf } : {}),
                },
              }),
            (r) =>
              r.ingeridos === 0
                ? `Nenhum registro atendeu aos critérios (${r.totalFonte} avaliados na fonte).`
                : `${r.ingeridos} contratações gravadas no acervo (de ${r.totalFonte} retornadas pela fonte).`,
          )
        }
        disabled={carregando}
      >
        {carregando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {carregando ? "Ingerindo…" : "Executar ingestão"}
      </Button>
      <Resultado erro={erro} texto={texto} />
    </Painel>
  );
}

function CardEmpresa() {
  const [cnpj, setCnpj] = useState("");
  const { carregando, erro, texto, executar } = useAcao<{
    razao_social: string;
    socios: number;
    capital_social: number;
    data_abertura: string;
  }>();

  return (
    <Painel
      icone={<Building2 className="size-4 text-primary" aria-hidden />}
      titulo="Cadastro CNPJ e QSA (Receita Federal)"
      descricao="Consulta o cadastro nacional da pessoa jurídica e o quadro de sócios e administradores, gravando ambos no acervo."
    >
      <div className="space-y-1.5">
        <Label htmlFor="cnpj" className="text-xs">
          CNPJ do fornecedor
        </Label>
        <Input
          id="cnpj"
          placeholder="00.000.000/0000-00"
          value={cnpj}
          onChange={(e) => setCnpj(e.target.value)}
        />
      </div>
      <Button
        onClick={() =>
          executar(
            () => enriquecerEmpresa({ data: { cnpj: cnpj.replace(/\D/g, "") } }),
            (r) =>
              `${r.razao_social} — aberta em ${r.data_abertura}, capital social de R$ ${r.capital_social.toLocaleString("pt-BR")}, ${r.socios} integrantes no QSA.`,
          )
        }
        disabled={carregando || cnpj.replace(/\D/g, "").length !== 14}
      >
        {carregando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {carregando ? "Consultando…" : "Enriquecer cadastro"}
      </Button>
      <Resultado erro={erro} texto={texto} />
    </Painel>
  );
}

function CardGeo() {
  const [cnpj, setCnpj] = useState("");
  const { carregando, erro, texto, executar } = useAcao<{
    razao_social: string;
    endereco_normalizado: string;
    precisao: string;
    estabelecimentos_50m: number;
    street_view: boolean;
    status_localizacao: string;
  }>();

  return (
    <Painel
      icone={<Satellite className="size-4 text-primary" aria-hidden />}
      titulo="Auditoria geográfica remota (Google Maps Platform)"
      descricao="Geocodifica o endereço fiscal, conta estabelecimentos comerciais em raio de 50 m (Places) e verifica cobertura de imagem (Street View) para classificar a fachada."
    >
      <div className="space-y-1.5">
        <Label htmlFor="cnpj-geo" className="text-xs">
          CNPJ já cadastrado no acervo
        </Label>
        <Input
          id="cnpj-geo"
          placeholder="00.000.000/0000-00"
          value={cnpj}
          onChange={(e) => setCnpj(e.target.value)}
        />
      </div>
      <Button
        onClick={() =>
          executar(
            () => auditarLocalizacao({ data: { cnpj: cnpj.replace(/\D/g, "") } }),
            (r) =>
              `${r.razao_social}: ${r.endereco_normalizado} (precisão ${r.precisao}) — ${r.estabelecimentos_50m} estabelecimentos em 50 m, Street View ${r.street_view ? "disponível" : "indisponível"}. Classificação: ${r.status_localizacao}.`,
          )
        }
        disabled={carregando || cnpj.replace(/\D/g, "").length !== 14}
      >
        {carregando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {carregando ? "Auditando…" : "Auditar endereço fiscal"}
      </Button>
      <Resultado erro={erro} texto={texto} />
    </Painel>
  );
}

function CardRecalculo() {
  const { carregando, erro, texto, executar } = useAcao<{ atualizados: number }>();
  return (
    <Painel
      icone={<Database className="size-4 text-primary" aria-hidden />}
      titulo="Recálculo do score de risco"
      descricao="Reexecuta o motor de score sobre todo o acervo e persiste os cinco fatores, mantendo o banco coerente com os dados recém-ingeridos."
    >
      <Button
        variant="outline"
        onClick={() =>
          executar(
            () => recalcularScores(),
            (r) => `${r.atualizados} certames tiveram o score recalculado e persistido.`,
          )
        }
        disabled={carregando}
      >
        {carregando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {carregando ? "Recalculando…" : "Recalcular todos os scores"}
      </Button>
      <Resultado erro={erro} texto={texto} />
    </Painel>
  );
}
