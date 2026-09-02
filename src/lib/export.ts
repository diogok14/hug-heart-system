/** Utilitários de exportação (CSV e PDF via impressão do navegador). */

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

/** Gera e baixa um CSV com BOM (compatível com Excel em pt-BR, separador ";"). */
export function baixarCSV(nome: string, cabecalho: string[], linhas: unknown[][]): void {
  const conteudo = [cabecalho, ...linhas].map((l) => l.map(csvCell).join(";")).join("\r\n");
  const blob = new Blob(["\uFEFF" + conteudo], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome.endsWith(".csv") ? nome : `${nome}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] as string);

export interface SecaoRelatorio {
  titulo: string;
  linhas: { rotulo: string; valor: string }[];
  texto?: string;
}

/**
 * Abre uma janela com o relatório formatado e dispara a caixa de impressão do
 * navegador, permitindo salvar em PDF sem dependências externas.
 */
export function imprimirRelatorio(opts: {
  titulo: string;
  subtitulo: string;
  selo: string;
  secoes: SecaoRelatorio[];
}): void {
  const emitido = new Date().toLocaleString("pt-BR");
  const secoes = opts.secoes
    .map(
      (s) => `<section>
        <h2>${escapeHtml(s.titulo)}</h2>
        ${s.texto ? `<p class="texto">${escapeHtml(s.texto)}</p>` : ""}
        ${
          s.linhas.length
            ? `<table>${s.linhas
                .map(
                  (l) =>
                    `<tr><th>${escapeHtml(l.rotulo)}</th><td>${escapeHtml(l.valor)}</td></tr>`,
                )
                .join("")}</table>`
            : ""
        }
      </section>`,
    )
    .join("");

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>${escapeHtml(opts.titulo)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: "IBM Plex Sans", "Segoe UI", Arial, sans-serif; color: #14213d; margin: 0; font-size: 11pt; }
  header { border-bottom: 3px solid #0f1b3d; padding-bottom: 10px; margin-bottom: 18px; }
  .marca { font-size: 8.5pt; letter-spacing: .14em; text-transform: uppercase; color: #3b6fa0; font-weight: 600; }
  h1 { font-family: Georgia, "Libre Baskerville", serif; font-size: 17pt; margin: 6px 0 4px; line-height: 1.25; }
  .sub { font-size: 9.5pt; color: #4a5875; }
  .selo { display: inline-block; margin-top: 8px; padding: 3px 9px; border-radius: 3px; background: #e8edf3; color: #0f1b3d; font-size: 9pt; font-weight: 600; }
  section { margin-bottom: 16px; page-break-inside: avoid; }
  h2 { font-size: 10pt; text-transform: uppercase; letter-spacing: .1em; color: #1e3a5f; border-bottom: 1px solid #cfd8e6; padding-bottom: 4px; margin: 0 0 8px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; vertical-align: top; padding: 4px 6px; border-bottom: 1px solid #edf1f6; font-size: 10pt; }
  th { width: 38%; font-weight: 600; color: #4a5875; }
  .texto { text-align: justify; margin: 0 0 8px; line-height: 1.5; }
  footer { margin-top: 22px; border-top: 1px solid #cfd8e6; padding-top: 8px; font-size: 8.5pt; color: #6b7794; text-align: justify; }
</style></head><body>
<header>
  <div class="marca">Radar de Integridade em Contratações Públicas</div>
  <h1>${escapeHtml(opts.titulo)}</h1>
  <div class="sub">${escapeHtml(opts.subtitulo)}</div>
  <div class="selo">${escapeHtml(opts.selo)}</div>
</header>
${secoes}
<footer>Documento gerado em ${escapeHtml(emitido)} a partir do cruzamento automatizado de bases públicas.
Os indicadores apresentados são sinalizadores de risco produzidos por método estatístico e não constituem
acusação, prova ou conclusão sobre irregularidade; exigem apuração formal pelos órgãos de controle competentes.</footer>
<script>window.onload = () => { window.print(); };</script>
</body></html>`;

  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}
