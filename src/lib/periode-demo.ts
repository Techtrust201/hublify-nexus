/**
 * Les données semées restent datées de mars 2026 (ancre du seed).
 * L'affichage de la Timeline et des événements détectés les rapproche
 * de la période en cours, sans réécrire la base à chaque jour.
 */
import { ANCRE_SEED_MO1 } from "@/data/planning-mo1";

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
] as const;

/** Fenêtre du corpus de démo « en cours » au moment du seed (mi-février → fin mars 2026). */
const FENETRE_DEBUT = new Date(2026, 1, 15).getTime();
const FENETRE_FIN = new Date(2026, 2, 31).getTime();

/** Décalages, en jours, des trois événements semés (`ev1`…`ev3`) par rapport à aujourd'hui. */
const EVENEMENTS_SEED: Record<string, { debut: number; fin: number | null }> = {
  ev1: { debut: 0, fin: 6 },
  ev2: { debut: 2, fin: null },
  ev3: { debut: -1, fin: 0 },
};

function debutLocal(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function estDansFenetreDemo(date: Date) {
  const t = debutLocal(date).getTime();
  return t >= FENETRE_DEBUT && t <= FENETRE_FIN;
}

export function decalageDemoJours(maintenant: Date) {
  return Math.round(
    (debutLocal(maintenant).getTime() - debutLocal(ANCRE_SEED_MO1).getTime()) / 86_400_000,
  );
}

/** Décale une date de la fenêtre seed vers la période courante. Les autres dates ne bougent pas. */
export function projeterDateDemo(date: Date, maintenant: Date) {
  const ancre = debutLocal(date);
  if (!estDansFenetreDemo(ancre)) return ancre;
  const copie = new Date(ancre);
  copie.setDate(copie.getDate() + decalageDemoJours(maintenant));
  return copie;
}

function ajouterJours(base: Date, jours: number) {
  const copie = debutLocal(base);
  copie.setDate(copie.getDate() + jours);
  return copie;
}

function libelleJour(date: Date) {
  return `${date.getDate()} ${MOIS[date.getMonth()]} ${date.getFullYear()}`;
}

function isoLocal(date: Date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const j = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${j}`;
}

/** Intervalle réel d'un événement semé, calé sur aujourd'hui comme son libellé. */
export function intervalleEvenement(id: string, maintenant = new Date()) {
  const plan = EVENEMENTS_SEED[id];
  if (!plan) return null;
  const debut = ajouterJours(maintenant, plan.debut);
  const fin = ajouterJours(maintenant, plan.fin ?? plan.debut);
  return { debut: isoLocal(debut), fin: isoLocal(fin) };
}

export function evenementCouvreJour(id: string, jour: string, maintenant = new Date()) {
  const plage = intervalleEvenement(id, maintenant);
  if (!plage) return false;
  return jour >= plage.debut && jour <= plage.fin;
}

/**
 * Libellé affiché d'un événement. Les trois fiches semées suivent la période
 * courante ; un événement saisi par l'utilisateur conserve sa date.
 */
export function datesEvenementPourAffichage(id: string, dates: string, maintenant: Date) {
  const plan = EVENEMENTS_SEED[id];
  if (!plan) return dates;
  const debut = ajouterJours(maintenant, plan.debut);
  if (plan.fin == null) return libelleJour(debut);
  const fin = ajouterJours(maintenant, plan.fin);
  if (debut.getMonth() === fin.getMonth() && debut.getFullYear() === fin.getFullYear()) {
    return `${debut.getDate()} – ${fin.getDate()} ${MOIS[fin.getMonth()]} ${fin.getFullYear()}`;
  }
  return `${libelleJour(debut)} – ${libelleJour(fin)}`;
}
