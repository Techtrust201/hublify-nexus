import { aLeDroit, estRolePortail, type RoleId } from "@/auth/permissions";
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
import {
  emailActeur,
  ligneAppartient,
  nomActeur,
  peutEcrireCollection,
  peutEcrireParametrage,
  peutInsererCollection,
  peutModifierCollection,
  peutRemplacerCollections,
  reduirePatch,
  validerInsertion,
} from "@/data/portee-role";
import type { Sql } from "@/lib/sql";
import type { OrgType } from "@/lib/orgs";

export type DepsEtat = {
  sessionOrg: () => Promise<OrgSession | null>;
  sql: () => Sql | null;
  cleChiffrement?: () => string | undefined;
};

export type RaisonEchec =
  | "non_authentifie"
  | "non_configure"
  | "interdit"
  | "introuvable"
  | "invalide";

export type Lecture = { ok: true; payload: EtatSession } | { ok: false; raison: RaisonEchec };

export type Ecriture = { ok: true } | { ok: false; raison: RaisonEchec };

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

type LigneMetier = { id: string } & Record<string, unknown>;

function commeLigne(valeur: unknown): Record<string, unknown> | null {
  if (!valeur || typeof valeur !== "object" || Array.isArray(valeur)) return null;
  return valeur as Record<string, unknown>;
}

function presentDansEtat(etat: EtatSession, collection: CollectionMetier, id: string) {
  const liste = etat[collection];
  if (!Array.isArray(liste)) return false;
  return liste.some((item) => {
    if (typeof item === "string") return item === id;
    return Boolean(item && typeof item === "object" && (item as { id?: string }).id === id);
  });
}

async function controlerInsertion(
  sql: Sql,
  org: OrgSession,
  collection: CollectionMetier,
  item: LigneMetier,
): Promise<{ ok: true; item: LigneMetier } | { ok: false; raison: RaisonEchec }> {
  if (!peutInsererCollection(org, collection)) return { ok: false, raison: "interdit" };
  if (validerInsertion(collection, item) === "invalide") return { ok: false, raison: "invalide" };
  const orgId = await orgCibleEcriture(sql, org, collection);
  let ligne: LigneMetier = { ...item };
  const portail = estRolePortail(org.roleId);

  if (portail && collection === "conversations") {
    const existant = commeLigne(await lireLigne(sql, orgId, collection, item.id));
    if (existant && !ligneAppartient(org, collection, existant)) {
      return { ok: false, raison: "interdit" };
    }
    const type = String(existant?.["type"] ?? ligne["type"] ?? "");
    if (type === "team" || (org.roleId === "prestataire" && type && type !== "prestataire")) {
      return { ok: false, raison: "interdit" };
    }
    const email = emailActeur(org);
    ligne = {
      ...ligne,
      ...(type ? { type } : {}),
      ...(email ? { assigne: email } : {}),
    };
  }

  if (portail && collection === "messagesFil") {
    const convId = String(item["conversationId"] ?? "");
    const conv = commeLigne(await lireLigne(sql, orgId, "conversations", convId));
    if (!conv || !ligneAppartient(org, "conversations", conv)) {
      return { ok: false, raison: "interdit" };
    }
  }

  if (
    (org.roleId === "locataire" || org.roleId === "voyageur") &&
    (collection === "dossiersLocation" || collection === "partagesDossier" || collection === "candidatures")
  ) {
    const dossierId =
      collection === "dossiersLocation" ? item.id : String(item["dossierId"] ?? "");
    const existant = commeLigne(await lireLigne(sql, org.orgId, "dossiersLocation", dossierId));
    if (collection !== "dossiersLocation" && (!existant || !ligneAppartient(org, "dossiersLocation", existant))) {
      return { ok: false, raison: "interdit" };
    }
    if (collection === "dossiersLocation") {
      if (existant && !ligneAppartient(org, "dossiersLocation", existant)) {
        return { ok: false, raison: "interdit" };
      }
      const nom = `${org.prenom ?? ""} ${org.nom ?? ""}`.trim();
      ligne = {
        ...ligne,
        email: existant ? existant["email"] : (org.email ?? ligne["email"]),
        occupantNom: existant ? existant["occupantNom"] : nom || ligne["occupantNom"],
        departValide: existant ? existant["departValide"] : false,
      };
    }
  }

  if (org.roleId === "prestataire" && collection === "rapportsIntervention") {
    const missionId = String(item["missionId"] ?? "");
    const rows = (await sql.query(
      `select 1 from public.missions where id = $1 and org_prestataire_id = $2::uuid limit 1`,
      [missionId, org.orgId],
    )) as unknown[];
    if (rows.length === 0) return { ok: false, raison: "interdit" };
  }

  if (org.roleId === "prestataire" && collection === "documents") {
    const existant = commeLigne(await lireLigne(sql, orgId, "documents", item.id));
    if (existant && existant["vue"] !== "inventaire-presta") {
      return { ok: false, raison: "interdit" };
    }
    ligne = { ...ligne, vue: "inventaire-presta" };
  }

  return { ok: true, item: ligne };
}

