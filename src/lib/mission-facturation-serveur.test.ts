import { describe, expect, it } from "vitest";

import { ecrireDescription, type MetaPrestation } from "@/lib/gestionnaire-planning";
import {
  changeLaFacturation,
  montantApplicable,
  nomAffichePourAssigne,
  preparerMission,
  reglesFacturationActives,
  tarifAutomatique,
  tarifEffectifCentimes,
  trouverPrestataire,
  type ContexteFacturation,
} from "@/lib/mission-facturation-serveur";
import { controlerMission } from "@/data/missions-serveur";

const FICHES = [
  { id: "p1", nom: "Prestataire Fictif", email: "Presta.Fictif@exemple.test" },
  { id: "p2", nom: "Homonyme", email: "h1@exemple.test" },
  { id: "p3", nom: "Homonyme", email: "h2@exemple.test" },
  { id: "p4", nom: "Sans Mail", email: null },
];

function ctx(partiel: Partial<ContexteFacturation> = {}): ContexteFacturation {
  return {
    prestataires: FICHES,
    grilleOrg: new Map([
      ["Menage", 4000],
      ["Check-in", 2500],
    ]),
    tarifsPrestataire: new Map([["p1|Menage", 3700]]),
    reservations: new Map([["r1", "b1"]]),
    tvaLocataire: null,
    dateEffet: null,
    ...partiel,
  };
}

function mission(
  meta: MetaPrestation,
  extra: Partial<{ assigne: string; type: string; bienId: string }> = {},
) {
  return {
    bienId: extra.bienId ?? "b1",
    type: extra.type ?? "Menage",
    assigne: extra.assigne ?? "Prestataire Fictif",
    description: ecrireDescription("Ménage planifié.", meta),
  };
}

describe("tarif automatique : manuel d'abord, puis selon l'attribution", () => {
  it("prend le tarif du prestataire avant la grille", () => {
    expect(tarifAutomatique("Menage", "p1", "prestataire", ctx())).toEqual({
      centimes: 3700,
      source: "prestataire",
    });
  });
  it("retombe sur la grille de l'org sans tarif prestataire", () => {
    expect(tarifAutomatique("Check-in", "p1", "prestataire", ctx())).toEqual({
      centimes: 2500,
      source: "grille_org",
    });
    expect(tarifAutomatique("Menage", null, "teammate", ctx())).toEqual({
      centimes: 4000,
      source: "grille_org",
    });
  });
  it("à la charge du mandataire : la grille de l'org (contrat) passe avant le prestataire", () => {
    expect(tarifAutomatique("Menage", "p1", "prestataire", ctx(), "mandataire")).toEqual({
      centimes: 4000,
      source: "grille_org",
    });
    // Sans grille pour ce type : tarif du prestataire, puis barème.
    expect(
      tarifAutomatique("Menage", "p1", "prestataire", ctx({ grilleOrg: new Map() }), "mandataire"),
    ).toEqual({ centimes: 3700, source: "prestataire" });
    expect(tarifAutomatique("Maintenance", "p1", "prestataire", ctx(), "mandataire")).toBeNull();
  });
  it("propriétaire ou locataire : ordre inchangé, prestataire avant la grille", () => {
    for (const attribution of ["proprietaire", "locataire", null] as const) {
      expect(tarifAutomatique("Menage", "p1", "prestataire", ctx(), attribution)).toEqual({
        centimes: 3700,
        source: "prestataire",
      });
    }
  });
  it("mandataire : le tarif manuel reste prioritaire sur tout", () => {
    const p = preparerMission(
      mission({ porteur: "prestataire", attribution: "mandataire", tarif: 55 }),
      ctx(),
    );
    expect(p.colonnes).toMatchObject({
      tarifManuelCentimes: 5500,
      tarifCalculeCentimes: 4000,
      tarifSource: "grille_org",
    });
    expect(tarifEffectifCentimes(p.colonnes)).toBe(5500);
  });
  it("rend null sans aucun tarif : le barème fixe s'applique (R5)", () => {
    expect(tarifAutomatique("Maintenance", "p1", "prestataire", ctx())).toBeNull();
  });
  it("ne calcule rien quand le propriétaire porte la prestation", () => {
    expect(tarifAutomatique("Menage", "p1", "proprietaire", ctx())).toBeNull();
  });
  it("le tarif manuel reste prioritaire et modifiable (R1)", () => {
    const p = preparerMission(mission({ porteur: "prestataire", tarif: 55.5 }), ctx());
    expect(p.colonnes.tarifManuelCentimes).toBe(5550);
    expect(p.colonnes.tarifCalculeCentimes).toBe(3700);
    expect(tarifEffectifCentimes(p.colonnes)).toBe(5550);
    const sansManuel = preparerMission(mission({ porteur: "prestataire" }), ctx());
    expect(tarifEffectifCentimes(sansManuel.colonnes)).toBe(3700);
  });
});

