import { AlertTriangle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LIBELLES_ALERTES, type AlertePatrimoine } from "@/data/patrimoine-fiche";

export function AlerteLieu({
  nom,
  alertes,
  onCompleter,
}: {
  nom: string;
  alertes: readonly AlertePatrimoine[];
  onCompleter: (section: "welcome" | "cles") => void;
}) {
  if (alertes.length === 0) return null;
  const libelles = alertes.map((a) => LIBELLES_ALERTES[a]);
  return (
    <Popover>
      <PopoverTrigger
        className="inline-flex size-11 items-center justify-center rounded-full text-chip-warning-fg hover:bg-chip-warning md:size-7"
        aria-label={`Alertes pour ${nom} : ${libelles.join(", ")}`}
      >
        <AlertTriangle className="size-4 fill-chip-warning" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3">
        <p className="text-xs font-medium text-ink">À compléter — {nom}</p>
        <ul className="mt-2 space-y-2 text-sm text-ink-body">
          {alertes.map((a) => (
            <li key={a}>
              {a === "etat-des-lieux" ? (
                <Link
                  to="/outils/etats-des-lieux"
                  className="underline decoration-line underline-offset-2 hover:text-ink"
                >
                  {LIBELLES_ALERTES[a]}
                </Link>
              ) : (
                <button
                  type="button"
                  className="text-left underline decoration-line underline-offset-2 hover:text-ink"
                  onClick={() => onCompleter(a === "welcome-book" ? "welcome" : "cles")}
                >
                  {LIBELLES_ALERTES[a]}
                </button>
              )}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
