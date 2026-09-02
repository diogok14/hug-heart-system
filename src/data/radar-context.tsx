import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  arestasVinculosDe,
  type Empresa,
  type RadarDataset,
  type SancaoCGU,
  type Socio,
  type VinculoAresta,
} from "@/data/radar";

interface RadarApi extends RadarDataset {
  empresaByCnpj: (cnpj: string) => Empresa | undefined;
  sociosByCnpj: (cnpj: string) => Socio[];
  sancoesByCnpj: (cnpj: string) => SancaoCGU[];
  arestasVinculos: () => VinculoAresta[];
}

const VAZIO: RadarDataset = { empresas: [], socios: [], sancoes: [], licitacoes: [] };

const RadarContext = createContext<RadarApi | null>(null);

export function RadarProvider({
  dataset,
  children,
}: {
  dataset: RadarDataset | undefined;
  children: ReactNode;
}) {
  const value = useMemo<RadarApi>(() => {
    const ds = dataset ?? VAZIO;
    const arestas = arestasVinculosDe(ds);
    return {
      ...ds,
      empresaByCnpj: (cnpj) => ds.empresas.find((e) => e.cnpj === cnpj),
      sociosByCnpj: (cnpj) => ds.socios.filter((s) => s.cnpj === cnpj),
      sancoesByCnpj: (cnpj) => ds.sancoes.filter((s) => s.cpf_cnpj_sancionado === cnpj),
      arestasVinculos: () => arestas,
    };
  }, [dataset]);

  return <RadarContext.Provider value={value}>{children}</RadarContext.Provider>;
}

export function useRadar(): RadarApi {
  const ctx = useContext(RadarContext);
  if (!ctx) throw new Error("useRadar precisa estar dentro de <RadarProvider>");
  return ctx;
}
