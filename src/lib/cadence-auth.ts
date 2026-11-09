/**
 * Plafonds Better Auth. La connexion et le mot de passe oublié sont plus
 * serrés que le plafond global : ce sont les deux portes vers un compte.
 * `window` est en secondes.
 */
export const CADENCE_AUTH = {
  fenetreSecondes: 60,
  plafond: 40,
  regles: {
    "/sign-in/email": { window: 60, max: 5 },
    "/request-password-reset": { window: 900, max: 3 },
  },
} as const;
