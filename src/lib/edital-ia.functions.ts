import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AnaliseIA } from "@/data/radar";

const entrada = z.object({ licitacaoId: z.string().min(1) });

const analiseSchema = z.object({
  tem_clausulas_restritivas: z.boolean(),
  score_restricao: z.number().min(0).max(15),
  motivos: z.array(z.string()).max(6),
  exigencias_atipicas: z
    .array(z.object({ clausula: z.string(), impacto_concorrencia: z.string() }))
    .max(5),
  sintese_objeto: z.string(),
});

const SISTEMA = `Você é auditor de controle externo especializado em Lei 14.133/2021.
Analise o edital de licitação e identifique cláusulas restritivas à competitividade
(direcionamento): exigências de marca, atestados desproporcionais, prazos exíguos,
qualificação técnica excessiva, localização geográfica obrigatória, entre outras.
Responda SOMENTE com JSON no formato solicitado, em português do Brasil, objetivo e
factual. score_restricao vai de 0 (sem indício) a 15 (direcionamento evidente).`;

/** Extrai texto simples de um PDF (streams não comprimidos) ou devolve vazio. */
async function textoDoEdital(url: string): Promise<string> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return "";
    const buf = new Uint8Array(await res.arrayBuffer());
    const bruto = new TextDecoder("latin1").decode(buf);
    const trechos = [...bruto.matchAll(/\((?:\\.|[^\\()])*\)/g)]
      .map((m) => m[0].slice(1, -1).replace(/\\([()\\])/g, "$1"))
      .join(" ");
    return trechos.replace(/\s+/g, " ").slice(0, 24000).trim();
  } catch {
    return "";
  }
}

/**
 * Análise semântica do edital via Lovable AI (Gemini). Persiste o resultado em
 * auditoria_risco, alimentando o fator "direcionamento editalício" do motor de score.
 */
export const analisarEdital = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => entrada.parse(d))
  .handler(async ({ data }): Promise<AnaliseIA> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: lic, error } = await supabaseAdmin
      .from("licitacoes")
      .select("*")
      .eq("id", data.licitacaoId)
      .maybeSingle();
    if (error) throw new Error(`Falha ao ler a licitação: ${error.message}`);
    if (!lic) throw new Error("Licitação não encontrada.");

    const texto = await textoDoEdital((lic.link_edital_pdf as string) ?? "");
    const contexto = [
      `Edital: ${lic.numero_edital}`,
      `Modalidade: ${lic.modalidade}`,
      `Órgão: ${lic.orgao_comprador} — ${lic.municipio}/${lic.uf}`,
      `Objeto: ${lic.objeto}`,
      `Valor estimado: R$ ${lic.valor_estimado} | Homologado: R$ ${lic.valor_homologado}`,
      `Publicação: ${lic.data_publicacao} | Homologação: ${lic.data_homologacao}`,
      texto
        ? `\nTexto extraído do edital:\n${texto}`
        : "\nO PDF do edital não pôde ser lido. Analise a partir dos metadados acima, sinalizando na síntese que o texto integral não estava disponível.",
    ].join("\n");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SISTEMA },
          { role: "user", content: contexto },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "analise_edital",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: [
                "tem_clausulas_restritivas",
                "score_restricao",
                "motivos",
                "exigencias_atipicas",
                "sintese_objeto",
              ],
              properties: {
                tem_clausulas_restritivas: { type: "boolean" },
                score_restricao: { type: "number" },
                motivos: { type: "array", items: { type: "string" } },
                exigencias_atipicas: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["clausula", "impacto_concorrencia"],
                    properties: {
                      clausula: { type: "string" },
                      impacto_concorrencia: { type: "string" },
                    },
                  },
                },
                sintese_objeto: { type: "string" },
              },
            },
          },
        },
      }),
    });

    if (resp.status === 429) throw new Error("Limite de uso da IA atingido. Tente novamente em instantes.");
    if (resp.status === 402) throw new Error("Créditos de IA esgotados no workspace.");
    if (!resp.ok) throw new Error(`Falha na análise de IA (${resp.status}).`);

    const json = (await resp.json()) as { choices?: { message?: { content?: string } }[] };
    const conteudo = json.choices?.[0]?.message?.content ?? "{}";
    const analise = analiseSchema.parse(JSON.parse(conteudo));

    const { error: upErr } = await supabaseAdmin.from("auditoria_risco").upsert(
      {
        licitacao_id: data.licitacaoId,
        analise_ia: analise,
        fator_clausula_restritiva: Math.round(analise.score_restricao),
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "licitacao_id" },
    );
    if (upErr) throw new Error(`Falha ao gravar a análise: ${upErr.message}`);

    return analise;
  });
