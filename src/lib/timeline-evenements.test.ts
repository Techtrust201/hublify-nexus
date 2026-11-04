import { describe, expect, it } from "vitest";
import {
  construireTimeline,
  filtrerTimeline,
  grouperTimeline,
  parserDateTimeline,
} from "@/lib/timeline-evenements";

const MAINTENANT = new Date(2026, 2, 10);

describe("timeline", () => {
  it("lit les dates ISO et les dates document en anglais abrégé", () => {
    expect(parserDateTimeline("2026-03-10")?.getDate()).toBe(10);
    expect(parserDateTimeline("01 Mar 2026")?.getMonth()).toBe(2);
    expect(parserDateTimeline("n'importe quoi")).toBeNull();
  });

  it("regroupe le jour même, la veille, la semaine et le reste", () => {
    const evenements = construireTimeline({
      documents: [
        {
          id: "d1",
          titre: "Bail Colette",
          type: "Bail",
          logement: "Appartement Colette",
          date: "10 Mar 2026",
          modifiePar: "Équipe",
        },
        {
          id: "d2",
          titre: "Quittance",
          type: "Quittance",
          logement: "Appartement Colette",
          date: "09 Mar 2026",
          modifiePar: "Équipe",
        },
        {
          id: "d3",
          titre: "Diagnostic",
          type: "Diagnostic",
          logement: "Suzette",
          date: "04 Mar 2026",
          modifiePar: "Équipe",
        },
      ],
      reservations: [
        {
          id: "r1",
          bienId: "suzette",
          occupant: "Sophie Martin",
          arrivee: "2026-01-02",
          depart: "2026-01-08",
          plateforme: "Airbnb",
          statut: "Confirmé",
        },
        {
          id: "r2",
          bienId: "suzette",
          occupant: "Jean",
          arrivee: "2026-03-12",
          depart: "2026-03-09",
          plateforme: "Direct",
          statut: "Annulé",
        },
      ],
      biens: [{ id: "suzette", nom: "Appartement Suzette" }],
    });
    const groupes = grouperTimeline(evenements, MAINTENANT).map((g) => g.id);
    expect(groupes).toEqual(["aujourdhui", "hier", "semaine", "ancien"]);
    const annulee = evenements.find((e) => e.id === "resa-r2");
    expect(annulee?.annule).toBe(true);
    expect(annulee?.logement).toBe("Appartement Suzette");

    const sansAnnulees = filtrerTimeline(evenements, {
      recherche: "jean",
      type: "tous",
      periode: "tous",
      masquerAnnulees: true,
      maintenant: MAINTENANT,
    });
    expect(sansAnnulees).toHaveLength(0);

    const baux = filtrerTimeline(evenements, {
      recherche: "",
      type: "Bail",
      periode: "aujourdhui",
      masquerAnnulees: false,
      maintenant: MAINTENANT,
    });
    expect(baux.map((e) => e.id)).toEqual(["doc-d1"]);
  });

  it("rapproche la fenêtre de mars 2026 de la période demandée sans déplacer le reste", () => {
    const maintenant = new Date(2026, 10, 4);
    const evenements = construireTimeline({
      documents: [
        {
          id: "mars",
          titre: "Quittance",
          type: "Quittance",
          logement: "Colette",
          date: "04 Mar 2026",
          modifiePar: "Équipe",
        },
        {
          id: "janvier",
          titre: "Bail",
          type: "Bail",
          logement: "Colette",
          date: "15 Jan 2026",
          modifiePar: "Équipe",
        },
      ],
      reservations: [],
      biens: [],
      projeterDemo: true,
      maintenant,
    });
    const mars = evenements.find((e) => e.id === "doc-mars");
    const janvier = evenements.find((e) => e.id === "doc-janvier");
    expect(mars?.date.getFullYear()).toBe(2026);
    expect(mars?.date.getMonth()).toBe(10);
    expect(mars?.date.getDate()).toBe(4);
    expect(janvier?.date.getMonth()).toBe(0);
    expect(janvier?.date.getDate()).toBe(15);
  });
});
