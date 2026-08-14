// Vocabulaire provisoire (voir docs/DECISIONS.md) :
// Bien · Réservation · Voyageur · Prestataire · Mission · Gestionnaire

import type { StatutMission } from "./statuts";

export type Bien = {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  typologie: string;
  capacite: number;
};

export type CategoriePrestataire =
  | "Ménage"
  | "Maintenance"
  | "Blanchisserie"
  | "Jardinage"
  | "Accueil";

export type Prestataire = {
  id: string;
  nom: string;
  categorie: CategoriePrestataire;
  telephone: string;
  email: string;
  ville: string;
  actif: boolean;
  note: number;
};

export type Voyageur = {
  nom: string;
  telephone: string;
};

export type Reservation = {
  id: string;
  bienId: string;
  voyageur: Voyageur;
  arrivee: string; // ISO date
  depart: string; // ISO date
  plateforme: "Airbnb" | "Booking" | "Direct";
};

export type TypeMission = "Ménage" | "Maintenance" | "Check-in" | "Check-out" | "Inventaire";

export type Mission = {
  id: string;
  reference: string;
  titre: string;
  type: TypeMission;
  bienId: string;
  prestataireId: string | null;
  reservationId: string | null;
  date: string; // ISO date (YYYY-MM-DD)
  heureDebut: string;
  heureFin: string;
  statut: StatutMission;
  consignes: string;
};

export type CanalMessage = "occupants" | "prestataires" | "team";

export type TeamMate = {
  id: string;
  nom: string;
  initiales: string;
};

export type Message = {
  id: string;
  canal: CanalMessage;
  auteur: string;
  initiales: string;
  bienNom?: string;
  texte: string;
  ilYa: string;
};

export type StatutLoyer = "a_valider" | "valide";

export type Loyer = {
  id: string;
  locataire: string;
  initiales: string;
  bienNom: string;
  echeance: string;
  montant: number;
  statut: StatutLoyer;
};

export type EvenementLocal = {
  id: string;
  titre: string;
  lieu: string;
  dates: string;
  impact: "Fort impact" | "Impact modéré" | "Opportunité";
  description: string;
};

export type DocumentBien = {
  id: string;
  titre: string;
  type: string;
  bienNom: string;
  date: string;
};

export type TarifBien = {
  bienId: string;
  nuit: number;
  weekend: number;
  hauteSaison: number;
};
