import { AUJOURD_HUI_MO1 } from "@/data/planning-mo1";
import type { EtatSession } from "@/data/etat-session";

export function calculerKpi(s: EtatSession, aujourdhui = AUJOURD_HUI_MO1) {
  const loyersRetard = s.loyers.filter((l) => !l.valide);
  const impaye = loyersRetard.reduce((n, l) => n + l.montant, 0);
  const checkIn = s.reservationsDossier.filter(
    (r) => r.arrivee === aujourdhui && r.statut !== "Annulé",
  ).length;
  const checkOut = s.reservationsDossier.filter(
    (r) => r.depart === aujourdhui && r.statut !== "Annulé",
  ).length;
  const missionsJour = s.missions.filter(
    (m) => m.date === aujourdhui && m.statut !== "terminee",
  );
  const menage = missionsJour.filter((m) => m.type === "Menage").length;
  const enCours = s.missions.filter((m) => m.statut === "en_cours").length;
  const reservationsActives = s.reservationsDossier.filter(
    (r) => r.statut !== "Annulé",
  ).length;
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
