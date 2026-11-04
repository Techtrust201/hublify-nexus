import type { PlateformeMo1, StatutReservationMo1 } from "@/data/reservations-mo1";

/** Huit lignes, comme la maquette « Vision Occupations / Tablerfull ». */
export const TAILLE_PAGE_RESERVATIONS = 8;

export type FiltrePeriode = "tous" | "en_cours" | "a_venir" | "departs" | "passes";
export type FiltreStatutTableau = "tout" | StatutReservationMo1;
export type ColonneTri = "statut" | "propriete" | "arrivee" | "paiement";
export type SensTri = "asc" | "desc";

export type ReservationTableau = {
  id: string;
  bienId: string;
  occupant: string;
  arrivee: string;
  depart: string;
  heureArrivee: string;
  statut: StatutReservationMo1;
  plateforme: PlateformeMo1;
  voyageurs: number;
  montant: number;
  paye: number;
  type?: string;
};

export type CriteresTableau = {
  recherche: string;
  statut: FiltreStatutTableau;
  periode: FiltrePeriode;
  mois: string;
  aujourdHui: string;
  nomBien: (bienId: string) => string;
};

const ORDRE_STATUT: Record<StatutReservationMo1, number> = {
  Confirmé: 0,
  "En attente": 1,
  Annulé: 2,
};

export function finDeMois(mois: string) {
  const annee = Number(mois.slice(0, 4));
  const m = Number(mois.slice(5, 7));
  const jour = new Date(annee, m, 0).getDate();
  return `${mois}-${String(jour).padStart(2, "0")}`;
}

function pourcentage(r: { montant: number; paye: number }) {
  const montant = Number(r.montant) || 0;
  const paye = Number(r.paye) || 0;
  if (montant <= 0) return 0;
  return Math.round((paye / montant) * 100);
}

/**
 * « Tout » reprend les séjours actifs : les annulés restent derrière leur onglet.
 * La période et le mois se combinent.
 */
export function filtrerReservations<T extends ReservationTableau>(
  reservations: readonly T[],
  criteres: CriteresTableau,
): T[] {
  const q = criteres.recherche.trim().toLowerCase();
  return reservations.filter((r) => {
    if (q) {
      const nom = criteres.nomBien(r.bienId).toLowerCase();
      if (!r.occupant.toLowerCase().includes(q) && !nom.includes(q)) return false;
    }
    if (criteres.statut === "tout" && r.statut === "Annulé") return false;
    if (criteres.statut !== "tout" && r.statut !== criteres.statut) return false;
    const auj = criteres.aujourdHui;
    if (criteres.periode === "en_cours" && !(r.arrivee <= auj && r.depart > auj)) return false;
    if (criteres.periode === "a_venir" && !(r.arrivee > auj)) return false;
    if (criteres.periode === "departs" && r.depart !== auj) return false;
    if (criteres.periode === "passes" && !(r.depart < auj)) return false;
    if (criteres.mois !== "tous") {
      const fin = finDeMois(criteres.mois);
      if (r.depart < `${criteres.mois}-01` || r.arrivee > fin) return false;
    }
    return true;
  });
}

export function comptesReservations(reservations: ReservationTableau[], aujourdHui: string) {
  const base = reservations.filter((r) => r.statut !== "Annulé");
  return {
    en_cours: base.filter((r) => r.arrivee <= aujourdHui && r.depart > aujourdHui).length,
    a_venir: base.filter((r) => r.arrivee > aujourdHui).length,
    departs: base.filter((r) => r.depart === aujourdHui).length,
    passes: base.filter((r) => r.depart < aujourdHui).length,
    confirme: reservations.filter((r) => r.statut === "Confirmé").length,
    attente: reservations.filter((r) => r.statut === "En attente").length,
    annule: reservations.filter((r) => r.statut === "Annulé").length,
  };
}

export function trierReservations<T extends ReservationTableau>(
  lignes: readonly T[],
  tri: { colonne: ColonneTri; sens: SensTri } | null,
  nomBien: (bienId: string) => string,
): T[] {
  if (!tri) return [...lignes];
  const sens = tri.sens === "asc" ? 1 : -1;
  return [...lignes].sort((a, b) => {
    let cmp = 0;
    if (tri.colonne === "statut") cmp = ORDRE_STATUT[a.statut] - ORDRE_STATUT[b.statut];
    else if (tri.colonne === "propriete") {
      cmp = nomBien(a.bienId).localeCompare(nomBien(b.bienId), "fr", { sensitivity: "base" });
    } else if (tri.colonne === "arrivee") {
      cmp = a.arrivee.localeCompare(b.arrivee) || a.heureArrivee.localeCompare(b.heureArrivee);
    } else cmp = pourcentage(a) - pourcentage(b);
    if (cmp === 0) cmp = a.id.localeCompare(b.id);
    return cmp * sens;
  });
}

export function paginerReservations<T>(
  lignes: readonly T[],
  page: number,
  taille = TAILLE_PAGE_RESERVATIONS,
) {
  const pages = Math.max(1, Math.ceil(lignes.length / taille));
  const pageCourante = Math.min(Math.max(1, page), pages);
  const debut = (pageCourante - 1) * taille;
  return {
    page: pageCourante,
    pages,
    visibles: lignes.slice(debut, debut + taille),
  };
}

/** Clé pour un séjour court, maison pour un bail — comme les pictogrammes de la maquette. */
export function sejourAvecCle(type: string | undefined) {
  return !type?.startsWith("Bail");
}
