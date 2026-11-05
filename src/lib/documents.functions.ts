import { createServerFn } from "@tanstack/react-start";
import { aLeDroit, estRolePortail } from "@/auth/permissions";
import { emailActeur, nomActeur } from "@/data/portee-role";
import { sessionDepuisRequete } from "@/lib/session-serveur.server";
import {
  estContexteFichier,
  validerDepot,
  type ContexteFichier,
  type CoteFichier,
  type FichierMeta,
} from "@/lib/fichiers-deposes";
import { octetsVersBase64, pdfTexte } from "@/lib/pdf";
import { getSql, type Sql } from "@/lib/sql";

const PLAFOND_COMPTE: Partial<Record<ContexteFichier, number>> = {
  patrimoine: 4,
  mission: 8,
};

async function enregistrerPdf(params: {
  orgId: string;
  nom: string;
  octets: Uint8Array;
  typeDoc: string;
}) {
  const sql = getSql();
  if (!sql) throw new Error("Base indisponible");
  const id = `doc-${crypto.randomUUID()}`;
  const taille =
    params.octets.byteLength < 1024
      ? `${params.octets.byteLength} o`
      : `${Math.max(1, Math.round(params.octets.byteLength / 1024))} Ko`;
  await sql.query(
    `insert into public.documents
       (org_id, id, titre, type_doc, filtre, logement, date_doc, taille, modifie_par, photos, vue)
     values ($1::uuid, $2, $3, $4, $4, '', $5, $6, '', 0, 'factures')`,
    [params.orgId, id, params.nom, params.typeDoc, new Date().toISOString().slice(0, 10), taille],
  );
  await sql.query(
    `insert into public.documents_fichiers (org_id, document_id, nom, mime, contenu)
     values ($1::uuid, $2, $3, 'application/pdf', $4)`,
    [params.orgId, id, params.nom, Buffer.from(params.octets)],
  );
  return { id, nom: params.nom, mime: "application/pdf", base64: octetsVersBase64(params.octets) };
}

function montantPdf(valeur: string) {
  const n = Number(String(valeur).replace(",", "."));
  if (!Number.isFinite(n) || n < 0) throw new Error("Montant invalide");
  return n;
}

