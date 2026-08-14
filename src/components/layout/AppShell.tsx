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
import { GESTIONNAIRE, TEAM } from "@/data/mock";
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

  return (
    <div className="flex min-h-screen w-full bg-[#f9fafb]">
      <aside className="sticky top-0 hidden h-screen w-[255px] shrink-0 flex-col border-r border-[#e5e7eb] bg-white md:flex">
        <div className="border-b border-[#f3f4f6] px-4 py-4">
          <Link to="/profil" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-[#e5e7eb] text-sm text-[#4a5565]">
              YR
            </span>
            <span className="min-w-0">
              <span className="block text-xs uppercase tracking-[0.3px] text-[#99a1af]">
                Gestionnaire
              </span>
              <span className="block text-sm text-[#1e2939]">{GESTIONNAIRE.nom}</span>
            </span>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="mt-4 flex h-[38px] w-full items-center justify-center rounded-[10px] border border-[#e5e7eb] bg-white text-sm font-medium text-[#4a5565]">
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
          {NAV.map((e) => (
            <Link
              key={e.titre}
              to={e.url}
              className={cn(
                "flex h-9 items-center gap-3 rounded-[10px] px-3 text-sm font-medium text-[#4a5565] hover:bg-[#f9fafb]",
                estActif(pathname, e.url) && "bg-[#f3f4f6] text-[#1e2939]",
              )}
            >
              <e.icone className="size-4 shrink-0" />
              <span className="flex-1 truncate">{e.titre}</span>
              {e.chevron &&
                (estActif(pathname, e.url) ? (
                  <ChevronDown className="size-3.5 text-[#99a1af]" />
                ) : (
                  <ChevronRight className="size-3.5 text-[#99a1af]" />
                ))}
            </Link>
          ))}

          <p className="px-3 pt-4 text-xs uppercase tracking-[0.3px] text-[#99a1af]">Team mate</p>
          {TEAM.map((m) => (
            <Link
              key={m.id}
              to="/messagerie"
              className="flex h-9 items-center gap-2 rounded-[10px] px-3 text-sm font-medium text-[#4a5565] hover:bg-[#f9fafb]"
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-[#e5e7eb] text-[10px] font-medium text-[#6a7282]">
                {m.initiales}
              </span>
              {m.nom}
            </Link>
          ))}

          <p className="px-3 pt-4 text-xs uppercase tracking-[0.3px] text-[#99a1af]">
            Tous les outils
          </p>
          <Link
            to="/outils"
            className="flex h-8 items-center gap-2 rounded-[10px] px-3 text-sm font-medium text-[#4a5565] hover:bg-[#f9fafb]"
          >
            <Info className="size-3.5" />
            En savoir plus
          </Link>
        </nav>

        <div className="space-y-2 border-t border-[#f3f4f6] px-4 py-4">
          <Link
            to="/outils"
            className="flex h-9 w-full items-center justify-center rounded-[10px] bg-[#101828] text-sm font-medium text-white"
          >
            Je débute
          </Link>
          <Link
            to="/outils"
            className="flex h-[38px] w-full items-center justify-center rounded-[10px] border border-[#e5e7eb] text-sm font-medium text-[#4a5565]"
          >
            Je découvre
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-[73px] items-center justify-between border-b border-[#e5e7eb] bg-white px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-[10px] border border-[#e5e7eb] p-2 text-[#4a5565] md:hidden"
              onClick={() => setMobileOuvert((v) => !v)}
              aria-label="Ouvrir la navigation"
            >
              <Menu className="size-4" />
            </button>
            {titre ? (
              <div className="min-w-0">
                <h1 className="truncate text-sm font-medium text-[#1e2939]">{titre}</h1>
                {sousTitre && <p className="truncate text-xs text-[#99a1af]">{sousTitre}</p>}
              </div>
            ) : (
              <div className="hidden h-8 w-16 md:block" />
            )}
          </div>
          <div className="flex items-center gap-4">
            {actions}
            <Link
              to="/outils"
              className="hidden h-[34px] items-center gap-1 rounded-[10px] border border-[#e5e7eb] px-3 text-sm font-medium text-[#4a5565] sm:inline-flex"
            >
              Outils
              <ChevronDown className="size-3.5" />
            </Link>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-[10px] border border-[#e5e7eb] text-[#4a5565]"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
            </button>
            <Link to="/profil" className="hidden text-sm font-medium text-[#4a5565] sm:inline">
              Compte gestionnaire
            </Link>
          </div>
        </header>

        {mobileOuvert && (
          <nav className="flex gap-1 overflow-x-auto border-b border-[#e5e7eb] bg-white px-4 py-2 md:hidden">
            <Link to="/" className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-[#4a5565]">
              Vue générale
            </Link>
            {NAV.map((e) => (
              <Link
                key={e.titre}
                to={e.url}
                className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-[#4a5565]"
              >
                {e.titre}
              </Link>
            ))}
          </nav>
        )}

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
