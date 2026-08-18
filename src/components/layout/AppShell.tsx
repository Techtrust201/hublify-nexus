// SOURCE: Maquette MO1 — sidebar gestionnaire + en-tête (frame Dashboard/Calendar/Missions/3days)

import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  FileText,
  Home,
  Info,
  Menu,
  MessageSquare,
  Users,
  Wrench,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GESTIONNAIRE } from "@/data/mock";
import { nomComplet } from "@/data/messagerie-mo1";
import { marquerNotifsLues, useSession } from "@/data/session";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Entree = {
  titre: string;
  url: string;
  icone: typeof Users;
  chevron?: boolean;
};

const NAV: Entree[] = [
  { titre: "Réservations", url: "/reservations", icone: Users },
  { titre: "Documents", url: "/documents", icone: FileText },
  { titre: "Prestataires", url: "/prestataires", icone: Wrench, chevron: true },
  { titre: "Patrimoines", url: "/patrimoines", icone: Home, chevron: true },
  { titre: "Messagerie", url: "/messagerie", icone: MessageSquare },
];

const SOUS_PRESTATAIRES = [
  { titre: "Prestataires", url: "/prestataires" },
  { titre: "Occupants", url: "/occupants" },
];

const SOUS_PATRIMOINES = [
  { titre: "Patrimoines", url: "/patrimoines" },
  { titre: "Inventaire", url: "/inventaire" },
];

function estActif(pathname: string, url: string) {
  return url === "/" ? pathname === "/" : pathname === url || pathname.startsWith(`${url}/`);
}

