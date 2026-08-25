import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://127.0.0.1:8080";

const ROUTES = (process.env.ROUTES ?? "").split(",").filter(Boolean).length
  ? process.env.ROUTES.split(",")
  : [
  "/",
  "/missions",
  "/missions/m1",
  "/reservations",
  "/reservations?vue=liste",
  "/reservations?vue=planning",
  "/reservations/nouveau",
  "/occupants",
  "/documents",
  "/prestataires",
  "/prestataires/p1",
  "/prestataires/nouveau",
  "/patrimoines",
  "/inventaire",
  "/messagerie",
  "/tarifs",
  "/team",
  "/outils",
  "/outils/modeles",
  "/outils/vue-annuelle",
  "/outils/debuter",
  "/profil",
  "/connexion",
  "/page-inconnue-xyz", // notFoundComponent
];

const WIDTHS = (process.env.WIDTHS ?? "320,375,414,768,834,1024")
  .split(",")
  .map(Number);

import { PROBE } from "./probe-page.mjs";

const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome-stable",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"],
});

// ANONYME=1 : mesure l'app déconnectée (page de connexion, redirections).
// EMAIL=… : rejoue le balayage avec un autre rôle (droits et nav différents).
let storageState;
if (!process.env.ANONYME) {
  const authCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const authPage = await authCtx.newPage();
  await authPage.goto(`${BASE}/connexion`, { waitUntil: "load" });
  await authPage.waitForTimeout(2500); // l'app doit être hydratée avant de soumettre
  await authPage.getByLabel("Email").fill(process.env.EMAIL ?? "contact@tech-trust.fr");
  await authPage
    .getByLabel("Mot de passe")
    .fill(process.env.DEMO_AUTH_PASSWORD ?? "Hublify-Demo-2026!");
  await authPage.getByRole("button", { name: "Se connecter" }).click();
  await authPage.waitForURL((u) => !u.pathname.includes("/connexion"), { timeout: 20_000 });
  storageState = await authCtx.storageState();
  await authCtx.close();
}

const problems = [];
const tight = [];

for (const width of WIDTHS) {
  const ctx = await browser.newContext({
    viewport: { width, height: 900 },
    deviceScaleFactor: 1,
    storageState,
  });
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    try {
      await page.goto(`${BASE}${route}`, { waitUntil: "load", timeout: 25_000 });
      await page.waitForTimeout(450);
      const res = await page.evaluate(PROBE);
      const entry = { width, route, ...res };
      const has =
        res.pageOverflow > 1 ||
        res.bleed.length ||
        res.clipped.length ||
        res.overlaps.length ||
        res.squeezed.length ||
        res.smallTargets.length;
      if (has) problems.push(entry);
      if (res.tightTargets.length) tight.push(entry);
    } catch (e) {
      problems.push({ width, route, error: String(e).slice(0, 160) });
    }
  }
  await ctx.close();
}

const dedupe = (list, key) => {
  const seen = new Map();
  for (const x of list) {
    const k = key(x);
    seen.set(k, (seen.get(k) ?? 0) + 1);
  }
  return [...seen.entries()].map(([k, n]) => `${n}× ${k}`);
};

for (const p of problems) {
  console.log(`\n=== ${p.route} @ ${p.width} ===`);
  if (p.error) {
    console.log("  ERREUR", p.error);
    continue;
  }
  if (p.pageOverflow > 1) console.log(`  SCROLL-X PAGE: ${p.pageOverflow}px`);
  for (const s of dedupe(p.bleed, (x) => `${x.el} [${x.left}→${x.right}]`)) console.log("  BLEED  ", s);
  for (const s of dedupe(p.clipped, (x) => `${x.el} (-${x.hidden}px)`)) console.log("  CLIP   ", s);
  for (const s of dedupe(p.overlaps, (x) => `${x.a}  ||  ${x.b}  (${x.overlap})`)) console.log("  OVERLAP", s);
  for (const s of dedupe(p.squeezed, (x) => `${x.el} ${x.w}px pour ${x.content}px de contenu`))
    console.log("  SQUEEZE", s);
  for (const s of dedupe(p.smallTargets, (x) => `${x.el} ${x.w}x${x.h}`)) console.log("  TARGET ", s);
}

console.log(`\n---- ${problems.length} combinaisons route×largeur avec problème ----`);

// Informatif : cibles conformes WCAG 2.5.8 (>=24px) mais sous les 44px recommandés.
const serres = new Map();
for (const p of tight) {
  for (const t of p.tightTargets) {
    const k = `${t.el} ${t.w}x${t.h}`;
    serres.set(k, (serres.get(k) ?? 0) + 1);
  }
}
console.log(`\n---- ${serres.size} cibles 24-43px (conformes WCAG, sous 44px) ----`);
for (const [k, n] of [...serres.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${n}× ${k}`);
await browser.close();