export const genererQuittancePdf = createServerFn({ method: "POST" })
  .validator(
    (input: {
      bailleur: string;
      bailleurAdr: string;
      locataire: string;
      locAdr: string;
      loyer: string;
      charges: string;
      mois: string;
      faitA: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const moi = await sessionDepuisRequete();
    if (!moi || !aLeDroit(moi.droits, "mod-finances")) {
      throw new Error("Droits insuffisants");
    }
    const total = montantPdf(data.loyer) + montantPdf(data.charges);
    const octets = await pdfTexte(`Quittance de loyer — ${data.mois}`, [
      `Bailleur : ${data.bailleur}`,
      data.bailleurAdr,
      `Locataire : ${data.locataire}`,
      data.locAdr,
      `Loyer nu : ${data.loyer} EUR`,
      `Charges : ${data.charges} EUR`,
      `Total : ${total.toFixed(2)} EUR`,
      `Fait à ${data.faitA}`,
    ]);
    return enregistrerPdf({
      orgId: moi.orgId,
      nom: `quittance-${data.mois.replace(/\s+/g, "-").toLowerCase()}.pdf`,
      octets,
      typeDoc: "Quittance",
    });
  });

export const genererAvisPdf = createServerFn({ method: "POST" })
  .validator(
    (input: {
      bailleur: string;
      locataire: string;
      mois: string;
      echeance: string;
      loyer: string;
      charges: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const moi = await sessionDepuisRequete();
    if (!moi || !aLeDroit(moi.droits, "mod-finances")) {
      throw new Error("Droits insuffisants");
    }
    const total = montantPdf(data.loyer) + montantPdf(data.charges);
    const octets = await pdfTexte(`Avis d'echeance — ${data.mois}`, [
      `Bailleur : ${data.bailleur}`,
      `Locataire : ${data.locataire}`,
      `Echeance : ${data.echeance}`,
      `Montant : ${total.toFixed(2)} EUR`,
    ]);
    return enregistrerPdf({
      orgId: moi.orgId,
      nom: `avis-echeance-${data.mois.replace(/\s+/g, "-").toLowerCase()}.pdf`,
      octets,
      typeDoc: "Avis d'échéance",
    });
  });

export const genererRecapReservationPdf = createServerFn({ method: "POST" })
  .validator((input: { titre: string; lignes: string[] }) => input)
  .handler(async ({ data }) => {
    const moi = await sessionDepuisRequete();
    if (!moi || !aLeDroit(moi.droits, "mod-reservations")) {
      throw new Error("Droits insuffisants");
    }
    const octets = await pdfTexte(data.titre, data.lignes);
    return enregistrerPdf({
      orgId: moi.orgId,
      nom: `${data.titre.replace(/\s+/g, "-").toLowerCase()}.pdf`,
      octets,
      typeDoc: "Récapitulatif",
    });
  });

type SessionFichier = NonNullable<Awaited<ReturnType<typeof sessionDepuisRequete>>>;

function autorise(session: SessionFichier, contexte: ContexteFichier, ecriture: boolean) {
  if (contexte === "profil") return true;
  const portail = estRolePortail(session.roleId);
  if (contexte === "patrimoine") {
    if (portail || (ecriture && session.roleId === "lecteur")) return false;
    return ecriture
      ? aLeDroit(session.droits, "mod-biens")
      : aLeDroit(session.droits, "voir-biens") || aLeDroit(session.droits, "mod-biens");
  }
  if (contexte === "mission") {
    if (session.roleId === "prestataire") return aLeDroit(session.droits, "mod-missions");
    if (portail || (ecriture && session.roleId === "lecteur")) return false;
    return ecriture
      ? aLeDroit(session.droits, "mod-missions")
      : aLeDroit(session.droits, "voir-documents") || aLeDroit(session.droits, "mod-missions");
  }
  if (contexte === "dossier") {
    if (session.roleId === "locataire" || session.roleId === "voyageur") return true;
    if (portail || (ecriture && session.roleId === "lecteur")) return false;
    return ecriture
      ? aLeDroit(session.droits, "mod-reservations")
      : aLeDroit(session.droits, "voir-documents") || aLeDroit(session.droits, "mod-reservations");
  }
  return false;
}

async function orgPrestataireLiee(sql: Sql, orgPrestataireId: string) {
  const liens = (await sql.query(
    `select org_gestionnaire_id as id from public.liens_org
      where org_prestataire_id = $1::uuid limit 1`,
    [orgPrestataireId],
  )) as { id: string }[];
  return liens[0]?.id ?? null;
}

async function orgDuFichier(sql: Sql, session: SessionFichier, contexte: ContexteFichier) {
  if (contexte === "mission" && session.roleId === "prestataire") {
    return (await orgPrestataireLiee(sql, session.orgId)) ?? session.orgId;
  }
  return session.orgId;
}

async function orgsLisibles(sql: Sql, session: SessionFichier) {
  const ids = [session.orgId];
  if (session.roleId === "prestataire") {
    const liee = await orgPrestataireLiee(sql, session.orgId);
    if (liee && !ids.includes(liee)) ids.push(liee);
  }
  return ids;
}

async function referenceAutorisee(
  sql: Sql,
  session: SessionFichier,
  contexte: ContexteFichier,
  refId: string,
) {
  if (session.roleId === "prestataire" && contexte === "mission") {
    const rows = (await sql.query(
      `select 1 from public.missions where id = $1 and org_prestataire_id = $2::uuid limit 1`,
      [refId, session.orgId],
    )) as unknown[];
    return rows.length > 0;
  }
  if (
    (session.roleId === "locataire" || session.roleId === "voyageur") &&
    contexte === "dossier"
  ) {
    const dossierId = refId.split(":")[0] ?? "";
    if (!dossierId) return false;
    const rows = (await sql.query(
      `select lower(email) as email, lower(occupant_nom) as nom
         from public.dossiers_location where org_id = $1::uuid and id = $2 limit 1`,
      [session.orgId, dossierId],
    )) as { email: string; nom: string }[];
    const ligne = rows[0];
    if (!ligne) return true;
    return ligne.email === emailActeur(session) || ligne.nom === nomActeur(session);
  }
  return true;
}

function versBase64(contenu: unknown) {
  if (Buffer.isBuffer(contenu)) return contenu.toString("base64");
  if (contenu instanceof Uint8Array) return octetsVersBase64(contenu);
  return "";
}

type LigneFichier = {
  id: string;
  contexte: ContexteFichier;
  ref_id: string;
  cote: CoteFichier;
  nom: string;
  mime: string;
  taille: number;
  user_id: string;
  contenu?: Buffer | Uint8Array | null;
};

function metaDe(ligne: LigneFichier): FichierMeta {
  return {
    id: ligne.id,
    contexte: ligne.contexte,
    refId: ligne.ref_id,
    cote: ligne.cote,
    nom: ligne.nom,
    mime: ligne.mime,
    taille: Number(ligne.taille) || 0,
  };
}

async function exigerSession() {
  const session = await sessionDepuisRequete();
  const sql = getSql();
  if (!session) return { ok: false as const, erreur: "Connexion requise." };
  if (!sql) return { ok: false as const, erreur: "Base indisponible." };
  return { ok: true as const, session, sql };
}

const COLONNES = `id, contexte, ref_id, cote, nom, mime, taille, user_id`;

export const deposerFichier = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }) => {
    const depot = validerDepot(data);
    if (!depot.ok) return { ok: false as const, erreur: depot.erreur };
    const acces = await exigerSession();
    if (!acces.ok) return acces;
    const { session, sql } = acces;
    if (!autorise(session, depot.depot.contexte, true)) {
      return { ok: false as const, erreur: "Droits insuffisants pour déposer ce fichier." };
    }
    const refId = depot.depot.contexte === "profil" ? session.userId : depot.depot.refId;
    if (!(await referenceAutorisee(sql, session, depot.depot.contexte, refId))) {
      return { ok: false as const, erreur: "Droits insuffisants pour déposer ce fichier." };
    }
    const orgId = await orgDuFichier(sql, session, depot.depot.contexte);
    const plafond = PLAFOND_COMPTE[depot.depot.contexte];
    if (plafond && depot.depot.cote === "") {
      const compte = (await sql.query(
        `select count(*)::int as n from public.fichiers_deposes
          where org_id = $1::uuid and contexte = $2 and ref_id = $3`,
        [orgId, depot.depot.contexte, refId],
      )) as { n: number }[];
      if ((compte[0]?.n ?? 0) >= plafond) {
        return { ok: false as const, erreur: `${plafond} fichiers maximum pour cet élément.` };
      }
    }
    const id = `fic-${crypto.randomUUID()}`;
    const lignes = (await sql.query(
      `insert into public.fichiers_deposes
         (org_id, id, contexte, ref_id, cote, nom, mime, taille, contenu, user_id)
       values ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10::uuid)
       on conflict (org_id, contexte, ref_id, cote) where cote <> ''
       do update set nom = excluded.nom, mime = excluded.mime, taille = excluded.taille,
                     contenu = excluded.contenu, user_id = excluded.user_id, created_at = now()
       returning ${COLONNES}`,
      [
        orgId,
        id,
        depot.depot.contexte,
        refId,
        depot.depot.cote,
        depot.depot.nom,
        depot.depot.mime,
        depot.octets.byteLength,
        Buffer.from(depot.octets),
        session.userId,
      ],
    )) as LigneFichier[];
    const ligne = lignes[0];
    if (!ligne) return { ok: false as const, erreur: "Le fichier n'a pas été enregistré." };
    return { ok: true as const, fichier: metaDe(ligne) };
  });