describe("date d'effet : aucun montant ne change tant qu'elle est vide", () => {
  const cols = { tarifManuelCentimes: 9900, tarifCalculeCentimes: 3700 };
  it("date vide : calcul actuel", () => {
    expect(reglesFacturationActives(null, "2026-11-20")).toBe(false);
    expect(
      montantApplicable(cols, {
        dateEffet: null,
        jourMission: "2026-11-20",
        actuelCentimes: 4500,
        baremeCentimes: 4500,
      }),
    ).toBe(4500);
  });
  it("avant la date : calcul actuel ; à partir de la date : tarif retenu, sinon barème", () => {
    const base = { dateEffet: "2026-12-01", actuelCentimes: 4500, baremeCentimes: 4500 };
    expect(montantApplicable(cols, { ...base, jourMission: "2026-11-30" })).toBe(4500);
    expect(montantApplicable(cols, { ...base, jourMission: "2026-12-01" })).toBe(9900);
    expect(
      montantApplicable(
        { tarifManuelCentimes: null, tarifCalculeCentimes: null },
        { ...base, jourMission: "2026-12-02", baremeCentimes: 1200 },
      ),
    ).toBe(1200);
  });
});

describe("validation de la méta", () => {
  it("locataire sans réservation : refusé (R3) et jamais écrit", () => {
    const p = preparerMission(mission({ attribution: "locataire", porteur: "prestataire" }), ctx());
    expect(p.erreurs).toContain("locataire_sans_reservation");
    expect(p.colonnes.attribution).toBeNull();
    expect(p.colonnes.tvaTaux).toBeNull();
  });
  it("locataire avec réservation du même logement : accepté, TVA figée", () => {
    const p = preparerMission(
      mission({ attribution: "locataire", reservationId: "r1", porteur: "prestataire" }),
      ctx(),
    );
    expect(p.erreurs).toEqual([]);
    expect(p.colonnes).toMatchObject({
      attribution: "locataire",
      reservationId: "r1",
      tvaTaux: 0.2,
    });
    const tvaOrg = preparerMission(
      mission({ attribution: "locataire", reservationId: "r1" }),
      ctx({ tvaLocataire: 0.1 }),
    );
    expect(tvaOrg.colonnes.tvaTaux).toBe(0.1);
  });
  it("réservation d'un autre logement ou inconnue : refusée", () => {
    const autre = preparerMission(
      mission({ attribution: "locataire", reservationId: "r1" }, { bienId: "b2" }),
      ctx(),
    );
    expect(autre.erreurs).toContain("reservation_introuvable");
    expect(autre.colonnes.reservationId).toBeNull();
    const inconnue = preparerMission(mission({ reservationId: "zz" }), ctx());
    expect(inconnue.erreurs).toEqual(["reservation_introuvable"]);
  });
  it("valeurs inconnues et tarif négatif : refusés", () => {
    const p = preparerMission(
      mission({
        attribution: "voisin" as never,
        porteur: "robot" as never,
        tarif: -3,
      }),
      ctx(),
    );
    expect(p.erreurs).toEqual(["attribution_inconnue", "porteur_inconnu", "tarif_invalide"]);
    expect(p.colonnes).toMatchObject({
      attribution: null,
      porteur: null,
      tarifManuelCentimes: null,
    });
  });
  it("« Ouvert » = marketplace (R2)", () => {
    expect(preparerMission(mission({ marketplace: true }), ctx()).colonnes.ouverte).toBe(true);
    expect(preparerMission(mission({}), ctx()).colonnes.ouverte).toBe(false);
  });
  it("mission sans méta (ancienne) : rien d'invalide, colonnes vides sauf tarif automatique", () => {
    const p = preparerMission(
      { bienId: "b1", type: "Menage", assigne: "Non assigné", description: "Ménage." },
      ctx(),
    );
    expect(p.erreurs).toEqual([]);
    expect(p.colonnes).toMatchObject({
      attribution: null,
      porteur: null,
      reservationId: null,
      tarifManuelCentimes: null,
      tarifCalculeCentimes: 4000,
      tarifSource: "grille_org",
      ouverte: false,
    });
    expect(p.assigne).toBe("Non assigné");
  });
});

