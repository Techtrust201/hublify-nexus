import { describe, expect, it } from "vitest";
import { accesBloque, membreEnAttente, MESSAGE_ACCES_EN_ATTENTE } from "@/lib/acces-membre";

const base = (statuts: string[]) => ({
  query: async (_texte: string, valeurs?: unknown[]) => {
    expect(valeurs).toEqual(["u-1"]);
    return statuts.map((statut) => ({ statut }));
  },
});

describe("accès des membres en attente", () => {
  it("ne bloque que le statut « attente »", () => {
    expect(accesBloque("attente")).toBe(true);
    expect(accesBloque("actif")).toBe(false);
    expect(accesBloque("externe")).toBe(false);
    expect(accesBloque(null)).toBe(false);
    expect(accesBloque(undefined)).toBe(false);
  });

  it("repère un compte dont le rattachement est en attente", async () => {
    expect(await membreEnAttente(base(["attente"]), "u-1")).toBe(true);
    expect(await membreEnAttente(base(["actif", "attente"]), "u-1")).toBe(true);
  });

  it("laisse passer un compte actif, externe ou sans rattachement (ouverture d'espace)", async () => {
    expect(await membreEnAttente(base(["actif"]), "u-1")).toBe(false);
    expect(await membreEnAttente(base(["externe"]), "u-1")).toBe(false);
    expect(await membreEnAttente(base([]), "u-1")).toBe(false);
  });

  it("explique le refus à l'utilisateur", () => {
    expect(MESSAGE_ACCES_EN_ATTENTE).toMatch(/validation/);
  });
});