export const listerFichiers = createServerFn({ method: "POST" })
  .validator((input: { contexte?: string; refId?: string }) => input ?? {})
  .handler(async ({ data }) => {
    const contexte = String(data?.contexte ?? "");
    if (!estContexteFichier(contexte)) return { ok: false as const, erreur: "Contexte inconnu." };
    const acces = await exigerSession();
    if (!acces.ok) return acces;
    const { session, sql } = acces;
    if (!autorise(session, contexte, false)) {
      return { ok: false as const, erreur: "Droits insuffisants." };
    }
    const refId = contexte === "profil" ? session.userId : String(data?.refId ?? "").trim();
    if (!refId) return { ok: false as const, erreur: "Référence manquante." };
    if (!(await referenceAutorisee(sql, session, contexte, refId))) {
      return { ok: false as const, erreur: "Droits insuffisants." };
    }
    const orgId = await orgDuFichier(sql, session, contexte);
    const lignes = (await sql.query(
      `select ${COLONNES} from public.fichiers_deposes
        where org_id = $1::uuid and contexte = $2 and ref_id = $3
          and ($2 <> 'profil' or user_id = $4::uuid)
        order by created_at, id`,
      [orgId, contexte, refId, session.userId],
    )) as LigneFichier[];
    return { ok: true as const, fichiers: lignes.map(metaDe) };
  });

