import { describe, expect, it } from "vitest";
import { emailValide, telephoneValide } from "@/lib/saisie";

describe("saisie", () => {
  it("refuse un e-mail sans domaine", () => {
    expect(emailValide("lea")).toBe(false);
    expect(emailValide("lea@email")).toBe(false);
    expect(emailValide("lea.moreau@email.fr")).toBe(true);
  });

  it("compte les chiffres du téléphone", () => {
    expect(telephoneValide("123")).toBe(false);
    expect(telephoneValide("+33 6 12 34 56 78")).toBe(true);
  });
});
