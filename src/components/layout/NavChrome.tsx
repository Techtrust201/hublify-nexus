// SOURCE: Hublify V1.0 — sidebar 189:9760 / images jointes
// Logo « Hublify », badge Ü, navigation, Je débute (pilule sarcelle) et Je découvre.
// Le rendu du nœud ne contient pas le bouton noir « Le réseau » cité par ECARTS.

import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  FileText,
  GraduationCap,
  Home,
  Lightbulb,
  MessageSquare,
  Phone,
  Users,
} from "lucide-react";
import { useAuth, useDroit } from "@/auth/auth-context";
import { aLeDroit, type DroitId } from "@/auth/permissions";
import { listerEquipe } from "@/lib/auth.functions";
import { cn } from "@/lib/utils";

type Entree = {
  titre: string;
  url: string;
  icone: typeof Users;
  droit?: DroitId;
};

const NAV: Entree[] = [
  { titre: "Réservations", url: "/reservations", icone: Users, droit: "voir-reservations" },
  { titre: "Documents", url: "/documents", icone: FileText, droit: "voir-documents" },
  { titre: "Patrimoine", url: "/patrimoines", icone: Home, droit: "voir-biens" },
  { titre: "Messagerie", url: "/messagerie", icone: MessageSquare, droit: "messagerie" },
  { titre: "Analyse", url: "/analyse", icone: BarChart3, droit: "voir-finances" },
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
  const auth = useAuth();
  const peutEquipe = useDroit("gerer-equipe");
  const peutOperer = useDroit("mod-reservations");
  const droits = auth?.droits ?? [];
  const navVisible = NAV.filter((e) => !e.droit || aLeDroit(droits, e.droit));
  const mobile = densite === "mobile";
  const { data: coequipiers } = useQuery({
    queryKey: ["equipe-navigation", auth?.orgId],
    queryFn: () => listerEquipe(),
    enabled: peutEquipe && Boolean(auth?.orgId),
    staleTime: 5 * 60_000,
  });
  const equipe = (coequipiers ?? []).filter((m) => m.statut === "actif");

  const lien = mobile
    ? "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-ink-body hover:bg-surface"
    : "flex h-9 items-center gap-3 rounded-xl px-3 text-sm text-ink-body hover:bg-surface";

  return (
    <>
      <div className="px-4 pb-2 pt-5">
        <p className="text-center text-xl font-semibold tracking-tight text-accent-teal">Hublify</p>
        <div className="mt-4 flex justify-center rounded-2xl border border-line bg-white px-4 py-4">
          <span
            className="flex size-16 items-center justify-center rounded-full bg-[#f8f0d8] text-2xl font-medium text-accent-teal"
            aria-hidden
          >
            Ü
          </span>
          <span className="sr-only">
            {auth ? `Compte de ${auth.prenom} ${auth.nom}` : "Compte Hublify"}
          </span>
        </div>
        <Link
          to="/"
          onClick={onNavigate}
          aria-current={pathname === "/" ? "page" : undefined}
          className={cn(
            "mt-3 flex h-10 w-full items-center justify-center rounded-xl border text-sm font-medium",
            pathname === "/"
              ? "border-line bg-surface-soft text-ink"
              : "border-line bg-white text-ink-body hover:bg-surface",
          )}
        >
          Vue générale
        </Link>
      </div>

      <nav
        className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-3 pt-2"
        aria-label="Sections"
      >
        {navVisible.map((e) => (
          <Link
            key={e.titre}
            to={e.url}
            onClick={onNavigate}
            aria-current={estActif(pathname, e.url) ? "page" : undefined}
            className={cn(lien, estActif(pathname, e.url) && "bg-surface-soft text-ink")}
          >
            <e.icone className="size-4 shrink-0" />
            <span className="flex-1 truncate">{e.titre}</span>
          </Link>
        ))}

        <p className="px-3 pb-1 pt-4 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-muted">
          Formations
        </p>
        <Link
          to="/formations/se-former"
          onClick={onNavigate}
          className={cn(
            lien,
            estActif(pathname, "/formations/se-former") && "bg-surface-soft text-ink",
          )}
        >
          <GraduationCap className="size-4 shrink-0" />
          <span>Se Former</span>
        </Link>
        <Link
          to="/formations/utiliser"
          onClick={onNavigate}
          className={cn(
            lien,
            estActif(pathname, "/formations/utiliser") && "bg-surface-soft text-ink",
          )}
        >
          <Lightbulb className="size-4 shrink-0" />
          <span>Utiliser hublify</span>
        </Link>

        {peutEquipe && (
          <div className="pt-3">
            <Link
              to="/team"
              onClick={onNavigate}
              className="flex min-h-6 items-center px-3 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-muted hover:text-ink-body"
            >
              Team mate
            </Link>
            <div className="mt-1 space-y-0.5">
              {equipe.length === 0 ? (
                <p className="px-3 py-2 text-xs text-ink-muted">Aucun coéquipier actif.</p>
              ) : (
                equipe.map((m) => (
                  <Link
                    key={m.id}
                    to="/team"
                    onClick={onNavigate}
                    className={cn(lien, "gap-2 pl-3")}
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-line text-[10px] font-medium text-ink-subtle">
                      {m.initiales}
                    </span>
                    <span className="truncate">
                      {m.prenom} {m.nom}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </nav>

      <div className="space-y-1 border-t border-surface-soft px-3 py-3">
        <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-muted">
          Assistance
        </p>
        <Link
          to="/assistance"
          onClick={onNavigate}
          className={cn(lien, estActif(pathname, "/assistance") && "bg-surface-soft text-ink")}
        >
          <Phone className="size-4 shrink-0" />
          <span>Contact 24/24h</span>
        </Link>
        <Link
          to="/parrainage"
          onClick={onNavigate}
          className={cn(lien, estActif(pathname, "/parrainage") && "bg-surface-soft text-ink")}
        >
          <Users className="size-4 shrink-0" />
          <span>Parrainage</span>
        </Link>
      </div>

      <div className="space-y-2 px-4 pb-4">
        {peutOperer && (
          <Link
            to="/outils/debuter"
            onClick={onNavigate}
            className={cn(
              "flex w-full items-center justify-center rounded-full bg-accent-teal text-sm font-medium text-white",
              mobile ? "min-h-11" : "h-10",
            )}
          >
            Je débute
          </Link>
        )}
        {auth?.roleId !== "prestataire" && (
          <Link
            to="/outils"
            activeOptions={{ exact: true }}
            onClick={onNavigate}
            className={cn(
              "flex w-full items-center justify-center rounded-full border border-line bg-white text-sm font-medium text-ink-body",
              mobile ? "min-h-11" : "h-10",
              pathname === "/outils" && "bg-surface-soft text-ink",
            )}
          >
            Je découvre
          </Link>
        )}
      </div>
    </>
  );
}