export const lireFichier = createServerFn({ method: "POST" })
  .validator((input: { id?: string }) => input ?? {})
  .handler(async ({ data }) => {
    const id = String(data?.id ?? "").trim();
    if (!id) return { ok: false as const, erreur: "Fichier introuvable." };
    const acces = await exigerSession();
    if (!acces.ok) return acces;
    return lireContenu(acces.sql, acces.session, id);
  });

async function lireContenu(sql: Sql, session: SessionFichier, id: string) {
  const orgs = await orgsLisibles(sql, session);
  const lignes = (await sql.query(
    `select ${COLONNES}, contenu from public.fichiers_deposes
      where org_id = any($1::uuid[]) and id = $2`,
    [orgs, id],
  )) as LigneFichier[];
  const ligne = lignes[0];
  if (!ligne) return { ok: false as const, erreur: "Fichier introuvable." };
  if (ligne.contexte === "profil" && ligne.user_id !== session.userId) {
    return { ok: false as const, erreur: "Droits insuffisants." };
  }
  if (
    !autorise(session, ligne.contexte, false) ||
    !(await referenceAutorisee(sql, session, ligne.contexte, ligne.ref_id))
  ) {
    return { ok: false as const, erreur: "Droits insuffisants." };
  }
  const base64 = versBase64(ligne.contenu);
  if (!base64) return { ok: false as const, erreur: "Fichier vide." };
  return { ok: true as const, fichier: { ...metaDe(ligne), base64 } };
}

export const retirerFichier = createServerFn({ method: "POST" })
  .validator((input: { id?: string }) => input ?? {})
  .handler(async ({ data }) => {
    const id = String(data?.id ?? "").trim();
    if (!id) return { ok: false as const, erreur: "Fichier introuvable." };
    const acces = await exigerSession();
    if (!acces.ok) return acces;
    const { session, sql } = acces;
    const orgs = await orgsLisibles(sql, session);
    const lignes = (await sql.query(
      `select ${COLONNES} from public.fichiers_deposes where org_id = any($1::uuid[]) and id = $2`,
      [orgs, id],
    )) as LigneFichier[];
    const ligne = lignes[0];
    if (!ligne) return { ok: false as const, erreur: "Fichier introuvable." };
    if (ligne.contexte === "profil" && ligne.user_id !== session.userId) {
      return { ok: false as const, erreur: "Droits insuffisants." };
    }
    if (
      !autorise(session, ligne.contexte, true) ||
      !(await referenceAutorisee(sql, session, ligne.contexte, ligne.ref_id))
    ) {
      return { ok: false as const, erreur: "Droits insuffisants." };
    }
    await sql.query(
      `delete from public.fichiers_deposes where org_id = any($1::uuid[]) and id = $2`,
      [orgs, id],
    );
    return { ok: true as const };
  });