describe("e-mail du prestataire dans `assigne` (filtre du portail, #63)", () => {
  it("remplace le nom de la fiche par son e-mail, en minuscules", () => {
    const p = preparerMission(mission({ porteur: "prestataire" }), ctx());
    expect(p.assigne).toBe("presta.fictif@exemple.test");
    expect(p.prestataireId).toBe("p1");
  });
  it("garde le nom quand la fiche n'a pas d'e-mail, ou quand deux fiches portent ce nom", () => {
    expect(preparerMission(mission({}, { assigne: "Sans Mail" }), ctx()).assigne).toBe("Sans Mail");
    expect(preparerMission(mission({}, { assigne: "Homonyme" }), ctx()).assigne).toBe("Homonyme");
  });
  it("ne touche pas un coéquipier ni le propriétaire", () => {
    expect(
      preparerMission(mission({ porteur: "teammate" }, { assigne: "Prestataire Fictif" }), ctx())
        .assigne,
    ).toBe("Prestataire Fictif");
    expect(
      preparerMission(mission({ porteur: "proprietaire" }, { assigne: "Propriétaire" }), ctx())
        .assigne,
    ).toBe("Propriétaire");
  });
  it("un e-mail déjà présent est reconnu", () => {
    expect(trouverPrestataire("presta.fictif@exemple.test", FICHES)?.id).toBe("p1");
  });
  it("la lecture gestionnaire rend le nom : affichage et factures inchangés", () => {
    expect(nomAffichePourAssigne("presta.fictif@exemple.test", FICHES)).toBe("Prestataire Fictif");
    expect(nomAffichePourAssigne("inconnu@exemple.test", FICHES)).toBe("inconnu@exemple.test");
    expect(nomAffichePourAssigne("Lucas", FICHES)).toBe("Lucas");
  });
});

describe("droits : qui peut changer quoi", () => {
  const avant = ecrireDescription("x", { attribution: "mandataire", tarif: 40 });
  it("détecte un changement d'attribution, de tarif, de réservation ou de règlement", () => {
    expect(
      changeLaFacturation(
        avant,
        ecrireDescription("autre texte", { attribution: "mandataire", tarif: 40 }),
      ),
    ).toBe(false);
    expect(
      changeLaFacturation(avant, ecrireDescription("x", { attribution: "mandataire", tarif: 41 })),
    ).toBe(true);
    expect(
      changeLaFacturation(
        avant,
        ecrireDescription("x", { attribution: "proprietaire", tarif: 40 }),
      ),
    ).toBe(true);
    expect(
      changeLaFacturation(
        avant,
        ecrireDescription("x", { attribution: "mandataire", tarif: 40, payePrestataire: 10 }),
      ),
    ).toBe(true);
  });
  it("sans « mod-finances » : changement financier interdit, le reste passe", () => {
    const m = {
      bienId: "b1",
      type: "Menage",
      assigne: "X",
      description: ecrireDescription("x", { attribution: "mandataire", tarif: 41 }),
    };
    expect(controlerMission(m, avant, ctx(), false)).toEqual({ ok: false, raison: "interdit" });
    expect(controlerMission({ ...m, description: avant }, avant, ctx(), false).ok).toBe(true);
    expect(controlerMission(m, avant, ctx(), true).ok).toBe(true);
  });
  it("création avec un tarif sans « mod-finances » : interdite", () => {
    const m = mission({ tarif: 10 });
    expect(controlerMission(m, null, ctx(), false)).toEqual({ ok: false, raison: "interdit" });
  });
  it("une méta invalide est refusée même avec tous les droits", () => {
    const m = mission({ attribution: "locataire" });
    expect(controlerMission(m, null, ctx(), true)).toEqual({ ok: false, raison: "invalide" });
  });
});
