import { useSyncExternalStore } from "react";
import {
  etatVide,
  estCollectionMetier,
  type BienSession,
  type EtatSession,
  type NotifMo1,
  type CollectionMetier,
} from "@/data/etat-session";
import { fusionnerParametrage, type ParametrageSession } from "@/data/parametrage-mo1";
import { calculerKpi } from "@/lib/kpi";
import {
  AUJOURD_HUI_MO1,
  type EvenementMo1,
  type MissionMo1,
  type StatutPastille,
} from "@/data/planning-mo1";
import type { ReservationMo1 as ReservationCalendrier } from "@/data/planning-mo1";
import type { OccupantMo1, ReservationMo1 as ReservationDossier } from "@/data/reservations-mo1";
import type { Conversation } from "@/data/messagerie-mo1";
import type {
  CandidatureLocation,
  ContactCopro,
  DossierLocation,
  PartageDossier,
  RapportIntervention,
} from "@/data/v1-metier";
import { joursPlage, poserPeriodesOuverture } from "@/data/v1-metier";
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
/**
 * Le cache local peut être vide alors que le compte a des données : c'est le
 * cas d'une première visite, ou d'une arrivée directe sur l'URL d'une fiche.
 * Seule la fin du chargement distant permet d'affirmer qu'une fiche absente
 * l'est réellement.
 */
let distantCharge = false;
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

// Le paramétrage n'est pas une collection mais il se synchronise comme telle.
type CleSynchronisable = CollectionMetier | "parametrage";
const sales = new Set<CleSynchronisable>();

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
    return {
      ...etatVide(),
      ...parsed,
      parametrage: fusionnerParametrage(parsed.parametrage),
    };
  } catch {
    return etatVide();
  }
}

function marquerDistantCharge(gen: number) {
  if (gen !== generation || distantCharge) return;
  distantCharge = true;
  abonnes.forEach((fn) => fn());
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
    etat = {
      ...etatVide(),
      ...distant.payload,
      parametrage: fusionnerParametrage(distant.payload.parametrage),
    };
    sales.clear();
    persisterLocal();
    abonnes.forEach((fn) => fn());
    ignorePush = false;
    poserStatut({ etat: "enregistre", a: Date.now() });
    // Import différé : la reprise dépend de la session, elle ne pèse pas sur le
    // chargement initial et ne s'exécute qu'une fois par navigateur.
    const { migrerDonneesLocales } = await import("@/data/migration-locale");
    await migrerDonneesLocales(etat);
  } catch (e) {
    if (gen !== generation) return;
    poserStatut({
      etat: "echec",
      depuis: Date.now(),
      raison: e instanceof Error ? e.message : "reseau",
    });
  } finally {
    // Succès comme échec : l'attente est terminée. Un écran de détail qui
    // patienterait indéfiniment serait pire qu'un écran qui conclut.
    marquerDistantCharge(gen);
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
    distantCharge = false;
    poserStatut({ etat: "inactif" });
    oublierEtatsLocaux(prochain);
    etat = charger(prochain);
    abonnes.forEach((fn) => fn());
  }

  if (!prochain) {
    // Sans compte, il n'y a rien à attendre du serveur.
    marquerDistantCharge(generation);
    return;
  }
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

/**
 * Dit si l'état métier a fini d'être chargé depuis le serveur. Tant que ce
 * n'est pas le cas — rendu serveur, premier rendu client, arrivée directe sur
 * l'URL d'une fiche — les collections peuvent être vides sans que cela signifie
 * qu'elles le soient vraiment. Un écran de détail qui conclurait « introuvable »
 * à cet instant annoncerait une page inexistante pour une fiche qui existe.
 */
export function useSessionChargee(): boolean {
  return useSyncExternalStore(
    souscrire,
    () => distantCharge,
    () => false,
  );
}

const CLES_ETAT = Object.keys(etatVide()) as Array<keyof EtatSession>;

