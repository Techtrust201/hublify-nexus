import { useSyncExternalStore } from "react";
import { etatVide, type EtatSession, type NotifMo1, type CollectionMetier } from "@/data/etat-session";
import { calculerKpi } from "@/lib/kpi";
import { AUJOURD_HUI_MO1, type EvenementMo1, type MissionMo1, type StatutPastille } from "@/data/planning-mo1";
import type { ReservationMo1 as ReservationCalendrier } from "@/data/planning-mo1";
import type { ReservationMo1 as ReservationDossier } from "@/data/reservations-mo1";
import {
  chargerEtatDistant,
  insererLigneMetier,
  modifierLigneMetier,
  sauverEtatDistant,
} from "@/data/session-remote";

export type { EtatSession, NotifMo1, CollectionMetier, BienSession } from "@/data/etat-session";

export const ETAT_INITIAL: EtatSession = etatVide();

const PREFIXE_CLE = "hublify.session.v5";
const CLES_LEGACY = ["hublify.session.v3", "hublify.session.v4"];

function cleLocale(userId: string | null) {
  return userId ? `${PREFIXE_CLE}.${userId}` : null;
}

export function oublierEtatsLocaux(sauf?: string | null) {
  if (typeof localStorage === "undefined") return;
  const conserver = cleLocale(sauf ?? null);
  const aSupprimer: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const cle = localStorage.key(i);
    if (!cle) continue;
    const legacy = CLES_LEGACY.some((p) => cle === p || cle.startsWith(`${p}.`));
    if (legacy || (cle.startsWith(`${PREFIXE_CLE}.`) && cle !== conserver)) {
      aSupprimer.push(cle);
    }
  }
  aSupprimer.forEach((cle) => localStorage.removeItem(cle));
}

export type StatutSync =
  | { etat: "inactif" }
  | { etat: "en-cours" }
  | { etat: "enregistre"; a: number }
  | { etat: "echec"; depuis: number; raison: string };

const INACTIF: StatutSync = { etat: "inactif" };

let etat: EtatSession = etatVide();
let hydrate = false;
let ignorePush = false;
let generation = 0;
let userIdCourant: string | null = null;
let syncTimer: ReturnType<typeof setTimeout> | undefined;
let repriseTimer: ReturnType<typeof setTimeout> | undefined;
let tentatives = 0;
let ecouteReseau = false;
let statutSync: StatutSync = INACTIF;
const abonnes = new Set<() => void>();
const abonnesStatut = new Set<() => void>();
const sales = new Set<CollectionMetier>();

function persisterLocal() {
  const cle = cleLocale(userIdCourant);
  if (!cle || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(cle, JSON.stringify(etat));
  } catch {
    /* quota / mode privé */
  }
}

function poserStatut(prochain: StatutSync) {
  statutSync = prochain;
  abonnesStatut.forEach((fn) => fn());
}

function patchSale(): Partial<EtatSession> {
  const patch: Partial<EtatSession> = {};
  for (const cle of sales) {
    (patch as Record<string, unknown>)[cle] = etat[cle];
  }
  return patch;
}

async function pousser(): Promise<boolean> {
  if (!userIdCourant) return false;
  if (sales.size === 0) {
    poserStatut({ etat: "enregistre", a: Date.now() });
    return true;
  }
  poserStatut({ etat: "en-cours" });
  try {
    const res = await sauverEtatDistant({ data: { patch: patchSale() } });
    if (!res.ok) {
      if (res.raison === "non_configure") {
        poserStatut({ etat: "inactif" });
        return true;
      }
      poserStatut({ etat: "echec", depuis: Date.now(), raison: res.raison });
      return false;
    }
    sales.clear();
    tentatives = 0;
    poserStatut({ etat: "enregistre", a: Date.now() });
    return true;
  } catch (e) {
    poserStatut({
      etat: "echec",
      depuis: Date.now(),
      raison: e instanceof Error ? e.message : "reseau",
    });
    return false;
  }
}

function programmerReprise() {
  if (repriseTimer) clearTimeout(repriseTimer);
  const delai = Math.min(2000 * 2 ** tentatives, 30_000);
  tentatives += 1;
  repriseTimer = setTimeout(() => {
    void pousser().then((ok) => {
      if (!ok) programmerReprise();
    });
  }, delai);
}

