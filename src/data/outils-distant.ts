import { aLeDroit, estRolePortail, type RoleId } from "@/auth/permissions";
import { normaliserLivret, type LivretAccueil } from "@/data/livrets";
import type { OrgSession } from "@/data/metier";
import { ficheStockee, type FicheUpsell } from "@/data/upsells-catalogue";
import { normaliserExtra, type ExtraPrecheckin } from "@/lib/gestionnaire-planning";
import type { Sql } from "@/lib/sql";

/**
 * Persistance des outils de démo (livrets, fiches upsell, extras de pré-check-in).
 * Le modèle est celui de `etat-distant` : dépendances injectées, org issue de
 * la session uniquement, refus explicite si le rôle ou le droit ne suffit pas.
 */

export type DepsOutils = {
  sessionOrg: () => Promise<OrgSession | null>;
  sql: () => Sql | null;
};

export type RaisonEchec = "non_authentifie" | "non_configure" | "interdit" | "invalide";

export type LectureLivrets =
  { ok: true; livrets: LivretAccueil[] } | { ok: false; raison: RaisonEchec };

export type LectureFiches =
  { ok: true; fiches: Record<string, FicheUpsell> } | { ok: false; raison: RaisonEchec };

export type LectureExtra =
  { ok: true; extra: ExtraPrecheckin; enregistre: boolean } | { ok: false; raison: RaisonEchec };

export type Ecriture = { ok: true } | { ok: false; raison: RaisonEchec };

type Acteur = { roleId: RoleId; droits: readonly string[] };

/** Le catalogue des livrets est un outil gestionnaire, pas une vue portail. */
export function peutLireLivrets(acteur: Acteur) {
  if (estRolePortail(acteur.roleId)) return false;
  return aLeDroit(acteur.droits, "voir-documents");
}

export function peutEcrireLivrets(acteur: Acteur) {
  if (acteur.roleId === "lecteur" || estRolePortail(acteur.roleId)) return false;
  return aLeDroit(acteur.droits, "voir-documents");
}

export function peutLireFichesUpsell(acteur: Acteur) {
  if (estRolePortail(acteur.roleId)) return false;
  return aLeDroit(acteur.droits, "mod-biens");
}

export function peutEcrireFichesUpsell(acteur: Acteur) {
  if (acteur.roleId === "lecteur" || estRolePortail(acteur.roleId)) return false;
  return aLeDroit(acteur.droits, "mod-biens");
}

/** Le voyageur lit les options pour afficher le formulaire ; il ne les change pas. */
export function peutLireExtraPrecheckin(acteur: Acteur) {
  return (
    aLeDroit(acteur.droits, "voir-reservations") || aLeDroit(acteur.droits, "mod-reservations")
  );
}

export function peutEcrireExtraPrecheckin(acteur: Acteur) {
  if (acteur.roleId === "lecteur" || estRolePortail(acteur.roleId)) return false;
  return aLeDroit(acteur.droits, "mod-reservations") || aLeDroit(acteur.droits, "mod-biens");
}

function livretDepuisLigne(id: string, payload: unknown): LivretAccueil | null {
  const brut = payloadObjet(payload);
  const source = brut && typeof brut === "object" ? { ...(brut as object), id } : { id, pages: [] };
  const livret = normaliserLivret(source);
  return livret ? borneLivret(livret) : null;
}

function payloadObjet(valeur: unknown): unknown {
  if (typeof valeur === "string") {
    try {
      return JSON.parse(valeur) as unknown;
    } catch {
      return null;
    }
  }
  return valeur;
}

function borneLivret(livret: LivretAccueil): LivretAccueil {
  return {
    ...livret,
    id: livret.id.slice(0, 120),
    nom: livret.nom.slice(0, 200),
    reference: livret.reference.slice(0, 40),
    logement: livret.logement.slice(0, 200),
    modifiePar: livret.modifiePar.slice(0, 120),
    logo: livret.logo.slice(0, 80),
    pages: livret.pages.slice(0, 40).map((page) => ({
      ...page,
      id: page.id.slice(0, 80),
      nom: page.nom.slice(0, 200),
      titre: page.titre.slice(0, 300),
      sousTitre: page.sousTitre.slice(0, 300),
      texte: page.texte.slice(0, 8000),
    })),
  };
}

function preparerLivrets(livrets: readonly LivretAccueil[]): LivretAccueil[] | null {
  const vus = new Set<string>();
  const propres: LivretAccueil[] = [];
  for (const brut of livrets) {
    const normalise = normaliserLivret(brut);
    if (!normalise) return null;
    const livret = borneLivret(normalise);
    if (!livret.id || vus.has(livret.id)) return null;
    vus.add(livret.id);
    propres.push(livret);
  }
  return propres;
}

