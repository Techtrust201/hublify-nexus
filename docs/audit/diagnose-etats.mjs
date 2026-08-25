import { chromium } from "playwright";
import { PROBE } from "./probe-page.mjs";

const BASE = process.env.BASE ?? "http://127.0.0.1:8080";
const WIDTHS = (process.env.WIDTHS ?? "320,375,768,1024").split(",").map(Number);

/** Scénarios interactifs qui ne sont jamais atteints par un simple chargement d'URL. */
const SCENARIOS = [
  {
    nom: "messagerie — fil ouvert",
    route: "/messagerie",
    action: async (page) => {
      await page.locator("main aside button").filter({ hasText: "Brian" }).first().click();
      await page.waitForTimeout(500);
    },
  },
  {
    nom: "messagerie — panneau documents",
    route: "/messagerie",
    action: async (page, width) => {
      if (width < 1024) {
        await page.locator("main aside button").filter({ hasText: "Brian" }).first().click();
        await page.waitForTimeout(400);
      }
      await page.getByRole("button", { name: "Documents" }).first().click();
      await page.waitForTimeout(400);
    },
  },
  {
    nom: "navigation mobile ouverte",
    route: "/",
    action: async (page, width) => {
      if (width >= 1024) return "ignore";
      await page.getByRole("button", { name: "Ouvrir la navigation" }).click();
      await page.waitForTimeout(500);
    },
  },
  {
    nom: "menu Outils déployé",
    route: "/",
    action: async (page, width) => {
      if (width < 1024) return "ignore";
      await page.getByRole("button", { name: "Outils" }).first().click();
      await page.waitForTimeout(400);
    },
  },
  {
    nom: "notifications déployées",
    route: "/",
    action: async (page) => {
      await page.getByRole("button", { name: "Notifications" }).click();
      await page.waitForTimeout(400);
    },
  },
  {
    nom: "planning défilé à droite",
    route: "/",
    action: async (page) => {
      await page.evaluate(() => {
        for (const el of document.querySelectorAll("*")) {
          if (el.scrollWidth > el.clientWidth + 40 && getComputedStyle(el).overflowX !== "visible") {
            el.scrollLeft = el.scrollWidth;
          }
        }
      });
      await page.waitForTimeout(400);
    },
  },
  {
    nom: "réservations — fiche occupant",
    route: "/occupants",
    action: async (page) => {
      await page.getByRole("button", { name: /Voir|Fiche|Détail/ }).first().click();
      await page.waitForTimeout(450);
    },
  },
  {
    nom: "réservations — onglet planning",
    route: "/reservations",
    action: async (page) => {
      await page.getByRole("button", { name: "Réservations", exact: true }).first().click();
      await page.waitForTimeout(400);
      await page.evaluate(() => {
        for (const el of document.querySelectorAll("*")) {
          if (el.scrollWidth > el.clientWidth + 40 && getComputedStyle(el).overflowX !== "visible") {
            el.scrollLeft = el.scrollWidth;
          }
        }
      });
      await page.waitForTimeout(300);
    },
  },
  {
    nom: "tarifs — onglet tarifs",
    route: "/tarifs",
    action: async (page) => {
      await page.getByRole("button", { name: "Tarifs", exact: true }).first().click();
      await page.waitForTimeout(450);
    },
  },
  {
    nom: "documents — recherche remplie",
    route: "/documents",
    action: async (page) => {
      const champ = page.locator("input[type=text], input:not([type])").first();
      await champ.fill("contrat de location saisonnière 2026 très long libellé");
      await page.waitForTimeout(350);
    },
  },
];

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

let mesures = 0;
for (const width of WIDTHS) {
  const ctx = await browser.newContext({
    viewport: { width, height: 812 },
    storageState,
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  for (const s of SCENARIOS) {
    try {
      await page.goto(`${BASE}${s.route}`, { waitUntil: "load" });
      await page.waitForTimeout(600);
      const r = await s.action(page, width);
      if (r === "ignore") continue;
      const res = await page.evaluate(PROBE);
      mesures++;
      const dur = [
        res.pageOverflow > 1 ? `SCROLL-X PAGE ${res.pageOverflow}px` : null,
        ...res.squeezed.map((x) => `SQUEEZE ${x.el} ${x.w}px pour ${x.content}px`),
        ...res.bleed.map((x) => `BLEED ${x.el} [${x.left}→${x.right}]`),
        ...res.overlaps.map((x) => `OVERLAP ${x.a} || ${x.b} (${x.overlap})`),
        ...res.clipped.map((x) => `CLIP ${x.el} (-${x.hidden}px)`),
      ].filter(Boolean);
      if (dur.length) {
        console.log(`\n### ${s.nom} @ ${width}`);
        for (const d of [...new Set(dur)].slice(0, 12)) console.log("   -", d);
      }
    } catch (e) {
      console.log(`\n### ${s.nom} @ ${width} — scénario non joué : ${String(e).slice(0, 120)}`);
    }
  }
  await ctx.close();
}
console.log(`\n---- ${mesures} états interactifs mesurés ----`);
await browser.close();