function persister() {
  persisterLocal();
  if (ignorePush || typeof window === "undefined" || !userIdCourant) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void pousser().then((ok) => {
      if (!ok) programmerReprise();
    });
  }, 400);
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

function charger(userId: string | null): EtatSession {
  const cle = cleLocale(userId);
  if (!cle || typeof localStorage === "undefined") return etatVide();
  try {
    const brut = localStorage.getItem(cle);
    if (!brut) return etatVide();
    const parsed = JSON.parse(brut) as Partial<EtatSession>;
    return { ...etatVide(), ...parsed };
  } catch {
    return etatVide();
  }
}

async function hydraterDistant() {
  const gen = generation;
  try {
    const distant = await chargerEtatDistant();
    if (gen !== generation) return;
    if (!distant.ok) {
      if (distant.raison !== "non_configure") {
        poserStatut({ etat: "echec", depuis: Date.now(), raison: distant.raison });
      }
      return;
    }
    ignorePush = true;
    etat = distant.payload;
    sales.clear();
    persisterLocal();
    abonnes.forEach((fn) => fn());
    ignorePush = false;
    poserStatut({ etat: "enregistre", a: Date.now() });
  } catch (e) {
    if (gen !== generation) return;
    poserStatut({
      etat: "echec",
      depuis: Date.now(),
      raison: e instanceof Error ? e.message : "reseau",
    });
  }
}

export function hydraterSession(userId?: string | null) {
  if (typeof window === "undefined") return;
  const prochain = userId ?? null;
  const changementDeCompte = hydrate && prochain !== userIdCourant;
  userIdCourant = prochain;

  if (!hydrate || changementDeCompte) {
    hydrate = true;
    if (syncTimer) clearTimeout(syncTimer);
    if (repriseTimer) clearTimeout(repriseTimer);
    tentatives = 0;
    sales.clear();
    generation += 1;
    poserStatut({ etat: "inactif" });
    oublierEtatsLocaux(prochain);
    etat = charger(prochain);
    abonnes.forEach((fn) => fn());
  }

  if (!prochain) return;
  if (!ecouteReseau) {
    ecouteReseau = true;
    window.addEventListener("online", () => {
      if (statutSync.etat === "echec") void pousser().then((ok) => !ok && programmerReprise());
    });
  }
  void hydraterDistant();
}

export function reessayerSync() {
  if (repriseTimer) clearTimeout(repriseTimer);
  tentatives = 0;
  void pousser().then((ok) => {
    if (!ok) programmerReprise();
  });
}

export function useStatutSync(): StatutSync {
  return useSyncExternalStore(
    (fn) => {
      abonnesStatut.add(fn);
      return () => abonnesStatut.delete(fn);
    },
    () => statutSync,
    () => INACTIF,
  );
}

export function useSession(): EtatSession {
  return useSyncExternalStore(
    souscrire,
    () => etat,
    () => ETAT_INITIAL,
  );
}

const CLES_ETAT = Object.keys(etatVide()) as Array<keyof EtatSession>;

export function modifierSession(fn: (actuel: EtatSession) => EtatSession) {
  generation += 1;
  const avant = etat;
  const prochain = fn(etat);
  for (const cle of CLES_ETAT) {
    if (cle === "membres") continue;
    if (prochain[cle] !== avant[cle]) {
      sales.add(cle as CollectionMetier);
    }
  }
  notifier(prochain);
}

export function idNouveau(prefixe: string) {
  return `${prefixe}-${Date.now().toString(36)}`;
}

async function pousserLigne(
  collection: CollectionMetier,
  item: { id: string },
): Promise<boolean> {
  poserStatut({ etat: "en-cours" });
  try {
    const res = await insererLigneMetier({ data: { collection, item } });
    if (!res.ok) {
      if (res.raison === "non_configure") {
        poserStatut({ etat: "inactif" });
        return true;
      }
      poserStatut({ etat: "echec", depuis: Date.now(), raison: res.raison });
      return false;
    }
    poserStatut({ etat: "enregistre", a: Date.now() });
    return true;
  } catch (e) {
    poserStatut({
      etat: "echec",
      depuis: Date.now(),
      raison: e instanceof Error ? e.message : "reseau",
    });
    return false;
  }
}

