// SOURCE: Maquette MO1 — sidebar gestionnaire + en-tête (frame Dashboard/Calendar/Missions/3days)

import { Link, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronDown, Menu, X } from "lucide-react";
import {
  estPagePlanningHorsAccueil,
  RetourVueGenerale,
} from "@/components/layout/RetourVueGenerale";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth, useDroit } from "@/auth/auth-context";
import { authClient } from "@/lib/auth-client";
import { signalerDeconnexion } from "@/lib/fin-session";
import { BandeauSync } from "@/components/layout/BandeauSync";
import { BarreOngletsMobile } from "@/components/layout/BarreOngletsMobile";
import { NavChrome } from "@/components/layout/NavChrome";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { CorpsEnAttente } from "@/components/layout/CorpsEnAttente";
import {
  marquerNotifsLues,
  oublierEtatsLocaux,
  reessayerSync,
  useLectureEchouee,
  useSession,
  useSessionChargee,
} from "@/data/session";
import { cn } from "@/lib/utils";

export function AppShell({
  titre,
  sousTitre,
  actions,
  attendDonnees = false,
  children,
}: {
  titre?: string;
  sousTitre?: string;
  actions?: ReactNode;
  /**
   * Retient le contenu tant que l'état métier n'est pas arrivé du serveur.
   * Sans cela, une page d'indicateurs affirme « À jour · 0 en attente · 0 € »
   * pendant les secondes qui précèdent l'arrivée des données, puis se contredit
   * avec « Urgent · 2 050 € ». Mieux vaut ne rien annoncer que se dédire.
   */
  attendDonnees?: boolean;
  children: ReactNode;
}) {
  const [mobileOuvert, setMobileOuvert] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const vueReservations = useRouterState({
    select: (r) => {
      const recherche = r.location.search as { vue?: string };
      return recherche?.vue;
    },
  });
  const retourPlanning =
    estPagePlanningHorsAccueil(pathname) &&
    (!(pathname === "/reservations" || pathname === "/reservations/") ||
      vueReservations === "planning");
  const session = useSession();
  const chargee = useSessionChargee();
  const lectureEchouee = useLectureEchouee();
  const auth = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const accueil = pathname === "/";
  const voirDocs = useDroit("voir-documents");
  const peutParametrer = useDroit("mod-biens");
  const notifsNonLues = session.notifications.filter((n) => !n.lu).length;

  useEffect(() => {
    setMobileOuvert(false);
  }, [pathname]);

  return (
    <div className="flex min-h-dvh w-full bg-gest-zone font-sans text-gest-item">
      <a
        href="#contenu-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-toast focus:rounded-card focus:bg-ink focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Aller au contenu
      </a>

      <aside
        className="sticky top-0 hidden h-dvh w-[255px] shrink-0 flex-col overflow-hidden border-r border-gest-bordure bg-gest-sidebar font-sans lg:flex"
        aria-label="Navigation principale"
      >
        <NavChrome pathname={pathname} densite="desktop" />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={cn(
            "sticky top-0 z-sticky px-4 pt-[env(safe-area-inset-top)] lg:px-6",
            accueil ? "bg-gest-zone" : "border-b border-gest-bordure bg-white/90 backdrop-blur-sm",
          )}
        >
          <div className="flex min-h-[72px] min-w-0 items-center justify-between gap-2 py-3 sm:gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                ref={hamburgerRef}
                type="button"
                className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-ink-body lg:hidden"
                onClick={() => setMobileOuvert(true)}
                aria-label={mobileOuvert ? "Fermer la navigation" : "Ouvrir la navigation"}
                aria-expanded={mobileOuvert}
                aria-controls="nav-mobile"
              >
                <Menu className="size-4" />
              </button>
              {accueil && auth ? (
                <h1 className="min-w-0 truncate font-sans text-[26px] font-medium leading-none text-gest-titre">
                  Bonjour {auth.prenom}
                </h1>
              ) : titre ? (
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-medium leading-tight text-ink-deep">
                    {titre}
                  </h1>
                  {sousTitre && !(attendDonnees && !chargee) && (
                    <p className="mt-0.5 truncate text-sm text-ink-muted">{sousTitre}</p>
                  )}
                </div>
              ) : (
                <div className="hidden h-8 w-16 lg:block" />
              )}
              {retourPlanning && <RetourVueGenerale className="shrink-0" />}
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
              {actions ? <div className="flex shrink-0 items-center">{actions}</div> : null}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger className="inline-flex h-9 shrink-0 items-center gap-1 rounded-gest-outils bg-gest-outils px-4 font-sans text-sm font-medium text-ink outline-none">
                  Outils
                  <ChevronDown className="size-3.5 shrink-0" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-52"
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  <DropdownMenuItem asChild>
                    <Link to="/outils">Tous les outils</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/outils/debuter">Je débute</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/outils/modeles">Modèles de documents</Link>
                  </DropdownMenuItem>
                  {voirDocs && (
                    <DropdownMenuItem asChild>
                      <Link to="/outils/baux">Baux</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/outils/vue-annuelle">Vue annuelle</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/inventaire">Inventaire</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/prestataires">Prestataires</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/occupants">Occupants</Link>
                  </DropdownMenuItem>
                  {voirDocs && (
                    <DropdownMenuItem asChild>
                      <Link to="/outils/etats-des-lieux">États des lieux</Link>
                    </DropdownMenuItem>
                  )}
                  {peutParametrer && (
                    <DropdownMenuItem asChild>
                      <Link to="/parametrage">Paramétrage</Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu
                modal={false}
                onOpenChange={(ouvert) => {
                  if (!ouvert && notifsNonLues > 0) marquerNotifsLues();
                }}
              >
                <DropdownMenuTrigger
                  className="relative inline-flex size-9 shrink-0 items-center justify-center rounded-full text-ink outline-none hover:bg-white/60"
                  aria-label="Notifications"
                >
                  <Bell className="size-4 shrink-0" />
                  {notifsNonLues > 0 && (
                    <span className="absolute right-1 top-1 size-2 rounded-full bg-chip-urgent" />
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[min(20rem,calc(100vw-1.5rem))] p-0"
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  <p className="border-b border-surface-soft px-3 py-2 text-xs font-medium text-ink">
                    Notifications
                  </p>
                  {session.notifications.length === 0 ? (
                    <p className="px-3 py-4 text-xs text-ink-subtle">Aucune notification.</p>
                  ) : (
                    session.notifications.slice(0, 8).map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        asChild
                        className="cursor-pointer items-start gap-2 py-2"
                      >
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
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-full outline-none sm:h-auto sm:w-auto sm:min-h-10 sm:flex-col sm:items-start sm:px-1"
                  aria-label="Compte gestionnaire"
                >
                  <span className="hidden text-[11px] leading-none text-ink-muted sm:block">
                    Compte gestionnaire
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm text-ink sm:mt-1">
                    <span className="size-2.5 shrink-0 rounded-full bg-[#b9fbbd]" aria-hidden />
                    <span className="hidden max-w-[9rem] truncate sm:inline">
                      {auth ? `${auth.prenom} ${auth.nom}` : "Compte"}
                    </span>
                    <ChevronDown className="size-3.5 shrink-0 text-ink-muted" />
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem asChild>
                    <Link to="/profil">Profil</Link>
                  </DropdownMenuItem>
                  {peutParametrer && (
                    <DropdownMenuItem asChild>
                      <Link to="/parametrage">Paramétrage</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onSelect={() => {
                      signalerDeconnexion();
                      void authClient.signOut().then(async () => {
                        oublierEtatsLocaux(null);
                        await router.invalidate();
                        await navigate({ to: "/connexion" });
                      });
                    }}
                  >
                    Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <BandeauSync />

        <Sheet
          open={mobileOuvert}
          onOpenChange={(open) => {
            setMobileOuvert(open);
            if (!open) {
              requestAnimationFrame(() => hamburgerRef.current?.focus());
            }
          }}
        >
          <SheetContent
            side="left"
            showClose={false}
            id="nav-mobile"
            className="flex w-[min(255px,100%)] max-w-[255px] flex-col gap-0 border-gest-bordure bg-gest-sidebar p-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] font-sans sm:max-w-[255px]"
          >
            <div className="flex items-center justify-between border-b border-surface-soft px-3 py-2">
              <SheetTitle className="text-sm font-medium text-ink">Menu</SheetTitle>
              <SheetDescription className="sr-only">
                Navigation principale de l'espace {auth?.role ?? "Hublify"}
              </SheetDescription>
              <button
                type="button"
                className="flex size-11 items-center justify-center rounded-card text-ink-body"
                onClick={() => setMobileOuvert(false)}
                aria-label="Fermer la navigation"
              >
                <X className="size-4" />
              </button>
            </div>
            <NavChrome
              pathname={pathname}
              densite="mobile"
              onNavigate={() => setMobileOuvert(false)}
            />
          </SheetContent>
        </Sheet>

        <main
          id="contenu-principal"
          className="espace-gestionnaire min-w-0 flex-1 p-4 pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:p-6 lg:pb-6"
        >
          {attendDonnees && !chargee ? (
            <CorpsEnAttente />
          ) : attendDonnees && lectureEchouee ? (
            <div role="alert" className="rounded-card border border-line bg-white p-6">
              <h2 className="text-base text-ink">Les données n'ont pas pu être chargées</h2>
              <p className="mt-2 text-sm text-ink-muted">
                Le serveur n'a pas répondu. Les chiffres ne sont pas affichés, pour ne pas les
                confondre avec un compte vide.
              </p>
              <button
                type="button"
                onClick={reessayerSync}
                className="mt-4 inline-flex h-11 items-center rounded-card bg-ink px-4 text-sm font-medium text-white md:h-9"
              >
                Réessayer
              </button>
            </div>
          ) : (
            children
          )}
        </main>
        <BarreOngletsMobile pathname={pathname} onMenu={() => setMobileOuvert(true)} />
      </div>
    </div>
  );
}
