import { DATES_BLOQUEES_INIT } from "@/data/documents-mo1";
import { etatVide, type BienSession, type EtatSession } from "@/data/etat-session";
import {
  ACTIONS_EN_COURS,
  CONVERSATIONS_MO1,
  MESSAGES_MO1 as FILS_MO1,
} from "@/data/messagerie-mo1";
import { PRESTATAIRES } from "@/data/mock";
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
  RESERVATIONS_MO1 as RESERVATIONS_DOSSIER,
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

export function biensCanon(): BienSession[] {
  return BIENS_PLANNING.map((b) => {
    const extra = BIENS_RESA.find((x) => x.id === b.id);
    return {
      id: b.id,
      nom: b.nom,
      baseNuit: b.baseNuit,
      ...(extra?.adresse ? { adresse: extra.adresse } : {}),
    };
  });
}

/** Parc Redris — uniquement pour le seed de l'org démo, jamais pour un nouvel adhérent. */
export function etatCanon(): EtatSession {
  return {
    ...etatVide(),
    biens: biensCanon(),
    prestataires: PRESTATAIRES,
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
  };
}
