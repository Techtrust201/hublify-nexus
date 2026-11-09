import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CADENCE_AUTH } from "@/lib/cadence-auth";
import { autoriserCadence, reinitialiserCadence } from "@/lib/cadence-memoire";
import { ENTETE_HSTS, ENTETES_SECURITE, poserEntetesSecurite } from "@/lib/entetes-securite";
import { htmlPourArchive } from "@/lib/mail";
import { genererMotDePasseInvitation } from "@/lib/mot-de-passe-invitation";
import { resoudreSecretAuth } from "@/lib/secret-auth";

describe("secret de session", () => {
  it("refuse le secret de développement en production", () => {
    expect(() => resoudreSecretAuth({ secret: "", nodeEnv: "production" })).toThrow(/production/);
    expect(() =>
      resoudreSecretAuth({
        secret: "dev-uniquement-32-caracteres-min",
        nodeEnv: "production",
      }),
    ).toThrow(/production/);
  });

  it("accepte un secret long en production et un repli hors production", () => {
    const secret = "x".repeat(40);
    expect(resoudreSecretAuth({ secret, nodeEnv: "production" })).toBe(secret);
    expect(resoudreSecretAuth({ secret: "", nodeEnv: "test" }).length).toBeGreaterThanOrEqual(32);
  });
});

describe("cadence d'authentification", () => {
  it("serre la connexion et le mot de passe oublié sous le plafond global", () => {
    expect(CADENCE_AUTH.regles["/sign-in/email"].max).toBeLessThan(CADENCE_AUTH.plafond);
    expect(CADENCE_AUTH.regles["/request-password-reset"].max).toBeLessThanOrEqual(3);
    expect(CADENCE_AUTH.regles["/request-password-reset"].window).toBeGreaterThanOrEqual(60);
  });

  it("bloque la sixième inscription de la même adresse dans la fenêtre", () => {
    reinitialiserCadence();
    const cle = "inscription:203.0.113.8";
    for (let i = 0; i < 5; i += 1) expect(autoriserCadence(cle, 5, 3_600_000, 1_000)).toBe(true);
    expect(autoriserCadence(cle, 5, 3_600_000, 1_000)).toBe(false);
    expect(autoriserCadence("inscription:203.0.113.9", 5, 3_600_000, 1_000)).toBe(true);
  });
});

describe("invitation", () => {
  it("fabrique un mot de passe temporaire long et non rejouable", () => {
    const a = genererMotDePasseInvitation();
    const b = genererMotDePasseInvitation();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(24);
    expect(a.startsWith("Hublify-")).toBe(true);
    expect(a).not.toMatch(/^[A-Za-z]+-[0-9a-f]{8}!aA1$/);
  });
});

describe("archive des mails", () => {
  it("n'enregistre pas un mot de passe temporaire en production", () => {
    const html = "<p>Mot de passe temporaire : <code>Hublify-secret</code></p>";
    expect(
      htmlPourArchive({ a: "a@b.c", sujet: "Invitation", html, sensible: true }, true),
    ).not.toContain("Hublify-secret");
    expect(
      htmlPourArchive({ a: "a@b.c", sujet: "Invitation", html, sensible: true }, false),
    ).toContain("Hublify-secret");
  });
});

describe("en-têtes de sécurité", () => {
  it("pose les en-têtes sur la réponse et dans vercel.json", () => {
    const reponse = poserEntetesSecurite(new Response("ok"), true);
    for (const [cle, valeur] of ENTETES_SECURITE) {
      expect(reponse.headers.get(cle)).toBe(valeur);
    }
    expect(reponse.headers.get(ENTETE_HSTS[0])).toBe(ENTETE_HSTS[1]);
    const vercel = readFileSync(new URL("../../vercel.json", import.meta.url), "utf8");
    for (const [, valeur] of ENTETES_SECURITE) expect(vercel).toContain(valeur);
    expect(vercel).toContain(ENTETE_HSTS[1]);
  });
});
