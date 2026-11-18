import { lireMetaPrestation } from "@/lib/gestionnaire-planning";

/**
 * Reprise de la méta JSON cachée dans `missions.description` vers les colonnes de la
 * migration 022. Fonction pure : elle dit quoi écrire, sans rien écrire.
 *
 * - Ne remplit qu'une colonne encore vide (NULL, ou `ouverte` à false) : rejouable sans effet.
 * - Le tarif saisi aujourd'hui à la main va dans `tarif_manuel_centimes` ; aucun tarif
 *   calculé n'est inventé.
 * - Une attribution « locataire » sans réservation est laissée de côté (contrainte
 *   `missions_locataire_reservation`) et signalée.
 * - La méta JSON n'est jamais modifiée.
 */
export type MissionAReprendre = {
  orgId: string;
  id: string;
  description: string;
  attribution: string | null;
  porteur: string | null;
  reservationId: string | null;
  tarifManuelCentimes: number | null;
  ouverte: boolean;
};

export type MajMission = {
  attribution?: "mandataire" | "proprietaire" | "locataire";
  porteur?: "prestataire" | "teammate" | "proprietaire";
  reservationId?: string;
  tarifManuelCentimes?: number;
  ouverte?: true;
};

export type DecisionReprise =
  | { action: "rien" }
  | { action: "maj"; maj: MajMission }
  | { action: "ignoree"; raison: "locataire_sans_reservation" };

const ATTRIBUTIONS = new Set(["mandataire", "proprietaire", "locataire"]);
const PORTEURS = new Set(["prestataire", "teammate", "proprietaire"]);

export function decisionReprise(m: MissionAReprendre): DecisionReprise {
  const meta = lireMetaPrestation(m.description);
  const maj: MajMission = {};

  if (m.attribution == null && meta.attribution && ATTRIBUTIONS.has(meta.attribution)) {
    maj.attribution = meta.attribution;
  }
  if (m.porteur == null && meta.porteur && PORTEURS.has(meta.porteur)) {
    maj.porteur = meta.porteur;
  }
  const reservation = typeof meta.reservationId === "string" ? meta.reservationId.trim() : "";
  if (m.reservationId == null && reservation) maj.reservationId = reservation;
  if (
    m.tarifManuelCentimes == null &&
    typeof meta.tarif === "number" &&
    Number.isFinite(meta.tarif) &&
    meta.tarif >= 0
  ) {
    maj.tarifManuelCentimes = Math.round(meta.tarif * 100);
  }
  if (!m.ouverte && meta.marketplace === true) maj.ouverte = true;

  const attributionFinale = maj.attribution ?? m.attribution;
  const reservationFinale = maj.reservationId ?? m.reservationId;
  if (attributionFinale === "locataire" && !reservationFinale) {
    return { action: "ignoree", raison: "locataire_sans_reservation" };
  }
  return Object.keys(maj).length === 0 ? { action: "rien" } : { action: "maj", maj };
}

/** UPDATE paramétré pour une décision « maj ». Chaque colonne n'est écrite que si elle est
 *  encore vide en base au moment de l'écriture (garde SQL en plus de la garde ci-dessus). */
export function requeteReprise(orgId: string, id: string, maj: MajMission) {
  const sets: string[] = [];
  const params: unknown[] = [];
  const poser = (col: string, valeur: unknown, garde: string) => {
    params.push(valeur);
    sets.push(`${col} = case when ${garde} then $${params.length} else ${col} end`);
  };
  if (maj.attribution) poser("attribution", maj.attribution, "attribution is null");
  if (maj.porteur) poser("porteur", maj.porteur, "porteur is null");
  if (maj.reservationId) poser("reservation_id", maj.reservationId, "reservation_id is null");
  if (maj.tarifManuelCentimes != null)
    poser("tarif_manuel_centimes", maj.tarifManuelCentimes, "tarif_manuel_centimes is null");
  if (maj.ouverte) poser("ouverte", true, "not ouverte");
  params.push(orgId, id);
  return {
    texte: `update public.missions set ${sets.join(", ")}
      where org_id = $${params.length - 1}::uuid and id = $${params.length}`,
    params,
  };
}
