import { createServerFn } from "@tanstack/react-start";
import { etatDepuisLigne, normaliserEtatPortail, type EtatPortail } from "@/data/portail-etat";
import { sessionDepuisRequete } from "@/lib/session-serveur.server";
import { getSql } from "@/lib/sql";

type ResultatOk = { ok: true; data: EtatPortail };
type ResultatKo = { ok: false; raison: "non_authentifie" | "non_configure" };

export const chargerPortailDistant = createServerFn({ method: "GET" }).handler(
  async (): Promise<ResultatOk | ResultatKo> => {
    const session = await sessionDepuisRequete();
    if (!session) return { ok: false, raison: "non_authentifie" };
    const sql = getSql();
    if (!sql) return { ok: false, raison: "non_configure" };
    const rows = await sql.query(
      `select mode, demarre, notes, paiements, edl, rdv, demandes, favoris, doc_courant, candidature
         from public.portail_etat where user_id = $1::uuid`,
      [session.userId],
    );
    return { ok: true, data: etatDepuisLigne(rows[0]) };
  },
);

export const sauverPortailDistant = createServerFn({ method: "POST" })
  .validator((input: unknown) => normaliserEtatPortail(input))
  .handler(async ({ data }): Promise<ResultatOk | ResultatKo> => {
    const session = await sessionDepuisRequete();
    if (!session) return { ok: false, raison: "non_authentifie" };
    const sql = getSql();
    if (!sql) return { ok: false, raison: "non_configure" };
    await sql.query(
      `insert into public.portail_etat (
         user_id, mode, demarre, notes, paiements, edl, rdv, demandes, favoris,
         doc_courant, candidature, updated_at
       ) values (
         $1::uuid, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb,
         $10, $11::jsonb, now()
       )
       on conflict (user_id) do update set
         mode = excluded.mode,
         demarre = excluded.demarre,
         notes = excluded.notes,
         paiements = excluded.paiements,
         edl = excluded.edl,
         rdv = excluded.rdv,
         demandes = excluded.demandes,
         favoris = excluded.favoris,
         doc_courant = excluded.doc_courant,
         candidature = excluded.candidature,
         updated_at = now()`,
      [
        session.userId,
        data.mode,
        data.demarre,
        JSON.stringify(data.notes),
        JSON.stringify(data.paiements),
        JSON.stringify(data.edl),
        data.rdv ? JSON.stringify(data.rdv) : null,
        JSON.stringify(data.demandes),
        JSON.stringify(data.favoris),
        data.docCourant,
        JSON.stringify(data.candidature),
      ],
    );
    return { ok: true, data };
  });
