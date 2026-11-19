import { aLeDroit, estRolePortail, type RoleId } from "@/auth/permissions";
import type { FacturationOrg } from "@/lib/facturation-missions";
import { peutUtiliserMarketplace, type MissionOuverte } from "@/lib/marketplace";
import {
  assemblerEtat,
  ecrireAccesLieu,
  ecrireParametrage,
  lireAccesLieux,
  lireLigne,
  lireMissionsPrestataire,
  majLigneVisible,
  orgCibleEcriture,
  prestataireMalRattache,
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
  peutLireCollection,
  peutModifierCollection,
  peutRemplacerCollections,
  reduirePatch,
  validerInsertion,
} from "@/data/portee-role";
import type { Sql } from "@/lib/sql";
import type { OrgType } from "@/lib/orgs";
import {
  apercuTarifMission,
  lireFacturationOrg,
  listerMissionsOuvertes,
  prendreMissionOuverte,
  CHAMPS_DECLENCHEURS,
  chargerContexteFacturation,
  controlerMission,
  ecrireColonnesFacturation,
  entreeMission,
  missionsPourGestionnaire,
  schemaFacturationPret,
  synchroniserMissionsEnBloc,
} from "@/data/missions-serveur";
import type { PreparationMission } from "@/lib/mission-facturation-serveur";
import {
  avecGestion,
  ecrireGestionReservation,
  lireGestionReservations,
  schemaGestionPret,
} from "@/data/reservation-gestion-serveur";
import { gestionDepuisEntree } from "@/lib/reservation-gestion";

export type DepsEtat = {
  sessionOrg: () => Promise<OrgSession | null>;
  sql: () => Sql | null;
  cleChiffrement?: () => string | undefined;
};

export type RaisonEchec =
  "non_authentifie" | "non_configure" | "interdit" | "introuvable" | "invalide";

export type Lecture = { ok: true; payload: EtatSession } | { ok: false; raison: RaisonEchec };

export type Ecriture = { ok: true } | { ok: false; raison: RaisonEchec };

/** Collections dont une ligne porte un bien_id soumis à une clé étrangère. */
const COLLECTIONS_LIEES_AU_BIEN: ReadonlySet<CollectionMetier> = new Set([
  "missions",
  "reservationsCalendrier",
  "reservationsDossier",
  "datesBloquees",
]);

export function bienIdDeLigne(item: { bienId?: unknown } | Record<string, unknown>): string {
  const valeur = item["bienId"];
  return typeof valeur === "string" ? valeur.trim() : "";
}

/** Retient seulement les lignes dont le logement existe déjà (ou est dans le même patch). */
export function retenirLignesAuBienExistant<T extends { bienId?: unknown }>(
  lignes: readonly T[],
  idsBiens: ReadonlySet<string>,
): T[] {
  return lignes.filter((ligne) => idsBiens.has(bienIdDeLigne(ligne)));
}

async function idsBiensDeLOrg(
  sql: Sql,
  orgId: string,
  biensDuPatch?: readonly { id: string }[],
): Promise<Set<string>> {
  const ids = new Set<string>();
  for (const bien of biensDuPatch ?? []) {
    if (bien?.id) ids.add(bien.id);
  }
  const rows = (await sql.query(`select id from public.biens where org_id = $1::uuid`, [
    orgId,
  ])) as {
    id?: string;
  }[];
  for (const row of rows ?? []) {
    if (row?.id) ids.add(String(row.id));
  }
  return ids;
}

async function bienExiste(sql: Sql, orgId: string, bienId: string): Promise<boolean> {
  if (!bienId) return false;
  const rows = (await sql.query(
    `select 1 from public.biens where org_id = $1::uuid and id = $2 limit 1`,
    [orgId, bienId],
  )) as unknown[];
  return rows.length > 0;
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
  // Gestion Oui / Non des réservations (024) : équipe de l'org gestionnaire seulement.
  if (gestionReservationVisible(org) && payload.reservationsDossier.length > 0) {
    payload.reservationsDossier = avecGestion(
      payload.reservationsDossier,
      await lireGestionReservations(sql, org.orgId),
    );
  }
  return { ok: true, payload };
}