export async function lireLivrets(deps: DepsOutils): Promise<LectureLivrets> {
  const org = await deps.sessionOrg();
  if (!org) return { ok: false, raison: "non_authentifie" };
  if (!peutLireLivrets(org)) return { ok: false, raison: "interdit" };
  const sql = deps.sql();
  if (!sql) return { ok: false, raison: "non_configure" };
  const rows = (await sql.query(
    `select id, payload, position
       from public.org_livrets
      where org_id = $1::uuid
      order by position, id`,
    [org.orgId],
  )) as { id: string; payload: unknown }[];
  const livrets: LivretAccueil[] = [];
  for (const row of rows) {
    const livret = livretDepuisLigne(row.id, row.payload);
    if (livret) livrets.push(livret);
  }
  return { ok: true, livrets };
}

export async function remplacerLivrets(
  deps: DepsOutils,
  livrets: readonly LivretAccueil[],
): Promise<Ecriture> {
  const org = await deps.sessionOrg();
  if (!org) return { ok: false, raison: "non_authentifie" };
  if (!peutEcrireLivrets(org)) return { ok: false, raison: "interdit" };
  const propres = preparerLivrets(livrets);
  if (!propres) return { ok: false, raison: "invalide" };
  const sql = deps.sql();
  if (!sql) return { ok: false, raison: "non_configure" };
  const saisie = propres.map((livret, position) => ({ id: livret.id, payload: livret, position }));
  // Une seule requête : l'insert et la suppression des modèles retirés
  // s'exécutent ensemble. L'org vient de la session, jamais du client.
  await sql.query(
    `with saisie as (
       select id, payload, position
         from jsonb_to_recordset($2::jsonb) as x(id text, payload jsonb, position int)
     ),
     ecriture as (
       insert into public.org_livrets (org_id, id, payload, position, updated_at)
       select $1::uuid, s.id, s.payload, s.position, now()
         from saisie s
       on conflict (org_id, id) do update
         set payload = excluded.payload,
             position = excluded.position,
             updated_at = now()
       returning id
     )
     delete from public.org_livrets l
      where l.org_id = $1::uuid
        and not exists (select 1 from saisie s where s.id = l.id)
        and (select count(*) from ecriture) >= 0`,
    [org.orgId, JSON.stringify(saisie)],
  );
  return { ok: true };
}

export async function lireFichesUpsell(deps: DepsOutils): Promise<LectureFiches> {
  const org = await deps.sessionOrg();
  if (!org) return { ok: false, raison: "non_authentifie" };
  if (!peutLireFichesUpsell(org)) return { ok: false, raison: "interdit" };
  const sql = deps.sql();
  if (!sql) return { ok: false, raison: "non_configure" };
  const rows = (await sql.query(
    `select upsell_id, code, type, prestataire, ville, piece_jointe
       from public.org_upsell_fiches
      where org_id = $1::uuid
      order by upsell_id`,
    [org.orgId],
  )) as Record<string, unknown>[];
  const fiches: Record<string, FicheUpsell> = {};
  for (const row of rows) {
    const id = String(row["upsell_id"] ?? "");
    const fiche = ficheStockee({
      code: row["code"],
      type: row["type"],
      prestataire: row["prestataire"],
      ville: row["ville"],
      pieceJointe: row["piece_jointe"],
    });
    if (id && fiche) fiches[id] = fiche;
  }
  return { ok: true, fiches };
}

export async function enregistrerFicheUpsell(
  deps: DepsOutils,
  upsellId: string,
  fiche: FicheUpsell,
): Promise<Ecriture> {
  const org = await deps.sessionOrg();
  if (!org) return { ok: false, raison: "non_authentifie" };
  if (!peutEcrireFichesUpsell(org)) return { ok: false, raison: "interdit" };
  const id = upsellId.trim().slice(0, 80);
  const propre = ficheStockee(fiche);
  if (!id || !propre) return { ok: false, raison: "invalide" };
  const sql = deps.sql();
  if (!sql) return { ok: false, raison: "non_configure" };
  await sql.query(
    `insert into public.org_upsell_fiches
       (org_id, upsell_id, code, type, prestataire, ville, piece_jointe, updated_at)
     values ($1::uuid, $2, $3, $4, $5, $6, $7, now())
     on conflict (org_id, upsell_id) do update set
       code = excluded.code,
       type = excluded.type,
       prestataire = excluded.prestataire,
       ville = excluded.ville,
       piece_jointe = excluded.piece_jointe,
       updated_at = now()`,
    [org.orgId, id, propre.code, propre.type, propre.prestataire, propre.ville, propre.pieceJointe],
  );
  return { ok: true };
}

