import type { LoyerMo1 } from "@/data/planning-mo1";
import type { ReservationMo1 } from "@/data/reservations-mo1";
import { telechargerPdf } from "@/lib/feedback";

export async function telechargerFactureReservation(r: ReservationMo1, bienNom?: string) {
  const logement = bienNom ?? r.bienId;
  const reste = Math.max(0, r.montant - r.paye);
  const extra = [
    `Occupant : ${r.occupant}`,
    `Logement : ${logement}`,
    `Arrivee : ${r.arrivee} ${r.heureArrivee}`,
    `Depart : ${r.depart} ${r.heureDepart}`,
    `Plateforme : ${r.plateforme}`,
    `Voyageurs : ${r.adultes} adultes, ${r.enfants} enfants`,
    `Montant : ${r.montant} EUR`,
    `Regle : ${r.paye} EUR`,
    `Reste : ${reste} EUR`,
    `Statut : ${r.statut}`,
  ];
  await telechargerPdf(`Facture ${r.occupant}`, extra, {
    titulaire: r.occupant,
    locataire: r.occupant,
    logement,
    adresse: logement,
    extra,
  });
}

export type DonneesAvoir = {
  occupant: string;
  email?: string | undefined;
  reservationId: string;
  plateforme: string;
  motif: string;
  montant: number;
  note?: string | undefined;
  logement: string;
  arrivee: string;
  depart: string;
  numero: string;
  date: string;
  ville?: string | undefined;
  societe?: string | undefined;
  signataire?: string | undefined;
};

function lignesAvoir(p: DonneesAvoir) {
  return [
    `Numero : ${p.numero}`,
    `Date : ${p.date}`,
    `Client : ${p.occupant}`,
    `Email : ${p.email ?? ""}`,
    `Reference : ${p.plateforme} ${p.reservationId}`,
    `Objet : ${p.motif}`,
    `Logement : ${p.logement}`,
    `Arrivee : ${p.arrivee}`,
    `Depart : ${p.depart}`,
    `Note : ${p.note ?? ""}`,
    `Montant : ${p.montant}`,
    `Ville : ${p.ville ?? ""}`,
    `Societe : ${p.societe ?? ""}`,
    `Signataire : ${p.signataire ?? ""}`,
  ];
}

export async function telechargerAvoir(p: DonneesAvoir) {
  await telechargerPdf(`Avoir ${p.numero}`, lignesAvoir(p), { extra: lignesAvoir(p) });
}

export async function fichierAvoir(p: DonneesAvoir) {
  const [{ octetsDocument }, { octetsVersBase64 }] = await Promise.all([
    import("@/lib/pdf-documents"),
    import("@/lib/pdf"),
  ]);
  const { nom, octets } = await octetsDocument(`Avoir ${p.numero}`, { extra: lignesAvoir(p) });
  return { nom, mime: "application/pdf", base64: octetsVersBase64(octets) };
}

export async function telechargerQuittanceLoyer(l: LoyerMo1) {
  const extra = [
    `Locataire : ${l.locataire}`,
    `Logement : ${l.bienNom}`,
    `Mois : ${l.echeance}`,
    `Montant : ${l.montant} EUR`,
    `Total : ${l.montant} EUR`,
    `Loyer : ${l.montant} EUR`,
    "Charges : 0 EUR",
  ];
  await telechargerPdf(`Quittance ${l.locataire}`, extra, {
    titulaire: l.locataire,
    locataire: l.locataire,
    logement: l.bienNom,
    adresse: l.bienNom,
    date: l.echeance,
    extra,
  });
}
