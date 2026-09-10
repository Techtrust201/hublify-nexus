import {
  DATES_BLOQUEES_INIT,
  DOCS_MO1,
  IMMEUBLES_PATRIMOINE,
  ITEMS_INVENTAIRE,
  LOGEMENTS_PATRIMOINE,
  MODELES_DOCS,
} from "@/data/documents-mo1";
import { DOSSIERS_EDL } from "@/data/edl-mo1";
import {
  etatVide,
  type BienSession,
  type EtatSession,
  type ImmeubleSession,
} from "@/data/etat-session";
import {
  ACTIONS_EN_COURS,
  CONVERSATIONS_MO1,
  DROIT_PERSONNALISE_INITIAL,
  MESSAGES_MO1 as FILS_MO1,
} from "@/data/messagerie-mo1";
import { PRESTATAIRES } from "@/data/mock";
import { PARAMETRAGE_DEFAUT } from "@/data/parametrage-mo1";
import {
  BIENS_MO1 as BIENS_PLANNING,
  ENSEMBLES_MO1,
  EVENEMENTS_MO1,
  LOYERS_MO1,
  MESSAGES_MO1,
  MISSIONS_MO1,
  REGLES_MO1,
  RESERVATIONS_MO1 as RESERVATIONS_CAL,
} from "@/data/planning-mo1";
import {
  BIENS_MO1 as BIENS_RESA,
  DATES_BLOQUEES_MO1,
  OCCUPANTS_MO1,
  RESERVATIONS_MO1 as RESERVATIONS_DOSSIER,
  versIsoJour,
} from "@/data/reservations-mo1";

const NOTIFS_INIT = [
  {
    id: "n-loyer",
    titre: "Loyer à valider",
    detail: "Sophie Martin · Suzette · 850 €",
    href: "/",
    lu: false,
  },
  {
    id: "n-msg",
    titre: "Message non lu",
    detail: "Albert Flores — Villa Lavandrix",
    href: "/messagerie",
    lu: false,
  },
  {
    id: "n-mission",
    titre: "Mission aujourd'hui",
    detail: "Check-in assisté · Suzette · 15:00",
    href: "/missions",
    lu: false,
  },
];

export function immeublesCanon(): ImmeubleSession[] {
  return IMMEUBLES_PATRIMOINE.map((i) => ({
    id: i.id,
    nom: i.nom,
    proprietaire: i.proprietaire,
    initiales: i.initiales,
    adresse: i.adresse,
    statut: i.statut,
    logements: 0,
  }));
}

/**
 * Un bien porte toute sa fiche : tarif de la vue planning, adresse de la vue
 * réservations et caractéristiques de la vue patrimoine, rapprochées par nom.
 */
export function biensCanon(): BienSession[] {
  const parNomImmeuble = new Map(IMMEUBLES_PATRIMOINE.map((i) => [i.nom, i.id]));
  return BIENS_PLANNING.map((b) => {
    const resa = BIENS_RESA.find((x) => x.id === b.id);
    const fiche = LOGEMENTS_PATRIMOINE.find((l) => l.nom.toLowerCase() === b.nom.toLowerCase());
    const immeubleId = fiche ? parNomImmeuble.get(fiche.immeuble) : undefined;
    return {
      id: b.id,
      nom: b.nom,
      baseNuit: b.baseNuit,
      adresse: fiche?.adresse ?? resa?.adresse ?? "",
      typologie: fiche?.typologie ?? "Logement",
      immeubleId: immeubleId ?? null,
      surface: fiche?.surface ?? "—",
      meuble: fiche?.meuble ?? true,
      proprietaire: fiche?.proprietaire ?? "",
      initiales: fiche?.initiales ?? "",
      note: fiche?.note ?? 5,
      statut: fiche?.statut ?? "libre",
    };
  });
}

/** Parc Redris — uniquement pour le seed de l'org démo, jamais pour un nouvel adhérent. */
export function etatCanon(): EtatSession {
  return {
    ...etatVide(),
    biens: biensCanon(),
    immeubles: immeublesCanon(),
    prestataires: PRESTATAIRES,
    occupants: OCCUPANTS_MO1.map((o) => ({
      ...o,
      arrivee: versIsoJour(o.arrivee),
      ...(o.depart ? { depart: versIsoJour(o.depart) } : {}),
    })),
    loyers: LOYERS_MO1,
    evenements: EVENEMENTS_MO1,
    messagesDash: MESSAGES_MO1,
    missions: MISSIONS_MO1,
    reservationsCalendrier: RESERVATIONS_CAL,
    reservationsDossier: RESERVATIONS_DOSSIER,
    datesBloquees: DATES_BLOQUEES_MO1,
    datesBloqueesAnnuelles: DATES_BLOQUEES_INIT,
    ensembles: ENSEMBLES_MO1,
    regles: REGLES_MO1,
    conversations: CONVERSATIONS_MO1,
    messagesFil: FILS_MO1,
    actions: ACTIONS_EN_COURS,
    notifications: NOTIFS_INIT,
    documents: DOCS_MO1,
    modeles: MODELES_DOCS,
    inventaire: ITEMS_INVENTAIRE,
    edl: DOSSIERS_EDL,
    droitsPersonnalises: [DROIT_PERSONNALISE_INITIAL],
    parametrage: PARAMETRAGE_DEFAUT,
  };
}
