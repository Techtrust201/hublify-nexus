import type { ModePortail, PaiementSimulation } from "@/lib/portail-mobile";

const MODE = "hublify.portail.mode";
const DEMARRE = "hublify.portail.demarre";
const NOTES = "hublify.portail.notes";
const PAIEMENTS = "hublify.portail.paiements";
const EDL = "hublify.portail.edl";
const RDV = "hublify.portail.rdv";
const DEMANDES = "hublify.portail.demandes";
const FAVORIS = "hublify.portail.favoris";
const DOC = "hublify.portail.doc";
const CANDIDATURE = "hublify.portail.candidature";
const PIN = "hublify.pin.code";
const WEBAUTHN = "hublify.portail.webauthn";

export type NoteCalendrier = { id: string; jour: string; texte: string };
export type DecisionStockee = {
  id: string;
  decision: "autoriser" | "resilier" | "signaler";
  expireLe: string | null;
  le: string;
};
export type RdvPortail = { jour: string; heure: string };
export type ValidationEdl = { emisLe: string; valideLe: string | null };
export type BrouillonCandidature = {
  bienId: string;
  arrivee: string;
  depart: string;
  marie: boolean;
  pacse: boolean;
  concubinage: boolean;
  colocation: boolean;
  autoriserDossier: boolean;
};

function lire(cle: string) {
  if (typeof localStorage === "undefined") return null;
  try {
    return localStorage.getItem(cle);
  } catch {
    return null;
  }
}

function ecrire(cle: string, valeur: string) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(cle, valeur);
  } catch {
    /* quota */
  }
}

function json<T>(cle: string, repli: T): T {
  const brut = lire(cle);
  if (!brut) return repli;
  try {
    return JSON.parse(brut) as T;
  } catch {
    return repli;
  }
}

export function lireMode(): ModePortail | null {
  const valeur = lire(MODE);
  return valeur === "resident" || valeur === "prestataire" ? valeur : null;
}

export function ecrireMode(mode: ModePortail) {
  ecrire(MODE, mode);
}

export function lireDemarre() {
  return lire(DEMARRE) === "1";
}

export function ecrireDemarre() {
  ecrire(DEMARRE, "1");
}

export function lireNotes(): NoteCalendrier[] {
  return json(NOTES, []);
}

export function ajouterNote(note: NoteCalendrier) {
  ecrire(NOTES, JSON.stringify([note, ...lireNotes().filter((n) => n.id !== note.id)]));
}

export function lirePaiements(): PaiementSimulation[] {
  return json(PAIEMENTS, []);
}

export function ajouterPaiement(paiement: PaiementSimulation) {
  ecrire(PAIEMENTS, JSON.stringify([paiement, ...lirePaiements()]));
}

export function lireEdl(): ValidationEdl {
  return json(EDL, { emisLe: new Date(Date.now() - 60 * 60 * 1000).toISOString(), valideLe: null });
}

export function ecrireEdl(valeur: ValidationEdl) {
  ecrire(EDL, JSON.stringify(valeur));
}

export function lireRdv(): RdvPortail | null {
  return json<RdvPortail | null>(RDV, null);
}

export function ecrireRdv(valeur: RdvPortail) {
  ecrire(RDV, JSON.stringify(valeur));
}

export function lireDemandes(): DecisionStockee[] {
  return json(DEMANDES, []);
}

export function ajouterDecision(decision: DecisionStockee) {
  ecrire(DEMANDES, JSON.stringify([decision, ...lireDemandes()]));
}

export function lireFavoris(): string[] {
  return json(FAVORIS, []);
}

export function basculerFavori(id: string) {
  const actuel = lireFavoris();
  const suivant = actuel.includes(id) ? actuel.filter((x) => x !== id) : [id, ...actuel];
  ecrire(FAVORIS, JSON.stringify(suivant));
  return suivant;
}

export function lireDocCourant() {
  return lire(DOC);
}

export function ecrireDocCourant(id: string) {
  ecrire(DOC, id);
}

export function lireBrouillonCandidature(): Partial<BrouillonCandidature> {
  return json(CANDIDATURE, {});
}

export function ecrireBrouillonCandidature(valeur: BrouillonCandidature) {
  ecrire(CANDIDATURE, JSON.stringify(valeur));
}

export function lirePin() {
  if (typeof sessionStorage === "undefined") return "";
  try {
    return sessionStorage.getItem(PIN) ?? "";
  } catch {
    return "";
  }
}

export function ecrirePin(pin: string) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(PIN, pin);
  } catch {
    /* navigation privée */
  }
}

export function lireWebAuthnId() {
  return lire(WEBAUTHN);
}

export function ecrireWebAuthnId(id: string) {
  ecrire(WEBAUTHN, id);
}

const CLES_METIER = [
  MODE,
  DEMARRE,
  NOTES,
  PAIEMENTS,
  EDL,
  RDV,
  DEMANDES,
  FAVORIS,
  DOC,
  CANDIDATURE,
];

/** Instantané navigateur, repris une fois vers la base puis oublié. */
export function lireInstantaneLocal() {
  return {
    mode: lireMode(),
    demarre: lireDemarre(),
    notes: lireNotes(),
    paiements: lirePaiements(),
    edl: lireEdl(),
    rdv: lireRdv(),
    demandes: lireDemandes(),
    favoris: lireFavoris(),
    docCourant: lireDocCourant(),
    candidature: lireBrouillonCandidature(),
  };
}

export function oublierEtatMetierLocal() {
  if (typeof localStorage === "undefined") return;
  for (const cle of CLES_METIER) {
    try {
      localStorage.removeItem(cle);
    } catch {
      /* navigation privée */
    }
  }
}
