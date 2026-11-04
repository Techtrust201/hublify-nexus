import type { EtatSession } from "@/data/etat-session";
import type { MissionMo1 } from "@/data/planning-mo1";
import type { ReservationMo1 } from "@/data/reservations-mo1";
import { nuitsEntre } from "@/data/reservations-mo1";
import {
  BAREME_FRAIS_GESTION_CENTIMES,
  TAUX_TVA_HONORAIRES,
  canalDe,
  centimes,
  estBail,
  formatTaux,
  mandatairePercçoit,
  montantDu,
  montantReverse,
  netProprietaire,
  partsPourcent,
  solderCaution,
  totauxFacture,
  ventilationSejour,
  type CanalAnalyse,
  type LignePrestation,
  type VentilationCentimes,
} from "@/lib/analyse-finance";

export const NUITS_MAX_COURTE_DUREE = 90;

const MOIS = [
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

export type FiltreAnalyse = {
  debut: string;
  fin: string;
  bienId?: string;
  aujourdhui?: string;
};

export type LigneEncaissementAnalyse = {
  id: string;
  logement: string;
  bienId: string;
  reference: string;
  occupant: string;
  canal: CanalAnalyse;
  checkIn: string;
  checkOut: string;
  nuits: number;
  percoit: boolean;
  taxeGereeParPlateforme: boolean;
  ventilation: VentilationCentimes;
  net: number;
  honorairesHt: number;
  honorairesTva: number;
  tauxHonoraires: string;
  paye: number;
  encaisse: number;
  restant: number;
  statut: ReservationMo1["statut"];
};

export type LigneCautionAnalyse = {
  id: string;
  logement: string;
  reference: string;
  occupant: string;
  checkIn: string;
  checkOut: string;
  du: number;
  encaisse: number;
  dateEncaissement: string | null;
  rembourse: number;
  dateRemboursement: string | null;
  retenu: number;
  solde: number;
};

export type PartCanal = {
  canal: CanalAnalyse;
  nuits: number;
  prix: number;
  commissionOta: number;
  partNuits: number;
  tauxEffectif: number;
};

export type MoisAnalyse = {
  cle: string;
  label: string;
  labelCourt: string;
  encaise: number;
  restant: number;
  brut: number;
  net: number;
  taux: number;
  tauxPrecedent: number;
};

export type LigneGestionnaire = {
  id: string;
  nom: string;
  initiales: string;
  logements: number;
  nuitsReservees: number;
  nuitsDisponibles: number;
  taux: number;
  encaisse: number;
  attendu: number;
  net: number;
  commissionOta: number;
  commissionAgence: number;
};

export type LigneFraisGestion = {
  nature: string;
  quantite: number;
  prixUnitaireHt: number;
  totalHt: number;
};

export type LigneHistorique = {
  id: string;
  nom: string;
  initiales: string;
  logement: string;
  localisation: string;
  reservationId: string;
  reference: string;
  arrivee: string;
  depart: string;
  nuits: number;
  canal: CanalAnalyse;
  montant: number;
  commission: number;
  net: number;
  statutPaiement: "Validé" | "En attente" | "Non validé" | "Annulé";
  statutSejour: ReservationMo1["statut"];
  note: number | null;
};

export type AnalyseVue = {
  filtre: Required<Pick<FiltreAnalyse, "debut" | "fin">> & { bienId: string; aujourdhui: string };
  logements: Array<{ id: string; nom: string }>;
  lignes: LigneEncaissementAnalyse[];
  cautions: LigneCautionAnalyse[];
  canaux: PartCanal[];
  mois: MoisAnalyse[];
  proprietaires: LigneGestionnaire[];
  fraisGestion: LigneFraisGestion[];
  historique: LigneHistorique[];
  factureProprietaire: LignePrestation[];
  facturesVoyageurs: Array<{
    id: string;
    occupant: string;
    logement: string;
    reference: string;
    periode: string;
    lignes: LignePrestation[];
    totalTtc: number;
  }>;
  kpi: {
    logements: number;
    logementsOccupes: number;
    tauxOccupation: number;
    nuitsDisponibles: number;
    nuitsReservees: number;
    nuitsBloquees: number;
    voyageurs: number;
    sejours: number;
    dureeMoyenne: number;
    loyerAttendu: number;
    loyerEncaisse: number;
    loyerRestant: number;
    variationEncaisse: number | null;
    cautionEncaissee: number;
    cautionRendue: number;
    cautionRetenue: number;
    upsells: number;
    fraisGestionHt: number;
    commissionsOta: number;
    taxes: number;
    commissionAgenceTtc: number;
    commissionAgenceHt: number;
    net: number;
    revenusValides: number;
    noteMoyenne: number | null;
    nbNotes: number;
  };
};

function isoAdd(iso: string, jours: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + jours);
  return d.toISOString().slice(0, 10);
}

