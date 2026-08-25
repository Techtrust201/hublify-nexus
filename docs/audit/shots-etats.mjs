import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE ?? "http://127.0.0.1:8080";
const OUT = process.env.OUT ?? "docs/audit/shots-etats";
const WIDTHS = (process.env.WIDTHS ?? "375,768").split(",").map(Number);

const defilerADroite = async (page) => {
  await page.evaluate(() => {
    for (const el of document.querySelectorAll("*")) {
      if (el.scrollWidth > el.clientWidth + 40 && getComputedStyle(el).overflowX !== "visible") {
        el.scrollLeft = el.scrollWidth;
      }
    }
  });
};

const ETATS = [
  {
    nom: "planning-defile",
    route: "/",
    action: async (page) => {
      await defilerADroite(page);
      await page.mouse.wheel(0, 260);
      await page.waitForTimeout(400);
    },
  },
  {
    nom: "reservations-planning-defile",
    route: "/reservations",
    action: async (page) => {
      await defilerADroite(page);
      await page.mouse.wheel(0, 260);
      await page.waitForTimeout(400);
    },
  },
  {
    nom: "messagerie-fil",
    route: "/messagerie",
    action: async (page) => {
      await page
        .locator("main aside button")
        .filter({ hasText: "Brian" })
        .first()
        .click()
        .catch(() => {});
      await page.waitForTimeout(500);
    },
  },
  {
    nom: "drawer",
    route: "/",
    action: async (page, width) => {
      if (width >= 1024) return "ignore";
      await page.getByRole("button", { name: "Ouvrir la navigation" }).click();
      await page.waitForTimeout(500);
    },
  },
  {
    nom: "dialog-evenement",
    route: "/",
    action: async (page) => {
      await page.getByRole("button", { name: "Ajouter", exact: true }).first().click();
      await page.waitForTimeout(500);
    },
  },
];

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
    viewport: { width, height: 812 },
    storageState,
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  for (const e of ETATS) {
    await page.goto(`${BASE}${e.route}`, { waitUntil: "load" });
    await page.waitForTimeout(700);
    const r = await e.action(page, width);
    if (r === "ignore") continue;
    const chemin = `${OUT}/${e.nom}-${width}.png`;
    await page.screenshot({ path: chemin });
    console.log(chemin);
  }
  await ctx.close();
}
await browser.close();
