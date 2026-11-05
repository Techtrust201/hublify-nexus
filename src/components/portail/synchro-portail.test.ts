import { describe, expect, it } from "vitest";
import { ETAT_PORTAIL_VIDE } from "@/data/portail-etat";
import {
  aDuLocal,
  fusionDoitEtrePubliee,
  fusionnerPortail,
  type InstantanePortail,
} from "@/components/portail/synchro-portail";

const LOCAL: InstantanePortail = {
  mode: null,
  demarre: false,
  notes: [{ id: "n1", jour: "2026-11-05", texte: "Arrivée tardive" }],
  paiements: [],
  edl: { emisLe: "2026-11-01", valideLe: null },
  rdv: null,
  demandes: [],
  favoris: [],
  docCourant: "doc-1",
  candidature: { bienId: "bien-1" },
};

describe("reprise du portail", () => {
  it("conserve les notes locales quand le chargement distant échoue", () => {
    const etat = fusionnerPortail(ETAT_PORTAIL_VIDE, LOCAL);
    expect(etat.notes).toEqual(LOCAL.notes);
    expect(etat.docCourant).toBe("doc-1");
    expect(etat.edl.emisLe).toBe("2026-11-01");
  });

  it("publie la fusion si le distant ignore l'état des lieux ou le brouillon", () => {
    const distant = { ...ETAT_PORTAIL_VIDE, mode: "resident" as const, demarre: true };
    const suivant = fusionnerPortail(distant, LOCAL);
    expect(suivant.mode).toBe("resident");
    expect(suivant.notes).toEqual(LOCAL.notes);
    expect(suivant.candidature).toEqual(LOCAL.candidature);
    expect(aDuLocal(LOCAL)).toBe(true);
    expect(fusionDoitEtrePubliee(distant, suivant)).toBe(true);
  });

  it("n'écrase pas un distant déjà complet avec un instantané vide", () => {
    const distant = {
      ...ETAT_PORTAIL_VIDE,
      mode: "resident" as const,
      notes: LOCAL.notes,
      edl: LOCAL.edl,
      docCourant: "doc-1",
      candidature: { bienId: "bien-1" },
    };
    const vide: InstantanePortail = {
      mode: null,
      demarre: false,
      notes: [],
      paiements: [],
      edl: { emisLe: "", valideLe: null },
      rdv: null,
      demandes: [],
      favoris: [],
      docCourant: null,
      candidature: {},
    };
    const suivant = fusionnerPortail(distant, vide);
    expect(fusionDoitEtrePubliee(distant, suivant)).toBe(false);
  });
});
