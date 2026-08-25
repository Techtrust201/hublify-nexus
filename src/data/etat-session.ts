import type { ActionEnCours, Conversation, MembreEquipe, MessageFil } from "@/data/messagerie-mo1";
import type {
  EnsembleRegles,
  EvenementMo1,
  LoyerMo1,
  MessageMo1,
  MissionMo1,
  RegleTarif,
  ReservationMo1 as ReservationCalendrier,
} from "@/data/planning-mo1";
import type { DateBloqueeMo1, ReservationMo1 as ReservationDossier } from "@/data/reservations-mo1";
import type { Prestataire } from "@/data/types";

export type NotifMo1 = {
  id: string;
  titre: string;
  detail: string;
  href: string;
  lu: boolean;
};

export type BienSession = {
  id: string;
  nom: string;
  baseNuit: number;
  adresse?: string;
};

export type EtatSession = {
  biens: BienSession[];
  prestataires: Prestataire[];
  loyers: LoyerMo1[];
  evenements: EvenementMo1[];
  messagesDash: MessageMo1[];
  missions: MissionMo1[];
  reservationsCalendrier: ReservationCalendrier[];
  reservationsDossier: ReservationDossier[];
  datesBloquees: DateBloqueeMo1[];
  datesBloqueesAnnuelles: string[];
  ensembles: EnsembleRegles[];
  regles: RegleTarif[];
  conversations: Conversation[];
  messagesFil: MessageFil[];
  membres: MembreEquipe[];
  actions: ActionEnCours[];
  notifications: NotifMo1[];
};

export const COLLECTIONS_METIER = [
  "biens",
  "prestataires",
  "loyers",
  "evenements",
  "messagesDash",
  "missions",
  "reservationsCalendrier",
  "reservationsDossier",
  "datesBloquees",
  "datesBloqueesAnnuelles",
  "ensembles",
  "regles",
  "conversations",
  "messagesFil",
  "actions",
  "notifications",
] as const;

export type CollectionMetier = (typeof COLLECTIONS_METIER)[number];

export const TABLE_COLLECTION: Record<CollectionMetier, string> = {
  biens: "biens",
  prestataires: "prestataires",
  loyers: "loyers",
  evenements: "evenements",
  messagesDash: "messages_dash",
  missions: "missions",
  reservationsCalendrier: "reservations_cal",
  reservationsDossier: "reservations_dossier",
  datesBloquees: "dates_bloquees",
  datesBloqueesAnnuelles: "dates_bloquees_annuelles",
  ensembles: "ensembles",
  regles: "regles",
  conversations: "conversations",
  messagesFil: "messages_fil",
  actions: "actions",
  notifications: "notifications",
};

export function etatVide(): EtatSession {
  return {
    biens: [],
    prestataires: [],
    loyers: [],
    evenements: [],
    messagesDash: [],
    missions: [],
    reservationsCalendrier: [],
    reservationsDossier: [],
    datesBloquees: [],
    datesBloqueesAnnuelles: [],
    ensembles: [],
    regles: [],
    conversations: [],
    messagesFil: [],
    membres: [],
    actions: [],
    notifications: [],
  };
}

export function estCollectionMetier(valeur: string): valeur is CollectionMetier {
  return (COLLECTIONS_METIER as readonly string[]).includes(valeur);
}
