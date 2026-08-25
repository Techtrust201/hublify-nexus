import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE ?? "http://127.0.0.1:8080";
const OUT = process.env.OUT ?? "docs/audit/shots";
const ROUTES = (process.env.ROUTES ?? "/,/team,/tarifs,/inventaire,/profil,/outils/debuter").split(",");
const WIDTHS = (process.env.WIDTHS ?? "320,375,768,834").split(",").map(Number);
const FULL = process.env.FULL !== "0";

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome-stable",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"],
});
const authCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const authPage = await authCtx.newPage();
await authPage.goto(`${BASE}/connexion`, { waitUntil: "load" });
await authPage.waitForTimeout(2500);
await authPage.getByLabel("Email").fill(process.env.DEMO_EMAIL ?? "contact@tech-trust.fr");
await authPage
  .getByLabel("Mot de passe")
  .fill(process.env.DEMO_AUTH_PASSWORD ?? "Hublify-Demo-2026!");
await authPage.getByRole("button", { name: "Se connecter" }).click();
await authPage.waitForURL((u) => !u.pathname.includes("/connexion"), { timeout: 20_000 });
const storageState = await authCtx.storageState();
await authCtx.close();

for (const width of WIDTHS) {
  const ctx = await browser.newContext({
    viewport: { width, height: 900 },
    storageState,
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    const nom = route === "/" ? "accueil" : route.replace(/^\//, "").replace(/\//g, "-");
    await page.goto(`${BASE}${route}`, { waitUntil: "load" });
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/${nom}-${width}.png`, fullPage: FULL });
    console.log(`${OUT}/${nom}-${width}.png`);
  }
  await ctx.close();
}
await browser.close();
