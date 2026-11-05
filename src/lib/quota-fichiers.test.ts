import { describe, expect, it } from "vitest";
import { GRACE_ORPHELIN_MS, preparerQuota } from "@/lib/quota-fichiers";

const HEURE = 60 * 60 * 1000;

describe("preparerQuota", () => {
  it("libère les dépôts abandonnés et garde les photos rattachées", () => {
    const plan = preparerQuota(
      [
        { id: "sauvee-1", rattache: true, ageMs: HEURE },
        { id: "sauvee-2", rattache: true, ageMs: HEURE },
        { id: "abandonnee", rattache: false, ageMs: GRACE_ORPHELIN_MS + 1 },
        { id: "recente", rattache: false, ageMs: 1_000 },
      ],
      4,
    );
    expect(plan.supprimer).toEqual(["abandonnee"]);
    expect(plan.accepter).toBe(true);
  });

  it("refuse quand le plafond est déjà tenu par des fichiers rattachés", () => {
    const plan = preparerQuota(
      [
        { id: "a", rattache: true, ageMs: HEURE },
        { id: "b", rattache: true, ageMs: HEURE },
        { id: "c", rattache: true, ageMs: HEURE },
        { id: "d", rattache: true, ageMs: HEURE },
      ],
      4,
    );
    expect(plan.supprimer).toEqual([]);
    expect(plan.accepter).toBe(false);
  });

  it("retire le plus ancien orphelin récent pour laisser la place à un nouveau dépôt", () => {
    const plan = preparerQuota(
      [
        { id: "vieux", rattache: false, ageMs: 10 * 60 * 1000 },
        { id: "jeune-1", rattache: false, ageMs: 2_000 },
        { id: "jeune-2", rattache: false, ageMs: 1_000 },
        { id: "jeune-3", rattache: false, ageMs: 500 },
      ],
      4,
    );
    expect(plan.supprimer).toEqual(["vieux"]);
    expect(plan.accepter).toBe(true);
  });
});
