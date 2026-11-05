import type { ModePortail, PaiementSimulation } from "@/lib/portail-mobile";
import type {
  BrouillonCandidature,
  DecisionStockee,
  NoteCalendrier,
  RdvPortail,
  ValidationEdl,
} from "@/components/portail/etat-local";

export type EtatPortail = {
  mode: ModePortail | null;
  demarre: boolean;
  notes: NoteCalendrier[];
  paiements: PaiementSimulation[];
  edl: ValidationEdl;
  rdv: RdvPortail | null;
  demandes: DecisionStockee[];
  favoris: string[];
  docCourant: string | null;
  candidature: Partial<BrouillonCandidature>;
};

export const ETAT_PORTAIL_VIDE: EtatPortail = {
  mode: null,
  demarre: false,
  notes: [],
  paiements: [],
  edl: { emisLe: "", valideLe: null },
  rdv: null,
  demandes: [],
  favoris: [],
  docCourant: null,
  candidature: {},
};

const MODES = new Set<ModePortail>(["resident", "prestataire"]);
const DECISIONS = new Set(["autoriser", "resilier", "signaler"]);

function texte(valeur: unknown, max: number) {
  if (typeof valeur !== "string") return "";
  return valeur.trim().slice(0, max);
}

function bool(valeur: unknown) {
  return valeur === true;
}

function objet(valeur: unknown): Record<string, unknown> | null {
  if (!valeur || typeof valeur !== "object" || Array.isArray(valeur)) return null;
  return valeur as Record<string, unknown>;
}

function liste(valeur: unknown) {
  return Array.isArray(valeur) ? valeur : [];
}

export function normaliserNote(valeur: unknown): NoteCalendrier | null {
  const o = objet(valeur);
  if (!o) return null;
  const id = texte(o["id"], 80);
  const jour = texte(o["jour"], 10);
  const contenu = texte(o["texte"], 500);
  if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(jour) || !contenu) return null;
  return { id, jour, texte: contenu };
}

export function normaliserPaiement(valeur: unknown): PaiementSimulation | null {
  const o = objet(valeur);
  if (!o) return null;
  const id = texte(o["id"], 80);
  const reference = texte(o["reference"], 80);
  const libelle = texte(o["libelle"], 200);
  const montant = typeof o["montant"] === "number" ? o["montant"] : Number(o["montant"]);
  const creeLe = texte(o["creeLe"], 40);
  if (
    !id ||
    !reference ||
    !libelle ||
    !Number.isFinite(montant) ||
    montant < 0 ||
    montant > 1_000_000
  ) {
    return null;
  }
  if (!creeLe) return null;
  return {
    id,
    reference,
    libelle,
    montant: Math.round(montant * 100) / 100,
    creeLe,
    statut: "simulation",
    fournisseur: "aucun",
    mention: texte(o["mention"], 240) || "Simulation Hublify",
  };
}

export function normaliserDecision(valeur: unknown): DecisionStockee | null {
  const o = objet(valeur);
  if (!o) return null;
  const decision = texte(o["decision"], 20);
  if (!DECISIONS.has(decision)) return null;
  const expire = o["expireLe"];
  return {
    id: texte(o["id"], 80) || `dem-${decision}`,
    decision: decision as DecisionStockee["decision"],
    expireLe: typeof expire === "string" ? expire.slice(0, 40) : null,
    le: texte(o["le"], 40) || new Date(0).toISOString(),
  };
}

export function normaliserCandidature(valeur: unknown): Partial<BrouillonCandidature> {
  const o = objet(valeur);
  if (!o) return {};
  const brouillon: Partial<BrouillonCandidature> = {};
  const bienId = texte(o["bienId"], 80);
  const arrivee = texte(o["arrivee"], 10);
  const depart = texte(o["depart"], 10);
  if (bienId) brouillon.bienId = bienId;
  if (arrivee) brouillon.arrivee = arrivee;
  if (depart) brouillon.depart = depart;
  if ("marie" in o) brouillon.marie = bool(o["marie"]);
  if ("pacse" in o) brouillon.pacse = bool(o["pacse"]);
  if ("concubinage" in o) brouillon.concubinage = bool(o["concubinage"]);
  if ("colocation" in o) brouillon.colocation = bool(o["colocation"]);
  if ("autoriserDossier" in o) brouillon.autoriserDossier = bool(o["autoriserDossier"]);
  return brouillon;
}

export function normaliserEtatPortail(brut: unknown): EtatPortail {
  const o = objet(brut) ?? {};
  const modeBrut = texte(o["mode"], 20);
  const mode = MODES.has(modeBrut as ModePortail) ? (modeBrut as ModePortail) : null;
  const edlBrut = objet(o["edl"]);
  const rdvBrut = objet(o["rdv"]);
  const jourRdv = rdvBrut ? texte(rdvBrut["jour"], 10) : "";
  const heureRdv = rdvBrut ? texte(rdvBrut["heure"], 5) : "";
  const doc = texte(o["docCourant"], 80);
  return {
    mode,
    demarre: bool(o["demarre"]),
    notes: liste(o["notes"])
      .map(normaliserNote)
      .filter((n): n is NoteCalendrier => Boolean(n))
      .slice(0, 80),
    paiements: liste(o["paiements"])
      .map(normaliserPaiement)
      .filter((p): p is PaiementSimulation => Boolean(p))
      .slice(0, 80),
    edl: {
      emisLe: edlBrut ? texte(edlBrut["emisLe"], 40) : "",
      valideLe:
        edlBrut && typeof edlBrut["valideLe"] === "string"
          ? edlBrut["valideLe"].slice(0, 40)
          : null,
    },
    rdv: jourRdv && heureRdv ? { jour: jourRdv, heure: heureRdv } : null,
    demandes: liste(o["demandes"])
      .map(normaliserDecision)
      .filter((d): d is DecisionStockee => Boolean(d))
      .slice(0, 40),
    favoris: liste(o["favoris"])
      .map((id) => texte(id, 80))
      .filter(Boolean)
      .slice(0, 40),
    docCourant: doc || null,
    candidature: normaliserCandidature(o["candidature"]),
  };
}

export function etatDepuisLigne(ligne: Record<string, unknown> | undefined): EtatPortail {
  if (!ligne) return { ...ETAT_PORTAIL_VIDE };
  return normaliserEtatPortail({
    mode: ligne["mode"],
    demarre: ligne["demarre"],
    notes: ligne["notes"],
    paiements: ligne["paiements"],
    edl: ligne["edl"],
    rdv: ligne["rdv"],
    demandes: ligne["demandes"],
    favoris: ligne["favoris"],
    docCourant: ligne["doc_courant"],
    candidature: ligne["candidature"],
  });
}
