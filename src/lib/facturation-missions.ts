/**
 * Règles de facturation des missions (chantier « Créer une Mission », PR 6/6).
 *
 * Tout passe par la date d'effet de l'org (`org_facturation.date_effet_facturation`) :
 * - pas de réglages, ou date vide : calcul actuel partout, au centime près ;
 * - mission datée avant la date d'effet : calcul actuel ;
 * - mission datée à partir de la date d'effet : nouvelles règles ci-dessous.
 *
 * Nouvelles règles (chiffrage L4, règles R1 à R5 de Hugo du 18/11) :
 * - réalisée par le propriétaire : rien à facturer ;
 * - à la charge du mandataire : hors facture propriétaire, comptée « à la charge du mandataire » ;
 * - à la charge du locataire : hors facture propriétaire, ligne sur la facture voyageur
 *   de la réservation liée (R3), au taux de TVA de l'org ;
 * - à la charge du propriétaire, ou attribution vide : facture propriétaire au tarif de la
 *   mission (manuel, sinon calculé), sinon au barème fixe (R5) ;
 * - « Linge et consommables » suit le ménage facturé au propriétaire, sauf si la réservation
 *   liée dit « Non » au linge et aux consommables (R4).
 */
import { BAREME_FRAIS_GESTION_CENTIMES, type LignePrestation } from "@/lib/analyse-finance";
import {
  TVA_LOCATAIRE_DEFAUT,
  reglesFacturationActives,
  type Attribution,
  type Porteur,
} from "@/lib/mission-facturation-serveur";

/** Colonnes de facturation d'une mission, telles que le serveur les a enregistrées. */
export type FacturationMission = {
  attribution: Attribution | null;
  porteur: Porteur | null;
  reservationId: string | null;
  /** Tarif retenu : manuel, sinon calculé. `null` : barème fixe (R5). */
  tarifCentimes: number | null;
  tvaTaux: number | null;
};

/** « Gestion : Ménage / Linge / Consommable » de la réservation. `null` : non renseigné. */
export type GestionReservation = {
  menage: boolean | null;
  linge: boolean | null;
  consommable: boolean | null;
};

/** Réglages et colonnes de facturation de l'org, lus par le gestionnaire. */
export type FacturationOrg = {
  dateEffet: string | null;
  tvaLocataire: number | null;
  missions: Record<string, FacturationMission>;
  reservations: Record<string, GestionReservation>;
};

type MissionFacturable = { id: string; type: string; date: string; bienId: string };

type LigneFrais = { nature: string; quantite: number; prixUnitaireHt: number; totalHt: number };

const NATURES = {
  Menage: "Ménage",
  Linge: "Linge et consommables",
  "Check-in": "Check-in",
  "Check-out": "Check-out",
  Maintenance: "Commission exceptionnelle (travaux)",
} as const;
type CleNature = keyof typeof NATURES;
const ORDRE: CleNature[] = ["Menage", "Linge", "Check-in", "Check-out", "Maintenance"];

const LIBELLES_TYPE: Record<string, string> = {
  Menage: "Ménage",
  "Check-in": "Check-in",
  "Check-out": "Check-out",
  Inventaire: "Inventaire",
  Maintenance: "Maintenance",
};

function estFacturableBareme(
  type: string,
): type is "Menage" | "Check-in" | "Check-out" | "Maintenance" {
  return type === "Menage" || type === "Check-in" || type === "Check-out" || type === "Maintenance";
}

/** La mission suit-elle les nouvelles règles ? */
export function missionSousNouvellesRegles(
  facturation: FacturationOrg | null | undefined,
  jourMission: string,
) {
  return Boolean(facturation && reglesFacturationActives(facturation.dateEffet, jourMission));
}

const SANS_COLONNES: FacturationMission = {
  attribution: null,
  porteur: null,
  reservationId: null,
  tarifCentimes: null,
  tvaTaux: null,
};

function colonnes(facturation: FacturationOrg, id: string) {
  return facturation.missions[id] ?? SANS_COLONNES;
}

/** Le linge suit le ménage, sauf « Non » au linge ET aux consommables sur la réservation. */
function lingeFacture(facturation: FacturationOrg, f: FacturationMission) {
  const gestion = f.reservationId ? facturation.reservations[f.reservationId] : undefined;
  if (!gestion) return true;
  return !(gestion.linge === false && gestion.consommable === false);
}

/**
 * Lignes « frais de gestion » de la facture propriétaire, depuis les missions de la période.
 * Sans réglages ou sans mission sous les nouvelles règles, le résultat est exactement
 * celui du calcul actuel (mêmes lignes, même ordre, mêmes montants).
 */
