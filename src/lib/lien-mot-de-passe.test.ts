import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  AlerteLienInvalide,
  lienMotDePasseInvalide,
  MESSAGE_LIEN_INVALIDE,
} from "@/lib/lien-mot-de-passe";

describe("lien de mot de passe invalide", () => {
  it("reconnaît le refus Better Auth d'un jeton déjà utilisé ou expiré", () => {
    expect(lienMotDePasseInvalide("abc", { code: "INVALID_TOKEN", status: 400 })).toBe(true);
  });

  it("traite l'absence de jeton comme un lien invalide", () => {
    expect(lienMotDePasseInvalide("")).toBe(true);
  });

  it("laisse passer les autres erreurs et le succès", () => {
    expect(lienMotDePasseInvalide("abc")).toBe(false);
    expect(lienMotDePasseInvalide("abc", null)).toBe(false);
    expect(lienMotDePasseInvalide("abc", { code: "PASSWORD_TOO_SHORT", status: 400 })).toBe(false);
  });

  it("affiche un message clair avec un lien vers « Mot de passe oublié »", () => {
    const html = renderToStaticMarkup(createElement(AlerteLienInvalide));
    expect(html).toContain('role="alert"');
    expect(html).toContain("Ce lien a déjà été utilisé ou a expiré.");
    expect(html).toContain("Demandez une nouvelle invitation à votre administrateur");
    expect(html).toContain('href="/mot-de-passe-oublie"');
    expect(MESSAGE_LIEN_INVALIDE).toMatch(/Mot de passe oublié/);
  });
});