/** La gestion Oui / Non d'une réservation est un réglage interne : pas pour le portail. */
function gestionReservationVisible(org: OrgSession) {
  return org.orgType === "gestionnaire" && !estRolePortail(org.roleId);
}

export type DisponibiliteGestion =
  { ok: true; disponible: boolean } | { ok: false; raison: RaisonEchec };

/** La fenêtre de réservation n'affiche Ménage / Linge / Consommables que si la 024 est là. */
export async function lireDisponibiliteGestion(deps: DepsEtat): Promise<DisponibiliteGestion> {
  const org = await deps.sessionOrg();
  if (!org) return { ok: false, raison: "non_authentifie" };
  if (!gestionReservationVisible(org)) return { ok: true, disponible: false };
  const sql = deps.sql();
  if (!sql) return { ok: false, raison: "non_configure" };
  return { ok: true, disponible: await schemaGestionPret(sql) };
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
    (collection === "dossiersLocation" ||
      collection === "partagesDossier" ||
      collection === "candidatures")
  ) {
    const dossierId = collection === "dossiersLocation" ? item.id : String(item["dossierId"] ?? "");
    const existant = commeLigne(await lireLigne(sql, org.orgId, "dossiersLocation", dossierId));
    if (
      collection !== "dossiersLocation" &&
      (!existant || !ligneAppartient(org, "dossiersLocation", existant))
    ) {
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

  if (COLLECTIONS_LIEES_AU_BIEN.has(collection)) {
    const bienId = bienIdDeLigne(ligne);
    if (!bienId || !(await bienExiste(sql, orgId, bienId))) {
      return { ok: false, raison: "invalide" };
    }
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
  const besoinBiens = COLLECTIONS_METIER.some(
    (cle) => patch[cle] !== undefined && COLLECTIONS_LIEES_AU_BIEN.has(cle),
  );
  const idsBiens = besoinBiens
    ? await idsBiensDeLOrg(sql, org.orgId, patch.biens)
    : new Set<string>();

  for (const cle of COLLECTIONS_METIER) {
    const valeur = patch[cle];
    if (valeur === undefined) continue;
    if (cle === "missions" && org.orgType === "prestataire") continue;
    let items = valeur as unknown[];
    if (COLLECTIONS_LIEES_AU_BIEN.has(cle)) {
      const originales = items as { id: string; bienId?: unknown }[];
      const retenues = retenirLignesAuBienExistant(originales, idsBiens);
      // Un patch composé uniquement de séjours orphelins ne doit pas vider la table.
      if (retenues.length === 0 && originales.length > 0) continue;
      items = retenues;
    }
    await remplacerCollection(sql, org.orgId, cle, items);
    if (cle === "missions") {
      await synchroniserMissionsEnBloc(sql, org.orgId, items as Record<string, unknown>[]);
    }
    if (cle === "reservationsDossier" && gestionReservationVisible(org)) {
      for (const r of items as Record<string, unknown>[]) {
        const gestion = gestionDepuisEntree(r ?? {});
        if (Object.keys(gestion).length > 0) {
          await ecrireGestionReservation(sql, org.orgId, String(r["id"] ?? ""), gestion);
        }
      }
    }
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
  const orgCible = await orgCibleEcriture(sql, org, collection);
  let ligne = controle.item;
  let prep: PreparationMission | null = null;
  if (
    collection === "missions" &&
    org.roleId !== "prestataire" &&
    (await schemaFacturationPret(sql))
  ) {
    const existant = commeLigne(await lireLigne(sql, orgCible, "missions", ligne.id));
    const verdict = controlerMission(
      entreeMission(ligne),
      existant ? String(existant["description"] ?? "") : null,
      await chargerContexteFacturation(sql, orgCible),
      aLeDroit(org.droits, "mod-finances"),
    );
    if (!verdict.ok) return verdict;
    prep = verdict.prep;
    if (prep) ligne = { ...ligne, assigne: prep.assigne };
  }
  await upsertLigne(sql, orgCible, collection, ligne, orgPrestataire);
  if (prep) await ecrireColonnesFacturation(sql, orgCible, ligne.id, prep);
  if (collection === "reservationsDossier" && gestionReservationVisible(org)) {
    await ecrireGestionReservation(sql, orgCible, ligne.id, gestionDepuisEntree(ligne));
  }
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
  if (COLLECTIONS_LIEES_AU_BIEN.has(collection) && "bienId" in reduit.patch) {
    const bienId = bienIdDeLigne(reduit.patch);
    const orgIdCible = await orgCibleEcriture(sql, org, collection);
    if (!bienId || !(await bienExiste(sql, orgIdCible, bienId))) {
      return { ok: false, raison: "invalide" };
    }
  }
  // Un prestataire ne change que le statut des missions qui lui sont attribuées,
  // pas celles d'un collègue ni d'une organisation à laquelle il n'est pas rattaché.
  if (org.roleId === "prestataire" && collection === "missions") {
    const miennes = await lireMissionsPrestataire(sql, org);
    if (!miennes.some((m) => m["id"] === id)) return { ok: false, raison: "introuvable" };
  }
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
          await lireLigne(
            sql,
            orgMaj.orgId,
            "conversations",
            String(ligne["conversationId"] ?? ""),
          ),
        )
      : null;
    if (!conv || !ligneAppartient(org, "conversations", conv)) {
      return { ok: false, raison: "introuvable" };
    }
  }

  let patchFinal = reduit.patch;
  let prep: PreparationMission | null = null;
  if (
    collection === "missions" &&
    org.roleId !== "prestataire" &&
    CHAMPS_DECLENCHEURS.some((cle) => patchFinal[cle] !== undefined) &&
    (await schemaFacturationPret(sql))
  ) {
    // Une mission confiée par une autre organisation n'est pas à nous : on n'y
    // calcule rien (elle n'est d'ailleurs pas lisible ici).
    const existant = commeLigne(await lireLigne(sql, org.orgId, "missions", id));
    if (existant) {
      const verdict = controlerMission(
        entreeMission({ ...existant, ...patchFinal }),
        String(existant["description"] ?? ""),
        await chargerContexteFacturation(sql, org.orgId),
        aLeDroit(org.droits, "mod-finances"),
      );
      if (!verdict.ok) return verdict;
      prep = verdict.prep;
      const assigneFusionne = String(patchFinal["assigne"] ?? existant["assigne"] ?? "");
      if (prep && prep.assigne !== assigneFusionne) {
        patchFinal = { ...patchFinal, assigne: prep.assigne };
      }
    }
  }

  const ok = await majLigneVisible(sql, orgMaj, collection, id, patchFinal);
  if (!ok) return { ok: false, raison: "introuvable" };
  if (prep) await ecrireColonnesFacturation(sql, org.orgId, id, prep);
  if (collection === "reservationsDossier" && gestionReservationVisible(org)) {
    await ecrireGestionReservation(sql, orgMaj.orgId, id, gestionDepuisEntree(reduit.patch));
  }
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
  if (
    !estRolePortail(org.roleId) &&
    org.roleId !== "lecteur" &&
    !peutLireCollection(org, collection)
  ) {
    return { ok: false, raison: "interdit" };
  }
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
  let entite = await lireLigne(sql, org.orgId, collection, id);
  if (entite == null) return { ok: false, raison: "introuvable" };
  if (collection === "missions" && entite && typeof entite === "object") {
    const fiches = (await sql.query(
      `select id, nom, email from public.prestataires where org_id = $1::uuid`,
      [org.orgId],
    )) as { id: string; nom: string; email: string | null }[];
    entite = missionsPourGestionnaire([entite as { assigne?: unknown }], fiches)[0] ?? entite;
  }
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
  if (prestataireMalRattache(org)) return [];
  if (org.roleId === "prestataire" || org.orgType === "prestataire") {
    // Mêmes missions que celles envoyées à l'écran : un prestataire ne reçoit
    // le code que des logements de ses propres missions.
    const missions = await lireMissionsPrestataire(sql, org);
    const ids = missions.map((m) => String(m["bienId"] ?? "")).filter((id) => id !== "");
    return [...new Set(ids)];
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
  if (prestataireMalRattache(org)) return { ok: true, acces: [] };
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

export type ApercuTarif =
  | { ok: true; tarif: { centimes: number; source: "prestataire" | "grille_org" } | null }
  | { ok: false; raison: RaisonEchec };

/** Tarif automatique affiché dans la fenêtre « Créer une Mission ». Lecture seule. */
export async function lireApercuTarif(
  deps: DepsEtat,
  entree: { type: string; assigne: string; porteur: string | null; attribution?: string | null },
): Promise<ApercuTarif> {
  const org = await deps.sessionOrg();
  if (!org) return { ok: false, raison: "non_authentifie" };
  if (estRolePortail(org.roleId) || !peutInsererCollection(org, "missions")) {
    return { ok: false, raison: "interdit" };
  }
  const sql = deps.sql();
  if (!sql) return { ok: false, raison: "non_configure" };
  return { ok: true, tarif: await apercuTarifMission(sql, org.orgId, entree) };
}

export type LectureFacturation =
  { ok: true; facturation: FacturationOrg | null } | { ok: false; raison: RaisonEchec };

/**
 * Réglages et colonnes de facturation pour l'écran Analyse (PR 6). Lecture seule.
 * Réservé à l'organisation gestionnaire, hors rôles portail, avec le droit « voir-finances ».
 */
export async function lireFacturation(deps: DepsEtat): Promise<LectureFacturation> {
  const org = await deps.sessionOrg();
  if (!org) return { ok: false, raison: "non_authentifie" };
  if (
    org.orgType !== "gestionnaire" ||
    estRolePortail(org.roleId) ||
    !aLeDroit(org.droits, "voir-finances")
  ) {
    return { ok: false, raison: "interdit" };
  }
  const sql = deps.sql();
  if (!sql) return { ok: false, raison: "non_configure" };
  return { ok: true, facturation: await lireFacturationOrg(sql, org.orgId) };
}

export type LectureMissionsOuvertes =
  { ok: true; missions: MissionOuverte[] } | { ok: false; raison: RaisonEchec };

/**
 * Marketplace (PR 5) : missions ouvertes des orgs gestionnaires liées par un lien actif.
 * Réservé au rôle prestataire d'une org prestataire (voir `peutUtiliserMarketplace`).
 */
export async function lireMissionsOuvertes(deps: DepsEtat): Promise<LectureMissionsOuvertes> {
  const org = await deps.sessionOrg();
  if (!org) return { ok: false, raison: "non_authentifie" };
  if (!peutUtiliserMarketplace(org)) return { ok: false, raison: "interdit" };
  const sql = deps.sql();
  if (!sql) return { ok: false, raison: "non_configure" };
  return { ok: true, missions: await listerMissionsOuvertes(sql, org.orgId) };
}

export type PriseMission =
  { ok: true; id: string } | { ok: false; raison: RaisonEchec | "indisponible" };

/** Marketplace (PR 5) : prendre une mission ouverte. Une seule personne peut la prendre. */
export async function prendreMission(deps: DepsEtat, id: string): Promise<PriseMission> {
  const org = await deps.sessionOrg();
  if (!org) return { ok: false, raison: "non_authentifie" };
  if (!peutUtiliserMarketplace(org)) return { ok: false, raison: "interdit" };
  if (!id) return { ok: false, raison: "invalide" };
  const sql = deps.sql();
  if (!sql) return { ok: false, raison: "non_configure" };
  return prendreMissionOuverte(sql, org.orgId, emailActeur(org), id);
}
