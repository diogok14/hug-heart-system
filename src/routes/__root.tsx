import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { GitBranch, LayoutDashboard, Radar, ScrollText, Table2 } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { BadgeProveniencia } from "@/components/radar/BadgeProveniencia";
import { FONTES_DADOS } from "@/data/radar";
import { RadarProvider } from "@/data/radar-context";
import { carregarRadar } from "@/lib/radar.functions";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O recurso solicitado não existe ou foi movido.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao painel
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Não foi possível carregar esta página
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ocorreu uma falha inesperada. Tente novamente ou volte ao painel.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Ir para o painel
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Radar de Integridade em Contratações Públicas" },
      {
        name: "description",
        content:
          "Auditoria preditiva de licitações públicas com dados abertos do Transferegov, CNPJ/QSA da Receita Federal e sanções da CGU.",
      },
      { property: "og:title", content: "Radar de Integridade em Contratações Públicas" },
      {
        property: "og:description",
        content:
          "Plataforma de controle social que calcula risco de conluio, sobrepreço e empresas de fachada em certames públicos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap",
      },
    ],
  }),
  loader: () => carregarRadar(),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const NAV = [
  { to: "/", label: "Painel de inteligência", sigla: "Visão geral", icon: LayoutDashboard },
  { to: "/certames", label: "Explorador de certames", sigla: "Processos", icon: Table2 },
  { to: "/vinculos", label: "Grafo de conluio", sigla: "Vínculos societários", icon: GitBranch },
  { to: "/metodologia", label: "Metodologia", sigla: "Nota técnica", icon: ScrollText },
] as const;

function Sidebar() {
  return (
    <nav className="flex flex-col gap-1 py-4" aria-label="Módulos do sistema">
      <p className="label-caps px-4 pb-2 text-institutional-foreground/50">Módulos</p>
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeOptions={{ exact: item.to === "/" }}
          className="nav-item"
          activeProps={{ className: "nav-item-active" }}
        >
          <item.icon className="size-4 shrink-0" aria-hidden />
          <span className="leading-tight">
            <span className="block">{item.label}</span>
            <span className="block text-[10.5px] opacity-60">{item.sigla}</span>
          </span>
        </Link>
      ))}
    </nav>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const dataset = Route.useLoaderData();

  return (
    <QueryClientProvider client={queryClient}>
      <RadarProvider dataset={dataset}>
        <div className="flex min-h-screen flex-col">
          <header className="bg-institutional text-institutional-foreground">
            <div className="flex items-center gap-3 border-b border-institutional-foreground/10 px-4 py-2.5 lg:px-6">
              <Link to="/" className="flex items-center gap-2.5">
                <span className="rounded-sm bg-institutional-foreground/10 p-1.5">
                  <Radar className="size-5" aria-hidden />
                </span>
                <span className="leading-tight">
                  <span className="block font-serif text-sm font-bold tracking-tight">
                    Radar de Integridade
                  </span>
                  <span className="block text-[10.5px] uppercase tracking-[0.14em] opacity-60">
                    Contratações públicas · controle externo
                  </span>
                </span>
              </Link>
              <div className="ml-auto flex items-center gap-3">
                <span className="hidden text-[11px] leading-tight opacity-70 md:block">
                  Sistema de auditoria preditiva
                  <br />
                  Exercício 2026 · uso interno de fiscalização
                </span>
                <BadgeProveniencia compact />
              </div>
            </div>
          </header>

          <div className="flex flex-1 flex-col lg:flex-row">
            <aside className="bg-institutional text-institutional-foreground lg:w-[248px] lg:shrink-0 lg:border-r lg:border-institutional-foreground/10">
              <div className="lg:sticky lg:top-0">
                <Sidebar />
              </div>
            </aside>

            <main className="min-w-0 flex-1 bg-background px-4 py-6 lg:px-8">
              <div className="mx-auto w-full max-w-[1440px]">
                {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
                <Outlet />
              </div>
            </main>
          </div>

          <footer className="border-t bg-surface">
            <div className="mx-auto max-w-[1500px] px-4 py-6 text-xs text-muted-foreground lg:px-8">
              <p className="font-semibold text-foreground">
                Fontes de dados abertos consumidas pela plataforma
              </p>
              <p className="mt-2">
                {FONTES_DADOS.map((f) => `${f.sigla} (${f.orgao})`).join(" · ")}
              </p>
              <p className="mt-3 max-w-4xl">
                Dados exibidos em ambiente de demonstração, estruturados conforme os conjuntos
                públicos do portal dados.gov.br. Os scores são indícios de risco e não constituem
                acusação de irregularidade.
              </p>
            </div>
          </footer>
        </div>
      </RadarProvider>
    </QueryClientProvider>
  );
}