async function pousserPatch(
  collection: CollectionMetier,
  id: string,
  patch: Record<string, unknown>,
): Promise<boolean> {
  poserStatut({ etat: "en-cours" });
  try {
    const res = await modifierLigneMetier({ data: { collection, id, patch } });
    if (!res.ok) {
      if (res.raison === "non_configure") {
        poserStatut({ etat: "inactif" });
        return true;
      }
      poserStatut({ etat: "echec", depuis: Date.now(), raison: res.raison });
      return false;
    }
    poserStatut({ etat: "enregistre", a: Date.now() });
    return true;
  } catch (e) {
    poserStatut({
      etat: "echec",
      depuis: Date.now(),
      raison: e instanceof Error ? e.message : "reseau",
    });
    return false;
  }
}

function appliquerLocal(fn: (actuel: EtatSession) => EtatSession) {
  generation += 1;
  ignorePush = true;
  etat = fn(etat);
  persisterLocal();
  abonnes.forEach((n) => n());
  ignorePush = false;
}

export function validerLoyer(id: string) {
  appliquerLocal((e) => ({
    ...e,
    loyers: e.loyers.map((l) => (l.id === id ? { ...l, valide: true } : l)),
  }));
  void pousserPatch("loyers", id, { valide: true }).then((ok) => !ok && programmerReprise());
}

export function marquerQuittance(id: string) {
  appliquerLocal((e) => ({
    ...e,
    loyers: e.loyers.map((l) => (l.id === id ? { ...l, valide: true, quittance: true } : l)),
  }));
  void pousserPatch("loyers", id, { valide: true, quittance: true }).then(
    (ok) => !ok && programmerReprise(),
  );
}

export function ajouterEvenement(evenement: EvenementMo1) {
  appliquerLocal((e) => ({ ...e, evenements: [evenement, ...e.evenements] }));
  void pousserLigne("evenements", evenement).then((ok) => !ok && programmerReprise());
}

export function changerStatutMission(id: string, statut: StatutPastille) {
  appliquerLocal((e) => ({
    ...e,
    missions: e.missions.map((m) => (m.id === id ? { ...m, statut } : m)),
  }));
  void pousserPatch("missions", id, { statut }).then((ok) => !ok && programmerReprise());
}

export function ajouterMission(mission: MissionMo1) {
  appliquerLocal((e) => ({ ...e, missions: [mission, ...e.missions] }));
  void pousserLigne("missions", mission).then((ok) => !ok && programmerReprise());
}

export function ajouterReservation(params: {
  dossier: ReservationDossier;
  calendrier: ReservationCalendrier;
}) {
  appliquerLocal((e) => ({
    ...e,
    reservationsDossier: [params.dossier, ...e.reservationsDossier],
    reservationsCalendrier: [params.calendrier, ...e.reservationsCalendrier],
  }));
  void (async () => {
    const a = await pousserLigne("reservationsDossier", params.dossier);
    const b = await pousserLigne("reservationsCalendrier", params.calendrier);
    if (!a || !b) programmerReprise();
  })();
}

export function ajouterPrestataire(prestataire: Omit<import("@/data/types").Prestataire, "id">) {
  const id = idNouveau("p");
  const ligne = { ...prestataire, id };
  appliquerLocal((e) => ({ ...e, prestataires: [...e.prestataires, ligne] }));
  void pousserLigne("prestataires", ligne).then((ok) => !ok && programmerReprise());
  return id;
}

export function ajouterNotif(notif: Omit<NotifMo1, "id" | "lu"> & { id?: string }) {
  const ligne: NotifMo1 = {
    id: notif.id ?? idNouveau("n"),
    lu: false,
    titre: notif.titre,
    detail: notif.detail,
    href: notif.href,
  };
  appliquerLocal((e) => ({ ...e, notifications: [ligne, ...e.notifications] }));
  void pousserLigne("notifications", ligne).then((ok) => !ok && programmerReprise());
}

export function marquerNotifsLues() {
  appliquerLocal((e) => ({
    ...e,
    notifications: e.notifications.map((n) => ({ ...n, lu: true })),
  }));
  sales.add("notifications");
  persister();
}

export function useKpiMo1() {
  return calculerKpi(useSession(), AUJOURD_HUI_MO1);
}
