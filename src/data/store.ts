// Service simulé : source unique en mémoire pour toute l'application.
// Aucun backend, aucune persistance. Remplaçable par une API réelle plus tard.

import { useSyncExternalStore } from "react";
import { BIENS, MISSIONS, PRESTATAIRES, RESERVATIONS } from "./mock";
import type { Bien, Mission, Prestataire, Reservation } from "./types";
import type { StatutMission } from "./statuts";

type Etat = {
  biens: Bien[];
  prestataires: Prestataire[];
  reservations: Reservation[];
  missions: Mission[];
};

let etat: Etat = {
  biens: BIENS,
  prestataires: PRESTATAIRES,
  reservations: RESERVATIONS,
  missions: MISSIONS,
};

const abonnes = new Set<() => void>();

function notifier(prochain: Etat) {
  etat = prochain;
  abonnes.forEach((fn) => fn());
}

function souscrire(fn: () => void) {
  abonnes.add(fn);
  return () => abonnes.delete(fn);
}

export function useHublify(): Etat {
  return useSyncExternalStore(
    souscrire,
    () => etat,
    () => etat,
  );
}

export function changerStatutMission(missionId: string, statut: StatutMission) {
  notifier({
    ...etat,
    missions: etat.missions.map((m) => (m.id === missionId ? { ...m, statut } : m)),
  });
}

export function affecterPrestataire(missionId: string, prestataireId: string | null) {
  notifier({
    ...etat,
    missions: etat.missions.map((m) =>
      m.id === missionId
        ? {
            ...m,
            prestataireId,
            statut: prestataireId
              ? m.statut === "a_affecter"
                ? "planifiee"
                : m.statut
              : "a_affecter",
          }
        : m,
    ),
  });
}

export function ajouterPrestataire(prestataire: Omit<Prestataire, "id">) {
  const id = `p${etat.prestataires.length + 1}-${Date.now().toString(36)}`;
  notifier({ ...etat, prestataires: [...etat.prestataires, { ...prestataire, id }] });
  return id;
}

// Sélecteurs
export const bienDe = (biens: Bien[], id: string) => biens.find((b) => b.id === id);
export const prestataireDe = (list: Prestataire[], id: string | null) =>
  id ? list.find((p) => p.id === id) : undefined;
export const reservationDe = (list: Reservation[], id: string | null) =>
  id ? list.find((r) => r.id === id) : undefined;
