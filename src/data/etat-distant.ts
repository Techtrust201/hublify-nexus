import { aLeDroit, type DroitId, type RoleId } from "@/auth/permissions";
import {
  assemblerEtat,
  lireLigne,
  majLigneVisible,
  remplacerCollection,
  upsertLigne,
  type OrgSession,
} from "@/data/metier";
import {
  estCollectionMetier,
  type CollectionMetier,
  type EtatSession,
} from "@/data/etat-session";
import type { Sql } from "@/lib/sql";
import type { OrgType } from "@/lib/orgs";

export type DepsEtat = {
  sessionOrg: () => Promise<OrgSession | null>;
  sql: () => Sql | null;
};

export type RaisonEchec = "non_authentifie" | "non_configure" | "interdit" | "introuvable";

export type Lecture =
  | { ok: true; payload: EtatSession }
  | { ok: false; raison: RaisonEchec };

export type Ecriture = { ok: true } | { ok: false; raison: RaisonEchec };

const DROIT_COLLECTION: Partial<Record<CollectionMetier, DroitId>> = {
  reservationsCalendrier: "mod-reservations",
  reservationsDossier: "mod-reservations",
  datesBloquees: "mod-reservations",
  datesBloqueesAnnuelles: "mod-reservations",
  loyers: "mod-finances",
  ensembles: "mod-finances",
  regles: "mod-finances",
  biens: "mod-biens",
  missions: "mod-missions",
  conversations: "messagerie",
  messagesFil: "messagerie",
  messagesDash: "messagerie",
  prestataires: "mod-biens",
};

function peutEcrire(org: OrgSession, collection: CollectionMetier) {
  if (org.roleId === "lecteur") return false;
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

  for (const [cle, valeur] of Object.entries(patch)) {
    if (!estCollectionMetier(cle) || valeur === undefined) continue;
    if (cle === "missions" && org.orgType === "prestataire") continue;
    if (!peutEcrire(org, cle)) return { ok: false, raison: "interdit" };
    await remplacerCollection(sql, org.orgId, cle, valeur as unknown[]);
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
  await upsertLigne(sql, org.orgId, collection, item);
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
  const ok = await majLigneVisible(sql, org, collection, id, patch);
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

export type { OrgSession, OrgType, RoleId };
