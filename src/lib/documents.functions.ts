import { createServerFn } from "@tanstack/react-start";
import { aLeDroit } from "@/auth/permissions";
import { sessionDepuisRequete } from "@/lib/session-serveur.server";
import { octetsVersBase64, pdfTexte } from "@/lib/pdf";
import { getSql } from "@/lib/sql";

async function enregistrerPdf(params: {
  orgId: string;
  nom: string;
  octets: Uint8Array;
}) {
  const sql = getSql();
  if (!sql) throw new Error("Base indisponible");
  const id = `doc-${crypto.randomUUID()}`;
  const chemin = `storage/${params.orgId}/${id}.pdf`;
  await sql.query(
    `insert into public.documents (org_id, id, nom, mime, chemin, contenu)
     values ($1::uuid, $2, $3, 'application/pdf', $4, $5)`,
    [params.orgId, id, params.nom, chemin, Buffer.from(params.octets)],
  );
  return { id, nom: params.nom, mime: "application/pdf", base64: octetsVersBase64(params.octets) };
}

export const genererQuittancePdf = createServerFn({ method: "POST" })
  .validator((input: {
    bailleur: string;
    bailleurAdr: string;
    locataire: string;
    locAdr: string;
    loyer: string;
    charges: string;
    mois: string;
    faitA: string;
  }) => input)
  .handler(async ({ data }) => {
    const moi = await sessionDepuisRequete();
    if (!moi || !aLeDroit(moi.droits, "voir-documents")) {
      throw new Error("Droits insuffisants");
    }
    const total = (Number(data.loyer) || 0) + (Number(data.charges) || 0);
    const octets = await pdfTexte(`Quittance de loyer — ${data.mois}`, [
      `Bailleur : ${data.bailleur}`,
      data.bailleurAdr,
      `Locataire : ${data.locataire}`,
      data.locAdr,
      `Loyer nu : ${data.loyer} EUR`,
      `Charges : ${data.charges} EUR`,
      `Total : ${total.toFixed(2)} EUR`,
      `Fait a ${data.faitA}`,
    ]);
    return enregistrerPdf({
      orgId: moi.orgId,
      nom: `quittance-${data.mois.replace(/\s+/g, "-").toLowerCase()}.pdf`,
      octets,
    });
  });

export const genererAvisPdf = createServerFn({ method: "POST" })
  .validator((input: {
    bailleur: string;
    locataire: string;
    mois: string;
    echeance: string;
    loyer: string;
    charges: string;
  }) => input)
  .handler(async ({ data }) => {
    const moi = await sessionDepuisRequete();
    if (!moi || !aLeDroit(moi.droits, "voir-documents")) {
      throw new Error("Droits insuffisants");
    }
    const total = (Number(data.loyer) || 0) + (Number(data.charges) || 0);
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
    });
  });

export const genererRecapReservationPdf = createServerFn({ method: "POST" })
  .validator((input: { titre: string; lignes: string[] }) => input)
  .handler(async ({ data }) => {
    const moi = await sessionDepuisRequete();
    if (!moi || !aLeDroit(moi.droits, "voir-reservations")) {
      throw new Error("Droits insuffisants");
    }
    const octets = await pdfTexte(data.titre, data.lignes);
    return enregistrerPdf({
      orgId: moi.orgId,
      nom: `${data.titre.replace(/\s+/g, "-").toLowerCase()}.pdf`,
      octets,
    });
  });
