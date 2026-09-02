import comercial from "@/assets/fachada-comercial.jpg";
import residencial from "@/assets/fachada-residencial.jpg";
import loteVago from "@/assets/fachada-lote-vago.jpg";
import type { Empresa } from "@/data/radar";

export const FACHADAS: Record<Empresa["fachada"], string> = {
  comercial,
  residencial,
  "lote-vago": loteVago,
};

export const STATUS_LOCALIZACAO_LABEL: Record<Empresa["status_localizacao"], string> = {
  NAO_VALIDADO: "Não validado",
  ESTABELECIMENTO_CONFIRMADO: "Estabelecimento comercial confirmado",
  RESIDENCIA_UNIFAMILIAR: "Residência unifamiliar",
  LOTE_VAGO: "Lote vago / sem edificação",
};
