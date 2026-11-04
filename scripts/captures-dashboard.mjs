/**
 * Captures Chrome headless du dashboard gestionnaire (desktop + mobile).
 * Prérequis : ./scripts/demo-local.sh puis npm run dev (port 8080).
 * Usage : node --env-file=.env.local scripts/captures-dashboard.mjs
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE ?? "http://127.0.0.1:8080";
const OUT = process.env.OUT ?? "/tmp/hublify-shots";
const EMAIL = process.env.DEMO_EMAIL ?? "redris.gestion@gmail.com";
const MDP = process.env.DEMO_AUTH_PASSWORD ?? "";

if (!MDP) {
  console.error("DEMO_AUTH_PASSWORD manquant (.env.local).");
  process.exit(1);
}

const PAGES = [
  ["accueil", "/"],
  ["reservations", "/reservations"],
  ["reservations-liste", "/reservations?vue=liste"],
  ["reservation-nouvelle", "/reservations/nouveau"],
  ["tarifs", "/tarifs"],
  ["precheckin", "/precheckin"],
  ["lieux", "/patrimoines"],
  ["missions", "/missions"],
  ["team", "/team"],
];

const TAILLES = [
  ["desktop", 1440, 900],
  ["mobile", 390, 844],
];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? "/usr/bin/google-chrome-stable",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"],
});

async function connecter(page) {
  await page.goto(`${BASE}/connexion`, { waitUntil: "load" });
  await page.getByRole("button", { name: "Se connecter" }).waitFor({ state: "visible" });
  await page.locator('input[name="email"]').fill(EMAIL);
  await page.locator('input[name="password"]').fill(MDP);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/connexion"), { timeout: 25_000 });
  await page.getByRole("link", { name: "Vue générale" }).first().waitFor({ timeout: 20_000 });
}

const auth = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "fr-FR",
});
const porte = await auth.newPage();
await connecter(porte);
const storage = await auth.storageState();
await auth.close();

for (const [nomTaille, width, height] of TAILLES) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    storageState: storage,
    deviceScaleFactor: 1,
    locale: "fr-FR",
  });
  const page = await ctx.newPage();
  for (const [nom, route] of PAGES) {
    await page.goto(`${BASE}${route}`, { waitUntil: "load" });
    await page.waitForTimeout(900);
    const fichier = `${OUT}/${nom}-${nomTaille}.png`;
    await page.screenshot({ path: fichier, fullPage: true });
    console.log(fichier);
  }

  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await page.waitForTimeout(800);
  const ajout = page.getByRole("button", { name: /Ajouter une prestation/ }).first();
  if (await ajout.count()) {
    await ajout.click();
    await page.waitForTimeout(400);
    const dateShot = `${OUT}/dialogue-date-${nomTaille}.png`;
    await page.screenshot({ path: dateShot });
    console.log(dateShot);
    const presta = page.getByRole("button", { name: "Ajouter une prestation" });
    if (await presta.count()) {
      await presta.click();
      await page.waitForTimeout(400);
      const prestaShot = `${OUT}/dialogue-prestation-${nomTaille}.png`;
      await page.screenshot({ path: prestaShot });
      console.log(prestaShot);
    }
  }
  await page.goto(`${BASE}/team`, { waitUntil: "load" });
  await page.waitForTimeout(800);
  const crayon = page.getByRole("button", { name: "Modifier les droits" }).first();
  if (await crayon.count()) {
    await crayon.click();
    await page.waitForTimeout(400);
    const droitsShot = `${OUT}/dialogue-droits-${nomTaille}.png`;
    await page.screenshot({ path: droitsShot });
    console.log(droitsShot);
  }

  await ctx.close();
}

await browser.close();
