/**
 * Rattachement des loyers EXISTANTS à leur séjour, pour le script
 * `scripts/rattacher-loyers-reservations.ts`. Ne retient que les correspondances non ambiguës.
 */

export type LoyerARattacher = {
  orgId: string;
  id: string;
  locataire: string;
  bienNom: string;
  echeance: string;
  reservationId: string | null;
};

export type SejourCandidat = {
  orgId: string;
  id: string;
  occupant: string;
  bienNom: string;
  arrivee: string;
  depart: string;
  statut: string;
};

const MOIS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

function norme(v: string) {
  return v.trim().replace(/\s+/g, " ").toLowerCase();
}

/** « 2026-03-05 » ou « 05 mars 2026 » → « 2026-03-05 » ; `null` si illisible ou invalide. */
export function echeanceIso(brut: string): string | null {
  const t = brut.trim();
  let a: number;
  let m: number;
  let j: number;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (iso) {
    a = Number(iso[1]);
    m = Number(iso[2]);
    j = Number(iso[3]);
  } else {
    const fr = /^(\d{1,2})\s+(\S+)\s+(\d{4})$/.exec(t);
    if (!fr) return null;
    const idx = MOIS.indexOf((fr[2] ?? "").toLowerCase());
    if (idx < 0) return null;
    a = Number(fr[3]);
    m = idx + 1;
    j = Number(fr[1]);
  }
  const d = new Date(Date.UTC(a, m - 1, j));
  if (d.getUTCFullYear() !== a || d.getUTCMonth() !== m - 1 || d.getUTCDate() !== j) return null;
  return `${String(a).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(j).padStart(2, "0")}`;
}

export type Rattachement = { orgId: string; loyerId: string; reservationId: string };

/**
 * Un loyer sans lien est rattaché si, dans sa propre organisation, UN SEUL séjour non annulé
 * a le même occupant, le même logement et contient l'échéance. Sinon : on ne touche à rien.
 */
export function rattachementsNonAmbigus(
  loyers: readonly LoyerARattacher[],
  sejours: readonly SejourCandidat[],
): Rattachement[] {
  const res: Rattachement[] = [];
  for (const l of loyers) {
    if (l.reservationId) continue;
    const ech = echeanceIso(l.echeance);
    if (!ech) continue;
    const candidats = sejours.filter(
      (s) =>
        s.orgId === l.orgId &&
        s.statut !== "Annulé" &&
        norme(s.occupant) === norme(l.locataire) &&
        norme(s.bienNom) === norme(l.bienNom) &&
        s.arrivee <= ech &&
        ech <= s.depart,
    );
    if (candidats.length === 1 && candidats[0]) {
      res.push({ orgId: l.orgId, loyerId: l.id, reservationId: candidats[0].id });
    }
  }
  return res;
}
