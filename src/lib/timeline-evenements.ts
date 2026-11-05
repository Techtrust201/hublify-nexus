/** Timeline des échanges : documents et réservations du portefeuille. */

import { projeterDateDemo } from "@/lib/periode-demo";

export type PeriodeTimeline = "tous" | "aujourdhui" | "hier" | "semaine";

export type GroupeTimeline = "aujourdhui" | "hier" | "semaine" | "ancien";

export type EvenementTimeline = {
  id: string;
  date: Date;
  titre: string;
  type: string;
  acteur: string;
  logement: string;
  annule: boolean;
};

export type DocumentTimeline = {
  id: string;
  titre: string;
  type: string;
  logement: string;
  date: string;
  modifiePar: string;
};

export type ReservationTimeline = {
  id: string;
  bienId: string;
  occupant: string;
  arrivee: string;
  depart: string;
  plateforme: string;
  statut: string;
};

const MOIS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

const LIBELLES: Record<GroupeTimeline, string> = {
  aujourdhui: "Aujourd'hui",
  hier: "Hier",
  semaine: "Cette semaine",
  ancien: "Plus ancien",
};

export function parserDateTimeline(valeur: string): Date | null {
  const texte = valeur.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(texte);
  if (iso) {
    const date = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const mot = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/.exec(texte);
  if (!mot) return null;
  const mois = MOIS[mot[2]!.toLowerCase()];
  if (mois == null) return null;
  const date = new Date(Number(mot[3]), mois, Number(mot[1]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function debutJour(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function groupeTimeline(date: Date, maintenant: Date): GroupeTimeline {
  const jour = debutJour(date);
  const aujourdhui = debutJour(maintenant);
  const ecart = Math.round((aujourdhui - jour) / 86_400_000);
  if (ecart === 0) return "aujourdhui";
  if (ecart === 1) return "hier";
  const ancre = new Date(aujourdhui);
  const jourSemaine = ancre.getDay();
  const decalageLundi = jourSemaine === 0 ? 6 : jourSemaine - 1;
  const lundi = new Date(ancre);
  lundi.setDate(ancre.getDate() - decalageLundi);
  const dimanche = new Date(lundi);
  dimanche.setDate(lundi.getDate() + 6);
  if (jour >= lundi.getTime() && jour <= dimanche.getTime()) return "semaine";
  return "ancien";
}

export function libelleGroupe(groupe: GroupeTimeline) {
  return LIBELLES[groupe];
}

export function construireTimeline(input: {
  documents: DocumentTimeline[];
  reservations: ReservationTimeline[];
  biens: ReadonlyArray<{ id: string; nom: string }>;
  /** Rapproche les dates semées (mars 2026) de la période courante, sans toucher au seed. */
  projeterDemo?: boolean;
  maintenant?: Date;
}): EvenementTimeline[] {
  const noms = new Map(input.biens.map((b) => [b.id, b.nom]));
  const maintenant = input.maintenant ?? new Date();
  const poser = (date: Date) => (input.projeterDemo ? projeterDateDemo(date, maintenant) : date);
  const evenements: EvenementTimeline[] = [];

  for (const doc of input.documents) {
    const date = parserDateTimeline(doc.date);
    if (!date) continue;
    evenements.push({
      id: `doc-${doc.id}`,
      date: poser(date),
      titre: `Document — ${doc.titre}`,
      type: doc.type || "Document",
      acteur: doc.modifiePar || "Gestionnaire",
      logement: doc.logement,
      annule: false,
    });
  }

  for (const resa of input.reservations) {
    const date = parserDateTimeline(resa.arrivee);
    if (!date) continue;
    const annule = resa.statut === "Annulé";
    const logement = noms.get(resa.bienId) ?? resa.bienId;
    evenements.push({
      id: `resa-${resa.id}`,
      date: poser(date),
      titre: `${annule ? "Réservation annulée" : "Nouvelle réservation"} — ${logement} — ${resa.occupant}`,
      type: annule ? "Réservation annulée" : resa.plateforme || "Réservation",
      acteur: "Gestionnaire",
      logement,
      annule,
    });
  }

  return evenements.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function filtrerTimeline(
  evenements: EvenementTimeline[],
  options: {
    recherche: string;
    type: string;
    periode: PeriodeTimeline;
    masquerAnnulees: boolean;
    maintenant: Date;
  },
) {
  const recherche = options.recherche.trim().toLowerCase();
  return evenements.filter((ev) => {
    if (options.masquerAnnulees && ev.annule) return false;
    if (options.type !== "tous" && ev.type !== options.type) return false;
    if (options.periode !== "tous") {
      const groupe = groupeTimeline(ev.date, options.maintenant);
      if (options.periode === "semaine") {
        if (groupe === "ancien") return false;
      } else if (groupe !== options.periode) return false;
    }
    if (!recherche) return true;
    const blob = `${ev.titre} ${ev.type} ${ev.acteur} ${ev.logement}`.toLowerCase();
    return blob.includes(recherche);
  });
}

export function grouperTimeline(evenements: EvenementTimeline[], maintenant: Date) {
  const ordre: GroupeTimeline[] = ["aujourdhui", "hier", "semaine", "ancien"];
  return ordre
    .map((id) => ({
      id,
      libelle: libelleGroupe(id),
      items: evenements.filter((ev) => groupeTimeline(ev.date, maintenant) === id),
    }))
    .filter((groupe) => groupe.items.length > 0);
}

export function formaterQuand(date: Date) {
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
