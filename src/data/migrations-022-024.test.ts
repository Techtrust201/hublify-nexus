import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const lire = (chemin: string) => readFileSync(new URL(chemin, import.meta.url), "utf8");
const MIGRATIONS = [
  "022-missions-facturation",
  "023-tarifs-et-facturation-org",
  "024-reservation-gestion",
];

/** Retire les commentaires SQL pour ne contrôler que les instructions. */
const instructions = (sql: string) => sql.replace(/--.*$/gm, "").toLowerCase();

describe("migrations 022 à 024 (chantier « Créer une Mission »)", () => {
  for (const nom of MIGRATIONS) {
    const sql = instructions(lire(`../../db/migrations/${nom}.sql`));

    it(`${nom} : additive, sans écriture de données`, () => {
      // « on delete cascade » est une clause de clé étrangère, pas une écriture.
      const sansFk = sql.replace(/on delete (cascade|set null)/g, "");
      expect(sansFk).not.toMatch(/\b(drop|truncate|delete|update|insert|rename)\b/);
      expect(sql).not.toMatch(/alter\s+column/);
    });

    it(`${nom} : rejouable (if not exists partout)`, () => {
      const ajouts = sql.match(/add column(?! if not exists)/g) ?? [];
      const tables = sql.match(/create table(?! if not exists)/g) ?? [];
      const index = sql.match(/create index(?! if not exists)/g) ?? [];
      expect([...ajouts, ...tables, ...index]).toEqual([]);
    });

    it(`${nom} : colonnes ajoutées nullable ou à défaut constant`, () => {
      const colonnes = sql.match(/add column if not exists .*$/gm) ?? [];
      for (const c of colonnes) {
        expect(c).toMatch(/\bnull\b|default (false|now\(\))/);
        if (/not null/.test(c)) expect(c).toMatch(/default/);
      }
    });

    it(`${nom} : a son rollback, qui retire la version de schema_migrations`, () => {
      const down = lire(`../../db/rollback/${nom}.down.sql`).toLowerCase();
      expect(down).toContain("begin;");
      expect(down).toContain("commit;");
      expect(down).toContain(`where version = '${nom.slice(0, 3)}'`);
    });
  }

  it("aucun fichier de rollback dans db/migrations (le script les jouerait)", () => {
    const fichiers = readdirSync(new URL("../../db/migrations/", import.meta.url));
    expect(fichiers.filter((f) => f.includes("down"))).toEqual([]);
  });
});
