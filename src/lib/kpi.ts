import { AUJOURD_HUI_MO1 } from "@/data/planning-mo1";
import type { EtatSession } from "@/data/etat-session";
import type { PaiementAnalyse } from "@/data/analyse-mo1";
import { construireAnalyse, NUITS_MAX_COURTE_DUREE } from "@/lib/analyse-vue";
import type { CanalAnalyse } from "@/lib/analyse-finance";

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

function canalPaiement(canal: CanalAnalyse): PaiementAnalyse["canal"] {
  if (canal === "Airbnb" || canal === "Booking.com") return canal;
  return "Direct";
}

/**
 * Au-delà de ce seuil, un séjour relève du bail et non de la location courte
 * durée : 90 nuits est la limite de location d'un meublé de tourisme au même
 * client. Le revenu par nuit n'a de sens que sur la courte durée — mêler un
 * bail annuel à des séjours de trois nuits écrase la moyenne et produit un
 * chiffre que personne ne peut interpréter.
 */
export function analyserReservations(s: EtatSession, annee = 2026) {
  const vue = construireAnalyse(s, {
    debut: `${annee}-01-01`,
    fin: `${annee}-12-31`,
    aujourdhui: AUJOURD_HUI_MO1,
  });
  const euros = (centimes: number) => Math.round(centimes) / 100;
  const paiements: PaiementAnalyse[] = vue.historique
    .filter((h) => h.statutSejour !== "Annulé")
    .map((h) => ({
      id: h.id,
      nom: h.nom,
      initiales: h.initiales,
      logement: h.logement,
      localisation: h.localisation,
      reservation: h.reservationId,
      reservationId: h.reservationId,
      arrivee: isoFr(h.arrivee),
      depart: isoFr(h.depart),
      booking: h.reference,
      nuits: h.nuits,
      montant: euros(h.montant),
      commission: euros(h.commission),
      canal: canalPaiement(h.canal),
      statut: h.statutPaiement === "Validé" ? "Validé" : "En attente",
    }));

  const brut = paiements.reduce((n, p) => n + p.montant, 0);
  const commissionsOta = paiements.reduce((n, p) => n + p.commission, 0);
  const net = euros(vue.kpi.net);
  const nuits = paiements.reduce((n, p) => n + p.nuits, 0);
  const courtsSejours = paiements.filter((p) => p.nuits <= NUITS_MAX_COURTE_DUREE);
  const nuitsCourteDuree = courtsSejours.reduce((n, p) => n + p.nuits, 0);
  const brutCourteDuree = courtsSejours.reduce((n, p) => n + p.montant, 0);
  const longsSejours = paiements.length - courtsSejours.length;
  const revenusValides = euros(vue.kpi.revenusValides);
  const autres = euros(vue.kpi.upsells);
  const fraisPresta = euros(vue.kpi.fraisGestionHt);

  const occupation = vue.mois.map((m) => ({ mois: m.labelCourt, taux: m.taux }));
  const evolution = vue.mois
    .filter((m) => m.brut > 0)
    .map((m) => ({ mois: m.label.toUpperCase(), brut: euros(m.brut), net: euros(m.net) }));

  return {
    paiements,
    occupation,
    evolution: evolution.length ? evolution : [{ mois: `JAN ${annee}`, brut: 0, net: 0 }],
    kpi: {
      net,
      variationNet: vue.kpi.variationEncaisse ?? 0,
      deltaNet: 0,
      revenuNuit: nuitsCourteDuree ? Math.round(brutCourteDuree / nuitsCourteDuree) : 0,
      nuits,
      nuitsCourteDuree,
      longsSejours,
      variationNuit: 0,
      fraisPresta,
      nbPresta: vue.fraisGestion.reduce((n, f) => n + f.quantite, 0),
      partPresta: brut ? `${Math.round((fraisPresta / brut) * 100)} %` : "0 %",
      commissionsOta,
      partOta: brut ? `${((commissionsOta / brut) * 100).toFixed(1).replace(".", ",")} %` : "0 %",
      variationOta: 0,
      autres,
      partAutres: brut ? `${((autres / brut) * 100).toFixed(1).replace(".", ",")} %` : "0 %",
      commissionGestionnaire: euros(vue.kpi.commissionAgenceTtc),
      revenusValides,
      partValides: net
        ? `${((revenusValides / Math.max(net, 1)) * 100).toFixed(1).replace(".", ",")} %`
        : "0 %",
    },
  };
}
