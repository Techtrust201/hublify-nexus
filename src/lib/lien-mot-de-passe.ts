import { createElement } from "react";

/** Message affiché quand le lien de définition / réinitialisation n'est plus valable. */
export const MESSAGE_LIEN_INVALIDE =
  "Ce lien a déjà été utilisé ou a expiré. Demandez une nouvelle invitation à votre administrateur, ou utilisez « Mot de passe oublié ».";

/**
 * Vrai quand Better Auth refuse le jeton (déjà consommé, expiré ou inconnu),
 * ou quand la page est ouverte sans jeton.
 */
export function lienMotDePasseInvalide(
  jeton: string,
  erreur?: { code?: string | null | undefined; status?: number | null | undefined } | null,
) {
  if (!jeton) return true;
  if (!erreur) return false;
  return erreur.code === "INVALID_TOKEN";
}

/** Bloc d'alerte (sans dépendance au routeur, rendu testable côté serveur). */
export function AlerteLienInvalide() {
  return createElement(
    "div",
    {
      role: "alert",
      "data-testid": "lien-mot-de-passe-invalide",
      className: "mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800",
    },
    createElement("p", null, MESSAGE_LIEN_INVALIDE),
    createElement(
      "p",
      { className: "mt-2" },
      createElement(
        "a",
        { href: "/mot-de-passe-oublie", className: "font-semibold underline" },
        "Mot de passe oublié",
      ),
    ),
  );
}
