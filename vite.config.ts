// La configuration Vite (React, Tailwind, TanStack Start, Nitro, alias @) est fournie
// par le preset partagé — ne pas réajouter ces plugins manuellement.
import { sentryTanstackStart } from "@sentry/tanstackstart-react/vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

const SENTRY_ORG = "tech-trust-agency";
const SENTRY_PROJECT = "hublify-nexus";
const SENTRY_URL = "https://de.sentry.io";

function lireVariableBuild(nom: string): string | undefined {
  const depuisProcess = process.env[nom];
  if (typeof depuisProcess === "string" && depuisProcess.length > 0) return depuisProcess;

  const modes = [process.env["NODE_ENV"], process.env["VERCEL_ENV"], "production", "development"];
  const vus = new Set<string>();
  for (const mode of modes) {
    if (!mode || vus.has(mode)) continue;
    vus.add(mode);
    const charge = loadEnv(mode, process.cwd(), "");
    const valeur = charge[nom];
    if (typeof valeur === "string" && valeur.length > 0) return valeur;
  }
  return undefined;
}

const dsnPublic = lireVariableBuild("NEXT_PUBLIC_SENTRY_DSN");
const environnement = lireVariableBuild("VERCEL_ENV");
const release = lireVariableBuild("VERCEL_GIT_COMMIT_SHA");
const jeton = lireVariableBuild("SENTRY_AUTH_TOKEN");

// Objet séparé : le type du preset partagé ne déclare pas `vercel`, mais Nitro
// recopie `vercel.functions` dans `.vc-config.json`. Sans `regions`, Vercel
// place la fonction en iad1.
const nitroConfig = {
  preset: "vercel",
  vercel: {
    functions: {
      regions: ["fra1"],
    },
  },
};

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    client: { entry: "client" },
  },
  // Sans preset explicite, le preset partagé vise Cloudflare Workers, dont le
  // runtime n'ouvre pas les connexions Postgres dont l'application a besoin.
  // fra1 (Francfort) : même région que vercel.json. Jamais iad1.
  nitro: nitroConfig,
  vite: {
    define: {
      "import.meta.env.NEXT_PUBLIC_SENTRY_DSN": JSON.stringify(dsnPublic ?? ""),
      "import.meta.env.VERCEL_ENV": JSON.stringify(environnement ?? ""),
      "import.meta.env.VERCEL_GIT_COMMIT_SHA": JSON.stringify(release ?? ""),
    },
  },
  // Dernier plugin : envoi des source maps vers de.sentry.io, puis suppression
  // des .map générés. Sans SENTRY_AUTH_TOKEN, l'envoi est ignoré et le build continue.
  plugins: [
    sentryTanstackStart({
      org: lireVariableBuild("SENTRY_ORG") ?? SENTRY_ORG,
      project: lireVariableBuild("SENTRY_PROJECT") ?? SENTRY_PROJECT,
      sentryUrl: lireVariableBuild("SENTRY_URL") ?? SENTRY_URL,
      telemetry: false,
      ...(jeton ? { authToken: jeton } : {}),
      release: {
        ...(release ? { name: release } : {}),
        setCommits: false,
        deploy: false,
      },
    }),
  ],
});