export function modifierSession(fn: (actuel: EtatSession) => EtatSession) {
  generation += 1;
  const avant = etat;
  const prochain = fn(etat);
  for (const cle of CLES_ETAT) {
    if (!estCollectionMetier(cle) && cle !== "parametrage") continue;
    if (prochain[cle] !== avant[cle]) {
      sales.add(cle);
    }
  }
  notifier(prochain);
}

/**
 * Écrit une collection entière et la marque pour synchronisation. Les écrans
 * qui manipulaient un tableau en localStorage passent par ici sans changer de
 * forme : ils poussent la liste complète, le serveur aligne la table.
 */
export function poserCollection<K extends CollectionMetier>(
  cle: K,
  maj: EtatSession[K] | ((actuel: EtatSession[K]) => EtatSession[K]),
) {
  modifierSession((e) => ({
    ...e,
    [cle]: typeof maj === "function" ? (maj as (a: EtatSession[K]) => EtatSession[K])(e[cle]) : maj,
  }));
}

export function poserParametrage(
  maj: ParametrageSession | ((actuel: ParametrageSession) => ParametrageSession),
) {
  modifierSession((e) => ({
    ...e,
    parametrage: typeof maj === "function" ? maj(e.parametrage) : maj,
  }));
}

export function idNouveau(prefixe: string) {
  return `${prefixe}-${Date.now().toString(36)}`;
}

export function poserOuverturesBail(bienId: string, debut: string, fin: string) {
  const jours = joursPlage(debut, fin);
  poserCollection("datesBloquees", (liste) => poserPeriodesOuverture(liste, bienId, debut, fin));
  return jours.length;
}

export function ouvrirConversationProspect(params: {
  nom: string;
  extrait: string;
  bienNom?: string | undefined;
  type?: Conversation["type"] | undefined;
}) {
  const id = idNouveau("c");
  const initiales = params.nom
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  const ligne: Conversation = {
    id,
    section: "prospections",
    nom: params.nom,
    initiales: initiales || "??",
    type: params.type ?? "locataire",
    badge: "Prospect",
    extrait: params.extrait,
    ilYa: "À l'instant",
    nonLu: true,
    archivee: false,
    ...(params.bienNom ? { bienNom: params.bienNom } : {}),
  };
  appliquerLocal((e) => ({ ...e, conversations: [ligne, ...e.conversations] }));
  void pousserLigne("conversations", ligne).then((ok) => !ok && programmerReprise());
  return id;
}

