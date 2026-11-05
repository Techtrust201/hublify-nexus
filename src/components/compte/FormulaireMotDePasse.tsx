import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toastErreur, toastOk } from "@/lib/feedback";
import { forceMotDePasse } from "@/lib/force-mot-de-passe";

/**
 * Changement de mot de passe de la session courante. Les autres sessions
 * (autre onglet, autre appareil) sont révoquées : elles devront se reconnecter.
 */
export function FormulaireMotDePasse() {
  const [actuel, setActuel] = useState("");
  const [suivant, setSuivant] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const force = forceMotDePasse(suivant);

  return (
    <form
      className="space-y-3 rounded-card border border-line bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (envoi) return;
        if (!actuel || !suivant) {
          toastErreur("Renseignez le mot de passe actuel et le nouveau.");
          return;
        }
        if (suivant.length < 10) {
          toastErreur("Le nouveau mot de passe doit contenir au moins 10 caractères.");
          return;
        }
        if (suivant !== confirmation) {
          toastErreur("La confirmation ne correspond pas.");
          return;
        }
        setEnvoi(true);
        void authClient
          .changePassword({
            currentPassword: actuel,
            newPassword: suivant,
            revokeOtherSessions: true,
          })
          .then((res) => {
            if (res.error) {
              toastErreur(res.error.message || "Le mot de passe n'a pas été changé.");
              return;
            }
            setActuel("");
            setSuivant("");
            setConfirmation("");
            toastOk("Mot de passe mis à jour. Les autres sessions sont déconnectées.");
          })
          .catch(() => {
            toastErreur("Le serveur n'a pas répondu. Réessayez dans un instant.");
          })
          .finally(() => setEnvoi(false));
      }}
    >
      <h2 className="text-lg text-ink">Mot de passe</h2>
      <p className="text-sm text-ink-muted">
        Au moins 10 caractères. Après l'enregistrement, les autres onglets et appareils devront se
        reconnecter.
      </p>
      <label className="block text-xs text-ink-muted">
        Mot de passe actuel
        <input
          type="password"
          autoComplete="current-password"
          value={actuel}
          onChange={(e) => setActuel(e.target.value)}
          className="mt-1 h-11 w-full rounded-card border border-line px-3 text-sm text-ink md:h-9"
        />
      </label>
      <label className="block text-xs text-ink-muted">
        Nouveau mot de passe
        <input
          type="password"
          autoComplete="new-password"
          value={suivant}
          onChange={(e) => setSuivant(e.target.value)}
          className="mt-1 h-11 w-full rounded-card border border-line px-3 text-sm text-ink md:h-9"
        />
      </label>
      <p className="text-[11px] text-ink-subtle">Robustesse : {force.libelle}</p>
      <label className="block text-xs text-ink-muted">
        Confirmation
        <input
          type="password"
          autoComplete="new-password"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          className="mt-1 h-11 w-full rounded-card border border-line px-3 text-sm text-ink md:h-9"
        />
      </label>
      <button
        type="submit"
        disabled={envoi}
        className="inline-flex h-11 items-center rounded-card bg-ink px-4 text-sm font-medium text-white disabled:opacity-60 md:h-9"
      >
        {envoi ? "Enregistrement…" : "Changer le mot de passe"}
      </button>
    </form>
  );
}
