import { describe, expect, it } from "vitest";
import { motDePasseDemoExpose, raccourcisDemoActifs } from "@/routes/connexion";

describe("raccourcis démo connexion", () => {
  it("n'expose pas le panneau ni le mot de passe hors mode démo DEV", () => {
    // En vitest, import.meta.env.DEV est true mais VITE_MODE_DEMO n'est pas posé
    // par défaut → le panneau reste off (flag off by default).
    if (import.meta.env["VITE_MODE_DEMO"] !== "1") {
      expect(raccourcisDemoActifs()).toBe(false);
      expect(motDePasseDemoExpose()).toBe("");
    }
  });

  it("ne laisse jamais fuiter un mot de passe si les raccourcis sont inactifs", () => {
    if (!raccourcisDemoActifs()) {
      expect(motDePasseDemoExpose()).toBe("");
    }
  });
});
