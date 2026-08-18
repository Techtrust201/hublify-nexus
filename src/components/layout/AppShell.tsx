// SOURCE: Maquette MO1 — sidebar gestionnaire + en-tête (frame Dashboard/Calendar/Missions/3days)

import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavChrome } from "@/components/layout/NavChrome";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { marquerNotifsLues, useSession } from "@/data/session";

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
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const session = useSession();
  const notifsNonLues = session.notifications.filter((n) => !n.lu).length;

  useEffect(() => {
    setMobileOuvert(false);
  }, [pathname]);

  return (
    <div className="flex min-h-dvh w-full bg-surface">
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
        <header className="sticky top-0 z-sticky flex min-h-[73px] items-center justify-between border-b border-line bg-white px-4 pt-[env(safe-area-inset-top)] lg:px-6">
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
            {titre ? (
              <div className="min-w-0">
                <h1 className="truncate text-sm font-medium text-ink">{titre}</h1>
                {sousTitre && <p className="truncate text-xs text-ink-muted">{sousTitre}</p>}
              </div>
            ) : (
              <div className="hidden h-8 w-16 lg:block" />
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {actions}
            <DropdownMenu>
              <DropdownMenuTrigger className="hidden h-11 items-center gap-1 rounded-card border border-line px-3 text-sm font-medium text-ink-body lg:inline-flex">
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
                className="relative flex size-11 items-center justify-center rounded-card border border-line text-ink-body"
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
              className="hidden min-h-11 items-center text-sm font-medium text-ink-body lg:inline-flex"
            >
              Compte gestionnaire
            </Link>
          </div>
        </header>

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
                Navigation principale de l'espace gestionnaire
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
          {children}
        </main>
      </div>
    </div>
  );
}