function joursInclus(debut: string, fin: string) {
  if (fin < debut) return 0;
  const a = Date.parse(`${debut}T12:00:00Z`);
  const b = Date.parse(`${fin}T12:00:00Z`);
  return Math.round((b - a) / 86_400_000) + 1;
}

export function nuitsChevauchement(arrivee: string, depart: string, debut: string, fin: string) {
  const finExclue = isoAdd(fin, 1);
  const start = arrivee > debut ? arrivee : debut;
  const end = depart < finExclue ? depart : finExclue;
  if (end <= start) return 0;
  const a = Date.parse(`${start}T12:00:00Z`);
  const b = Date.parse(`${end}T12:00:00Z`);
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

export function moisEntre(debut: string, fin: string) {
  const out: Array<{ cle: string; label: string; labelCourt: string }> = [];
  let y = Number(debut.slice(0, 4));
  let m = Number(debut.slice(5, 7));
  const y2 = Number(fin.slice(0, 4));
  const m2 = Number(fin.slice(5, 7));
  if (!y || !m || !y2 || !m2) return out;
  while (y < y2 || (y === y2 && m <= m2)) {
    const cle = `${y}-${String(m).padStart(2, "0")}`;
    const court = MOIS[m - 1] ?? "";
    out.push({ cle, label: `${court} ${y}`, labelCourt: court });
    m += 1;
    if (m === 13) {
      m = 1;
      y += 1;
    }
    if (out.length > 36) break;
  }
  return out;
}

function referenceDe(id: string) {
  return id.replace(/^r-/, "").toUpperCase();
}

function villeDe(adresse?: string) {
  const morceau = adresse?.split(",").pop()?.trim();
  return morceau || "—";
}

function autresServices(s: EtatSession, r: ReservationMo1) {
  const ids = r.upsellIds ?? [];
  return s.parametrage.upsells.filter((u) => ids.includes(u.id)).reduce((n, u) => n + u.prix, 0);
}

function reductionEuros(r: ReservationMo1) {
  if (r.reductionMontant !== undefined) return Math.max(0, r.reductionMontant);
  if (r.reductionPourcent) return (Math.max(0, r.montant) * r.reductionPourcent) / 100;
  return 0;
}

function statutPaiement(r: ReservationMo1): LigneHistorique["statutPaiement"] {
  if (r.statut === "Annulé") return "Annulé";
  if (r.montant <= 0) return "Validé";
  if (r.paye >= r.montant) return "Validé";
  if (r.paye > 0) return "En attente";
  return "Non validé";
}

function retenuCaution(r: ReservationMo1) {
  return (r.remboursements ?? [])
    .filter((x) => /caution|dégât|degat|retenue/i.test(`${x.motif} ${x.note}`))
    .reduce((n, x) => n + x.montant, 0);
}

export function construireAnalyse(session: EtatSession, filtre: FiltreAnalyse): AnalyseVue {
  const debut = filtre.debut;
  const fin = filtre.fin;
  const bienId = filtre.bienId && filtre.bienId !== "tous" ? filtre.bienId : "";
  const aujourdhui = filtre.aujourdhui ?? debut;
  const biens = bienId ? session.biens.filter((b) => b.id === bienId) : session.biens;
  const idsBiens = new Set(biens.map((b) => b.id));
  const bienParId = new Map(session.biens.map((b) => [b.id, b]));

  const sejours = session.reservationsDossier.filter((r) => {
    if (bienId && r.bienId !== bienId) return false;
    return r.arrivee <= fin && r.depart > debut;
  });

  const lignes: LigneEncaissementAnalyse[] = [];
  for (const r of sejours) {
    if (r.statut === "Annulé") continue;
    const bien = bienParId.get(r.bienId);
    const vent = ventilationSejour({
      montantEuros: r.montant,
      reductionEuros: reductionEuros(r),
      fraisMenageEuros: r.fraisMenage,
      taxeSejourEuros: r.taxeSejour,
      autresServicesEuros: autresServices(session, r),
      plateforme: r.plateforme,
      type: r.type,
      // La colonne SQL est NOT NULL DEFAULT 0 : un zéro veut dire « non saisi »,
      // pas une exonération négociée. Le taux du canal s'applique alors.
      fraisPlateformeEuros:
        r.fraisPlateforme && r.fraisPlateforme > 0 ? r.fraisPlateforme : undefined,
      commissionMontantEuros:
        r.commissionMontant && r.commissionMontant > 0 ? r.commissionMontant : undefined,
      commissionPourcent:
        r.commissionPourcent && r.commissionPourcent > 0 ? r.commissionPourcent : undefined,
    });
    const { honorairesHt, honorairesTva, tauxHonorairesTtc, ...ventilation } = vent;
    const payeCentimes = centimes(r.paye);
    const net = netProprietaire({
      payeCentimes: payeCentimes > 0 ? payeCentimes : undefined,
      montantCentimes: ventilation.prixReference,
      fraisPlateformeCentimes: ventilation.commissionOta,
    });
    const loyerNet = Math.max(0, ventilation.prixReference - ventilation.ajustements);
    const encaisse = Math.min(Math.max(0, payeCentimes), loyerNet);
    lignes.push({
      id: r.id,
      logement: bien?.nom ?? r.bienId,
      bienId: r.bienId,
      reference: referenceDe(r.id),
      occupant: r.occupant,
      canal: canalDe(r.plateforme, r.type),
      checkIn: r.arrivee,
      checkOut: r.depart,
      nuits: Math.max(1, nuitsEntre(r.arrivee, r.depart)),
      percoit: mandatairePercçoit(r.plateforme, r.type),
      taxeGereeParPlateforme:
        (r.taxeSejour ?? 0) <= 0 && (r.plateforme === "Airbnb" || r.plateforme === "Booking.com"),
      ventilation,
      net,
      honorairesHt,
      honorairesTva,
      tauxHonoraires: formatTaux(tauxHonorairesTtc),
      paye: centimes(r.paye),
      encaisse,
      restant: loyerNet - encaisse,
      statut: r.statut,
    });
  }
  lignes.sort((a, b) => a.checkIn.localeCompare(b.checkIn) || a.logement.localeCompare(b.logement));

  const cautions: LigneCautionAnalyse[] = sejours
    .filter((r) => (r.caution ?? 0) > 0)
    .map((r) => {
      const solde = solderCaution({
        cautionEuros: r.caution ?? 0,
        statut: r.statut,
        arrivee: r.arrivee,
        depart: r.depart,
        aujourdhui,
        retenuEuros: retenuCaution(r),
      });
      return {
        id: r.id,
        logement: bienParId.get(r.bienId)?.nom ?? r.bienId,
        reference: referenceDe(r.id),
        occupant: r.occupant,
        checkIn: r.arrivee,
        checkOut: r.depart,
        ...solde,
      };
    })
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));

  const canauxOrdre: CanalAnalyse[] = [
    "Airbnb",
    "Booking.com",
    "Direct",
    "VRBO",
    "Expedia",
    "Autre",
    "Bail",
  ];
  const canauxBruts = canauxOrdre.map((canal) => {
    const duCanal = lignes.filter((l) => l.canal === canal);
    const nuits = duCanal.reduce(
      (n, l) => n + nuitsChevauchement(l.checkIn, l.checkOut, debut, fin),
      0,
    );
    const prix = duCanal.reduce((n, l) => n + l.ventilation.prixReference, 0);
    const commissionOta = duCanal.reduce((n, l) => n + l.ventilation.commissionOta, 0);
    return {
      canal,
      nuits,
      prix,
      commissionOta,
      partNuits: 0,
      tauxEffectif: prix > 0 ? commissionOta / prix : 0,
    };
  });
  const parts = partsPourcent(canauxBruts.map((c) => c.nuits));
  const canaux = canauxBruts
    .map((c, i) => ({ ...c, partNuits: parts[i] ?? 0 }))
    .filter((c) => c.nuits > 0 || c.prix > 0);

  const mois = moisEntre(debut, fin).map((m) => {
    const debutMois = `${m.cle}-01`;
    const finMois = isoAdd(isoAdd(debutMois, 32).slice(0, 7) + "-01", -1);
    const borneDebut = debutMois < debut ? debut : debutMois;
    const borneFin = finMois > fin ? fin : finMois;
    const duMois = lignes.filter((l) => l.checkIn.startsWith(m.cle));
    const brut = duMois.reduce((n, l) => n + l.ventilation.prixReference, 0);
    const net = duMois.reduce((n, l) => n + l.net, 0);
    const encaise = duMois.reduce((n, l) => n + l.encaisse, 0);
    const restant = duMois.reduce((n, l) => n + l.restant, 0);
    const capacite = Math.max(1, biens.length) * Math.max(1, joursInclus(borneDebut, borneFin));
    let occ = 0;
    for (const l of lignes) occ += nuitsChevauchement(l.checkIn, l.checkOut, borneDebut, borneFin);
    const debutPrec = isoAdd(borneDebut, -365);
    const finPrec = isoAdd(borneFin, -365);
    const sejoursPrec = session.reservationsDossier.filter(
      (r) =>
        r.statut !== "Annulé" &&
        (!bienId || r.bienId === bienId) &&
        nuitsChevauchement(r.arrivee, r.depart, debutPrec, finPrec) > 0,
    );
    let occPrec = 0;
    for (const r of sejoursPrec)
      occPrec += nuitsChevauchement(r.arrivee, r.depart, debutPrec, finPrec);
    return {
      ...m,
      encaise,
      restant,
      brut,
      net,
      taux: Math.min(100, Math.round((occ / capacite) * 100)),
      tauxPrecedent: Math.min(100, Math.round((occPrec / capacite) * 100)),
    };
  });

  const jours = joursInclus(debut, fin);
  const nuitsDisponiblesBrutes = biens.length * jours;
  const bloqueesPonctuelles = session.datesBloquees.filter(
    (d) => idsBiens.has(d.bienId) && d.date >= debut && d.date <= fin,
  ).length;
  const bloqueesAnnuelles = session.datesBloqueesAnnuelles.filter(
    (d) => d >= debut && d <= fin,
  ).length;
  const nuitsBloquees = Math.min(
    nuitsDisponiblesBrutes,
    bloqueesPonctuelles + bloqueesAnnuelles * Math.max(1, biens.length),
  );
  const nuitsDisponibles = Math.max(0, nuitsDisponiblesBrutes - nuitsBloquees);
  const nuitsReservees = lignes.reduce(
    (n, l) => n + nuitsChevauchement(l.checkIn, l.checkOut, debut, fin),
    0,
  );
  const logementsOccupes = new Set(
    lignes
      .filter((l) => nuitsChevauchement(l.checkIn, l.checkOut, debut, fin) > 0)
      .map((l) => l.bienId),
  ).size;

  const groupes = new Map<string, LigneEncaissementAnalyse[]>();
  for (const l of lignes) {
    const proprio = bienParId.get(l.bienId)?.proprietaire?.trim() || "Propriétaire non renseigné";
    const liste = groupes.get(proprio) ?? [];
    liste.push(l);
    groupes.set(proprio, liste);
  }
  const proprietaires: LigneGestionnaire[] = [...groupes.entries()]
    .map(([nom, ls]) => {
      const biensIds = new Set(ls.map((l) => l.bienId));
      const reservees = ls.reduce(
        (n, l) => n + nuitsChevauchement(l.checkIn, l.checkOut, debut, fin),
        0,
      );
      const dispo = biensIds.size * jours;
      return {
        id: nom,
        nom,
        initiales:
          nom
            .split(/\s+/)
            .slice(0, 2)
            .map((p) => p[0] ?? "")
            .join("")
            .toUpperCase() || "—",
        logements: biensIds.size,
        nuitsReservees: reservees,
        nuitsDisponibles: dispo,
        taux: dispo > 0 ? Math.min(100, Math.round((reservees / dispo) * 100)) : 0,
        encaisse: ls.reduce((n, l) => n + l.encaisse, 0),
        attendu: ls.reduce(
          (n, l) => n + l.ventilation.prixReference - l.ventilation.ajustements,
          0,
        ),
        net: ls.reduce((n, l) => n + l.net, 0),
        commissionOta: ls.reduce((n, l) => n + l.ventilation.commissionOta, 0),
        commissionAgence: ls.reduce((n, l) => n + l.ventilation.commissionAgenceTtc, 0),
      };
    })
    .sort((a, b) => b.net - a.net);

  const fraisGestion = fraisDepuisMissions(
    session.missions.filter((m) => idsBiens.has(m.bienId) && m.date >= debut && m.date <= fin),
  );
  const edlDansPeriode = session.edl.filter((d) => d.date >= debut && d.date <= fin).length;
  if (edlDansPeriode > 0) {
    fraisGestion.push({
      nature: "État des lieux",
      quantite: edlDansPeriode,
      prixUnitaireHt: BAREME_FRAIS_GESTION_CENTIMES["Etat des lieux"],
      totalHt: edlDansPeriode * BAREME_FRAIS_GESTION_CENTIMES["Etat des lieux"],
    });
  }

  const factureProprietaire: LignePrestation[] = [];
  for (const l of lignes) {
    if (l.honorairesHt <= 0) continue;
    const bail = estBail(typeDe(session, l.id));
    factureProprietaire.push({
      id: `hon-${l.id}`,
      nature: bail
        ? `Honoraires de gestion locative — ${l.logement} (${l.tauxHonoraires} TTC du loyer, mise en location et état des lieux inclus s'ils sont au mandat)`
        : `Honoraires de gestion des séjours — ${l.logement} (${l.tauxHonoraires} TTC du loyer)`,
      periode: `${l.checkIn} → ${l.checkOut}`,
      quantite: 1,
      prixUnitaireHt: l.honorairesHt,
      tauxTva: TAUX_TVA_HONORAIRES,
      tvaForcee: l.honorairesTva,
    });
  }
  for (const frais of fraisGestion) {
    factureProprietaire.push({
      id: `frais-${frais.nature}`,
      nature: frais.nature,
      periode: `${debut} → ${fin}`,
      quantite: frais.quantite,
      prixUnitaireHt: frais.prixUnitaireHt,
      tauxTva: TAUX_TVA_HONORAIRES,
    });
  }

  const facturesVoyageurs = lignes.map((l) => {
    const prestations: LignePrestation[] = [
      {
        id: `${l.id}-loyer`,
        nature: `Location ${l.logement}`,
        periode: `${l.checkIn} → ${l.checkOut}`,
        quantite: 1,
        prixUnitaireHt: Math.max(0, l.ventilation.prixReference - l.ventilation.ajustements),
        tauxTva: 0,
      },
    ];
    if (l.ventilation.menageLocataire > 0) {
      prestations.push({
        id: `${l.id}-menage`,
        nature: "Ménage locataire",
        periode: l.checkOut,
        quantite: 1,
        prixUnitaireHt: l.ventilation.menageLocataire,
        tauxTva: TAUX_TVA_HONORAIRES,
      });
    }
    if (l.ventilation.autresServices > 0) {
      prestations.push({
        id: `${l.id}-services`,
        nature: "Autres services",
        periode: `${l.checkIn} → ${l.checkOut}`,
        quantite: 1,
        prixUnitaireHt: l.ventilation.autresServices,
        tauxTva: TAUX_TVA_HONORAIRES,
      });
    }
    if (l.ventilation.taxeSejour > 0) {
      prestations.push({
        id: `${l.id}-taxe`,
        nature: "Taxe de séjour (non soumise à TVA)",
        periode: `${l.checkIn} → ${l.checkOut}`,
        quantite: 1,
        prixUnitaireHt: l.ventilation.taxeSejour,
        tauxTva: 0,
      });
    }
    return {
      id: l.id,
      occupant: l.occupant,
      logement: l.logement,
      reference: l.reference,
      periode: `${l.checkIn} → ${l.checkOut}`,
      lignes: prestations,
      totalTtc: totauxFacture(prestations).totalTtc,
    };
  });

  const historique: LigneHistorique[] = sejours
    .map((r) => {
      const bien = bienParId.get(r.bienId);
      const ligne = lignes.find((l) => l.id === r.id);
      const nuits = Math.max(0, nuitsEntre(r.arrivee, r.depart));
      return {
        id: r.id,
        nom: r.occupant,
        initiales: r.initiales,
        logement: bien?.nom ?? r.bienId,
        localisation: villeDe(bien?.adresse),
        reservationId: r.id,
        reference: referenceDe(r.id),
        arrivee: r.arrivee,
        depart: r.depart,
        nuits,
        canal: canalDe(r.plateforme, r.type),
        montant: ligne ? ligne.ventilation.prixReference : centimes(r.montant),
        commission: r.statut === "Annulé" ? 0 : (ligne?.ventilation.commissionOta ?? 0),
        net: ligne?.net ?? 0,
        statutPaiement: statutPaiement(r),
        statutSejour: r.statut,
        note: typeof bien?.note === "number" ? bien.note : null,
      };
    })
    .sort((a, b) => a.arrivee.localeCompare(b.arrivee));

  const notes = biens.map((b) => b.note).filter((n): n is number => typeof n === "number");
  const courts = lignes.filter((l) => l.nuits <= NUITS_MAX_COURTE_DUREE && l.canal !== "Bail");
  const nuitsCourtes = courts.reduce((n, l) => n + l.nuits, 0);

  const anneePrecDebut = isoAdd(debut, -365);
  const anneePrecFin = isoAdd(fin, -365);
  const encaissePrec = session.reservationsDossier
    .filter(
      (r) =>
        r.statut !== "Annulé" &&
        (!bienId || r.bienId === bienId) &&
        r.arrivee >= anneePrecDebut &&
        r.arrivee <= anneePrecFin,
    )
    .reduce(
      (n, r) => n + Math.min(Math.max(0, centimes(r.paye)), Math.max(0, centimes(r.montant))),
      0,
    );
  const encaisseActuel = lignes.reduce((n, l) => n + l.encaisse, 0);

  return {
    filtre: { debut, fin, bienId: bienId || "tous", aujourdhui },
    logements: session.biens.map((b) => ({ id: b.id, nom: b.nom })),
    lignes,
    cautions,
    canaux,
    mois,
    proprietaires,
    fraisGestion,
    historique,
    factureProprietaire,
    facturesVoyageurs,
    kpi: {
      logements: biens.length,
      logementsOccupes,
      tauxOccupation:
        nuitsDisponibles > 0
          ? Math.min(100, Math.round((nuitsReservees / nuitsDisponibles) * 100))
          : 0,
      nuitsDisponibles,
      nuitsReservees,
      nuitsBloquees,
      voyageurs: lignes.reduce((n, l) => {
        const r = sejours.find((s) => s.id === l.id);
        return n + (r?.voyageurs ?? 0);
      }, 0),
      sejours: lignes.length,
      dureeMoyenne:
        nuitsCourtes && courts.length ? Math.round((nuitsCourtes / courts.length) * 10) / 10 : 0,
      loyerAttendu: lignes.reduce(
        (n, l) => n + l.ventilation.prixReference - l.ventilation.ajustements,
        0,
      ),
      loyerEncaisse: encaisseActuel,
      loyerRestant: lignes.reduce((n, l) => n + l.restant, 0),
      variationEncaisse:
        encaissePrec > 0
          ? Math.round(((encaisseActuel - encaissePrec) / encaissePrec) * 100)
          : null,
      cautionEncaissee: cautions.reduce((n, c) => n + c.encaisse, 0),
      cautionRendue: cautions.reduce((n, c) => n + c.rembourse, 0),
      cautionRetenue: cautions.reduce((n, c) => n + c.retenu, 0),
      upsells: lignes.reduce((n, l) => n + l.ventilation.autresServices, 0),
      fraisGestionHt: fraisGestion.reduce((n, f) => n + f.totalHt, 0),
      commissionsOta: lignes.reduce((n, l) => n + l.ventilation.commissionOta, 0),
      taxes: lignes.reduce((n, l) => n + l.ventilation.taxeSejour, 0),
      commissionAgenceTtc: lignes.reduce((n, l) => n + l.ventilation.commissionAgenceTtc, 0),
      commissionAgenceHt: lignes.reduce((n, l) => n + l.honorairesHt, 0),
      net: lignes.reduce((n, l) => n + l.net, 0),
      revenusValides: lignes
        .filter(
          (l) =>
            l.encaisse >= l.ventilation.prixReference - l.ventilation.ajustements &&
            l.restant === 0,
        )
        .reduce((n, l) => n + l.net, 0),
      noteMoyenne: notes.length
        ? Math.round((notes.reduce((s, n) => s + n, 0) / notes.length) * 10) / 10
        : null,
      nbNotes: notes.length,
    },
  };
}

