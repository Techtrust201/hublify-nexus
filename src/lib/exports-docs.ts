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

export async function telechargerAvoir(p: {
  occupant: string;
  email?: string;
  reservationId: string;
  plateforme: string;
  motif: string;
  montant: number;
  note?: string;
  logement: string;
  arrivee: string;
  depart: string;
  numero: string;
  date: string;
}) {
  const extra = [
    `Document : AVOIR`,
    `Numero : ${p.numero}`,
    `Date : ${p.date}`,
    `Client : ${p.occupant}`,
    `Email : ${p.email ?? ""}`,
    `Reservation : ${p.plateforme} ${p.reservationId}`,
    `Logement : ${p.logement}`,
    `Sejour : ${p.arrivee} -> ${p.depart}`,
    `Objet : ${p.motif}`,
    p.note ? `Note : ${p.note}` : "",
    `Montant TTC : ${p.montant} EUR`,
    `Total avoir TTC : ${p.montant} EUR`,
  ].filter(Boolean);
  await telechargerPdf(`Avoir ${p.numero}`, extra, {
    titulaire: p.occupant,
    locataire: p.occupant,
    logement: p.logement,
    adresse: p.logement,
    date: p.date,
    extra,
  });
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
