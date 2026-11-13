import { APIError, betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { MESSAGE_ACCES_EN_ATTENTE, membreEnAttente } from "@/lib/acces-membre";
import { CADENCE_AUTH } from "@/lib/cadence-auth";
import { assurerEspaceSiOrphelin } from "@/lib/espace-compte";
import { envoyerMail } from "@/lib/mail";
import { resoudreSecretAuth } from "@/lib/secret-auth";
import { getSql, obtenirPool } from "@/lib/sql";

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

const googleId = process.env["GOOGLE_CLIENT_ID"]?.trim();
const googleSecret = process.env["GOOGLE_CLIENT_SECRET"]?.trim();

export const auth = betterAuth({
  appName: "Hublify",
  baseURL:
    process.env["BETTER_AUTH_URL"] ??
    urlPublique(process.env["VERCEL_PROJECT_PRODUCTION_URL"]) ??
    urlPublique(process.env["VERCEL_URL"]) ??
    "http://localhost:8080",
  secret: resoudreSecretAuth({
    secret: process.env["BETTER_AUTH_SECRET"],
    nodeEnv: process.env["NODE_ENV"],
  }),
  database: obtenirPool(),
  trustedOrigins: origines,
  ...(googleId && googleSecret
    ? {
        socialProviders: {
          google: {
            clientId: googleId,
            clientSecret: googleSecret,
          },
        },
      }
    : {}),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url }) => {
      await envoyerMail({
        a: user.email,
        sujet: "Réinitialiser votre mot de passe Hublify",
        html: `<p>Réinitialisez votre mot de passe :</p><p><a href="${url}">Choisir un nouveau mot de passe</a></p>`,
        sensible: true,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await envoyerMail({
        a: user.email,
        sujet: "Vérifiez votre e-mail Hublify",
        html: `<p>Confirmez votre adresse :</p><p><a href="${url}">Vérifier mon e-mail</a></p>`,
        sensible: true,
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    // Pas de cache cookie : un changement de mot de passe, une révocation ou
    // une déconnexion doit être vu à la requête suivante, pas cinq minutes plus tard.
    cookieCache: {
      enabled: false,
    },
  },
  advanced: {
    useSecureCookies: process.env["NODE_ENV"] === "production",
    // Pas de `x-forwarded-for` : son premier saut est choisi par le client.
    // Vercel pose `x-vercel-forwarded-for` ; `x-real-ip` est le repli plateforme.
    ipAddress: {
      ipAddressHeaders: ["x-vercel-forwarded-for", "x-real-ip"],
    },
    database: {
      generateId: "uuid",
    },
  },
  rateLimit: {
    // En CI le seed + les e2e enchaînent des connexions : le plafond
    // ferait échouer la suite pour une raison sans rapport avec le produit.
    enabled: process.env["CI"] !== "true",
    window: CADENCE_AUTH.fenetreSecondes,
    max: CADENCE_AUTH.plafond,
    customRules: {
      "/sign-in/email": CADENCE_AUTH.regles["/sign-in/email"],
      "/request-password-reset": CADENCE_AUTH.regles["/request-password-reset"],
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Le formulaire et le seed rattachent eux-mêmes l'organisation.
          if (inscriptionsInternes > 0) return;
          await assurerEspaceSiOrphelin(user.id);
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          // Compte invité non validé : pas de session, donc pas de connexion (e-mail ou Google).
          const sql = getSql();
          if (sql && (await membreEnAttente(sql, session.userId))) {
            throw new APIError("FORBIDDEN", { message: MESSAGE_ACCES_EN_ATTENTE });
          }
        },
        after: async (session) => {
          // Si la création du compte a échoué après l'écriture de l'utilisateur,
          // la connexion suivante ouvre l'espace. Le formulaire interne est exclu.
          if (inscriptionsInternes > 0) return;
          await assurerEspaceSiOrphelin(session.userId);
        },
      },
    },
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
