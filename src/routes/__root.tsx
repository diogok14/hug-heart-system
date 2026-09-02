import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Radar } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { BadgeProveniencia } from "@/components/radar/BadgeProveniencia";
import { FONTES_DADOS } from "@/data/radar";

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
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap",
      },
    ],
  }),
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
  { to: "/", label: "Painel de inteligência" },
  { to: "/certames", label: "Explorador de certames" },
  { to: "/vinculos", label: "Grafo de conluio" },
  { to: "/metodologia", label: "Metodologia" },
] as const;

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <header className="bg-institutional text-institutional-foreground">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-4 px-4 py-3 lg:px-8">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="rounded-md bg-institutional-foreground/10 p-1.5">
                <Radar className="size-5" aria-hidden />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-semibold">Radar de Integridade</span>
                <span className="block text-[11px] opacity-70">
                  Contratações públicas · controle social
                </span>
              </span>
            </Link>
            <nav className="order-3 flex w-full gap-1 overflow-x-auto text-sm md:order-none md:w-auto md:flex-1">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={{ exact: item.to === "/" }}
                  className="shrink-0 rounded-md px-3 py-1.5 opacity-75 transition hover:bg-institutional-foreground/10 hover:opacity-100"
                  activeProps={{
                    className: "bg-institutional-foreground/15 font-semibold opacity-100",
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <BadgeProveniencia compact />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 lg:px-8">
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </main>

        <footer className="mt-8 border-t bg-surface">
          <div className="mx-auto max-w-[1500px] px-4 py-6 text-xs text-muted-foreground lg:px-8">
            <p className="font-medium text-foreground">
              Fontes de dados abertos consumidas pela plataforma
            </p>
            <p className="mt-2">
              {FONTES_DADOS.map((f) => `${f.sigla} (${f.orgao})`).join(" · ")}
            </p>
            <p className="mt-3">
              Dados exibidos em ambiente de demonstração, estruturados conforme os conjuntos
              públicos do portal dados.gov.br. Os scores são indícios de risco e não constituem
              acusação de irregularidade.
            </p>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  );
}