function typeDe(session: EtatSession, id: string) {
  return session.reservationsDossier.find((r) => r.id === id)?.type;
}

function fraisDepuisMissions(missions: MissionMo1[]): LigneFraisGestion[] {
  const compte = { Menage: 0, "Check-in": 0, "Check-out": 0, Maintenance: 0 };
  for (const m of missions) {
    if (
      m.type === "Menage" ||
      m.type === "Check-in" ||
      m.type === "Check-out" ||
      m.type === "Maintenance"
    ) {
      compte[m.type] += 1;
    }
  }
  const lignes: LigneFraisGestion[] = [];
  const ajouter = (nature: string, quantite: number, prix: number) => {
    if (quantite <= 0) return;
    lignes.push({ nature, quantite, prixUnitaireHt: prix, totalHt: quantite * prix });
  };
  ajouter("Ménage", compte.Menage, BAREME_FRAIS_GESTION_CENTIMES.Menage);
  ajouter("Linge et consommables", compte.Menage, BAREME_FRAIS_GESTION_CENTIMES.Linge);
  ajouter("Check-in", compte["Check-in"], BAREME_FRAIS_GESTION_CENTIMES["Check-in"]);
  ajouter("Check-out", compte["Check-out"], BAREME_FRAIS_GESTION_CENTIMES["Check-out"]);
  ajouter(
    "Commission exceptionnelle (travaux)",
    compte.Maintenance,
    BAREME_FRAIS_GESTION_CENTIMES.Maintenance,
  );
  return lignes;
}

