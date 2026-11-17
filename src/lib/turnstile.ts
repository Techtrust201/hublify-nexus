/**
 * Cloudflare Turnstile, DÉSACTIVÉ par défaut. Il ne s'active que si les deux clés
 * existent : `VITE_TURNSTILE_SITE_KEY` (publique, dans le bundle) et
 * `TURNSTILE_SECRET_KEY` (serveur). Sans elles, aucun widget, aucune vérification.
 */
type Env = Record<string, string | undefined>;

export function turnstileActifServeur(env: Env = process.env) {
  return Boolean(env["TURNSTILE_SECRET_KEY"]?.trim());
}

export async function verifierTurnstile(
  jeton: string | undefined,
  ip: string | undefined,
  env: Env = process.env,
  appel: typeof fetch = fetch,
) {
  const secret = env["TURNSTILE_SECRET_KEY"]?.trim();
  if (!secret) return true;
  if (!jeton || jeton.length > 2048) return false;
  const corps = new URLSearchParams({ secret, response: jeton });
  if (ip) corps.set("remoteip", ip);
  try {
    const reponse = await appel("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: corps,
    });
    if (!reponse.ok) return false;
    const resultat = (await reponse.json()) as { success?: boolean };
    return resultat.success === true;
  } catch {
    return false;
  }
}
