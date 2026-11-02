import { createServerFn } from "@tanstack/react-start";
import { aLeDroit } from "@/auth/permissions";
import { COMPTE_DEFAUT, normaliserCompte, type CompteEntreprise } from "@/data/compte-gestionnaire";
import { ibanValide } from "@/lib/iban";
import { normaliserFiche, type FicheLieu } from "@/data/patrimoine-fiche";
import {
  normaliserReglages as normaliserReglagesEtendus,
  REGLAGES_DEFAUT,
  type ReglagesEtendus,
} from "@/data/reglages-etendus";
import {
  normaliserReglages as normaliserReglagesMessagerie,
  reglagesParDefaut,
  type ReglagesMessagerie,
} from "@/data/reglages-messagerie";
import { sessionDepuisRequete } from "@/lib/session-serveur.server";
import { getSql } from "@/lib/sql";

type ResultatOk<T> = { ok: true; data: T };
type ResultatKo = { ok: false; raison: "non_authentifie" | "non_configure" | "interdit" };

async function sessionOrg() {
  const s = await sessionDepuisRequete();
  if (!s) return null;
  return s;
}

function refuse(): ResultatKo {
  return { ok: false, raison: "non_authentifie" };
}

function interdit(): ResultatKo {
  return { ok: false, raison: "interdit" };
}

function nonConfigure(): ResultatKo {
  return { ok: false, raison: "non_configure" };
}

// ---------------------------------------------------------------- Compte / RIB

export const chargerCompteDistant = createServerFn({ method: "GET" }).handler(
  async (): Promise<ResultatOk<CompteEntreprise> | ResultatKo> => {
    const s = await sessionOrg();
    if (!s) return refuse();
    const sql = getSql();
    if (!sql) return nonConfigure();
    const rows = (await sql.query(
      `select offre_commerciale, raison_sociale, siret, adresse, detenteur_carte_t,
              numero_agrement, iban, titulaire_rib, equipe_hote, equipe_quittee
         from public.org_compte where org_id = $1::uuid`,
      [s.orgId],
    )) as Record<string, unknown>[];
    const r = rows[0];
    if (!r) return { ok: true, data: { ...COMPTE_DEFAUT } };
    return {
      ok: true,
      data: normaliserCompte({
        offreCommerciale: r["offre_commerciale"],
        raisonSociale: r["raison_sociale"],
        siret: r["siret"],
        adresse: r["adresse"],
        detenteurCarteT: r["detenteur_carte_t"],
        numeroAgrement: r["numero_agrement"],
        iban: r["iban"],
        titulaireRib: r["titulaire_rib"],
        equipeHote: r["equipe_hote"],
        equipeQuittee: r["equipe_quittee"],
      }),
    };
  },
);

export const sauverCompteDistant = createServerFn({ method: "POST" })
  .validator((input: CompteEntreprise) => {
    const compte = normaliserCompte(input);
    if (compte.iban.trim() && !ibanValide(compte.iban)) {
      throw new Error("IBAN invalide");
    }
    return compte;
  })
  .handler(async ({ data }): Promise<ResultatOk<CompteEntreprise> | ResultatKo> => {
    const s = await sessionOrg();
    if (!s) return refuse();
    if (!aLeDroit(s.droits, "gerer-equipe") && !aLeDroit(s.droits, "mod-biens")) {
      return interdit();
    }
    const sql = getSql();
    if (!sql) return nonConfigure();
    await sql.query(
      `insert into public.org_compte (
         org_id, offre_commerciale, raison_sociale, siret, adresse, detenteur_carte_t,
         numero_agrement, iban, titulaire_rib, equipe_hote, equipe_quittee, updated_at
       ) values ($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, now())
       on conflict (org_id) do update set
         offre_commerciale = excluded.offre_commerciale,
         raison_sociale = excluded.raison_sociale,
         siret = excluded.siret,
         adresse = excluded.adresse,
         detenteur_carte_t = excluded.detenteur_carte_t,
         numero_agrement = excluded.numero_agrement,
         iban = excluded.iban,
         titulaire_rib = excluded.titulaire_rib,
         equipe_hote = excluded.equipe_hote,
         equipe_quittee = excluded.equipe_quittee,
         updated_at = now()`,
      [
        s.orgId,
        data.offreCommerciale,
        data.raisonSociale,
        data.siret,
        data.adresse,
        data.detenteurCarteT,
        data.numeroAgrement,
        data.iban.replace(/\s/g, "").toUpperCase(),
        data.titulaireRib,
        data.equipeHote,
        data.equipeQuittee,
      ],
    );
    return { ok: true, data };
  });

