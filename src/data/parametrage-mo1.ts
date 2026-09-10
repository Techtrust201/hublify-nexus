export type UpsellParam = {
  id: string;
  nom: string;
  prix: number;
  actif: boolean;
};

export type ParametrageSession = {
  notifAlertes: boolean;
  notifAide: boolean;
  notifMaj: boolean;
  notifsEmail: boolean;
  notifsPush: boolean;
  notifsSms: boolean;
  rappelPaiement: boolean;
  rappelPaiementHeures: string;
  notifLoyer: boolean;
  notifMessage: boolean;
  notifMission: boolean;
  emailPreCheckin: boolean;
  messagePreCheckin: string;
  lienAppVoyageur: boolean;
  delaiEnvoiActif: boolean;
  delaiEnvoiJours: string;
  messageLienPerso: string;
  exigerIdentifiant: boolean;
  identifiantTousVoyageurs: boolean;
  accepterToutePiece: boolean;
  infosContactSupp: boolean;
  signatureVoyageur: boolean;
  passerellePaiement: boolean;
  portailVoyageurs: boolean;
  codePorteSiPaye: boolean;
  rappelCheckout: boolean;
  rappelCheckoutJours: string;
  afficherFichesAcces: boolean;
  afficherEdl: boolean;
  heureCheckIn: string;
  heureCheckOut: string;
  delaiMenageMin: string;
  consignesArrivee: string;
  consignesDepart: string;
  upsells: UpsellParam[];
};

export const PARAMETRAGE_DEFAUT: ParametrageSession = {
  notifAlertes: true,
  notifAide: true,
  notifMaj: false,
  notifsEmail: true,
  notifsPush: true,
  notifsSms: false,
  rappelPaiement: true,
  rappelPaiementHeures: "00",
  notifLoyer: true,
  notifMessage: true,
  notifMission: true,
  emailPreCheckin: true,
  messagePreCheckin:
    "Bienvenue. Merci de confirmer vos horaires d'arrivée et le nombre de voyageurs.",
  lienAppVoyageur: false,
  delaiEnvoiActif: true,
  delaiEnvoiJours: "3",
  messageLienPerso: "Retrouvez Wi-Fi, codes et consignes dans votre espace voyageur.",
  exigerIdentifiant: true,
  identifiantTousVoyageurs: false,
  accepterToutePiece: true,
  infosContactSupp: true,
  signatureVoyageur: false,
  passerellePaiement: true,
  portailVoyageurs: true,
  codePorteSiPaye: true,
  rappelCheckout: true,
  rappelCheckoutJours: "1",
  afficherFichesAcces: true,
  afficherEdl: true,
  heureCheckIn: "16:00",
  heureCheckOut: "10:00",
  delaiMenageMin: "120",
  consignesArrivee:
    "Remise des clés à l'arrivée. Présenter le règlement intérieur et les codes Wi-Fi.",
  consignesDepart: "État des lieux de sortie, relevé des compteurs, photos du logement.",
  upsells: [
    { id: "u-dej", nom: "Petit-déjeuner", prix: 15, actif: true },
    { id: "u-late", nom: "Late Check-out (14h)", prix: 25, actif: true },
    { id: "u-park", nom: "Parking sécurisé", prix: 10, actif: false },
    { id: "u1", nom: "Lit bébé", prix: 20, actif: true },
    { id: "u2", nom: "Ménage supplémentaire", prix: 45, actif: true },
    { id: "u4", nom: "Transfert gare", prix: 35, actif: true },
  ],
};

export function fusionnerParametrage(
  partiel?: Partial<ParametrageSession> | null,
): ParametrageSession {
  return {
    ...PARAMETRAGE_DEFAUT,
    ...partiel,
    upsells: partiel?.upsells ?? PARAMETRAGE_DEFAUT.upsells,
  };
}
