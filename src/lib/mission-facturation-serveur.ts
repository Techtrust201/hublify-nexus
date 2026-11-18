import { lireMetaPrestation, type MetaPrestation } from "@/lib/gestionnaire-planning";

/**
 * Règles serveur de « Créer une Mission » (PR 3/6). Fonctions pures : elles disent
 * quoi écrire dans les colonnes de la migration 022, sans rien écrire.
 *
 * - La méta JSON cachée dans `missions.description` reste écrite par l'écran
 *   (double écriture) : les colonnes en sont dérivées côté serveur.
 * - Aucune règle ici ne change un montant affiché ou facturé. Les montants restent
 *   ceux du calcul actuel tant que `org_facturation.date_effet_facturation` est vide
 *   (voir `reglesFacturationActives`).
 */

export type Attribution = "mandataire" | "proprietaire" | "locataire";
export type Porteur = "prestataire" | "teammate" | "proprietaire";
export type SourceTarif = "prestataire" | "grille_org";
export type TypeMission = "Menage" | "Check-in" | "Check-out" | "Inventaire" | "Maintenance";

const ATTRIBUTIONS: ReadonlySet<string> = new Set(["mandataire", "proprietaire", "locataire"]);
const PORTEURS: ReadonlySet<string> = new Set(["prestataire", "teammate", "proprietaire"]);
const TYPES: ReadonlySet<string> = new Set([
  "Menage",
  "Check-in",
  "Check-out",
  "Inventaire",
  "Maintenance",
]);

/** TVA par défaut des prestations refacturées au locataire, tant que l'org n'en fixe pas. */
export const TVA_LOCATAIRE_DEFAUT = 0.2;

/** Fiche de l'annuaire des prestataires de l'organisation (table `prestataires`). */
export type FichePrestataire = { id: string; nom: string; email: string | null };

/** Tout ce que le serveur lit une fois par organisation pour décider. */
export type ContexteFacturation = {
  prestataires: readonly FichePrestataire[];
  /** type de mission → centimes */
  grilleOrg: ReadonlyMap<string, number>;
  /** `${prestataireId}|${type}` → centimes */
  tarifsPrestataire: ReadonlyMap<string, number>;
  /** id de réservation → bien */
  reservations: ReadonlyMap<string, string>;
  tvaLocataire: number | null;
  dateEffet: string | null;
};

export type MissionEntree = {
  bienId: string;
  type: string;
  assigne: string;
  description: string;
};

export type ColonnesFacturation = {
  attribution: Attribution | null;
  porteur: Porteur | null;
  reservationId: string | null;
  tarifManuelCentimes: number | null;
  tarifCalculeCentimes: number | null;
  tarifSource: SourceTarif | null;
  ouverte: boolean;
  /** Taux à figer si la ligne n'en a pas encore (prestation refacturée au locataire). */
  tvaTaux: number | null;
};

export type ErreurMission =
  | "attribution_inconnue"
  | "porteur_inconnu"
  | "tarif_invalide"
  | "reservation_introuvable"
  | "locataire_sans_reservation";

export type PreparationMission = {
  colonnes: ColonnesFacturation;
  /** Valeur à écrire dans `assigne` (e-mail du prestataire quand il est connu). */
  assigne: string;
  prestataireId: string | null;
  erreurs: ErreurMission[];
};

function normaliser(valeur: string) {
  return valeur.trim().toLowerCase();
}

/**
 * Retrouve la fiche du prestataire désigné par `assigne` (nom affiché à l'écran ou
 * e-mail). Un nom porté par deux fiches différentes ne désigne personne.
 */
export function trouverPrestataire(
  assigne: string,
  prestataires: readonly FichePrestataire[],
): FichePrestataire | null {
  const cle = normaliser(assigne);
  if (!cle) return null;
  if (cle.includes("@")) {
    return prestataires.find((p) => p.email && normaliser(p.email) === cle) ?? null;
  }
  const memes = prestataires.filter((p) => normaliser(p.nom) === cle);
  return memes.length === 1 ? (memes[0] ?? null) : null;
}