export function piedsFacture(vue: AnalyseVue) {
  const percus = vue.lignes.filter((l) => l.percoit);
  const nonPercus = vue.lignes.filter((l) => !l.percoit);
  const fraisTtc = vue.fraisGestion.reduce(
    (n, f) => n + f.totalHt + Math.round(f.totalHt * TAUX_TVA_HONORAIRES),
    0,
  );
  const honorairesNonPercus = nonPercus.reduce((n, l) => n + l.ventilation.commissionAgenceTtc, 0);
  const honorairesPercus = percus.reduce((n, l) => n + l.ventilation.commissionAgenceTtc, 0);
  return {
    reverse: montantReverse(percus.map((l) => l.net)),
    du: montantDu(honorairesNonPercus, fraisTtc),
    honorairesPercus,
    honorairesNonPercus,
    fraisTtc,
    nets: vue.lignes.reduce((n, l) => n + l.net, 0),
  };
}

export function sommaireEncaissements(vue: AnalyseVue) {
  const zero = {
    prix: 0,
    ajustements: 0,
    menage: 0,
    autres: 0,
    taxe: 0,
    ota: 0,
    agence: 0,
    net: 0,
  };
  return vue.lignes.reduce(
    (s, l) => ({
      prix: s.prix + l.ventilation.prixReference,
      ajustements: s.ajustements + l.ventilation.ajustements,
      menage: s.menage + l.ventilation.menageLocataire,
      autres: s.autres + l.ventilation.autresServices,
      taxe: s.taxe + l.ventilation.taxeSejour,
      ota: s.ota + l.ventilation.commissionOta,
      agence: s.agence + l.ventilation.commissionAgenceTtc,
      net: s.net + l.net,
    }),
    zero,
  );
}

