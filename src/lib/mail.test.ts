import { afterEach, describe, expect, it, vi } from "vitest";
import {
  corpsResend,
  envoyerMail,
  EXPEDITEUR_PAR_DEFAUT,
  parametresEnvoi,
  REPONSE_PAR_DEFAUT,
} from "@/lib/mail";

const mail = { a: "destinataire@exemple.test", sujet: "Sujet", html: "<p>Corps</p>" };

describe("paramètres d'envoi", () => {
  it("par défaut : noreply@tech-trust.fr, réponse à contact@tech-trust.fr", () => {
    expect(parametresEnvoi({})).toEqual({
      from: "Hublify <noreply@tech-trust.fr>",
      replyTo: "contact@tech-trust.fr",
    });
    expect(EXPEDITEUR_PAR_DEFAUT).toBe("Hublify <noreply@tech-trust.fr>");
    expect(REPONSE_PAR_DEFAUT).toBe("contact@tech-trust.fr");
  });

  it("respecte MAIL_FROM et MAIL_REPLY_TO valides", () => {
    expect(
      parametresEnvoi({
        MAIL_FROM: " Equipe <bonjour@tech-trust.fr> ",
        MAIL_REPLY_TO: "aide@tech-trust.fr",
      }),
    ).toEqual({ from: "Equipe <bonjour@tech-trust.fr>", replyTo: "aide@tech-trust.fr" });
    expect(parametresEnvoi({ MAIL_FROM: "noreply@tech-trust.fr" }).from).toBe(
      "noreply@tech-trust.fr",
    );
  });

  it("retombe sur le défaut si une valeur est vide ou mal formée", () => {
    expect(parametresEnvoi({ MAIL_FROM: "", MAIL_REPLY_TO: "" })).toEqual(parametresEnvoi({}));
    expect(parametresEnvoi({ MAIL_FROM: "pas une adresse" }).from).toBe(EXPEDITEUR_PAR_DEFAUT);
    expect(parametresEnvoi({ MAIL_FROM: "A <a@b.fr>\r\nBcc: x@y.fr" }).from).toBe(
      EXPEDITEUR_PAR_DEFAUT,
    );
    expect(parametresEnvoi({ MAIL_REPLY_TO: "a@b.fr, c@d.fr" }).replyTo).toBe(REPONSE_PAR_DEFAUT);
  });

  it("MAIL_REPLY_TO=aucune retire l'adresse de réponse", () => {
    expect(parametresEnvoi({ MAIL_REPLY_TO: "Aucune" }).replyTo).toBeUndefined();
    expect(corpsResend(mail, { MAIL_REPLY_TO: "aucune" })).not.toHaveProperty("reply_to");
  });
});

describe("corps Resend", () => {
  it("ajoute reply_to à chaque envoi", () => {
    expect(corpsResend(mail, {})).toEqual({
      from: "Hublify <noreply@tech-trust.fr>",
      to: ["destinataire@exemple.test"],
      subject: "Sujet",
      html: "<p>Corps</p>",
      reply_to: ["contact@tech-trust.fr"],
    });
  });
});

describe("envoyerMail sans clé", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("n'appelle jamais le réseau sans RESEND_API_KEY", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("DATABASE_URL", "");
    const appel = vi.fn();
    vi.stubGlobal("fetch", appel);
    await expect(envoyerMail(mail)).resolves.toBe(false);
    expect(appel).not.toHaveBeenCalled();
  });
});
