const fenetres = new Map<string, number[]>();

/** Compteur en mémoire, par instance. Suffit à freiner un script sur une fonction publique. */
export function autoriserCadence(
  cle: string,
  max: number,
  fenetreMs: number,
  maintenant = Date.now(),
) {
  const liste = (fenetres.get(cle) ?? []).filter((t) => maintenant - t < fenetreMs);
  if (liste.length >= max) {
    fenetres.set(cle, liste);
    return false;
  }
  liste.push(maintenant);
  fenetres.set(cle, liste);
  return true;
}

export function reinitialiserCadence() {
  fenetres.clear();
}

function ipUtilisable(valeur: string) {
  if (valeur.length < 3 || valeur.length > 64) return false;
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(valeur)) {
    return valeur.split(".").every((octet) => {
      const n = Number(octet);
      return n <= 255 && String(n) === octet;
    });
  }
  if (!valeur.includes(":") || !/^[0-9a-f:]+$/i.test(valeur)) return false;
  return valeur.split("::").length <= 2;
}

/** Première adresse valide d'un en-tête posé par la plateforme, pas par le client. */
function premiereIp(entete: string | null) {
  if (!entete) return "";
  for (const morceau of entete.split(",")) {
    const ip = morceau.trim();
    if (ipUtilisable(ip)) return ip;
  }
  return "";
}

/**
 * Clé de plafond. `x-vercel-forwarded-for` est l'adresse vue par Vercel.
 * `x-real-ip` est le repli de la plateforme. `x-forwarded-for` est ignoré :
 * le client peut en changer le premier saut à chaque requête et sortir du plafond.
 * Sans IP de plateforme, tout le monde partage le même seau.
 */
export function cleAdresse(action: string, entetes: { get(nom: string): string | null }) {
  const ip =
    premiereIp(entetes.get("x-vercel-forwarded-for")) ||
    premiereIp(entetes.get("x-real-ip")) ||
    "sans-ip-de-confiance";
  return `${action}:${ip}`;
}