export function exporterEncaissementsCsv(vue: AnalyseVue) {
  const s = sommaireEncaissements(vue);
  const entete = [
    "Logement",
    "Référence",
    "Check-in",
    "Check-out",
    "Prix de référence",
    "Ajustements",
    "Ménages locataire",
    "Autres services",
    "Taxe de séjour",
    "Commission OTA",
    "Commission agence TTC",
    "Net propriétaire",
    "Canal",
  ];
  const ligne = (vals: Array<string | number>) => vals.join(";");
  const euros = (c: number) => (c / 100).toFixed(2).replace(".", ",");
  const corps = vue.lignes.map((l) =>
    ligne([
      l.logement,
      l.reference,
      l.checkIn,
      l.checkOut,
      euros(l.ventilation.prixReference),
      euros(l.ventilation.ajustements),
      euros(l.ventilation.menageLocataire),
      euros(l.ventilation.autresServices),
      l.taxeGereeParPlateforme ? "Taxe gérée par la plateforme" : euros(l.ventilation.taxeSejour),
      euros(l.ventilation.commissionOta),
      euros(l.ventilation.commissionAgenceTtc),
      euros(l.net),
      l.canal,
    ]),
  );
  corps.push(
    ligne([
      "TOTAL",
      "",
      "",
      "",
      euros(s.prix),
      euros(s.ajustements),
      euros(s.menage),
      euros(s.autres),
      euros(s.taxe),
      euros(s.ota),
      euros(s.agence),
      euros(s.net),
      "",
    ]),
  );
  return [ligne(entete), ...corps].join("\n");
}

export function exerciceParDefaut(aujourdhui: string) {
  const annee = aujourdhui.slice(0, 4) || "2026";
  return { debut: `${annee}-01-01`, fin: `${annee}-12-31` };
}