// ---------------------------------------------------------------- Fiches lieu

export const chargerFichesLieuDistantes = createServerFn({ method: "GET" }).handler(
  async (): Promise<
    ResultatOk<{ fiches: Record<string, FicheLieu>; typesPerso: string[] }> | ResultatKo
  > => {
    const s = await sessionOrg();
    if (!s) return refuse();
    const sql = getSql();
    if (!sql) return nonConfigure();
    const biens = (await sql.query(`select id, fiche from public.biens where org_id = $1::uuid`, [
      s.orgId,
    ])) as { id: string; fiche: unknown }[];
    const fiches: Record<string, FicheLieu> = {};
    for (const b of biens) {
      if (b.fiche && typeof b.fiche === "object" && Object.keys(b.fiche as object).length > 0) {
        fiches[b.id] = normaliserFiche(b.fiche);
      }
    }
    const types = (await sql.query(
      `select types from public.org_types_lieu where org_id = $1::uuid`,
      [s.orgId],
    )) as { types: string[] }[];
    return {
      ok: true,
      data: {
        fiches,
        typesPerso: types[0]?.types ?? [],
      },
    };
  },
);

export const sauverFicheLieuDistante = createServerFn({ method: "POST" })
  .validator((input: { bienId: string; fiche: FicheLieu }) => {
    if (!input?.bienId) throw new Error("Bien requis");
    return { bienId: String(input.bienId), fiche: normaliserFiche(input.fiche) };
  })
  .handler(async ({ data }): Promise<ResultatOk<true> | ResultatKo> => {
    const s = await sessionOrg();
    if (!s) return refuse();
    if (!aLeDroit(s.droits, "mod-biens")) return interdit();
    const sql = getSql();
    if (!sql) return nonConfigure();
    const res = (await sql.query(
      `update public.biens set fiche = $3::jsonb
        where org_id = $1::uuid and id = $2
        returning id`,
      [s.orgId, data.bienId, JSON.stringify(data.fiche)],
    )) as { id: string }[];
    if (!res[0]) return interdit();
    return { ok: true, data: true };
  });

export const sauverTypesLieuDistants = createServerFn({ method: "POST" })
  .validator((input: { types: string[] }) => ({
    types: (input?.types ?? []).filter((t) => typeof t === "string" && t.trim()),
  }))
  .handler(async ({ data }): Promise<ResultatOk<true> | ResultatKo> => {
    const s = await sessionOrg();
    if (!s) return refuse();
    if (!aLeDroit(s.droits, "mod-biens")) return interdit();
    const sql = getSql();
    if (!sql) return nonConfigure();
    await sql.query(
      `insert into public.org_types_lieu (org_id, types, updated_at)
       values ($1::uuid, $2::text[], now())
       on conflict (org_id) do update set types = excluded.types, updated_at = now()`,
      [s.orgId, data.types],
    );
    return { ok: true, data: true };
  });

// ---------------------------------------------------------------- Relances

export const chargerReglagesEtendusDistants = createServerFn({ method: "GET" }).handler(
  async (): Promise<ResultatOk<ReglagesEtendus> | ResultatKo> => {
    const s = await sessionOrg();
    if (!s) return refuse();
    const sql = getSql();
    if (!sql) return nonConfigure();
    const rows = (await sql.query(
      `select relance_loyer, message_relance_loyer, relance_facture, message_relance_facture,
              auto_menage, auto_edl_bail, messages_auto, abonnement_ref, abonnement_actif, offre
         from public.org_reglages_etendus where org_id = $1::uuid`,
      [s.orgId],
    )) as Record<string, unknown>[];
    const r = rows[0];
    if (!r) return { ok: true, data: { ...REGLAGES_DEFAUT } };
    return {
      ok: true,
      data: normaliserReglagesEtendus({
        relanceLoyer: r["relance_loyer"],
        messageRelanceLoyer: r["message_relance_loyer"] || REGLAGES_DEFAUT.messageRelanceLoyer,
        relanceFacture: r["relance_facture"],
        messageRelanceFacture:
          r["message_relance_facture"] || REGLAGES_DEFAUT.messageRelanceFacture,
        autoMenage: r["auto_menage"],
        autoEdlBail: r["auto_edl_bail"],
        messagesAuto: r["messages_auto"],
        abonnementRef: r["abonnement_ref"],
        abonnementActif: r["abonnement_actif"],
        offre: r["offre"],
      }),
    };
  },
);

