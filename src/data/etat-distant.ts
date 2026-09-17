import { aLeDroit, estRolePortail, type DroitId, type RoleId } from "@/auth/permissions";
import {
  assemblerEtat,
  ecrireAccesLieu,
  ecrireParametrage,
  lireAccesLieux,
  lireLigne,
  majLigneVisible,
  orgCibleEcriture,
  remplacerCollection,
  upsertLigne,
  type AccesLieu,
  type OrgSession,
} from "@/data/metier";
import { COLLECTIONS_METIER, type CollectionMetier, type EtatSession } from "@/data/etat-session";
import { fusionnerParametrage } from "@/data/parametrage-mo1";
import type { Sql } from "@/lib/sql";
import type { OrgType } from "@/lib/orgs";

export type DepsEtat = {
  sessionOrg: () => Promise<OrgSession | null>;
  sql: () => Sql | null;
  cleChiffrement?: () => string | undefined;
};

export type RaisonEchec = "non_authentifie" | "non_configure" | "interdit" | "introuvable";

export type Lecture = { ok: true; payload: EtatSession } | { ok: false; raison: RaisonEchec };

export type Ecriture = { ok: true } | { ok: false; raison: RaisonEchec };

const DROIT_COLLECTION: Partial<Record<CollectionMetier, DroitId>> = {
  reservationsCalendrier: "mod-reservations",
  reservationsDossier: "mod-reservations",
  datesBloquees: "mod-reservations",
  datesBloqueesAnnuelles: "mod-reservations",
  occupants: "mod-reservations",
  loyers: "mod-finances",
  ensembles: "mod-finances",
  regles: "mod-finances",
  biens: "mod-biens",
  immeubles: "mod-biens",
  inventaire: "mod-biens",
  prestataires: "mod-biens",
  missions: "mod-missions",
  conversations: "messagerie",
  messagesFil: "messagerie",
  messagesDash: "messagerie",
  documents: "voir-documents",
  modeles: "voir-documents",
  edl: "voir-documents",
  droitsPersonnalises: "gerer-equipe",
  rapportsIntervention: "mod-missions",
};

function peutEcrire(org: OrgSession, collection: CollectionMetier) {
  if (org.roleId === "lecteur") return false;
  if (org.roleId === "voyageur") {
    return (
      collection === "reservationsDossier" ||
      collection === "messagesFil" ||
      collection === "conversations"
    );
  }
  if (org.roleId === "locataire") {
    return (
      collection === "dossiersLocation" ||
      collection === "partagesDossier" ||
      collection === "candidatures" ||
      collection === "messagesFil" ||
      collection === "conversations" ||
      collection === "notifications"
    );
  }
  if (org.roleId === "proprietaire") {
    return collection === "messagesFil" || collection === "conversations";
  }
  const besoin = DROIT_COLLECTION[collection];
  if (!besoin) return true;
  return aLeDroit(org.droits, besoin);
}

export function estPayloadValide(valeur: unknown): valeur is Partial<EtatSession> {
  return typeof valeur === "object" && valeur !== null && !Array.isArray(valeur);
}

export async function lireEtat(deps: DepsEtat): Promise<Lecture> {
  const org = await deps.sessionOrg();
  if (!org) return { ok: false, raison: "non_authentifie" };
  const sql = deps.sql();
  if (!sql) return { ok: false, raison: "non_configure" };
  const payload = await assemblerEtat(sql, org);
  return { ok: true, payload };
}

export async function ecrireCollections(
  deps: DepsEtat,
  patch: Partial<EtatSession>,
): Promise<Ecriture> {
  const org = await deps.sessionOrg();
  if (!org) return { ok: false, raison: "non_authentifie" };
  if (org.roleId === "lecteur") return { ok: false, raison: "interdit" };
  const sql = deps.sql();
  if (!sql) return { ok: false, raison: "non_configure" };

  // On suit l'ordre de COLLECTIONS_METIER, pas celui du patch : les parents
  // doivent être écrits avant leurs enfants pour satisfaire les clés étrangères.
  for (const cle of COLLECTIONS_METIER) {
    const valeur = patch[cle];
    if (valeur === undefined) continue;
    if (cle === "missions" && org.orgType === "prestataire") continue;
    if (!peutEcrire(org, cle)) return { ok: false, raison: "interdit" };
    await remplacerCollection(sql, org.orgId, cle, valeur as unknown[]);
  }
  if (patch.parametrage !== undefined) {
    await ecrireParametrage(sql, org.orgId, fusionnerParametrage(patch.parametrage));
  }
  return { ok: true };
}

