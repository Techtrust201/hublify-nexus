import { describe, expect, it } from "vitest";
import {
  comptesReservations,
  filtrerReservations,
  paginerReservations,
  sejourAvecCle,
  trierReservations,
  type ReservationTableau,
} from "./tableau-vue";

const AUJ = "2026-03-06";

function resa(
  partiel: Partial<ReservationTableau> & Pick<ReservationTableau, "id">,
): ReservationTableau {
  return {
    bienId: "b1",
    occupant: "Sophie Martin",
    arrivee: "2026-03-03",
    depart: "2026-03-08",
    heureArrivee: "16:00",
    statut: "Confirmé",
    plateforme: "Airbnb",
    voyageurs: 2,
    montant: 400,
    paye: 400,
    ...partiel,
  };
}

const LISTE: ReservationTableau[] = [
  resa({ id: "a", occupant: "Sophie Martin", bienId: "suzette", arrivee: "2026-03-03" }),
  resa({
    id: "b",
    occupant: "Jean Dupont",
    bienId: "villa",
    arrivee: "2026-04-04",
    depart: "2026-04-09",
    plateforme: "Booking.com",
    paye: 100,
    montant: 340,
  }),
  resa({
    id: "c",
    occupant: "Anna Schmidt",
    bienId: "colette",
    statut: "En attente",
    arrivee: "2026-03-06",
    depart: "2026-03-06",
    paye: 0,
    type: "Bail meublé",
  }),
  resa({
    id: "d",
    occupant: "Paul Annule",
    bienId: "suzette",
    statut: "Annulé",
    arrivee: "2026-02-01",
    depart: "2026-02-04",
  }),
];

const NOMS: Record<string, string> = {
  suzette: "Suzette",
  villa: "Villa Lavandrix",
  colette: "Appartement Colette",
  b1: "Bien",
};

const nomBien = (id: string) => NOMS[id] ?? id;

describe("vue tableau des réservations", () => {
  it("affiche les colonnes utiles : statut, propriété, occupant, dates, montant", () => {
    const actifs = filtrerReservations(LISTE, {
      recherche: "",
      statut: "tout",
      periode: "tous",
      mois: "tous",
      aujourdHui: AUJ,
      nomBien,
    });
    expect(actifs.map((r) => r.statut)).toEqual(["Confirmé", "Confirmé", "En attente"]);
    expect(actifs.map((r) => nomBien(r.bienId))).toEqual([
      "Suzette",
      "Villa Lavandrix",
      "Appartement Colette",
    ]);
    expect(actifs.map((r) => r.occupant)).toContain("Sophie Martin");
    expect(actifs.every((r) => r.arrivee && r.depart && r.montant >= 0)).toBe(true);
  });

  it("filtre par occupant, logement, statut, période et mois", () => {
    const base = {
      recherche: "",
      statut: "tout" as const,
      periode: "tous" as const,
      mois: "tous",
      aujourdHui: AUJ,
      nomBien,
    };
    expect(
      filtrerReservations(LISTE, { ...base, recherche: "lavandrix" }).map((r) => r.id),
    ).toEqual(["b"]);
    expect(filtrerReservations(LISTE, { ...base, recherche: "anna" }).map((r) => r.id)).toEqual([
      "c",
    ]);
    expect(filtrerReservations(LISTE, { ...base, statut: "En attente" }).map((r) => r.id)).toEqual([
      "c",
    ]);
    expect(filtrerReservations(LISTE, { ...base, statut: "Annulé" }).map((r) => r.id)).toEqual([
      "d",
    ]);
    expect(filtrerReservations(LISTE, { ...base, periode: "a_venir" }).map((r) => r.id)).toEqual([
      "b",
    ]);
    expect(filtrerReservations(LISTE, { ...base, periode: "en_cours" }).map((r) => r.id)).toEqual([
      "a",
    ]);
    expect(filtrerReservations(LISTE, { ...base, periode: "departs" }).map((r) => r.id)).toEqual([
      "c",
    ]);
    expect(filtrerReservations(LISTE, { ...base, mois: "2026-04" }).map((r) => r.id)).toEqual([
      "b",
    ]);
    expect(comptesReservations(LISTE, AUJ)).toMatchObject({
      en_cours: 1,
      a_venir: 1,
      departs: 1,
      annule: 1,
      confirme: 2,
      attente: 1,
    });
  });

  it("trie par date d'arrivée et pagine par 8", () => {
    const tries = trierReservations(LISTE, { colonne: "arrivee", sens: "asc" }, nomBien);
    expect(tries.map((r) => r.id)).toEqual(["d", "a", "c", "b"]);
    const page = paginerReservations(
      Array.from({ length: 14 }, (_, i) => i),
      2,
    );
    expect(page.pages).toBe(2);
    expect(page.visibles).toEqual([8, 9, 10, 11, 12, 13]);
    expect(sejourAvecCle("Bail meublé")).toBe(false);
    expect(sejourAvecCle("Location saisonnière")).toBe(true);
  });
});
