import { describe, expect, it } from "vitest";
import { dateEdlAffichee } from "@/data/edl-mo1";
import { formatDateLongue } from "@/data/reservations-mo1";

describe("dates des états des lieux", () => {
  const aujourdhui = new Date(2026, 10, 5);

  it("rapproche un dossier semé de la période courante", () => {
    expect(dateEdlAffichee("edl1", "2026-03-04", aujourdhui)).not.toBe(
      formatDateLongue("2026-03-04"),
    );
  });

  it("laisse intacte une date choisie, même dans la fenêtre de mars 2026", () => {
    expect(dateEdlAffichee("edl-nouveau", "2026-03-05", aujourdhui)).toBe(
      formatDateLongue("2026-03-05"),
    );
  });
});
