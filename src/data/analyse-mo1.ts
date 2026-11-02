/**
 * Types de l'historique d'analyse.
 * Les montants affichés ne viennent plus de constantes figées : ils sont
 * calculés dans `src/lib/analyse-finance.ts` et `src/lib/analyse-vue.ts`.
 */

export type OngletAnalyse = "occupation" | "revenus" | "gestionnaire";

export type PaiementAnalyse = {
  id: string;
  nom: string;
  initiales: string;
  logement: string;
  localisation: string;
  reservation: string;
  reservationId: string;
  arrivee: string;
  depart: string;
  booking: string;
  nuits: number;
  montant: number;
  commission: number;
  canal: "Airbnb" | "Booking.com" | "Direct";
  statut: "Validé" | "En attente";
};
