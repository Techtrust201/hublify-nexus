import { afterEach, describe, expect, it } from "vitest";

import type { Sql } from "@/lib/sql";
import {
  listerMissionsOuvertes,
  missionsPourGestionnaire,
  oublierSchemaFacturation,
  prendreMissionOuverte,
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

describe("marketplace (PR 5) : requêtes", () => {
  const ORG_P = "11111111-1111-4111-8111-111111111111";
  function fauxAvecParams(reponses: (texte: string) => unknown[]) {
    const requetes: { texte: string; valeurs: unknown[] }[] = [];
    const sql = {
      query: async (texte: string, valeurs: unknown[] = []) => {
        requetes.push({ texte, valeurs });
        if (texte.includes("information_schema")) return [{ missions: true, tables: true }];
        return reponses(texte);
      },
    } as unknown as Sql;
    return { sql, requetes };
  }

  it("liste : lien actif avec l'org du compte, ouverte, sans assigné ; sept champs en sortie", async () => {
    const { sql, requetes } = fauxAvecParams(() => [
      {
        id: "m1",
        jour: "2026-12-03",
        type_mission: "Menage",
        titre: "T",
        heure: "10:00",
        description: "Code 4321",
        bien_nom: "Studio",
        bien_adresse: "1 rue Z, Saint-Pierre",
        proprietaire: "Ne doit pas sortir",
      },
    ]);
    const liste = await listerMissionsOuvertes(sql, ORG_P);
    expect(liste).toEqual([
      {
        id: "m1",
        date: "2026-12-03",
        type: "Menage",
        titre: "T",
        plage: "10:00",
        logement: "Studio",
        ville: "Saint-Pierre",
      },
    ]);
    const q = requetes.find((r) => r.texte.includes("from public.missions m"))!;
    expect(q.valeurs).toEqual([ORG_P]);
    for (const morceau of [
      "l.org_prestataire_id = $1::uuid",
      "l.statut = 'actif'",
      "m.ouverte",
      "coalesce(btrim(m.assigne), '') = ''",
    ]) {
      expect(q.texte).toContain(morceau);
    }
    // Sélection explicite : aucune étoile, ni réservation, ni propriétaire.
    expect(q.texte).not.toMatch(/select\s+\*|m\.\*|proprietaire|reservation/i);
  });

  it("prise : une seule mise à jour conditionnelle ; rien d'autre si elle ne touche aucune ligne", async () => {
    const { sql, requetes } = fauxAvecParams(() => []);
    expect(await prendreMissionOuverte(sql, ORG_P, "p@exemple.test", "m1")).toEqual({
      ok: false,
      raison: "indisponible",
    });
    const maj = requetes.filter((r) => /^\s*update/i.test(r.texte));
    expect(maj).toHaveLength(1);
    const t = maj[0]!.texte;
    for (const morceau of [
      "where m.id = $2",
      "m.ouverte",
      "coalesce(btrim(m.assigne), '') = ''",
      "l.statut = 'actif'",
      "l.org_prestataire_id = $1::uuid",
      "returning",
    ]) {
      expect(t).toContain(morceau);
    }
    expect(maj[0]!.valeurs.slice(0, 3)).toEqual([ORG_P, "m1", "p@exemple.test"]);
  });
});
