import type {
  ActionEnCours,
  Conversation,
  DroitPersonnalise,
  MembreEquipe,
  MessageFil,
} from "@/data/messagerie-mo1";
import type {
  EnsembleRegles,
  EvenementMo1,
  LoyerMo1,
  MessageMo1,
  MissionMo1,
  RegleTarif,
  ReservationMo1 as ReservationCalendrier,
} from "@/data/planning-mo1";
import type {
  DateBloqueeMo1,
  OccupantMo1,
  ReservationMo1 as ReservationDossier,
} from "@/data/reservations-mo1";
import type { DocMo1, ItemInventaire, ModeleDoc } from "@/data/documents-mo1";
import type { DossierEdl } from "@/data/edl-mo1";
import type { Prestataire } from "@/data/types";
import { PARAMETRAGE_DEFAUT, type ParametrageSession } from "@/data/parametrage-mo1";
import type {
  CandidatureLocation,
  ContactCopro,
  DossierLocation,
  PartageDossier,
  RapportIntervention,
} from "@/data/v1-metier";

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
  typologie?: string;
  immeubleId?: string | null;
  surface?: string;
  meuble?: boolean;
  proprietaire?: string;
  initiales?: string;
  note?: number;
  statut?: "loué" | "libre" | "en travaux";
};

export type ImmeubleSession = {
  id: string;
  nom: string;
  proprietaire: string;
  initiales: string;
  adresse: string;
  statut: "actif" | "inactif";
  logements: number;
};

export type EtatSession = {
  biens: BienSession[];
  immeubles: ImmeubleSession[];
  prestataires: Prestataire[];
  occupants: OccupantMo1[];
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
  documents: DocMo1[];
  modeles: ModeleDoc[];
  inventaire: ItemInventaire[];
  edl: DossierEdl[];
  droitsPersonnalises: DroitPersonnalise[];
  rapportsIntervention: RapportIntervention[];
  contactsCopro: ContactCopro[];
  dossiersLocation: DossierLocation[];
  partagesDossier: PartageDossier[];
  candidatures: CandidatureLocation[];
  parametrage: ParametrageSession;
};

// L'ordre est celui des écritures : un parent avant ses enfants, sinon les clés
// étrangères refusent l'insertion (immeuble → bien → réservation, ensemble →
// règle, conversation → message).
export const COLLECTIONS_METIER = [
  "immeubles",
  "biens",
  "prestataires",
  "occupants",
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
  "documents",
  "modeles",
  "inventaire",
  "edl",
  "droitsPersonnalises",
  "rapportsIntervention",
  "contactsCopro",
  "dossiersLocation",
  "partagesDossier",
  "candidatures",
] as const;

export type CollectionMetier = (typeof COLLECTIONS_METIER)[number];

export const TABLE_COLLECTION: Record<CollectionMetier, string> = {
  biens: "biens",
  immeubles: "immeubles",
  prestataires: "prestataires",
  occupants: "occupants",
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
  documents: "documents",
  modeles: "modeles_documents",
  inventaire: "inventaire_items",
  edl: "edl_dossiers",
  droitsPersonnalises: "droits_personnalises",
  rapportsIntervention: "rapports_intervention",
  contactsCopro: "contacts_copro",
  dossiersLocation: "dossiers_location",
  partagesDossier: "partages_dossier",
  candidatures: "candidatures_location",
};

export function etatVide(): EtatSession {
  return {
    biens: [],
    immeubles: [],
    prestataires: [],
    occupants: [],
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
    documents: [],
    modeles: [],
    inventaire: [],
    edl: [],
    droitsPersonnalises: [],
    rapportsIntervention: [],
    contactsCopro: [],
    dossiersLocation: [],
    partagesDossier: [],
    candidatures: [],
    parametrage: PARAMETRAGE_DEFAUT,
  };
}

export function estCollectionMetier(valeur: string): valeur is CollectionMetier {
  return (COLLECTIONS_METIER as readonly string[]).includes(valeur);
}