export function AppShell({
  titre,
  sousTitre,
  actions,
  children,
}: {
  titre?: string;
  sousTitre?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [mobileOuvert, setMobileOuvert] = useState(false);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const session = useSession();
  const teamSidebar = session.membres.filter((m) => m.statut === "actif").slice(0, 3);
  const notifsNonLues = session.notifications.filter((n) => !n.lu).length;

  return (
    <div className="flex min-h-screen w-full bg-surface">
      <aside className="sticky top-0 hidden h-screen w-[255px] shrink-0 flex-col border-r border-line bg-white md:flex">
        <div className="border-b border-surface-soft px-4 py-4">
          <Link to="/profil" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-line text-sm text-ink-body">
              YR
            </span>
            <span className="min-w-0">
              <span className="block text-xs uppercase tracking-[0.3px] text-ink-muted">
                Gestionnaire
              </span>
              <span className="block text-sm text-ink">{GESTIONNAIRE.nom}</span>
            </span>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="mt-4 flex h-[38px] w-full items-center justify-center rounded-card border border-line bg-white text-sm font-medium text-ink-body">
              Vue générale
              <ChevronDown className="ml-1 size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem asChild>
                <Link to="/">Vue générale</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/missions">Missions</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/reservations">Réservations</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/tarifs">Tarifs</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pt-3">
          {NAV.map((e) => {
            const sous =
              e.titre === "Prestataires"
                ? SOUS_PRESTATAIRES
                : e.titre === "Patrimoines"
                  ? SOUS_PATRIMOINES
                  : null;
            const ouvert = Boolean(
              sous?.some((s) => estActif(pathname, s.url)) || estActif(pathname, e.url),
            );
            return (
              <div key={e.titre}>
                <Link
                  to={e.url}
                  className={cn(
                    "flex h-9 items-center gap-3 rounded-card px-3 text-sm font-medium text-ink-body hover:bg-surface",
                    estActif(pathname, e.url) && "bg-surface-soft text-ink",
                  )}
                >
                  <e.icone className="size-4 shrink-0" />
                  <span className="flex-1 truncate">{e.titre}</span>
                  {e.chevron &&
                    (ouvert ? (
                      <ChevronDown className="size-3.5 text-ink-muted" />
                    ) : (
                      <ChevronRight className="size-3.5 text-ink-muted" />
                    ))}
                </Link>
                {e.chevron && ouvert && sous && (
                  <div className="mb-1 ml-7 mt-0.5 space-y-0.5">
                    {sous.map((s) => (
                      <Link
                        key={s.url}
                        to={s.url}
                        className={cn(
                          "flex h-8 items-center rounded-[8px] px-2 text-xs font-medium text-ink-subtle hover:bg-surface",
                          estActif(pathname, s.url) && "bg-surface-soft text-ink",
                        )}
                      >
                        {s.titre}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <Link
            to="/team"
            className="block px-3 pt-4 text-xs uppercase tracking-[0.3px] text-ink-muted hover:text-ink-body"
          >
            Team mate
          </Link>
          {teamSidebar.map((m) => (
            <Link
              key={m.id}
              to="/team"
              className="flex h-9 items-center gap-2 rounded-card px-3 text-sm font-medium text-ink-body hover:bg-surface"
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-line text-[10px] font-medium text-ink-subtle">
                {m.initiales}
              </span>
              {nomComplet(m)}
            </Link>
          ))}

          <p className="px-3 pt-4 text-xs uppercase tracking-[0.3px] text-ink-muted">
            Tous les outils
          </p>
          <Link
            to="/outils"
            className="flex h-8 items-center gap-2 rounded-card px-3 text-sm font-medium text-ink-body hover:bg-surface"
          >
            <Info className="size-3.5" />
            En savoir plus
          </Link>
        </nav>

        <div className="space-y-2 border-t border-surface-soft px-4 py-4">
          <Link
            to="/outils/debuter"
            className="flex h-9 w-full items-center justify-center rounded-card bg-ink-deep text-sm font-medium text-white"
          >
            Je débute
          </Link>
          <Link
            to="/"
            className="flex h-[38px] w-full items-center justify-center rounded-card border border-line text-sm font-medium text-ink-body"
          >
            Je découvre
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-[73px] items-center justify-between border-b border-line bg-white px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-card border border-line p-2 text-ink-body md:hidden"
              onClick={() => setMobileOuvert((v) => !v)}
              aria-label="Ouvrir la navigation"
            >
              <Menu className="size-4" />
            </button>
            {titre ? (
              <div className="min-w-0">
                <h1 className="truncate text-sm font-medium text-ink">{titre}</h1>
                {sousTitre && <p className="truncate text-xs text-ink-muted">{sousTitre}</p>}
              </div>
            ) : (
              <div className="hidden h-8 w-16 md:block" />
            )}
          </div>
          <div className="flex items-center gap-4">
            {actions}
            <DropdownMenu>
              <DropdownMenuTrigger className="hidden h-[34px] items-center gap-1 rounded-card border border-line px-3 text-sm font-medium text-ink-body sm:inline-flex">
                Outils
                <ChevronDown className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild>
                  <Link to="/outils">Tous les outils</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/outils/modeles">Modèles de documents</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/outils/vue-annuelle">Vue annuelle</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/inventaire">Inventaire</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu
              onOpenChange={(ouvert) => {
                if (ouvert && notifsNonLues > 0) marquerNotifsLues();
              }}
            >
              <DropdownMenuTrigger
                className="relative flex size-8 items-center justify-center rounded-card border border-line text-ink-body"
                aria-label="Notifications"
              >
                <Bell className="size-4" />
                {notifsNonLues > 0 && (
                  <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-ink text-[9px] text-white">
                    {notifsNonLues}
                  </span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0">
                <p className="border-b border-surface-soft px-3 py-2 text-xs font-medium text-ink">
                  Notifications
                </p>
                {session.notifications.length === 0 ? (
                  <p className="px-3 py-4 text-xs text-ink-subtle">Aucune notification.</p>
                ) : (
                  session.notifications.slice(0, 8).map((n) => (
                    <DropdownMenuItem key={n.id} asChild className="cursor-pointer items-start gap-2 py-2">
                      <a href={n.href}>
                        <span>
                          <span className="block text-xs text-ink">{n.titre}</span>
                          <span className="block text-[11px] text-ink-muted">{n.detail}</span>
                        </span>
                      </a>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Link to="/profil" className="hidden text-sm font-medium text-ink-body sm:inline">
              Compte gestionnaire
            </Link>
          </div>
        </header>

        {mobileOuvert && (
          <nav className="flex gap-1 overflow-x-auto border-b border-line bg-white px-4 py-2 md:hidden">
            <Link to="/" className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-ink-body">
              Vue générale
            </Link>
            {NAV.map((e) => (
              <Link
                key={e.titre}
                to={e.url}
                className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-ink-body"
              >
                {e.titre}
              </Link>
            ))}
            <Link to="/occupants" className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-ink-body">
              Occupants
            </Link>
            <Link to="/inventaire" className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-ink-body">
              Inventaire
            </Link>
            <Link to="/team" className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-ink-body">
              Team
            </Link>
            <Link to="/profil" className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-ink-body">
              Profil
            </Link>
            <Link to="/missions" className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-ink-body">
              Missions
            </Link>
          </nav>
        )}

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