export function fraisGestionMissions(
  missions: readonly MissionFacturable[],
  facturation?: FacturationOrg | null,
): LigneFrais[] {
  // Clé : nature + prix unitaire. Une même nature peut avoir plusieurs prix.
  const groupes = new Map<CleNature, Map<number, number>>();
  const ajouter = (cle: CleNature, prix: number) => {
    const parPrix = groupes.get(cle) ?? new Map<number, number>();
    parPrix.set(prix, (parPrix.get(prix) ?? 0) + 1);
    groupes.set(cle, parPrix);
  };
  for (const m of missions) {
    if (!estFacturableBareme(m.type)) continue;
    const bareme = BAREME_FRAIS_GESTION_CENTIMES[m.type];
    if (!facturation || !missionSousNouvellesRegles(facturation, m.date)) {
      ajouter(m.type, bareme);
      if (m.type === "Menage") ajouter("Linge", BAREME_FRAIS_GESTION_CENTIMES.Linge);
      continue;
    }
    const f = colonnes(facturation, m.id);
    if (f.porteur === "proprietaire") continue;
    if (f.attribution === "mandataire" || f.attribution === "locataire") continue;
    ajouter(m.type, f.tarifCentimes ?? bareme);
    if (m.type === "Menage" && lingeFacture(facturation, f)) {
      ajouter("Linge", BAREME_FRAIS_GESTION_CENTIMES.Linge);
    }
  }
  const lignes: LigneFrais[] = [];
  for (const cle of ORDRE) {
    const parPrix = groupes.get(cle);
    if (!parPrix) continue;
    // Le barème d'abord (seul prix connu aujourd'hui), puis les tarifs par ordre croissant.
    const bareme = BAREME_FRAIS_GESTION_CENTIMES[cle];
    const prix = [...parPrix.keys()].sort((a, b) => (a === bareme ? -1 : b === bareme ? 1 : a - b));
    for (const p of prix) {
      const quantite = parPrix.get(p) ?? 0;
      if (quantite <= 0) continue;
      lignes.push({ nature: NATURES[cle], quantite, prixUnitaireHt: p, totalHt: quantite * p });
    }
  }
  return lignes;
}

/**
 * Lignes « Prestation » de la facture voyageur d'une réservation : missions à la charge du
 * locataire, liées à cette réservation (R3), sous les nouvelles règles et avec un tarif.
 * Sans tarif : pas de ligne (le barème est un frais de gestion propriétaire, pas un prix
 * annoncé au locataire). Taux : celui figé sur la mission, sinon celui de l'org, sinon 20 %.
 */
export function prestationsLocataire(
  missions: readonly MissionFacturable[],
  facturation: FacturationOrg | null | undefined,
  reservationId: string,
  logement: string,
): LignePrestation[] {
  if (!facturation) return [];
  const lignes: LignePrestation[] = [];
  for (const m of missions) {
    if (!missionSousNouvellesRegles(facturation, m.date)) continue;
    const f = colonnes(facturation, m.id);
    if (f.attribution !== "locataire" || f.reservationId !== reservationId) continue;
    if (f.porteur === "proprietaire") continue;
    if (f.tarifCentimes == null || f.tarifCentimes <= 0) continue;
    lignes.push({
      id: `${reservationId}-prestation-${m.id}`,
      nature: `Prestation ${LIBELLES_TYPE[m.type] ?? m.type} — ${logement}`,
      periode: m.date,
      quantite: 1,
      prixUnitaireHt: f.tarifCentimes,
      tauxTva: f.tvaTaux ?? facturation.tvaLocataire ?? TVA_LOCATAIRE_DEFAUT,
    });
  }
  return lignes.sort((a, b) => a.periode.localeCompare(b.periode) || a.id.localeCompare(b.id));
}

/** Total HT des missions à la charge du mandataire (tarif, sinon barème), sous les nouvelles règles. */
export function chargeMandataireHt(
  missions: readonly MissionFacturable[],
  facturation: FacturationOrg | null | undefined,
) {
  if (!facturation) return 0;
  let total = 0;
  for (const m of missions) {
    if (!missionSousNouvellesRegles(facturation, m.date)) continue;
    const f = colonnes(facturation, m.id);
    if (f.attribution !== "mandataire" || f.porteur === "proprietaire") continue;
    const bareme = estFacturableBareme(m.type) ? BAREME_FRAIS_GESTION_CENTIMES[m.type] : 0;
    total += f.tarifCentimes ?? bareme;
  }
  return total;
}

/**
 * Montant dû au prestataire (en euros) pour « Facturation prestataires » et le règlement.
 * Avant la date d'effet : tarif saisi dans la méta, comme aujourd'hui. Après : tarif
 * retenu par le serveur (manuel, sinon calculé), à défaut celui de la méta.
 */
export function tarifPrestataireEuros(
  mission: { id: string; date: string },
  tarifMeta: number | undefined,
  facturation: FacturationOrg | null | undefined,
): number | undefined {
  if (!facturation || !missionSousNouvellesRegles(facturation, mission.date)) return tarifMeta;
  const centimesRetenus = facturation.missions[mission.id]?.tarifCentimes;
  return centimesRetenus == null ? tarifMeta : centimesRetenus / 100;
}

/** Mention sur la facture quand au moins une mission de la période suit les nouvelles règles. */
export function mentionRegles(
  missions: readonly { date: string }[],
  facturation: FacturationOrg | null | undefined,
) {
  if (!facturation?.dateEffet) return null;
  if (!missions.some((m) => missionSousNouvellesRegles(facturation, m.date))) return null;
  const [a, mo, j] = facturation.dateEffet.split("-");
  return `Règles de facturation en vigueur au ${j}/${mo}/${a}`;
}