function emailValide(email: string | null | undefined): email is string {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Ordre du tarif automatique. Le manuel n'est pas « calculé » : il vit dans sa propre
 * colonne et reste prioritaire sur tout (`tarifEffectifCentimes`).
 *
 * - Prestation à la charge du mandataire (attribution « mandataire ») : grille de l'org
 *   (tarif contractuel) → tarif du prestataire → barème. Décision de Hugo du 18/11 :
 *   « le tarif contractuel de l'organisation passe en premier ».
 * - Autres cas (propriétaire, locataire, attribution non renseignée) : tarif du
 *   prestataire → grille de l'org → barème.
 *
 * `null` en sortie : aucun tarif connu, le barème fixe s'applique (règle R5).
 */
export function tarifAutomatique(
  type: string,
  prestataireId: string | null,
  porteur: Porteur | null,
  ctx: Pick<ContexteFacturation, "grilleOrg" | "tarifsPrestataire">,
  attribution: Attribution | null = null,
): { centimes: number; source: SourceTarif } | null {
  if (porteur === "proprietaire") return null;
  const presta = prestataireId ? ctx.tarifsPrestataire.get(`${prestataireId}|${type}`) : undefined;
  const grille = ctx.grilleOrg.get(type);
  const duPrestataire =
    presta != null ? { centimes: presta, source: "prestataire" as const } : null;
  const deLaGrille = grille != null ? { centimes: grille, source: "grille_org" as const } : null;
  if (attribution === "mandataire") return deLaGrille ?? duPrestataire;
  return duPrestataire ?? deLaGrille;
}

/** Tarif retenu pour la ligne : manuel, sinon calculé, sinon `null` (barème fixe). */
export function tarifEffectifCentimes(
  c: Pick<ColonnesFacturation, "tarifManuelCentimes" | "tarifCalculeCentimes">,
): number | null {
  return c.tarifManuelCentimes ?? c.tarifCalculeCentimes ?? null;
}

/**
 * Les nouvelles règles de montant ne s'appliquent qu'à partir de la date d'effet de
 * l'organisation. Date vide (défaut) : jamais, le calcul actuel reste partout.
 */
export function reglesFacturationActives(dateEffet: string | null, jourMission: string) {
  if (!dateEffet) return false;
  return jourMission >= dateEffet;
}

/**
 * Montant à facturer pour une ligne : le calcul actuel (`actuelCentimes`) tant que la
 * date d'effet n'est pas atteinte, sinon le tarif retenu, sinon le barème.
 */
export function montantApplicable(
  c: Pick<ColonnesFacturation, "tarifManuelCentimes" | "tarifCalculeCentimes">,
  options: {
    dateEffet: string | null;
    jourMission: string;
    actuelCentimes: number;
    baremeCentimes: number;
  },
) {
  if (!reglesFacturationActives(options.dateEffet, options.jourMission)) {
    return options.actuelCentimes;
  }
  return tarifEffectifCentimes(c) ?? options.baremeCentimes;
}

function tarifManuel(meta: MetaPrestation): { valeur: number | null; invalide: boolean } {
  if (meta.tarif === undefined || meta.tarif === null) return { valeur: null, invalide: false };
  if (typeof meta.tarif !== "number" || !Number.isFinite(meta.tarif) || meta.tarif < 0) {
    return { valeur: null, invalide: true };
  }
  return { valeur: Math.round(meta.tarif * 100), invalide: false };
}

/**
 * Valide la mission et calcule les colonnes. Une valeur invalide n'est jamais écrite :
 * la colonne reste vide et l'erreur est remontée. L'appelant décide de refuser
 * (écriture d'une ligne) ou d'écrire seulement ce qui est sûr (remplacement en bloc).
 */
export function preparerMission(m: MissionEntree, ctx: ContexteFacturation): PreparationMission {
  const meta = lireMetaPrestation(m.description ?? "");
  const erreurs: ErreurMission[] = [];

  let attribution: Attribution | null = null;
  if (meta.attribution !== undefined && meta.attribution !== null) {
    if (ATTRIBUTIONS.has(String(meta.attribution))) attribution = meta.attribution;
    else erreurs.push("attribution_inconnue");
  }

  let porteur: Porteur | null = null;
  if (meta.porteur !== undefined && meta.porteur !== null) {
    if (PORTEURS.has(String(meta.porteur))) porteur = meta.porteur;
    else erreurs.push("porteur_inconnu");
  }

  const manuel = tarifManuel(meta);
  if (manuel.invalide) erreurs.push("tarif_invalide");

  let reservationId: string | null = null;
  const demandee = typeof meta.reservationId === "string" ? meta.reservationId.trim() : "";
  if (demandee) {
    const bien = ctx.reservations.get(demandee);
    if (bien !== undefined && bien === m.bienId) reservationId = demandee;
    else erreurs.push("reservation_introuvable");
  }
  if (attribution === "locataire" && !reservationId) {
    if (!demandee) erreurs.push("locataire_sans_reservation");
    // Contrainte `missions_locataire_reservation` : sans réservation valable, on n'écrit
    // pas l'attribution plutôt que de faire échouer l'écriture.
    attribution = null;
  }

  const fiche =
    porteur === "proprietaire" || porteur === "teammate"
      ? null
      : trouverPrestataire(m.assigne ?? "", ctx.prestataires);
  const prestataireId = fiche?.id ?? null;
  // L'e-mail remplace le nom seulement s'il ne désigne qu'une fiche : la lecture
  // gestionnaire doit pouvoir retrouver le même nom (`nomAffichePourAssigne`).
  const emailUnique =
    fiche && emailValide(fiche.email)
      ? ctx.prestataires.filter(
          (p) => p.email && normaliser(p.email) === normaliser(fiche.email ?? ""),
        ).length === 1
      : false;
  const assigne = fiche && emailUnique ? normaliser(fiche.email ?? "") : m.assigne;

  const type = TYPES.has(m.type) ? m.type : "Maintenance";
  const auto = tarifAutomatique(type, prestataireId, porteur, ctx, attribution);

  return {
    colonnes: {
      attribution,
      porteur,
      reservationId,
      tarifManuelCentimes: manuel.valeur,
      tarifCalculeCentimes: auto?.centimes ?? null,
      tarifSource: auto?.source ?? null,
      ouverte: meta.marketplace === true,
      tvaTaux: attribution === "locataire" ? (ctx.tvaLocataire ?? TVA_LOCATAIRE_DEFAUT) : null,
    },
    assigne,
    prestataireId,
    erreurs,
  };
}

/** Champs de la méta qui touchent à l'argent : les changer demande le droit « mod-finances ». */
export function champsFinanciers(description: string | null | undefined) {
  const meta = lireMetaPrestation(description ?? "");
  return JSON.stringify([
    meta.attribution ?? null,
    meta.tarif ?? null,
    typeof meta.reservationId === "string" ? meta.reservationId.trim() || null : null,
    meta.payePrestataire ?? null,
  ]);
}

export function changeLaFacturation(
  avant: string | null | undefined,
  apres: string | null | undefined,
) {
  return champsFinanciers(avant) !== champsFinanciers(apres);
}

/**
 * Lecture côté gestionnaire : l'écran, les factures prestataires et les regroupements
 * comparent `assigne` au nom de la fiche. On rend donc le nom quand la base porte
 * l'e-mail d'une fiche, pour que l'affichage et les montants restent identiques.
 */
export function nomAffichePourAssigne(
  assigne: string,
  prestataires: readonly FichePrestataire[],
): string {
  if (!assigne.includes("@")) return assigne;
  const cle = normaliser(assigne);
  const fiche = prestataires.find((p) => p.email && normaliser(p.email) === cle);
  return fiche ? fiche.nom : assigne;
}