export const sauverReglagesEtendusDistants = createServerFn({ method: "POST" })
  .validator((input: ReglagesEtendus) => normaliserReglagesEtendus(input))
  .handler(async ({ data }): Promise<ResultatOk<ReglagesEtendus> | ResultatKo> => {
    const s = await sessionOrg();
    if (!s) return refuse();
    if (!aLeDroit(s.droits, "mod-biens")) return interdit();
    const sql = getSql();
    if (!sql) return nonConfigure();
    await sql.query(
      `insert into public.org_reglages_etendus (
         org_id, relance_loyer, message_relance_loyer, relance_facture, message_relance_facture,
         auto_menage, auto_edl_bail, messages_auto, abonnement_ref, abonnement_actif, offre, updated_at
       ) values ($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, now())
       on conflict (org_id) do update set
         relance_loyer = excluded.relance_loyer,
         message_relance_loyer = excluded.message_relance_loyer,
         relance_facture = excluded.relance_facture,
         message_relance_facture = excluded.message_relance_facture,
         auto_menage = excluded.auto_menage,
         auto_edl_bail = excluded.auto_edl_bail,
         messages_auto = excluded.messages_auto,
         abonnement_ref = excluded.abonnement_ref,
         abonnement_actif = excluded.abonnement_actif,
         offre = excluded.offre,
         updated_at = now()`,
      [
        s.orgId,
        data.relanceLoyer,
        data.messageRelanceLoyer,
        data.relanceFacture,
        data.messageRelanceFacture,
        data.autoMenage,
        data.autoEdlBail,
        data.messagesAuto,
        data.abonnementRef,
        data.abonnementActif,
        data.offre,
      ],
    );
    return { ok: true, data };
  });

// ---------------------------------------------------------------- Messagerie auto

export const chargerReglagesMessagerieDistants = createServerFn({ method: "GET" }).handler(
  async (): Promise<ResultatOk<ReglagesMessagerie> | ResultatKo> => {
    const s = await sessionOrg();
    if (!s) return refuse();
    const sql = getSql();
    if (!sql) return nonConfigure();
    const rows = (await sql.query(
      `select payload from public.org_reglages_messagerie where org_id = $1::uuid`,
      [s.orgId],
    )) as { payload: unknown }[];
    if (!rows[0]) return { ok: true, data: reglagesParDefaut() };
    return { ok: true, data: normaliserReglagesMessagerie(rows[0].payload) };
  },
);

export const sauverReglagesMessagerieDistants = createServerFn({ method: "POST" })
  .validator((input: ReglagesMessagerie) => normaliserReglagesMessagerie(input))
  .handler(async ({ data }): Promise<ResultatOk<ReglagesMessagerie> | ResultatKo> => {
    const s = await sessionOrg();
    if (!s) return refuse();
    if (!aLeDroit(s.droits, "messagerie") && !aLeDroit(s.droits, "mod-biens")) {
      return interdit();
    }
    const sql = getSql();
    if (!sql) return nonConfigure();
    await sql.query(
      `insert into public.org_reglages_messagerie (org_id, payload, updated_at)
       values ($1::uuid, $2::jsonb, now())
       on conflict (org_id) do update set payload = excluded.payload, updated_at = now()`,
      [s.orgId, JSON.stringify(data)],
    );
    return { ok: true, data };
  });

/** Validation IBAN exposée pour tests unitaires côté serveur / partagé. */
export function validerIbanServeur(valeur: string) {
  return ibanValide(valeur);
}
