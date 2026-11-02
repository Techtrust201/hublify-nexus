import { Link } from "@tanstack/react-router";
import { BarChart3, Home, Menu, MessageSquare, Users } from "lucide-react";
import { useDroit } from "@/auth/auth-context";
import { estActif } from "@/components/layout/NavChrome";
import { cn } from "@/lib/utils";

const ONGLETS = [
  { titre: "Accueil", url: "/", icone: Home, droit: undefined },
  {
    titre: "Réservations",
    url: "/reservations",
    icone: Users,
    droit: "voir-reservations" as const,
  },
  { titre: "Messages", url: "/messagerie", icone: MessageSquare, droit: "messagerie" as const },
  { titre: "Analyse", url: "/analyse", icone: BarChart3, droit: "voir-finances" as const },
];

export function BarreOngletsMobile({ pathname, onMenu }: { pathname: string; onMenu: () => void }) {
  const voirReservations = useDroit("voir-reservations");
  const voirMessages = useDroit("messagerie");
  const voirFinances = useDroit("voir-finances");
  const droits = {
    "voir-reservations": voirReservations,
    messagerie: voirMessages,
    "voir-finances": voirFinances,
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-sticky border-t border-v1-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Navigation rapide"
    >
      <ul className="flex">
        {ONGLETS.filter((o) => !o.droit || droits[o.droit]).map((o) => {
          const actif = estActif(pathname, o.url);
          return (
            <li key={o.url} className="min-w-0 flex-1">
              <Link
                to={o.url}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                  actif ? "text-v1-brand" : "text-v1-ink-muted",
                )}
                aria-current={actif ? "page" : undefined}
              >
                <o.icone className="size-4" aria-hidden />
                {o.titre}
              </Link>
            </li>
          );
        })}
        <li className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onMenu}
            className="flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-v1-ink-muted"
          >
            <Menu className="size-4" aria-hidden />
            Menu
          </button>
        </li>
      </ul>
    </nav>
  );
}
