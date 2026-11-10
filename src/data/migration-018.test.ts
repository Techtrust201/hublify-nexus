import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("migration 018", () => {
  const sql = readFileSync(
    new URL("../../db/migrations/018-fil-prestataire-assigne.sql", import.meta.url),
    "utf8",
  );

  it("rattache le fil démo par e-mail, sans suppression, et reste rejouable", () => {
    expect(sql.toLowerCase()).not.toMatch(/\b(delete|drop|truncate)\b/);
    expect(sql).toContain("lucas.menage@hublify.app");
    expect(sql).toContain("type_interlocuteur = 'prestataire'");
    expect(sql).toContain("nom = 'Linge & Entretien'");
    expect(sql).toContain("btrim(coalesce(assigne, ''))");
    expect(sql).toContain("'Linge & Entretien'");
    expect(sql).not.toMatch(/where[\s\S]*assigne\s*=\s*'[^']+@/i);
  });
});
