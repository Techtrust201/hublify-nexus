const MOIS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
] as const;

export function moisFrancais(index: number) {
  return MOIS[index] ?? "";
}

export function partiesIso(iso: string): { annee: number; mois: number; jour: number } {
  const morceaux = iso.split("-");
  const annee = Number(morceaux[0]);
  const mois = Number(morceaux[1]);
  const jour = Number(morceaux[2]);
  return {
    annee: Number.isFinite(annee) ? annee : 2026,
    mois: Number.isFinite(mois) ? mois : 1,
    jour: Number.isFinite(jour) ? jour : 1,
  };
}

export function dernierJourDuMois(annee: number, mois: number) {
  return new Date(annee, mois, 0).getDate();
}

export function libelleMois(iso: string) {
  const { annee, mois } = partiesIso(iso);
  return `${moisFrancais(mois - 1)} ${annee}`;
}

export function debutDeMois(annee: number, mois: number) {
  return `${annee}-${String(mois).padStart(2, "0")}-01`;
}

export function finDeMois(annee: number, mois: number) {
  const jour = String(dernierJourDuMois(annee, mois)).padStart(2, "0");
  return `${annee}-${String(mois).padStart(2, "0")}-${jour}`;
}

/** Vrai quand la plage couvre des mois entiers, du 1er au dernier jour. */
export function plageAligneeSurLesMois(debut: string, fin: string) {
  const a = partiesIso(debut);
  const b = partiesIso(fin);
  return a.jour === 1 && b.jour === dernierJourDuMois(b.annee, b.mois);
}
