import { existsSync, readFileSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

for (const fichier of [".env.local", ".env"]) {
  if (!existsSync(fichier)) continue;
  for (const ligne of readFileSync(fichier, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(ligne);
    if (!m?.[1] || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = (m[2] ?? "").trim().replace(/^["']|["']$/g, "");
  }
}

if (process.env.CI && !process.env.DATABASE_URL) {
  throw new Error(
    "CI : DATABASE_URL est obligatoire. Le workflow doit démarrer le service Postgres.",
  );
}

const port = 8080;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: !process.env.CI,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  // Les routes sont compilées à la demande : on les visite avant la suite pour
  // qu'aucun test ne paie ce coût. Voir e2e/prechauffage.ts.
  globalSetup: "./e2e/prechauffage.ts",
  // Marge résiduelle : la compilation préchauffée reste plus lente qu'un accès
  // ordinaire pendant les premières secondes.
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
