import { describe, expect, it } from "vitest";
import {
  dupliquerLivret,
  fusionMigrationLivrets,
  LIVRETS_INITIAUX,
  livretRenomme,
  pageRenseignee,
} from "@/data/livrets";

describe("livrets d'accueil", () => {
  it("propose un livret et une fiche d'accès distincts", () => {
    const familles = new Set(LIVRETS_INITIAUX.map((l) => l.famille));
    expect(familles).toEqual(new Set(["livret", "fiche"]));
    expect(pageRenseignee(LIVRETS_INITIAUX[0]!.pages[0]!)).toBe(true);
  });

  it("duplique sans partager les pages et renomme", () => {
    const source = LIVRETS_INITIAUX[0]!;
    const copie = dupliquerLivret(source, new Date("2026-03-11T08:00:00Z"));
    expect(copie.id).not.toBe(source.id);
    expect(copie.nom).toContain("(copie)");
    copie.pages[0]!.texte = "autre";
    expect(source.pages[0]!.texte).not.toBe("autre");
    expect(livretRenomme(source, "  Accueil villa  ").nom).toBe("Accueil villa");
  });

  it("ne reprend le navigateur que si la base de l'organisation est vide", () => {
    const distant = LIVRETS_INITIAUX[0]!;
    const legacy = LIVRETS_INITIAUX[1]!;
    expect(fusionMigrationLivrets([distant], [legacy]).pousser).toBe(false);
    expect(fusionMigrationLivrets([distant], [legacy]).livrets.map((l) => l.id)).toEqual([
      distant.id,
    ]);
    expect(fusionMigrationLivrets([], [legacy])).toMatchObject({
      pousser: true,
      livrets: [legacy],
    });
    expect(fusionMigrationLivrets([], null)).toEqual({ livrets: [], pousser: false });
  });
});
