import { beforeEach, describe, expect, it } from "vitest";
import {
  avecGestion,
  ecrireGestionReservation,
  lireGestionReservations,
  oublierSchemaGestion,
} from "@/data/reservation-gestion-serveur";
import type { Sql } from "@/lib/sql";

const ORG = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";

function sqlEspion(colonnesPresentes: number, lignes: unknown[] = []) {
  const appels: { texte: string; valeurs: unknown[] }[] = [];
  const query = (texte: string, valeurs: unknown[] = []) => {
    appels.push({ texte, valeurs });
    if (texte.includes("information_schema")) return Promise.resolve([{ n: colonnesPresentes }]);
    return Promise.resolve(lignes);
  };
  const tag = Object.assign(() => Promise.resolve([]), { query }) as unknown as Sql;
  return { tag, appels };
}

beforeEach(() => oublierSchemaGestion());

describe("gestion des réservations sans la migration 024", () => {
  it("n'écrit ni ne lit aucune colonne absente", async () => {
    const { tag, appels } = sqlEspion(0);
    await ecrireGestionReservation(tag, ORG, "r1", { menageGere: true });
    expect(await lireGestionReservations(tag, ORG)).toBeNull();
    expect(appels.every((a) => a.texte.includes("information_schema"))).toBe(true);
    expect(appels.some((a) => /menage_gere\s*=|select id, menage_gere/.test(a.texte))).toBe(false);
  });

  it("une migration partielle compte comme absente", async () => {
    const { tag, appels } = sqlEspion(2);
    await ecrireGestionReservation(tag, ORG, "r1", { lingeGere: false });
    expect(appels.some((a) => a.texte.includes("update"))).toBe(false);
  });

  it("rien à écrire : aucune requête", async () => {
    const { tag, appels } = sqlEspion(3);
    await ecrireGestionReservation(tag, ORG, "r1", {});
    expect(appels).toEqual([]);
  });
});

describe("gestion des réservations avec la migration 024", () => {
  it("n'écrit que les valeurs présentes, sur la réservation de l'org", async () => {
    const { tag, appels } = sqlEspion(3);
    await ecrireGestionReservation(tag, ORG, "r1", { menageGere: true, consommableGere: null });
    const maj = appels.find((a) => a.texte.includes("update"));
    expect(maj?.texte).toMatch(/menage_gere = \$1::boolean, consommable_gere = \$2::boolean/);
    expect(maj?.texte).not.toMatch(/linge_gere/);
    expect(maj?.texte).toMatch(/where org_id = \$3::uuid and id = \$4/);
    expect(maj?.valeurs).toEqual([true, null, ORG, "r1"]);
  });

  it("lit les valeurs et les ajoute aux réservations", async () => {
    const { tag } = sqlEspion(3, [
      { id: "r1", menage_gere: true, linge_gere: false, consommable_gere: null },
    ]);
    const carte = await lireGestionReservations(tag, ORG);
    const lues = avecGestion([{ id: "r1" }, { id: "r2" }], carte);
    expect(lues).toEqual([
      { id: "r1", menageGere: true, lingeGere: false, consommableGere: null },
      { id: "r2" },
    ]);
    expect(avecGestion([{ id: "r1" }], null)).toEqual([{ id: "r1" }]);
  });
});
