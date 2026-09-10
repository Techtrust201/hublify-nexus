import { AUJOURD_HUI_MO1 } from "@/data/planning-mo1";
import type { EtatSession } from "@/data/etat-session";
import type { PaiementAnalyse } from "@/data/analyse-mo1";
import { nuitsEntre } from "@/data/reservations-mo1";

export function calculerKpi(s: EtatSession, aujourdhui = AUJOURD_HUI_MO1) {
  const loyersRetard = s.loyers.filter((l) => !l.valide);
  const impaye = loyersRetard.reduce((n, l) => n + l.montant, 0);
  const checkIn = s.reservationsDossier.filter(
    (r) => r.arrivee === aujourdhui && r.statut !== "Annulé",
  ).length;
  const checkOut = s.reservationsDossier.filter(
    (r) => r.depart === aujourdhui && r.statut !== "Annulé",
  ).length;
  const missionsJour = s.missions.filter((m) => m.date === aujourdhui && m.statut !== "terminee");
  const menage = missionsJour.filter((m) => m.type === "Menage").length;
  const plomberie = missionsJour.filter(
    (m) => m.titre.toLowerCase().includes("plomb") || m.assigne.toLowerCase().includes("plomb"),
  ).length;
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
    plomberie,
    reservationsActives,
  };
}

function isoFr(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function canalAnalyse(plateforme: string): PaiementAnalyse["canal"] {
  if (plateforme === "Airbnb" || plateforme === "Booking.com") return plateforme;
  return "Direct";
}

const MOIS_COURTS = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

/**
 * Au-delà de ce seuil, un séjour relève du bail et non de la location courte
 * durée : 90 nuits est la limite de location d'un meublé de tourisme au même
 * client. Le revenu par nuit n'a de sens que sur la courte durée — mêler un
 * bail annuel à des séjours de trois nuits écrase la moyenne et produit un
 * chiffre que personne ne peut interpréter.
 */
const NUITS_MAX_COURTE_DUREE = 90;

export function analyserReservations(s: EtatSession, annee = 2026) {
  const actives = s.reservationsDossier.filter((r) => r.statut !== "Annulé");
  const paiements: PaiementAnalyse[] = actives.map((r) => {
    const bien = s.biens.find((b) => b.id === r.bienId);
    const nuits = Math.max(1, nuitsEntre(r.arrivee, r.depart));
    const canal = canalAnalyse(r.plateforme);
    const commission = canal === "Direct" ? 0 : Math.round(r.montant * 0.12);
    const ville = bien?.adresse?.split(",").pop()?.trim() ?? "—";
    return {
      id: r.id,
      nom: r.occupant,
      initiales: r.initiales,
      logement: bien?.nom ?? r.bienId,
      localisation: ville,
      reservation: r.id,
      reservationId: r.id,
      arrivee: isoFr(r.arrivee),
      depart: isoFr(r.depart),
      booking: r.id.replace(/^r-/, "BK").toUpperCase(),
      nuits,
      montant: r.montant,
      commission,
      canal,
      statut: r.montant > 0 && r.paye >= r.montant ? "Validé" : "En attente",
    };
  });

  const brut = paiements.reduce((n, p) => n + p.montant, 0);
  const commissionsOta = paiements.reduce((n, p) => n + p.commission, 0);
  const net = brut - commissionsOta;
  const nuits = paiements.reduce((n, p) => n + p.nuits, 0);
  const courtsSejours = paiements.filter((p) => p.nuits <= NUITS_MAX_COURTE_DUREE);
  const nuitsCourteDuree = courtsSejours.reduce((n, p) => n + p.nuits, 0);
  const brutCourteDuree = courtsSejours.reduce((n, p) => n + p.montant, 0);
  const longsSejours = paiements.length - courtsSejours.length;
  const revenusValides = paiements
    .filter((p) => p.statut === "Validé")
    .reduce((n, p) => n + p.montant - p.commission, 0);
  const autres = actives.reduce((n, r) => {
    const ids = r.upsellIds ?? [];
    return (
      n + s.parametrage.upsells.filter((u) => ids.includes(u.id)).reduce((m, u) => m + u.prix, 0)
    );
  }, 0);
  const missionsPayantes = s.missions.filter((m) => m.statut === "terminee").length;
  const fraisPresta = missionsPayantes * 30;

  const occupation = MOIS_COURTS.map((mois, i) => {
    const debut = new Date(annee, i, 1);
    const fin = new Date(annee, i + 1, 0);
    const jours = fin.getDate();
    const capacite = Math.max(1, s.biens.length) * jours;
    let occ = 0;
    for (const r of actives) {
      const a = new Date(`${r.arrivee}T12:00:00`);
      const d = new Date(`${r.depart}T12:00:00`);
      const start = Math.max(a.getTime(), debut.getTime());
      const end = Math.min(d.getTime(), fin.getTime());
      if (end > start) occ += Math.round((end - start) / 86_400_000);
    }
    return { mois, taux: Math.min(100, Math.round((occ / capacite) * 100)) };
  });

  const evolution = MOIS_COURTS.map((mois, i) => {
    const mm = String(i + 1).padStart(2, "0");
    const duMois = actives.filter((r) => r.arrivee.startsWith(`${annee}-${mm}`));
    const b = duMois.reduce((n, r) => n + r.montant, 0);
    const c = duMois.reduce((n, r) => {
      const canal = canalAnalyse(r.plateforme);
      return n + (canal === "Direct" ? 0 : Math.round(r.montant * 0.12));
    }, 0);
    return { mois: `${mois.toUpperCase()} ${annee}`, brut: b, net: b - c };
  }).filter((l) => l.brut > 0);

  return {
    paiements,
    occupation,
    evolution: evolution.length ? evolution : [{ mois: `JAN ${annee}`, brut: 0, net: 0 }],
    kpi: {
      net,
      variationNet: 0,
      deltaNet: 0,
      revenuNuit: nuitsCourteDuree ? Math.round(brutCourteDuree / nuitsCourteDuree) : 0,
      nuits,
      nuitsCourteDuree,
      longsSejours,
      variationNuit: 0,
      fraisPresta,
      nbPresta: missionsPayantes,
      partPresta: brut ? `${Math.round((fraisPresta / brut) * 100)} %` : "0 %",
      commissionsOta,
      partOta: brut ? `${((commissionsOta / brut) * 100).toFixed(1).replace(".", ",")} %` : "0 %",
      variationOta: 0,
      autres,
      partAutres: brut ? `${((autres / brut) * 100).toFixed(1).replace(".", ",")} %` : "0 %",
      commissionGestionnaire: Math.round(net * 0.05),
      revenusValides,
      partValides: net
        ? `${((revenusValides / Math.max(net, 1)) * 100).toFixed(1).replace(".", ",")} %`
        : "0 %",
    },
  };
}