export async function insererEntite(
  deps: DepsEtat,
  collection: CollectionMetier,
  item: { id: string },
): Promise<Ecriture> {
  const org = await deps.sessionOrg();
  if (!org) return { ok: false, raison: "non_authentifie" };
  if (!peutEcrire(org, collection)) return { ok: false, raison: "interdit" };
  const sql = deps.sql();
  if (!sql) return { ok: false, raison: "non_configure" };
  await upsertLigne(sql, await orgCibleEcriture(sql, org, collection), collection, item);
  return { ok: true };
}

export async function modifierEntite(
  deps: DepsEtat,
  collection: CollectionMetier,
  id: string,
  patch: Record<string, unknown>,
): Promise<Ecriture> {
  const org = await deps.sessionOrg();
  if (!org) return { ok: false, raison: "non_authentifie" };
  if (!peutEcrire(org, collection)) return { ok: false, raison: "interdit" };
  const sql = deps.sql();
  if (!sql) return { ok: false, raison: "non_configure" };
  const orgMaj =
    collection === "missions"
      ? org
      : { ...org, orgId: await orgCibleEcriture(sql, org, collection) };
  const ok = await majLigneVisible(sql, orgMaj, collection, id, patch);
  if (!ok) return { ok: false, raison: "introuvable" };
  return { ok: true };
}

export async function chargerEntite(
  deps: DepsEtat,
  collection: CollectionMetier,
  id: string,
): Promise<{ ok: true; entite: Record<string, unknown> } | { ok: false; raison: RaisonEchec }> {
  const org = await deps.sessionOrg();
  if (!org) return { ok: false, raison: "non_authentifie" };
  const sql = deps.sql();
  if (!sql) return { ok: false, raison: "non_configure" };
  const entite = await lireLigne(sql, org.orgId, collection, id);
  if (entite == null) return { ok: false, raison: "introuvable" };
  return { ok: true, entite: JSON.parse(JSON.stringify(entite)) as Record<string, unknown> };
}

// Les codes d'accès sont chiffrés au repos. Sans clé applicative on refuse de
// lire comme d'écrire : mieux vaut une fiche indisponible qu'un secret en clair.
function cleOuRien(deps: DepsEtat) {
  const cle = deps.cleChiffrement?.();
  return cle && cle.length > 0 ? cle : null;
}

export async function lireAcces(
  deps: DepsEtat,
): Promise<{ ok: true; acces: AccesLieu[] } | { ok: false; raison: RaisonEchec }> {
  const org = await deps.sessionOrg();
  if (!org) return { ok: false, raison: "non_authentifie" };
  if (!aLeDroit(org.droits, "voir-biens") && !estRolePortail(org.roleId)) {
    return { ok: false, raison: "interdit" };
  }
  const sql = deps.sql();
  if (!sql) return { ok: false, raison: "non_configure" };
  const cle = cleOuRien(deps);
  if (!cle) return { ok: false, raison: "non_configure" };
  return { ok: true, acces: await lireAccesLieux(sql, org.orgId, cle) };
}

export async function enregistrerAcces(deps: DepsEtat, acces: AccesLieu): Promise<Ecriture> {
  const org = await deps.sessionOrg();
  if (!org) return { ok: false, raison: "non_authentifie" };
  if (org.roleId === "lecteur" || !aLeDroit(org.droits, "mod-biens")) {
    return { ok: false, raison: "interdit" };
  }
  const sql = deps.sql();
  if (!sql) return { ok: false, raison: "non_configure" };
  const cle = cleOuRien(deps);
  if (!cle) return { ok: false, raison: "non_configure" };
  await ecrireAccesLieu(sql, org.orgId, cle, acces);
  return { ok: true };
}

export type { AccesLieu, OrgSession, OrgType, RoleId };
