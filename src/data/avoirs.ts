import { ajouterDocument } from "@/data/documents-store";
import type { ReservationMo1 } from "@/data/reservations-mo1";
import { idNouveau, modifierReservation } from "@/data/session";
import { fichierAvoir, type DonneesAvoir } from "@/lib/exports-docs";

/** Un remboursement réduit l'encaissé, s'inscrit dans l'historique de la réservation
 *  et produit toujours l'avoir correspondant, quel que soit l'écran d'où il part. */
export function emettreAvoir(params: {
  reservation: ReservationMo1;
  bien?: { nom: string; adresse?: string | undefined } | undefined;
  motif: string;
  montant: number;
  note: string;
  societe?: string | undefined;
  signataire?: string | undefined;
}): DonneesAvoir {
  const { reservation, bien } = params;
  const montant = Math.round(params.montant);
  const date = new Date().toISOString().slice(0, 10);
  const numero = `AV-${date.replace(/-/g, "")}-${reservation.id.slice(-4).toUpperCase()}`;
  modifierReservation(reservation.id, {
    paye: Math.max(0, reservation.paye - montant),
    remboursements: [
      ...(reservation.remboursements ?? []),
      { id: idNouveau("rb"), date, motif: params.motif, montant, note: params.note },
    ],
  });
  const donnees: DonneesAvoir = {
    occupant: reservation.occupant,
    email: reservation.email,
    reservationId: reservation.id,
    plateforme: reservation.plateforme,
    motif: params.motif,
    montant,
    note: params.note,
    logement: [bien?.nom, bien?.adresse].filter(Boolean).join(" — ") || reservation.bienId,
    arrivee: reservation.arrivee,
    depart: reservation.depart,
    numero,
    date,
    ville: bien?.adresse?.split(",").pop()?.trim(),
    societe: params.societe,
    signataire: params.signataire,
  };
  const doc = {
    id: idNouveau("doc"),
    titre: `Avoir ${numero} — ${reservation.occupant}`,
    type: "Avoir",
    filtre: "Correspondances",
    logement: bien?.nom ?? reservation.bienId,
    date,
    taille: "1 page",
    modifiePar: "Gestionnaire",
    photos: 0,
    vue: "residents" as const,
    occupant: "locataires" as const,
  };
  void fichierAvoir(donnees)
    .then((fichier) => ajouterDocument({ ...doc, fichier }))
    .catch(() => ajouterDocument(doc));
  return donnees;
}
