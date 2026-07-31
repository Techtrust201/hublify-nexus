// SOURCE: V2 Redris — « Dashboard Sidebar », « NavItem », en-tête gestionnaire
// Adapté : libellés purgés de toute référence REDRIS, identité HUBLIFY uniquement.

import { Link, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  CalendarDays,
  FileText,
  LayoutDashboard,
  MessageSquare,
  PanelLeft,
  Search,
  Settings,
  Users,
  Wrench,
  Bell,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GESTIONNAIRE } from "@/data/mock";

type Entree = { titre: string; url: string; icone: typeof LayoutDashboard; actif: boolean };

const NAV: Entree[] = [
  { titre: "Vue générale", url: "/", icone: LayoutDashboard, actif: true },
  { titre: "Missions", url: "/missions", icone: CalendarDays, actif: true },
  { titre: "Prestataires", url: "/prestataires", icone: Wrench, actif: true },
  { titre: "Biens", url: "/", icone: Building2, actif: false },
  { titre: "Réservations", url: "/", icone: CalendarDays, actif: false },
  { titre: "Voyageurs", url: "/", icone: Users, actif: false },
  { titre: "Documents", url: "/", icone: FileText, actif: false },
  { titre: "Messagerie", url: "/", icone: MessageSquare, actif: false },
  { titre: "Équipe", url: "/", icone: Users, actif: false },
  { titre: "Paramètres", url: "/", icone: Settings, actif: false },
];

function Logo({ compact }: { compact: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <img
        src="/hublify-mark.png"
        alt="Hublify"
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 rounded-md object-contain"
      />
      {!compact && (
        <span className="text-base font-semibold tracking-tight text-foreground">Hublify</span>
      )}
    </div>
  );
}

export function AppShell({
  titre,
  sousTitre,
  actions,
  children,
}: {
  titre: string;
  sousTitre?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [replie, setReplie] = useState(false);
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const estActif = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-sidebar transition-all md:flex",
          replie ? "w-16" : "w-64",
        )}
      >
        <div className="flex h-16 items-center px-4">
          <Logo compact={replie} />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
          {NAV.map((e) => {
            const contenu = (
              <>
                <e.icone className="h-4 w-4 shrink-0" />
                {!replie && <span className="truncate">{e.titre}</span>}
              </>
            );
            const classes = cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              e.actif
                ? estActif(e.url)
                  ? "bg-brand-soft text-brand-strong"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
                : "cursor-not-allowed text-muted-foreground/50",
            );
            return e.actif ? (
              <Link key={e.titre} to={e.url} className={classes} title={e.titre}>
                {contenu}
              </Link>
            ) : (
              <div key={e.titre} className={classes} title={`${e.titre} — hors périmètre étape 1`}>
                {contenu}
              </div>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
              YR
            </div>
            {!replie && (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{GESTIONNAIRE.nom}</p>
                <p className="truncate text-xs text-muted-foreground">Compte gestionnaire</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border bg-background px-4 md:px-6">
          <button
            onClick={() => setReplie((v) => !v)}
            className="hidden rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground md:inline-flex"
            aria-label="Replier la navigation"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
          <div className="md:hidden">
            <Logo compact={false} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-foreground">{titre}</h1>
            {sousTitre && <p className="truncate text-xs text-muted-foreground">{sousTitre}</p>}
          </div>
          <div className="hidden items-center gap-2 rounded-lg border border-border px-3 py-2 lg:flex">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Rechercher…</span>
          </div>
          <button
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
          {actions}
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-background px-4 py-2 md:hidden">
          {NAV.filter((e) => e.actif).map((e) => (
            <Link
              key={e.titre}
              to={e.url}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-muted-foreground"
              activeProps={{ className: "bg-brand-soft text-brand-strong" }}
            >
              {e.titre}
            </Link>
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-6">{children}</main>

        <footer className="border-t border-border px-4 py-3 text-xs text-muted-foreground md:px-6">
          Hublify — prototype interne. Données fictives, aucun traitement réel.
        </footer>
      </div>
    </div>
  );
}
