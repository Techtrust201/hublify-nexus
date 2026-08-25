import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  redirect,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { AuthProvider } from "@/auth/auth-context";
import { aLeDroit, droitRequisPourChemin, type AuthContexte } from "@/auth/permissions";
import { Toaster } from "@/components/ui/sonner";
import { hydraterSession } from "@/data/session";
import { getSession } from "@/lib/auth.functions";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page introuvable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 md:min-h-0"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Cette page n'a pas pu s'afficher
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Un problème est survenu. Vous pouvez réessayer ou revenir à l'accueil.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 md:min-h-0"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  auth: AuthContexte | null;
}>()({
  beforeLoad: async ({ location }) => {
    const estPublic =
      location.pathname === "/connexion" ||
      location.pathname === "/inscription" ||
      location.pathname === "/mot-de-passe-oublie" ||
      location.pathname === "/reinitialiser-mot-de-passe" ||
      location.pathname.startsWith("/api/");
    if (estPublic) return { auth: null };
    const auth = await getSession();
    if (!auth) {
      throw redirect({ to: "/connexion" });
    }
    const besoin = droitRequisPourChemin(location.pathname);
    if (besoin && !aLeDroit(auth.droits, besoin)) {
      throw redirect({ to: "/" });
    }
    return { auth };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: "Hublify — pilotage des biens et des missions" },
      {
        name: "description",
        content:
          "Hublify : plateforme de gestion des biens, réservations, prestataires et missions d'intervention.",
      },
      { name: "author", content: "Hublify" },
      { property: "og:site_name", content: "Hublify" },
      { property: "og:title", content: "Hublify — pilotage des biens et des missions" },
      {
        property: "og:description",
        content: "Gestion des biens, réservations, prestataires et missions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico?v=2", type: "image/x-icon" },
      { rel: "icon", href: "/hublify-mark.png?v=2", type: "image/png", sizes: "128x128" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png?v=2" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
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

function RootComponent() {
  const { queryClient, auth } = Route.useRouteContext();
  useEffect(() => {
    hydraterSession(auth?.userId);
  }, [auth?.userId]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider valeur={auth ?? null}>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </QueryClientProvider>
  );
}
