import { APIError, betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { envoyerMail } from "@/lib/mail";
import { obtenirPool } from "@/lib/sql";

let inscriptionsInternes = 0;

export async function avecInscriptionInterne<T>(fn: () => Promise<T>): Promise<T> {
  inscriptionsInternes += 1;
  try {
    return await fn();
  } finally {
    inscriptionsInternes -= 1;
  }
}

function urlPublique(hote: string | undefined) {
  if (!hote) return undefined;
  return hote.startsWith("http://") || hote.startsWith("https://") ? hote : `https://${hote}`;
}

const origines = [
  process.env["BETTER_AUTH_URL"],
  urlPublique(process.env["VERCEL_URL"]),
  urlPublique(process.env["VERCEL_BRANCH_URL"]),
  urlPublique(process.env["VERCEL_PROJECT_PRODUCTION_URL"]),
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "https://hublify-nexus.vercel.app",
].filter((x): x is string => Boolean(x));

export const auth = betterAuth({
  appName: "Hublify",
  baseURL:
    process.env["BETTER_AUTH_URL"] ??
    urlPublique(process.env["VERCEL_PROJECT_PRODUCTION_URL"]) ??
    urlPublique(process.env["VERCEL_URL"]) ??
    "http://localhost:8080",
  secret: process.env["BETTER_AUTH_SECRET"] ?? "dev-uniquement-32-caracteres-min",
  database: obtenirPool(),
  trustedOrigins: origines,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url }) => {
      await envoyerMail({
        a: user.email,
        sujet: "Réinitialiser votre mot de passe Hublify",
        html: `<p>Réinitialisez votre mot de passe :</p><p><a href="${url}">Choisir un nouveau mot de passe</a></p>`,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await envoyerMail({
        a: user.email,
        sujet: "Vérifiez votre e-mail Hublify",
        html: `<p>Confirmez votre adresse :</p><p><a href="${url}">Vérifier mon e-mail</a></p>`,
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  advanced: {
    useSecureCookies: process.env["NODE_ENV"] === "production",
    database: {
      generateId: "uuid",
    },
  },
  rateLimit: {
    // En CI le seed + les e2e enchaînent des connexions : le plafond 40/60 s
    // ferait échouer la suite pour une raison sans rapport avec le produit.
    enabled: process.env["CI"] !== "true",
    window: 60,
    max: 40,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;
      if (inscriptionsInternes > 0) return;
      throw new APIError("FORBIDDEN", {
        message: "L'inscription publique est désactivée.",
      });
    }),
  },
  plugins: [tanstackStartCookies()],
});
