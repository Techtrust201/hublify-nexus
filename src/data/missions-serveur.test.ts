import { afterEach, describe, expect, it } from "vitest";

import type { Sql } from "@/lib/sql";
import {
  missionsPourGestionnaire,
  oublierSchemaFacturation,
  schemaFacturationPret,
  synchroniserMissionsEnBloc,
} from "@/data/missions-serveur";

function faux(reponses: (texte: string) => unknown[]) {
  const requetes: string[] = [];
  const sql = {
    query: async (texte: string) => {
      requetes.push(texte);
      return reponses(texte);
    },
  } as unknown as Sql;
  return { sql, requetes };
}

afterEach(() => oublierSchemaFacturation());

describe("déploiement avant la migration 022/023", () => {
  it("sans les colonnes, rien n'est lu ni écrit en plus", async () => {
    const { sql, requetes } = faux(() => [{ missions: false, tables: false }]);
    expect(await schemaFacturationPret(sql)).toBe(false);
    await synchroniserMissionsEnBloc(sql, "00000000-0000-0000-0000-000000000000", [
      { id: "m1", bienId: "b1", type: "Menage", assigne: "X", description: "" },
    ]);
    expect(requetes.every((q) => q.includes("information_schema"))).toBe(true);
  });

  it("le « non » n'est pas mis en cache : une migration appliquée plus tard est vue", async () => {
    let pret = false;
    const { sql } = faux(() => [{ missions: pret, tables: pret }]);
    expect(await schemaFacturationPret(sql)).toBe(false);
    pret = true;
    expect(await schemaFacturationPret(sql)).toBe(true);
  });
});

describe("lecture gestionnaire", () => {
  it("rend le nom de la fiche à la place de son e-mail, sans toucher au reste", () => {
    const fiches = [{ id: "p1", nom: "Presta Fictif", email: "presta@exemple.test" }];
    const lues = missionsPourGestionnaire(
      [
        { id: "a", assigne: "presta@exemple.test" },
        { id: "b", assigne: "Coéquipier" },
        { id: "c", assigne: "inconnu@exemple.test" },
      ],
      fiches,
    );
    expect(lues.map((m) => m.assigne)).toEqual([
      "Presta Fictif",
      "Coéquipier",
      "inconnu@exemple.test",
    ]);
  });
});
