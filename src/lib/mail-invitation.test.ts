import { describe, expect, it } from "vitest";
import {
  invitationEnCours,
  lienDefinitionMotDePasse,
  mailInvitation,
  mailPourJetonMotDePasse,
  origineInvitation,
} from "@/lib/mail-invitation";
import { genererMotDePasseInvitation } from "@/lib/mot-de-passe-invitation";

const JETON = "AbCdEf0123456789ghijKLMN";

describe("mail d'invitation", () => {
  const mail = mailInvitation({
    email: "invite@exemple.fr",
    orgNom: "Redris <Gestion>",
    origine: "https://hublify-nexus-abc-techtrust.vercel.app/",
    jeton: JETON,
  });

  it("ne contient aucun mot de passe", () => {
    expect(mail.html).not.toMatch(/mot de passe temporaire/i);
    expect(mail.html).not.toMatch(/<code>/);
    expect(mail.html).not.toMatch(/Hublify-[A-Za-z0-9_-]{10,}/);
    // Même si un mot de passe aléatoire existait côté serveur, il n'est jamais injecté.
    expect(mail.html).not.toContain(genererMotDePasseInvitation().slice(0, 12));
  });

  it("porte un lien de définition du mot de passe vers l'origine donnée", () => {
    const attendu =
      "https://hublify-nexus-abc-techtrust.vercel.app/reinitialiser-mot-de-passe?token=" + JETON;
    expect(mail.html).toContain(`href="${attendu}"`);
    expect(mail.html).toContain("https://hublify-nexus-abc-techtrust.vercel.app/connexion");
    expect(mail.html).toContain("/mot-de-passe-oublie");
    expect(mail.html).toMatch(/valable 1 heure/);
    const lien = new URL(attendu);
    expect(lien.pathname).toBe("/reinitialiser-mot-de-passe");
    expect(lien.searchParams.get("token")).toBe(JETON);
  });

  it("garde le sujet, le caractère sensible et échappe le nom d'organisation", () => {
    expect(mail.a).toBe("invite@exemple.fr");
    expect(mail.sujet).toBe("Invitation Hublify — Redris <Gestion>");
    expect(mail.sensible).toBe(true);
    expect(mail.html).toContain("Redris &lt;Gestion&gt;");
    expect(mail.html).not.toContain("<Gestion>");
  });

  it("encode le jeton dans le lien", () => {
    expect(lienDefinitionMotDePasse("http://localhost:8080", "a b&c")).toBe(
      "http://localhost:8080/reinitialiser-mot-de-passe?token=a%20b%26c",
    );
  });
});

describe("mail émis par sendResetPassword", () => {
  const url = "https://prod.exemple/api/auth/reset-password/JETON?callbackURL=";

  it("reste le mail « mot de passe oublié » hors invitation", () => {
    const mail = mailPourJetonMotDePasse(undefined, { email: "a@b.fr" }, url, JETON);
    expect(mail.sujet).toBe("Réinitialiser votre mot de passe Hublify");
    expect(mail.html).toContain(`href="${url}"`);
  });

  it("devient l'invitation pendant inviterMembre", async () => {
    const contexte = { orgNom: "Org", origine: "https://preview.exemple", envoye: false };
    const mail = await invitationEnCours.run(contexte, async () => {
      await Promise.resolve();
      return mailPourJetonMotDePasse(invitationEnCours.getStore(), { email: "a@b.fr" }, url, JETON);
    });
    expect(mail.sujet).toBe("Invitation Hublify — Org");
    expect(mail.html).toContain(
      `https://preview.exemple/reinitialiser-mot-de-passe?token=${JETON}`,
    );
    expect(mail.html).not.toContain("prod.exemple");
    expect(invitationEnCours.getStore()).toBeUndefined();
  });
});

describe("origine des liens d'invitation", () => {
  const env = {
    BETTER_AUTH_URL: undefined,
    VERCEL_URL: "hublify-nexus-abc-techtrust.vercel.app",
    VERCEL_BRANCH_URL: "hublify-nexus-git-fix-techtrust.vercel.app",
    VERCEL_PROJECT_PRODUCTION_URL: "hublify.app",
  };

  it("reprend l'origine de la Preview où travaille l'administrateur", () => {
    expect(origineInvitation("https://hublify-nexus-abc-techtrust.vercel.app", env)).toBe(
      "https://hublify-nexus-abc-techtrust.vercel.app",
    );
    expect(origineInvitation("https://hublify-nexus-git-fix-techtrust.vercel.app", env)).toBe(
      "https://hublify-nexus-git-fix-techtrust.vercel.app",
    );
  });

  it("refuse un hôte inconnu et retombe sur une origine configurée", () => {
    expect(origineInvitation("https://attaquant.exemple", env)).toBe(
      "https://hublify-nexus-abc-techtrust.vercel.app",
    );
    expect(
      origineInvitation("https://attaquant.exemple", {
        ...env,
        BETTER_AUTH_URL: "https://hublify.app",
      }),
    ).toBe("https://hublify.app");
  });

  it("fonctionne en local sans variable", () => {
    expect(origineInvitation("http://127.0.0.1:8080", {})).toBe("http://127.0.0.1:8080");
    expect(origineInvitation(undefined, {})).toBe("http://localhost:8080");
  });
});
