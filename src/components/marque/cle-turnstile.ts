/** Clé publique Turnstile. Absente (cas par défaut) : aucun widget, aucun script chargé. */
export const CLE_SITE_TURNSTILE = (
  import.meta.env["VITE_TURNSTILE_SITE_KEY"] as string | undefined
)?.trim();
