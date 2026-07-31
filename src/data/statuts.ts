// SOURCE: V2 Redris — statuts observés partiellement dans « Vision Missions Calendar »
// HYPOTHÈSE — À VALIDER : liste et transitions provisoires (voir docs/DECISIONS.md)

export const STATUTS_MISSION = [
  "a_affecter",
  "planifiee",
  "en_cours",
  "terminee",
  "annulee",
] as const;

export type StatutMission = (typeof STATUTS_MISSION)[number];

export const LIBELLE_STATUT: Record<StatutMission, string> = {
  a_affecter: "À affecter",
  planifiee: "Planifiée",
  en_cours: "En cours",
  terminee: "Terminée",
  annulee: "Annulée",
};

/** Classes de rendu par statut — tokens sémantiques uniquement. */
export const CLASSE_STATUT: Record<StatutMission, string> = {
  a_affecter: "bg-warning-soft text-warning-strong border-warning/30",
  planifiee: "bg-brand-soft text-brand-strong border-brand/30",
  en_cours: "bg-info-soft text-info-strong border-info/30",
  terminee: "bg-success-soft text-success-strong border-success/30",
  annulee: "bg-muted text-muted-foreground border-border",
};

/** Transitions autorisées — provisoires, étape 1 uniquement. */
export const TRANSITIONS: Record<StatutMission, StatutMission[]> = {
  a_affecter: ["planifiee", "annulee"],
  planifiee: ["en_cours", "a_affecter", "annulee"],
  en_cours: ["terminee", "annulee"],
  terminee: [],
  annulee: ["a_affecter"],
};
