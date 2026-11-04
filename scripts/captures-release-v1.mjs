/**
 * Captures headless desktop 1440 / mobile 390 pour la release V1.
 * Prérequis : npm run dev (port 8080) + .env.local avec DEMO_AUTH_PASSWORD.
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE ?? "http://127.0.0.1:8080";
const OUT = process.env.OUT ?? "docs/screenshots";
const EMAIL = process.env.DEMO_EMAIL ?? "amelie.dubois@hublify.app";
const MDP = process.env.DEMO_AUTH_PASSWORD ?? "";

if (!MDP) {
  console.error("DEMO_AUTH_PASSWORD manquant (.env.local).");
  process.exit(1);
}

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? "/usr/bin/google-chrome-stable",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"],
});

const TAILLES = [
  ["desktop", 1440, 900],
  ["mobile", 390, 844],
];

async function shot(page, nom, route) {
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(800);
  const fichier = `${OUT}/${nom}.png`;
  await page.screenshot({ path: fichier, fullPage: true });
  console.log(fichier);
}

for (const [label, width, height] of TAILLES) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    locale: "fr-FR",
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  await shot(page, `landing-${label}`, "/");
  await shot(page, `connexion-${label}`, "/connexion");

  await page.goto(`${BASE}/connexion`, { waitUntil: "load" });
  await page.locator('input[name="email"]').fill(EMAIL);
  await page.locator('input[name="password"]').fill(MDP);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/connexion"), { timeout: 30_000 });
  await page.waitForTimeout(1200);

  await shot(page, `dashboard-${label}`, "/");
  await shot(page, `profil-rib-${label}`, "/profil");

  await ctx.close();
}

await browser.close();
console.log("Captures terminées.");
