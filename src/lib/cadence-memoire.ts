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

export function cleAdresse(action: string, entetes: { get(nom: string): string | null }) {
  const brut = entetes.get("x-forwarded-for") ?? entetes.get("x-real-ip") ?? "";
  const ip = brut.split(",")[0]?.trim() || "inconnue";
  return `${action}:${ip.slice(0, 80)}`;
}
