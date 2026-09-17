// SOURCE: Maquette MO1 — sidebar gestionnaire + en-tête (frame Dashboard/Calendar/Missions/3days)

import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronDown, Menu, X } from "lucide-react";
import {
  estPagePlanningHorsAccueil,
  RetourVueGenerale,
} from "@/components/layout/RetourVueGenerale";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth, useDroit } from "@/auth/auth-context";
import { BandeauSync } from "@/components/layout/BandeauSync";
import { NavChrome } from "@/components/layout/NavChrome";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { CorpsEnAttente } from "@/components/layout/CorpsEnAttente";
import { marquerNotifsLues, useSession, useSessionChargee } from "@/data/session";
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
  const session = useSession();
  const chargee = useSessionChargee();
  const auth = useAuth();
  const voirDocs = useDroit("voir-documents");
  const peutParametrer = useDroit("mod-biens");
  const notifsNonLues = session.notifications.filter((n) => !n.lu).length;

  useEffect(() => {
    setMobileOuvert(false);
  }, [pathname]);

  return (
    <div className="flex min-h-dvh w-full bg-canvas">
      <a
        href="#contenu-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-toast focus:rounded-card focus:bg-ink focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Aller au contenu
      </a>

      <aside
        className="sticky top-0 hidden h-dvh w-[255px] shrink-0 flex-col border-r border-line bg-white lg:flex"
        aria-label="Navigation principale"
      >
        <NavChrome pathname={pathname} densite="desktop" />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-sticky border-b border-line bg-white/90 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-sm lg:px-6">
          <div className="flex min-h-[80px] items-center justify-between gap-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              ref={hamburgerRef}
              type="button"
              className="flex size-11 items-center justify-center rounded-card border border-line text-ink-body lg:hidden"
              onClick={() => setMobileOuvert(true)}
              aria-label={mobileOuvert ? "Fermer la navigation" : "Ouvrir la navigation"}
              aria-expanded={mobileOuvert}
              aria-controls="nav-mobile"
            >
              <Menu className="size-4" />
            </button>
            {pathname === "/" && auth ? (
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.16em] text-ink-muted">Vue générale</p>
                <h1 className="truncate text-xl font-medium leading-tight text-ink-deep">
                  Bonjour {auth.prenom}
                </h1>
              </div>
            ) : titre ? (
              <div className="min-w-0">
                <h1 className="truncate text-lg font-medium leading-tight text-ink-deep">{titre}</h1>
                {sousTitre && !(attendDonnees && !chargee) && (
                  <p className="mt-0.5 truncate text-sm text-ink-muted">{sousTitre}</p>
                )}
              </div>
            ) : (
              <div className="hidden h-8 w-16 lg:block" />
            )}
            {estPagePlanningHorsAccueil(pathname) && (
              <RetourVueGenerale className="shrink-0" />
            )}
          </div>
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {actions ? <div className="flex shrink-0 items-center">{actions}</div> : null}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger className="hidden h-10 shrink-0 items-center gap-1 rounded-card border border-line bg-canvas px-3 text-sm font-medium text-ink outline-none lg:inline-flex">
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
                  <Link to="/outils/baux">Créer un bail</Link>
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
                className="relative inline-flex h-11 w-[7.5rem] shrink-0 items-center justify-center gap-2 rounded-card border border-line bg-canvas px-3 text-sm text-ink outline-none sm:w-[8.25rem] lg:h-10"
                aria-label="Notifications"
              >
                <Bell className="size-4 shrink-0" />
                <span className="hidden sm:inline">Alertes</span>
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px]",
                    notifsNonLues > 0 ? "bg-ink text-white" : "bg-transparent text-transparent",
                  )}
                  aria-hidden={notifsNonLues === 0}
                >
                  {notifsNonLues > 0 ? notifsNonLues : "0"}
                </span>
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
            <Link
              to="/profil"
              className="hidden min-h-10 items-center rounded-card border border-line bg-canvas px-3 text-sm font-medium text-ink lg:inline-flex"
            >
              {auth ? `${auth.prenom} · ${auth.role}` : "Compte"}
            </Link>
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
            className="flex w-[min(255px,100%)] max-w-[255px] flex-col gap-0 border-line bg-white p-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] sm:max-w-[255px]"
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
          className="flex-1 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:p-6"
        >
          {attendDonnees && !chargee ? <CorpsEnAttente /> : children}
        </main>
      </div>
    </div>
  );
}
