import { describe, expect, it } from "vitest";

import {
  choixAssigne,
  decoderChoixAssigne,
  fusionnerMetaFenetre,
  libelleOrigineTarif,
  type SaisieFenetre,
} from "@/lib/fenetre-mission";
import { BAREME_FRAIS_GESTION_CENTIMES } from "@/lib/analyse-finance";
import { tarifAffiche } from "@/lib/mission-facturation-serveur";

const saisie = (partiel: Partial<SaisieFenetre> = {}): SaisieFenetre => ({
  periode: false,
  plageDebut: "10:00",
  plageFin: "14:00",
  horairePrecise: "",
  attribution: "",
  tarif: null,
  reservationId: "",
  typeLibre: "",
  porteur: "prestataire",
  ouvert: false,
  choixInchange: false,
  ...partiel,
});

describe("« Assigné à » : une seule liste", () => {
  it("décode chaque choix en porteur et assigné", () => {
    expect(decoderChoixAssigne("proprio")).toEqual({
      porteur: "proprietaire",
      nom: "",
      assigne: "Propriétaire",
    });
    expect(decoderChoixAssigne("presta:Presta Fictif")).toMatchObject({
      porteur: "prestataire",
      assigne: "Presta Fictif",
    });
    expect(decoderChoixAssigne("team:Coéquipier Fictif")).toMatchObject({
      porteur: "teammate",
      assigne: "Coéquipier Fictif",
    });
    expect(decoderChoixAssigne("ouvert")).toMatchObject({ assigne: "Non assigné" });
    expect(decoderChoixAssigne("")).toMatchObject({ assigne: "Non assigné" });
  });
  it("retrouve le choix d'une mission existante", () => {
    expect(choixAssigne({ porteur: "proprietaire" }, "Propriétaire")).toBe("proprio");
    expect(choixAssigne({ porteur: "prestataire" }, "Presta Fictif")).toBe("presta:Presta Fictif");
    expect(choixAssigne({}, "Presta Fictif")).toBe("presta:Presta Fictif");
    expect(choixAssigne({ porteur: "teammate" }, "Coéquipier")).toBe("team:Coéquipier");
    expect(choixAssigne({ marketplace: true }, "Non assigné")).toBe("ouvert");
    expect(choixAssigne({}, "Non assigné")).toBe("");
  });
});

describe("méta écrite par la fenêtre", () => {
  it("création sans période : ni plage, ni Ménage/Linge/Consommable", () => {
    expect(fusionnerMetaFenetre({}, saisie())).toEqual({ porteur: "prestataire" });
  });
  it("période : plage écrite ; horaire précis seulement s'il est saisi", () => {
    expect(fusionnerMetaFenetre({}, saisie({ periode: true }))).toEqual({
      plageDebut: "10:00",
      plageFin: "14:00",
      porteur: "prestataire",
    });
  });
  it("édition : conserve ménage, linge, consommable, envoi et règlement", () => {
    const avant = {
      menage: true,
      linge: true,
      consommable: false,
      envoi: "validee" as const,
      payePrestataire: 30,
      tarif: 40,
      plageDebut: "09:00",
      plageFin: "11:00",
    };
    const apres = fusionnerMetaFenetre(avant, saisie({ attribution: "proprietaire", tarif: 45 }));
    expect(apres).toEqual({
      menage: true,
      linge: true,
      consommable: false,
      envoi: "validee",
      payePrestataire: 30,
      tarif: 45,
      attribution: "proprietaire",
      porteur: "prestataire",
    });
  });
  it("le tarif automatique n'est jamais recopié : vide = pas de tarif manuel", () => {
    expect(fusionnerMetaFenetre({ tarif: 40 }, saisie({ tarif: null }))).not.toHaveProperty(
      "tarif",
    );
  });
  it("« Ouvert » = marketplace ; choisir quelqu'un la retire, ne rien changer la garde", () => {
    expect(fusionnerMetaFenetre({}, saisie({ ouvert: true })).marketplace).toBe(true);
    expect(fusionnerMetaFenetre({ marketplace: true }, saisie()).marketplace).toBeUndefined();
    expect(
      fusionnerMetaFenetre({ marketplace: true }, saisie({ choixInchange: true })).marketplace,
    ).toBe(true);
  });
  it("réservation écrite seulement si associée", () => {
    expect(fusionnerMetaFenetre({ reservationId: "r1" }, saisie()).reservationId).toBeUndefined();
    expect(fusionnerMetaFenetre({}, saisie({ reservationId: "r2" })).reservationId).toBe("r2");
  });
});

describe("tarif affiché", () => {
  const base = { bareme: BAREME_FRAIS_GESTION_CENTIMES, porteur: "prestataire" as const };
  it("manuel > prestataire > grille > barème", () => {
    expect(
      tarifAffiche({
        ...base,
        manuelEuros: 55,
        auto: { centimes: 3700, source: "prestataire" },
        type: "Menage",
      }),
    ).toEqual({ centimes: 5500, origine: "modifie" });
    expect(
      tarifAffiche({
        ...base,
        manuelEuros: null,
        auto: { centimes: 3700, source: "prestataire" },
        type: "Menage",
      }),
    ).toEqual({ centimes: 3700, origine: "prestataire" });
    expect(
      tarifAffiche({
        ...base,
        manuelEuros: null,
        auto: { centimes: 2500, source: "grille_org" },
        type: "Check-in",
      }),
    ).toEqual({ centimes: 2500, origine: "grille_org" });
    expect(tarifAffiche({ ...base, manuelEuros: null, auto: null, type: "Menage" })).toEqual({
      centimes: 4500,
      origine: "bareme",
    });
    expect(tarifAffiche({ ...base, manuelEuros: null, auto: null, type: "Inventaire" })).toEqual({
      centimes: 8000,
      origine: "bareme",
    });
  });
  it("propriétaire : pas de facturation", () => {
    expect(
      tarifAffiche({
        ...base,
        porteur: "proprietaire",
        manuelEuros: 10,
        auto: null,
        type: "Menage",
      }),
    ).toEqual({ centimes: null, origine: "aucun" });
  });
  it("libellés auto / modifié", () => {
    expect(libelleOrigineTarif("modifie")).toBe("modifié");
    expect(libelleOrigineTarif("bareme")).toBe("auto, barème");
  });
});
