// SOURCE: Maquette V1 — sidebar Accueil 2:18130 (Lieux, Analyse, Team mate, Je débute teal)

import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Home,
  Info,
  MessageSquare,
  Settings,
  Users,
  Wrench,
} from "lucide-react";
import { useAuth, useDroit } from "@/auth/auth-context";
import { aLeDroit, type DroitId } from "@/auth/permissions";
import { oublierEtatsLocaux } from "@/data/session";
import { listerEquipe } from "@/lib/auth.functions";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type Entree = {
  titre: string;
  url: string;
  icone: typeof Users;
  chevron?: boolean;
  droit?: DroitId;
};

const NAV: Entree[] = [
  { titre: "Réservations", url: "/reservations", icone: Users, droit: "voir-reservations" },
  { titre: "Documents", url: "/documents", icone: FileText, droit: "voir-documents" },
  { titre: "Lieux", url: "/patrimoines", icone: Home, droit: "voir-biens" },
  { titre: "Prestataires", url: "/prestataires", icone: Wrench, droit: "voir-biens" },
  { titre: "Occupants", url: "/occupants", icone: Users, droit: "voir-reservations" },
  { titre: "Messagerie", url: "/messagerie", icone: MessageSquare, droit: "messagerie" },
  { titre: "Analyse", url: "/analyse", icone: BarChart3, droit: "voir-finances" },
];

const OUTILS: Array<{ titre: string; url: string; icone: typeof Info; droit?: DroitId }> = [
  { titre: "Tous les outils", url: "/outils", icone: Info },
  {
    titre: "Modèles de documents",
    url: "/outils/modeles",
    icone: FileText,
    droit: "voir-documents",
  },
  {
    titre: "Vue annuelle",
    url: "/outils/vue-annuelle",
    icone: CalendarDays,
    droit: "voir-calendrier",
  },
  { titre: "Inventaire", url: "/inventaire", icone: ClipboardList, droit: "voir-biens" },
  {
    titre: "États des lieux",
    url: "/outils/etats-des-lieux",
    icone: ClipboardCheck,
    droit: "voir-documents",
  },
  { titre: "Paramétrage", url: "/parametrage", icone: Settings, droit: "mod-biens" },
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
  const navigate = useNavigate();
  const router = useRouter();
  const droits = auth?.droits ?? [];
  const navVisible = NAV.filter((e) => !e.droit || aLeDroit(droits, e.droit));
  const outilsVisibles = OUTILS.filter((o) => !o.droit || aLeDroit(droits, o.droit));
  const mobile = densite === "mobile";
  // Les coéquipiers listés sont ceux de l'organisation connectée. La requête est
  // partagée avec le reste de l'application via son cache : naviguer d'un écran
  // à l'autre ne la relance pas.
  const { data: coequipiers } = useQuery({
    queryKey: ["equipe-navigation", auth?.orgId],
    queryFn: () => listerEquipe(),
    enabled: peutEquipe && Boolean(auth?.orgId),
    staleTime: 5 * 60_000,
  });
  // Une invitation encore en attente n'est pas un coéquipier : la faire figurer
  // dans la navigation laisserait croire à un accès déjà ouvert.
  const equipe = (coequipiers ?? []).filter((m) => m.statut === "actif");

  const lien = mobile
    ? "flex min-h-11 items-center gap-3 rounded-card px-3 text-sm font-medium text-ink-body hover:bg-surface"
    : "flex h-9 items-center gap-3 rounded-card px-3 text-sm font-medium text-ink-body hover:bg-surface";

  return (
    <>
      <div className="border-b border-surface-soft px-4 py-4">
        <Link
          to="/profil"
          onClick={onNavigate}
          className={cn("flex items-center gap-3", mobile && "min-h-11")}
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-line text-sm text-ink-body">
            {auth?.initiales ?? "?"}
          </span>
          <span className="min-w-0">
            <span className="block text-xs uppercase tracking-[0.3px] text-ink-muted">
              {auth?.role ?? "Compte"}
            </span>
            <span className="block text-sm text-ink">
              {auth ? `${auth.prenom} ${auth.nom}` : "Hublify"}
            </span>
            {mobile && <span className="block text-xs text-ink-muted">Compte</span>}
          </span>
        </Link>
        <Link
          to="/"
          onClick={onNavigate}
          className={cn(
            "mt-4 flex h-[38px] w-full items-center justify-center rounded-card border border-line bg-white text-sm font-medium text-ink-body",
            estActif(pathname, "/") && "border-ink bg-surface-soft text-ink",
          )}
        >
          Vue générale
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pt-3">
        {navVisible.map((e) => (
          <Link
            key={e.titre}
            to={e.url}
            onClick={onNavigate}
            className={cn(lien, estActif(pathname, e.url) && "bg-surface-soft text-ink")}
          >
            <e.icone className="size-4 shrink-0" />
            <span className="flex-1 truncate">{e.titre}</span>
          </Link>
        ))}

        {peutEquipe && (
          <div className="pt-4">
            <Link
              to="/team"
              onClick={onNavigate}
              className="flex min-h-6 items-center px-3 text-xs uppercase tracking-[0.3px] text-ink-muted hover:text-ink-body"
            >
              Team mate
            </Link>
            <div className="mt-1 space-y-0.5">
              {equipe.map((m) => (
                <Link key={m.id} to="/team" onClick={onNavigate} className={cn(lien, "gap-2 pl-3")}>
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-line text-[10px] font-medium text-ink-subtle">
                    {m.initiales}
                  </span>
                  <span className="truncate">
                    {m.prenom} {m.nom}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <p className="px-3 pt-4 text-xs uppercase tracking-[0.3px] text-ink-muted">
          Tous les outils
        </p>
        {(mobile
          ? outilsVisibles
          : [{ titre: "En savoir plus", url: "/outils", icone: Info, droit: undefined }]
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
        {peutOperer && (
          <Link
            to="/outils/debuter"
            onClick={onNavigate}
            className={cn(
              "flex w-full items-center justify-center rounded-card bg-accent-teal text-sm font-medium text-white",
              mobile ? "min-h-11" : "h-9",
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
              "flex w-full items-center justify-center rounded-card border border-line text-sm font-medium text-ink-body",
              mobile ? "min-h-11" : "h-[38px]",
              pathname === "/outils" && "bg-surface-soft text-ink",
            )}
          >
            Je découvre
          </Link>
        )}
        <button
          type="button"
          onClick={() => {
            void authClient.signOut().then(async () => {
              oublierEtatsLocaux(null);
              await router.invalidate();
              await navigate({ to: "/connexion" });
            });
          }}
          className={cn(
            "flex w-full items-center justify-center rounded-card text-sm font-medium text-ink-muted hover:text-ink",
            mobile ? "min-h-11" : "h-9",
          )}
        >
          Se déconnecter
        </button>
      </div>
    </>
  );
}