export async function retirerFicheUpsell(deps: DepsOutils, upsellId: string): Promise<Ecriture> {
  const org = await deps.sessionOrg();
  if (!org) return { ok: false, raison: "non_authentifie" };
  if (!peutEcrireFichesUpsell(org)) return { ok: false, raison: "interdit" };
  const id = upsellId.trim();
  if (!id) return { ok: false, raison: "invalide" };
  const sql = deps.sql();
  if (!sql) return { ok: false, raison: "non_configure" };
  await sql.query(
    `delete from public.org_upsell_fiches where org_id = $1::uuid and upsell_id = $2`,
    [org.orgId, id],
  );
  return { ok: true };
}

function ligneVersExtra(row: Record<string, unknown>): ExtraPrecheckin {
  const proposes = row["upsells_proposes"];
  return normaliserExtra({
    rectoVerso: drapeau(row["recto_verso"], true),
    photo: drapeau(row["photo"], true),
    fichier: drapeau(row["fichier"], true),
    telephone: drapeau(row["telephone"], true),
    codePorteJourArrivee: drapeau(row["code_porte_jour_arrivee"], false),
    cautionActive: drapeau(row["caution_active"], false),
    cautionMontant: Number(row["caution_montant"]) || 0,
    cautionBaux: drapeau(row["caution_baux"], true),
    cautionVoyageurs: drapeau(row["caution_voyageurs"], true),
    upsellsProposes: Array.isArray(proposes) ? proposes.map((id) => String(id)) : [],
  });
}

function drapeau(valeur: unknown, defaut: boolean) {
  if (typeof valeur === "boolean") return valeur;
  if (valeur === "t" || valeur === "true" || valeur === 1) return true;
  if (valeur === "f" || valeur === "false" || valeur === 0) return false;
  return defaut;
}

export async function lireExtraPrecheckinOrg(deps: DepsOutils): Promise<LectureExtra> {
  const org = await deps.sessionOrg();
  if (!org) return { ok: false, raison: "non_authentifie" };
  if (!peutLireExtraPrecheckin(org)) return { ok: false, raison: "interdit" };
  const sql = deps.sql();
  if (!sql) return { ok: false, raison: "non_configure" };
  const rows = (await sql.query(
    `select recto_verso, photo, fichier, telephone, code_porte_jour_arrivee,
            caution_active, caution_montant, caution_baux, caution_voyageurs,
            upsells_proposes
       from public.org_precheckin_extra
      where org_id = $1::uuid`,
    [org.orgId],
  )) as Record<string, unknown>[];
  const row = rows[0];
  if (!row) return { ok: true, extra: normaliserExtra(null), enregistre: false };
  return { ok: true, extra: ligneVersExtra(row), enregistre: true };
}

export async function enregistrerExtraPrecheckin(
  deps: DepsOutils,
  extra: ExtraPrecheckin,
): Promise<Ecriture> {
  const org = await deps.sessionOrg();
  if (!org) return { ok: false, raison: "non_authentifie" };
  if (!peutEcrireExtraPrecheckin(org)) return { ok: false, raison: "interdit" };
  const propre = normaliserExtra(extra);
  if (propre.upsellsProposes.length > 80) return { ok: false, raison: "invalide" };
  const sql = deps.sql();
  if (!sql) return { ok: false, raison: "non_configure" };
  await sql.query(
    `insert into public.org_precheckin_extra (
       org_id, recto_verso, photo, fichier, telephone, code_porte_jour_arrivee,
       caution_active, caution_montant, caution_baux, caution_voyageurs,
       upsells_proposes, updated_at
     ) values ($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::text[], now())
     on conflict (org_id) do update set
       recto_verso = excluded.recto_verso,
       photo = excluded.photo,
       fichier = excluded.fichier,
       telephone = excluded.telephone,
       code_porte_jour_arrivee = excluded.code_porte_jour_arrivee,
       caution_active = excluded.caution_active,
       caution_montant = excluded.caution_montant,
       caution_baux = excluded.caution_baux,
       caution_voyageurs = excluded.caution_voyageurs,
       upsells_proposes = excluded.upsells_proposes,
       updated_at = now()`,
    [
      org.orgId,
      propre.rectoVerso,
      propre.photo,
      propre.fichier,
      propre.telephone,
      propre.codePorteJourArrivee,
      propre.cautionActive,
      propre.cautionMontant,
      propre.cautionBaux,
      propre.cautionVoyageurs,
      propre.upsellsProposes,
    ],
  );
  return { ok: true };
}
