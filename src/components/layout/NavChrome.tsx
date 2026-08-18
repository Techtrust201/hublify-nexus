// SOURCE: Maquette MO1 — sidebar gestionnaire (réutilisée desktop + drawer)

import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  Home,
  Info,
  MessageSquare,
  Users,
  Wrench,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GESTIONNAIRE } from "@/data/mock";
import { nomComplet } from "@/data/messagerie-mo1";
import { useSession } from "@/data/session";
import { cn } from "@/lib/utils";

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

const VUES = [
  { titre: "Vue générale", url: "/" },
  { titre: "Missions", url: "/missions" },
  { titre: "Réservations", url: "/reservations" },
  { titre: "Tarifs", url: "/tarifs" },
];

const OUTILS = [
  { titre: "Tous les outils", url: "/outils", icone: Info },
  { titre: "Modèles de documents", url: "/outils/modeles", icone: FileText },
  { titre: "Vue annuelle", url: "/outils/vue-annuelle", icone: CalendarDays },
  { titre: "Inventaire", url: "/inventaire", icone: ClipboardList },
];

export function estActif(pathname: string, url: string) {
  return url === "/" ? pathname === "/" : pathname === url || pathname.startsWith(`${url}/`);
}

export function NavChrome({
  pathname,
  densite,
  onNavigate,
}: {
  pathname: string;
  densite: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const session = useSession();
  const teamSidebar = session.membres.filter((m) => m.statut === "actif").slice(0, 3);
  const mobile = densite === "mobile";
  const lien = mobile
    ? "flex min-h-11 items-center gap-3 rounded-card px-3 text-sm font-medium text-ink-body hover:bg-surface"
    : "flex h-9 items-center gap-3 rounded-card px-3 text-sm font-medium text-ink-body hover:bg-surface";
  const sousLien = mobile
    ? "flex min-h-11 items-center rounded-[8px] px-2 text-sm font-medium text-ink-subtle hover:bg-surface"
    : "flex h-8 items-center rounded-[8px] px-2 text-xs font-medium text-ink-subtle hover:bg-surface";

  return (
    <>
      <div className="border-b border-surface-soft px-4 py-4">
        <Link to="/profil" onClick={onNavigate} className={cn("flex items-center gap-3", mobile && "min-h-11")}>
          <span className="flex size-10 items-center justify-center rounded-full bg-line text-sm text-ink-body">
            YR
          </span>
          <span className="min-w-0">
            <span className="block text-xs uppercase tracking-[0.3px] text-ink-muted">
              Gestionnaire
            </span>
            <span className="block text-sm text-ink">{GESTIONNAIRE.nom}</span>
            {mobile && <span className="block text-xs text-ink-muted">Compte</span>}
          </span>
        </Link>
        {mobile ? (
          <>
            <p className="mt-4 px-1 text-xs uppercase tracking-[0.3px] text-ink-muted">
              Vue générale
            </p>
            <div className="mt-1 space-y-0.5">
              {VUES.map((v) => (
                <Link
                  key={v.url + v.titre}
                  to={v.url}
                  onClick={onNavigate}
                  className={cn(lien, estActif(pathname, v.url) && "bg-surface-soft text-ink")}
                >
                  {v.titre}
                </Link>
              ))}
            </div>
          </>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger className="mt-4 flex h-[38px] w-full items-center justify-center rounded-card border border-line bg-white text-sm font-medium text-ink-body">
              Vue générale
              <ChevronDown className="ml-1 size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {VUES.map((v) => (
                <DropdownMenuItem key={v.url + v.titre} asChild>
                  <Link to={v.url}>{v.titre}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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
                onClick={onNavigate}
                className={cn(lien, estActif(pathname, e.url) && "bg-surface-soft text-ink")}
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
                      onClick={onNavigate}
                      className={cn(sousLien, estActif(pathname, s.url) && "bg-surface-soft text-ink")}
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
          onClick={onNavigate}
          className="block px-3 pt-4 text-xs uppercase tracking-[0.3px] text-ink-muted hover:text-ink-body"
        >
          Team mate
        </Link>
        {teamSidebar.map((m) => (
          <Link
            key={m.id}
            to="/team"
            onClick={onNavigate}
            className={cn(lien, "gap-2")}
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-line text-[10px] font-medium text-ink-subtle">
              {m.initiales}
            </span>
            {nomComplet(m)}
          </Link>
        ))}

        <p className="px-3 pt-4 text-xs uppercase tracking-[0.3px] text-ink-muted">Tous les outils</p>
        {(mobile
          ? OUTILS
          : [{ titre: "En savoir plus", url: "/outils", icone: Info }]
        ).map((o) => (
          <Link
            key={o.url + o.titre}
            to={o.url}
            onClick={onNavigate}
            className={cn(lien, "gap-2", estActif(pathname, o.url) && "bg-surface-soft text-ink")}
          >
            <o.icone className="size-3.5" />
            {o.titre}
          </Link>
        ))}
      </nav>

      <div className="space-y-2 border-t border-surface-soft px-4 py-4">
        <Link
          to="/outils/debuter"
          onClick={onNavigate}
          className={cn(
            "flex w-full items-center justify-center rounded-card bg-ink-deep text-sm font-medium text-white",
            mobile ? "min-h-11" : "h-9",
          )}
        >
          Je débute
        </Link>
        <Link
          to="/"
          onClick={onNavigate}
          className={cn(
            "flex w-full items-center justify-center rounded-card border border-line text-sm font-medium text-ink-body",
            mobile ? "min-h-11" : "h-[38px]",
          )}
        >
          Je découvre
        </Link>
      </div>
    </>
  );
}