async function pousserLigne(collection: CollectionMetier, item: { id: string }): Promise<boolean> {
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

export function modifierMission(id: string, patch: Partial<MissionMo1>) {
  appliquerLocal((e) => ({
    ...e,
    missions: e.missions.map((m) => (m.id === id ? { ...m, ...patch, id } : m)),
  }));
  void pousserPatch("missions", id, { ...patch } as Record<string, unknown>).then(
    (ok) => !ok && programmerReprise(),
  );
}

export function retirerMission(id: string) {
  appliquerLocal((e) => ({ ...e, missions: e.missions.filter((m) => m.id !== id) }));
  sales.add("missions");
  persister();
}

export function affecterMission(id: string, assigne: string) {
  appliquerLocal((e) => ({
    ...e,
    missions: e.missions.map((m) => (m.id === id ? { ...m, assigne } : m)),
  }));
  void pousserPatch("missions", id, { assigne }).then((ok) => !ok && programmerReprise());
}

function lieAuDossier(cal: ReservationCalendrier, dossier: ReservationDossier) {
  return (
    cal.id === dossier.id ||
    cal.id === `cal-${dossier.id}` ||
    (cal.voyageur === dossier.occupant &&
      cal.arrivee === dossier.arrivee &&
      cal.bienId === dossier.bienId)
  );
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

export function modifierReservation(id: string, patch: Partial<ReservationDossier>) {
  appliquerLocal((e) => {
    const actuel = e.reservationsDossier.find((r) => r.id === id);
    if (!actuel) return e;
    const dossier: ReservationDossier = { ...actuel, ...patch, id };
    return {
      ...e,
      reservationsDossier: e.reservationsDossier.map((r) => (r.id === id ? dossier : r)),
      reservationsCalendrier: e.reservationsCalendrier.map((r) =>
        lieAuDossier(r, actuel)
          ? {
              ...r,
              bienId: dossier.bienId,
              voyageur: dossier.occupant,
              arrivee: dossier.arrivee,
              depart: dossier.depart,
            }
          : r,
      ),
    };
  });
  void pousserPatch("reservationsDossier", id, { ...patch } as Record<string, unknown>).then(
    (ok) => !ok && programmerReprise(),
  );
}

export function annulerReservation(id: string) {
  appliquerLocal((e) => {
    const actuel = e.reservationsDossier.find((r) => r.id === id);
    if (!actuel) return e;
    return {
      ...e,
      reservationsDossier: e.reservationsDossier.map((r) =>
        r.id === id ? { ...r, statut: "Annulé" as const } : r,
      ),
      reservationsCalendrier: e.reservationsCalendrier.filter((r) => !lieAuDossier(r, actuel)),
    };
  });
  void pousserPatch("reservationsDossier", id, { statut: "Annulé" }).then(
    (ok) => !ok && programmerReprise(),
  );
}

export function ajouterBien(bien: BienSession) {
  appliquerLocal((e) => ({ ...e, biens: [...e.biens, bien] }));
  void pousserLigne("biens", bien).then((ok) => !ok && programmerReprise());
}

export function retirerBien(id: string) {
  appliquerLocal((e) => ({ ...e, biens: e.biens.filter((b) => b.id !== id) }));
  sales.add("biens");
  persister();
}

export function ajouterPrestataire(prestataire: Omit<import("@/data/types").Prestataire, "id">) {
  const id = idNouveau("p");
  const ligne = { ...prestataire, id };
  appliquerLocal((e) => ({ ...e, prestataires: [...e.prestataires, ligne] }));
  void pousserLigne("prestataires", ligne).then((ok) => !ok && programmerReprise());
  return id;
}

export function modifierPrestataire(
  id: string,
  patch: Partial<Omit<import("@/data/types").Prestataire, "id">>,
) {
  appliquerLocal((e) => ({
    ...e,
    prestataires: e.prestataires.map((p) => (p.id === id ? { ...p, ...patch, id } : p)),
  }));
  void pousserPatch("prestataires", id, { ...patch } as Record<string, unknown>).then(
    (ok) => !ok && programmerReprise(),
  );
}

export function retirerPrestataire(id: string) {
  appliquerLocal((e) => ({ ...e, prestataires: e.prestataires.filter((p) => p.id !== id) }));
  sales.add("prestataires");
  persister();
}

/** Rapproche par identifiant, à défaut par nom : un occupant saisi deux fois reste une seule fiche. */
export function upsertOccupant(occupant: OccupantMo1) {
  poserCollection("occupants", (liste) => {
    const i = liste.findIndex(
      (x) => x.id === occupant.id || x.nom.toLowerCase() === occupant.nom.toLowerCase(),
    );
    return i >= 0
      ? liste.map((x, idx) => (idx === i ? { ...x, ...occupant, id: x.id } : x))
      : [occupant, ...liste];
  });
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

export function ajouterRapport(rapport: RapportIntervention) {
  appliquerLocal((e) => ({
    ...e,
    rapportsIntervention: [rapport, ...e.rapportsIntervention.filter((r) => r.id !== rapport.id)],
  }));
  void pousserLigne("rapportsIntervention", rapport).then((ok) => !ok && programmerReprise());
}

export function upsertContactCopro(contact: ContactCopro) {
  poserCollection("contactsCopro", (liste) => {
    const i = liste.findIndex((c) => c.id === contact.id);
    return i >= 0 ? liste.map((c, idx) => (idx === i ? contact : c)) : [contact, ...liste];
  });
}

export function retirerContactCopro(id: string) {
  appliquerLocal((e) => ({
    ...e,
    contactsCopro: e.contactsCopro.filter((c) => c.id !== id),
  }));
  sales.add("contactsCopro");
  persister();
}

export function upsertDossierLocation(dossier: DossierLocation) {
  appliquerLocal((e) => {
    const i = e.dossiersLocation.findIndex((d) => d.id === dossier.id);
    return {
      ...e,
      dossiersLocation:
        i >= 0
          ? e.dossiersLocation.map((d, idx) => (idx === i ? dossier : d))
          : [dossier, ...e.dossiersLocation],
    };
  });
  void pousserLigne("dossiersLocation", dossier).then((ok) => !ok && programmerReprise());
}

/** Valide un départ : dossier + date de fin sur les deux calendriers. */
export function validerDepartDossier(dossierId: string, dateDepart: string) {
  const dossier = etat.dossiersLocation.find((d) => d.id === dossierId);
  if (!dossier) return false;
  upsertDossierLocation({ ...dossier, departDeclare: dateDepart, departValide: true });
  const cible = etat.reservationsDossier.find(
    (r) =>
      r.email.toLowerCase() === dossier.email.toLowerCase() ||
      r.occupant.toLowerCase() === dossier.occupantNom.toLowerCase(),
  );
  if (cible) modifierReservation(cible.id, { depart: dateDepart });
  return true;
}

export function upsertPartageDossier(partage: PartageDossier) {
  appliquerLocal((e) => {
    const i = e.partagesDossier.findIndex((p) => p.id === partage.id);
    return {
      ...e,
      partagesDossier:
        i >= 0
          ? e.partagesDossier.map((p, idx) => (idx === i ? partage : p))
          : [partage, ...e.partagesDossier],
    };
  });
  void pousserLigne("partagesDossier", partage).then((ok) => !ok && programmerReprise());
}

export function ajouterCandidature(candidature: CandidatureLocation) {
  appliquerLocal((e) => ({ ...e, candidatures: [candidature, ...e.candidatures] }));
  void pousserLigne("candidatures", candidature).then((ok) => !ok && programmerReprise());
}

export function modifierCandidature(id: string, patch: Partial<CandidatureLocation>) {
  appliquerLocal((e) => ({
    ...e,
    candidatures: e.candidatures.map((c) => (c.id === id ? { ...c, ...patch, id } : c)),
  }));
  void pousserPatch("candidatures", id, { ...patch } as Record<string, unknown>).then(
    (ok) => !ok && programmerReprise(),
  );
}

/** Accepte une candidature et pose la réservation sur les deux calendriers. */
export function validerCandidature(id: string) {
  const candidature = etat.candidatures.find((c) => c.id === id);
  if (!candidature) return false;
  modifierCandidature(id, { statut: "acceptee" });
  const doss = etat.dossiersLocation.find((d) => d.id === candidature.dossierId);
  if (!doss) return true;
  const reservaId = idNouveau("r");
  const initiales = doss.occupantNom
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  ajouterReservation({
    dossier: {
      id: reservaId,
      bienId: candidature.bienId,
      occupant: doss.occupantNom,
      initiales: initiales || "??",
      email: doss.email,
      telephone: "",
      arrivee: candidature.arrivee,
      depart: candidature.depart,
      heureArrivee: "16:00",
      heureDepart: "10:00",
      plateforme: "Direct",
      voyageurs: 1,
      adultes: 1,
      enfants: 0,
      montant: candidature.montant,
      paye: 0,
      statut: "Confirmé",
      couleur: "#e5e7eb",
      type: "Bail meublé",
    },
    calendrier: {
      id: `cal-${reservaId}`,
      bienId: candidature.bienId,
      voyageur: doss.occupantNom,
      arrivee: candidature.arrivee,
      depart: candidature.depart,
    },
  });
  return true;
}
