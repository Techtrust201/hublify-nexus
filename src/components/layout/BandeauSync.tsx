import { AlertTriangle, RefreshCw } from "lucide-react";
import { reessayerSync, useStatutSync } from "@/data/session";

/**
 * Rendu dans le flux, jamais en surcouche : un échec d'enregistrement doit être
 * visible sans recouvrir le contenu ni décaler les cibles tactiles mesurées.
 */
export function BandeauSync() {
  const statut = useStatutSync();
  if (statut.etat !== "echec") return null;

  const message =
    statut.raison === "non_authentifie"
      ? "Votre session a expiré : reconnectez-vous pour enregistrer vos modifications."
      : "Vos dernières modifications ne sont pas enregistrées sur le serveur.";

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-warning bg-warning-soft px-4 py-2 lg:px-6"
    >
      <AlertTriangle className="size-4 shrink-0 text-warning-strong" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-xs text-warning-strong">
        {message} Elles restent sur cet appareil, la reprise est automatique.
      </p>
      <button
        type="button"
        onClick={reessayerSync}
        className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-card border border-warning-strong px-3 text-xs font-medium text-warning-strong md:min-h-8"
      >
        <RefreshCw className="size-3.5" aria-hidden="true" />
        Réessayer
      </button>
    </div>
  );
}
