import { aLeDroit, estRolePortail, type RoleId } from "@/auth/permissions";
import type { ContexteFichier } from "@/lib/fichiers-deposes";
import type { Sql } from "@/lib/sql";

/** Session réduite aux champs qui décident d'un dépôt, d'une lecture ou d'une suppression. */
export type ActeurFichier = {
  userId: string;
  orgId: string;
  orgType: "gestionnaire" | "prestataire";
  roleId: RoleId;
  droits: readonly string[];
  email: string;
  prenom: string;
  nom: string;
};

export function identiteActeur(acteur: Pick<ActeurFichier, "email" | "prenom" | "nom">) {
  return {
    email: acteur.email.trim().toLowerCase(),
    nom: `${acteur.prenom} ${acteur.nom}`.trim().toLowerCase(),
  };
}

export function memePersonne(
  emailLigne: string,
  nomLigne: string,
  acteur: Pick<ActeurFichier, "email" | "prenom" | "nom">,
) {
  const id = identiteActeur(acteur);
  const email = emailLigne.trim().toLowerCase();
  const nom = nomLigne.trim().toLowerCase();
  if (id.email && email === id.email) return true;
  if (id.nom && nom === id.nom) return true;
  return false;
}

/** Personnel interne : ni portail, ni compte lecture. */
export function estPersonnel(roleId: RoleId) {
  return !estRolePortail(roleId) && roleId !== "lecteur";
}

export function cibleDossier(
  refId: string,
): { sorte: "precheckin"; reservationId: string } | { sorte: "dossier"; dossierId: string } {
  if (refId.startsWith("precheckin:")) {
    return { sorte: "precheckin", reservationId: refId.slice("precheckin:".length) };
  }
  const coupe = refId.indexOf(":");
  return { sorte: "dossier", dossierId: coupe >= 0 ? refId.slice(0, coupe) : refId };
}

/**
 * Décision pure, une fois la ligne d'appartenance lue dans l'org de session.
 * `trouve` faux = référence absente de cette org (y compris une org tierce).
 */
export function decisionDossier(params: {
  roleId: RoleId;
  droits: readonly string[];
  ecriture: boolean;
  trouve: boolean;
  correspond: boolean;
}) {
  if (!params.trouve) return false;
  if (
    params.roleId === "lecteur" ||
    params.roleId === "prestataire" ||
    params.roleId === "proprietaire"
  ) {
    return false;
  }
  if (estPersonnel(params.roleId)) {
    if (params.ecriture) return aLeDroit(params.droits, "mod-reservations");
    return aLeDroit(params.droits, "voir-documents") || aLeDroit(params.droits, "mod-reservations");
  }
  return params.correspond;
}

export function decisionMission(params: {
  roleId: RoleId;
  droits: readonly string[];
  ecriture: boolean;
  trouve: boolean;
  affecte: boolean;
}) {
  if (!params.trouve) return false;
  if (params.roleId === "prestataire") return params.affecte;
  if (
    params.roleId === "locataire" ||
    params.roleId === "voyageur" ||
    params.roleId === "proprietaire"
  ) {
    return false;
  }
  if (params.roleId === "lecteur") {
    return !params.ecriture && aLeDroit(params.droits, "voir-documents");
  }
  if (params.ecriture) return aLeDroit(params.droits, "mod-missions");
  return aLeDroit(params.droits, "voir-documents") || aLeDroit(params.droits, "mod-missions");
}

export function decisionPatrimoine(params: {
  roleId: RoleId;
  droits: readonly string[];
  ecriture: boolean;
  trouve: boolean;
  correspond: boolean;
}) {
  if (!params.trouve) return false;
  if (params.roleId === "proprietaire") {
    return !params.ecriture && params.correspond && aLeDroit(params.droits, "voir-biens");
  }
  if (estRolePortail(params.roleId)) return false;
  if (params.roleId === "lecteur") {
    return !params.ecriture && aLeDroit(params.droits, "voir-biens");
  }
  if (params.ecriture) return aLeDroit(params.droits, "mod-biens");
  return aLeDroit(params.droits, "voir-biens") || aLeDroit(params.droits, "mod-biens");
}

const REFUS = "Droits insuffisants.";

async function orgGestionnaire(sql: Sql, acteur: ActeurFichier) {
  if (acteur.orgType !== "prestataire") return acteur.orgId;
  const liens = (await sql.query(
    `select org_gestionnaire_id as id from public.liens_org
      where org_prestataire_id = $1::uuid limit 1`,
    [acteur.orgId],
  )) as { id: string }[];
  return liens[0]?.id ?? null;
}

export async function fichierAutorise(
  sql: Sql,
  acteur: ActeurFichier,
  contexte: ContexteFichier,
  refId: string,
  ecriture: boolean,
): Promise<{ ok: true } | { ok: false; erreur: string }> {
  if (contexte === "profil") {
    return refId === acteur.userId ? { ok: true } : { ok: false, erreur: REFUS };
  }

  if (contexte === "dossier") {
    const cible = cibleDossier(refId);
    if (cible.sorte === "precheckin" && !cible.reservationId) {
      return { ok: false, erreur: REFUS };
    }
    if (cible.sorte === "dossier" && !cible.dossierId) return { ok: false, erreur: REFUS };
    const lignes =
      cible.sorte === "precheckin"
        ? ((await sql.query(
            `select email, occupant as nom from public.reservations_dossier
              where org_id = $1::uuid and id = $2 limit 1`,
            [acteur.orgId, cible.reservationId],
          )) as { email: string; nom: string }[])
        : ((await sql.query(
            `select email, occupant_nom as nom from public.dossiers_location
              where org_id = $1::uuid and id = $2 limit 1`,
            [acteur.orgId, cible.dossierId],
          )) as { email: string; nom: string }[]);
    const ligne = lignes[0];
    const autorise = decisionDossier({
      roleId: acteur.roleId,
      droits: acteur.droits,
      ecriture,
      trouve: Boolean(ligne),
      correspond: ligne ? memePersonne(ligne.email ?? "", ligne.nom ?? "", acteur) : false,
    });
    return autorise ? { ok: true } : { ok: false, erreur: REFUS };
  }

  if (contexte === "mission") {
    const orgId = await orgGestionnaire(sql, acteur);
    if (!orgId) return { ok: false, erreur: REFUS };
    const lignes = (await sql.query(
      `select assigne, org_prestataire_id from public.missions
        where org_id = $1::uuid and id = $2 limit 1`,
      [orgId, refId],
    )) as { assigne: string; org_prestataire_id: string | null }[];
    const ligne = lignes[0];
    const assigne = ligne?.assigne ?? "";
    const affecte = ligne
      ? ligne.org_prestataire_id === acteur.orgId || memePersonne(assigne, assigne, acteur)
      : false;
    const autorise = decisionMission({
      roleId: acteur.roleId,
      droits: acteur.droits,
      ecriture,
      trouve: Boolean(ligne),
      affecte,
    });
    return autorise ? { ok: true } : { ok: false, erreur: REFUS };
  }

  const biens = (await sql.query(
    `select proprietaire from public.biens where org_id = $1::uuid and id = $2 limit 1`,
    [acteur.orgId, refId],
  )) as { proprietaire: string | null }[];
  const bien = biens[0];
  const autorise = decisionPatrimoine({
    roleId: acteur.roleId,
    droits: acteur.droits,
    ecriture,
    trouve: Boolean(bien),
    correspond: bien ? memePersonne("", bien.proprietaire ?? "", acteur) : false,
  });
  return autorise ? { ok: true } : { ok: false, erreur: REFUS };
}
