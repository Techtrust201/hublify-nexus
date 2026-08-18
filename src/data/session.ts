// Session unique de la démo MO1 : une seule source mutable, persistée en localStorage.
// Hydratation après le premier rendu client pour rester compatible SSR.

import { useSyncExternalStore } from "react";
import { DATES_BLOQUEES_INIT } from "./documents-mo1";
import {
  ACTIONS_EN_COURS,
  CONVERSATIONS_MO1,
  MEMBRES_MO1,
  MESSAGES_MO1 as FILS_MO1,
  type ActionEnCours,
  type Conversation,
  type MembreEquipe,
  type MessageFil,
} from "./messagerie-mo1";
import {
  AUJOURD_HUI_MO1,
  ENSEMBLES_MO1,
  EVENEMENTS_MO1,
  LOYERS_MO1,
  MESSAGES_MO1,
  MISSIONS_MO1,
  REGLES_MO1,
  RESERVATIONS_MO1 as RESERVATIONS_CAL,
  type EnsembleRegles,
  type EvenementMo1,
  type LoyerMo1,
  type MessageMo1,
  type MissionMo1,
  type RegleTarif,
  type ReservationMo1 as ReservationCalendrier,
  type StatutPastille,
} from "./planning-mo1";
import {
  DATES_BLOQUEES_MO1,
  RESERVATIONS_MO1 as RESERVATIONS_DOSSIER,
  type DateBloqueeMo1,
  type ReservationMo1 as ReservationDossier,
} from "./reservations-mo1";

export type NotifMo1 = {
  id: string;
  titre: string;
  detail: string;
  href: string;
  lu: boolean;
};

export type EtatSession = {
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

const CLE = "hublify.session.v3";

const NOTIFS_INIT: NotifMo1[] = [
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

export const ETAT_INITIAL: EtatSession = {
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
  membres: MEMBRES_MO1,
  actions: ACTIONS_EN_COURS,
  notifications: NOTIFS_INIT,
};

let etat: EtatSession = ETAT_INITIAL;
let hydrate = false;
const abonnes = new Set<() => void>();

function persister() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(CLE, JSON.stringify(etat));
  } catch {
    /* quota / mode privé */
  }
}

function notifier(prochain: EtatSession) {
  etat = prochain;
  persister();
  abonnes.forEach((fn) => fn());
}

function souscrire(fn: () => void) {
  abonnes.add(fn);
  return () => abonnes.delete(fn);
}

function charger(): EtatSession {
  if (typeof localStorage === "undefined") return ETAT_INITIAL;
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return ETAT_INITIAL;
    const parsed = JSON.parse(brut) as Partial<EtatSession>;
    return { ...ETAT_INITIAL, ...parsed };
  } catch {
    return ETAT_INITIAL;
  }
}

export function hydraterSession() {
  if (hydrate || typeof window === "undefined") return;
  hydrate = true;
  const charge = charger();
  etat = charge;
  abonnes.forEach((fn) => fn());
}

export function useSession(): EtatSession {
  return useSyncExternalStore(
    souscrire,
    () => etat,
    () => ETAT_INITIAL,
  );
}

export function modifierSession(fn: (actuel: EtatSession) => EtatSession) {
  notifier(fn(etat));
}

export function idNouveau(prefixe: string) {
  return `${prefixe}-${Date.now().toString(36)}`;
}

export function validerLoyer(id: string) {
  modifierSession((e) => ({
    ...e,
    loyers: e.loyers.map((l) => (l.id === id ? { ...l, valide: true } : l)),
  }));
}

export function marquerQuittance(id: string) {
  modifierSession((e) => ({
    ...e,
    loyers: e.loyers.map((l) =>
      l.id === id ? { ...l, valide: true, quittance: true } : l,
    ),
  }));
}

export function ajouterEvenement(evenement: EvenementMo1) {
  modifierSession((e) => ({ ...e, evenements: [evenement, ...e.evenements] }));
}

export function changerStatutMission(id: string, statut: StatutPastille) {
  modifierSession((e) => ({
    ...e,
    missions: e.missions.map((m) => (m.id === id ? { ...m, statut } : m)),
  }));
}

export function ajouterMission(mission: MissionMo1) {
  modifierSession((e) => ({ ...e, missions: [mission, ...e.missions] }));
}

export function ajouterReservation(params: {
  dossier: ReservationDossier;
  calendrier: ReservationCalendrier;
}) {
  modifierSession((e) => ({
    ...e,
    reservationsDossier: [params.dossier, ...e.reservationsDossier],
    reservationsCalendrier: [params.calendrier, ...e.reservationsCalendrier],
  }));
}

export function ajouterNotif(notif: Omit<NotifMo1, "id" | "lu"> & { id?: string }) {
  modifierSession((e) => ({
    ...e,
    notifications: [
      { id: notif.id ?? idNouveau("n"), lu: false, titre: notif.titre, detail: notif.detail, href: notif.href },
      ...e.notifications,
    ],
  }));
}

export function marquerNotifsLues() {
  modifierSession((e) => ({
    ...e,
    notifications: e.notifications.map((n) => ({ ...n, lu: true })),
  }));
}

export function useKpiMo1() {
  const s = useSession();
  const loyersRetard = s.loyers.filter((l) => !l.valide);
  const impaye = loyersRetard.reduce((n, l) => n + l.montant, 0);
  const checkIn = s.reservationsDossier.filter(
    (r) => r.arrivee === AUJOURD_HUI_MO1 && r.statut !== "Annulé",
  ).length;
  const checkOut = s.reservationsDossier.filter(
    (r) => r.depart === AUJOURD_HUI_MO1 && r.statut !== "Annulé",
  ).length;
  const missionsJour = s.missions.filter((m) => m.date === AUJOURD_HUI_MO1 && m.statut !== "terminee");
  const menage = missionsJour.filter((m) => m.type === "Menage").length;
  const enCours = s.missions.filter((m) => m.statut === "en_cours").length;
  const reservationsActives = s.reservationsDossier.filter((r) => r.statut !== "Annulé").length;
  return {
    loyersRetard: loyersRetard.length,
    impaye,
    checkIn,
    checkOut,
    checkTotal: checkIn + checkOut,
    missionsJour: missionsJour.length,
    interventionsEnCours: enCours,
    menage,
    reservationsActives,
  };
}