export async function ecrireCollections(
  deps: DepsEtat,
  patch: Partial<EtatSession>,
): Promise<Ecriture> {
  const org = await deps.sessionOrg();
  if (!org) return { ok: false, raison: "non_authentifie" };
  // Le portail ne voit qu'une partie du parc : un remplacement de collection
  // effacerait les lignes des autres. Leurs écritures passent ligne par ligne.
  if (!peutRemplacerCollections(org)) return { ok: false, raison: "interdit" };
  const sql = deps.sql();
  if (!sql) return { ok: false, raison: "non_configure" };

  for (const cle of COLLECTIONS_METIER) {
    if (patch[cle] === undefined) continue;
    if (cle === "missions" && org.orgType === "prestataire") continue;
    if (!peutEcrireCollection(org, cle)) return { ok: false, raison: "interdit" };
  }
  if (patch.parametrage !== undefined && !peutEcrireParametrage(org)) {
    return { ok: false, raison: "interdit" };
  }

  // On suit l'ordre de COLLECTIONS_METIER, pas celui du patch : les parents
  // doivent être écrits avant leurs enfants pour satisfaire les clés étrangères.
  for (const cle of COLLECTIONS_METIER) {
    const valeur = patch[cle];
    if (valeur === undefined) continue;
    if (cle === "missions" && org.orgType === "prestataire") continue;
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
  const sql = deps.sql();
  if (!sql) return { ok: false, raison: "non_configure" };
  const controle = await controlerInsertion(sql, org, collection, item as LigneMetier);
  if (!controle.ok) return controle;
  const orgPrestataire = org.roleId === "prestataire" ? org.orgId : null;
  await upsertLigne(
    sql,
    await orgCibleEcriture(sql, org, collection),
    collection,
    controle.item,
    orgPrestataire,
  );
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
  if (!peutModifierCollection(org, collection)) return { ok: false, raison: "interdit" };
  const reduit = reduirePatch(org, collection, patch);
  if (!reduit.ok) return reduit;
  const sql = deps.sql();
  if (!sql) return { ok: false, raison: "non_configure" };
  const orgMaj =
    collection === "missions"
      ? org
      : { ...org, orgId: await orgCibleEcriture(sql, org, collection) };

  if (org.roleId === "voyageur" && collection === "reservationsDossier") {
    const ligne = commeLigne(await lireLigne(sql, org.orgId, collection, id));
    if (!ligne || !ligneAppartient(org, collection, ligne)) {
      return { ok: false, raison: "introuvable" };
    }
  }
  if (
    (org.roleId === "locataire" || org.roleId === "voyageur") &&
    collection === "dossiersLocation"
  ) {
    const ligne = commeLigne(await lireLigne(sql, org.orgId, collection, id));
    if (!ligne || !ligneAppartient(org, collection, ligne)) {
      return { ok: false, raison: "introuvable" };
    }
  }
  if (estRolePortail(org.roleId) && collection === "conversations") {
    const ligne = commeLigne(await lireLigne(sql, orgMaj.orgId, collection, id));
    if (!ligne || !ligneAppartient(org, collection, ligne)) {
      return { ok: false, raison: "introuvable" };
    }
  }
  if (estRolePortail(org.roleId) && collection === "messagesFil") {
    const ligne = commeLigne(await lireLigne(sql, orgMaj.orgId, collection, id));
    const conv = ligne
      ? commeLigne(
          await lireLigne(sql, orgMaj.orgId, "conversations", String(ligne["conversationId"] ?? "")),
        )
      : null;
    if (!conv || !ligneAppartient(org, "conversations", conv)) {
      return { ok: false, raison: "introuvable" };
    }
  }

  const ok = await majLigneVisible(sql, orgMaj, collection, id, reduit.patch);
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
  if (org.roleId === "lecteur" || estRolePortail(org.roleId)) {
    const etat = await assemblerEtat(sql, org);
    if (!presentDansEtat(etat, collection, id)) return { ok: false, raison: "introuvable" };
    const liste = etat[collection];
    const trouve = Array.isArray(liste)
      ? liste.find((item) => {
          if (typeof item === "string") return item === id;
          return Boolean(item && typeof item === "object" && (item as { id?: string }).id === id);
        })
      : undefined;
    if (typeof trouve === "string") return { ok: true, entite: { id: trouve } };
    if (!trouve || typeof trouve !== "object") return { ok: false, raison: "introuvable" };
    return { ok: true, entite: JSON.parse(JSON.stringify(trouve)) as Record<string, unknown> };
  }
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

/** `null` : tous les biens de l'org. Un tableau : seulement ces identifiants. */
async function idsBiensPourSecrets(sql: Sql, org: OrgSession): Promise<string[] | null> {
  if (org.roleId === "lecteur") return [];
  if (!estRolePortail(org.roleId)) {
    return aLeDroit(org.droits, "mod-biens") ? null : [];
  }
  if (org.roleId === "prestataire" || org.orgType === "prestataire") {
    const rows = (await sql.query(
      `select distinct bien_id as id from public.missions
        where org_prestataire_id = $1::uuid and bien_id is not null`,
      [org.orgId],
    )) as { id: string }[];
    return rows.map((r) => r.id);
  }
  if (org.roleId === "proprietaire") {
    const rows = (await sql.query(
      `select id from public.biens where org_id = $1::uuid and lower(proprietaire) = $2`,
      [org.orgId, nomActeur(org)],
    )) as { id: string }[];
    return rows.map((r) => r.id);
  }
  const rows = (await sql.query(
    `select distinct bien_id as id from public.reservations_dossier
      where org_id = $1::uuid and (lower(email) = $2 or lower(occupant) = $3)`,
    [org.orgId, emailActeur(org), nomActeur(org)],
  )) as { id: string }[];
  return rows.map((r) => r.id);
}

async function orgDesSecrets(sql: Sql, org: OrgSession) {
  if (org.orgType !== "prestataire" && org.roleId !== "prestataire") return org.orgId;
  const liens = (await sql.query(
    `select org_gestionnaire_id as id from public.liens_org
      where org_prestataire_id = $1::uuid limit 1`,
    [org.orgId],
  )) as { id: string }[];
  return liens[0]?.id ?? org.orgId;
}

export async function lireAcces(
  deps: DepsEtat,
): Promise<{ ok: true; acces: AccesLieu[] } | { ok: false; raison: RaisonEchec }> {
  const org = await deps.sessionOrg();
  if (!org) return { ok: false, raison: "non_authentifie" };
  const prestataire = org.roleId === "prestataire" || org.orgType === "prestataire";
  if (!prestataire && !aLeDroit(org.droits, "voir-biens") && !estRolePortail(org.roleId)) {
    return { ok: false, raison: "interdit" };
  }
  const sql = deps.sql();
  if (!sql) return { ok: false, raison: "non_configure" };
  const cle = cleOuRien(deps);
  if (!cle) return { ok: false, raison: "non_configure" };
  const ids = await idsBiensPourSecrets(sql, org);
  const acces = await lireAccesLieux(sql, await orgDesSecrets(sql, org), cle);
  if (ids === null) return { ok: true, acces };
  const permis = new Set(ids);
  return { ok: true, acces: acces.filter((a) => permis.has(a.bienId)) };
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
