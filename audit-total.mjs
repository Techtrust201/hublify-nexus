/**
 * Audit exhaustif des actions.
 *
 * Le premier audit ciblait les boutons par leur libellé et en perdait la trace
 * dès qu'un clic changeait l'écran : 136 actions testées sur 305. Ici on les
 * désigne par leur position, et on s'assure de repartir d'un écran propre avant
 * chaque clic. Rien n'est laissé de côté.
 *
 * Pour chaque action on note ce qu'elle produit, si l'écran retrouve son état
 * initial, et si une surcouche reste ouverte malgré Échap : une surcouche qu'on
 * ne peut pas fermer est un cul-de-sac.
 */
import { chromium } from "@playwright/test";
import { appendFileSync, writeFileSync } from "node:fs";

const BASE = process.env.CIBLE ?? "https://hublify-nexus.vercel.app";
const MDP = process.env.DEMO_AUTH_PASSWORD ?? "";
const JOURNAL = "/tmp/audit-total.log";

const ROUTES = [
  "/",
  "/analyse",
  "/reservations",
  "/reservations?vue=liste",
  "/reservations/nouveau",
  "/missions",
  "/occupants",
  "/patrimoines",
  "/documents",
  "/messagerie",
  "/prestataires",
  "/prestataires/nouveau",
  "/tarifs",
  "/profil",
  "/parametrage",
  "/team",
  "/inventaire",
  "/outils",
  "/outils/debuter",
  "/outils/etats-des-lieux",
  "/outils/modeles",
  "/outils/vue-annuelle",
];

const dire = (s) => {
  console.log(s);
  appendFileSync(JOURNAL, s + "\n");
};

const net = (t) => (t || "").replace(/\s+/g, " ").trim();

const nav = await chromium.launch();
const ctx = await nav.newContext({ acceptDownloads: true, viewport: { width: 1360, height: 950 } });
const page = await ctx.newPage();

let erreursCourantes = [];
page.on("pageerror", (e) => erreursCourantes.push(net(String(e.message)).slice(0, 120)));
page.on(
  "console",
  (m) => m.type() === "error" && erreursCourantes.push(net(m.text()).slice(0, 120)),
);
let telechargement = null;
page.on("download", (d) => (telechargement = d.suggestedFilename()));

writeFileSync(JOURNAL, "");

await page.goto(BASE + "/connexion");
await page.getByRole("textbox", { name: /e-?mail/i }).fill("contact@tech-trust.fr");
await page.locator("#champ-mdp").fill(MDP);
await page.getByRole("button", { name: /se connecter|connexion/i }).click();
await page.waitForURL((u) => !u.pathname.startsWith("/connexion"), { timeout: 60000 });
dire("connecté\n");

/** Attend la fin du chargement des données, sinon on mesure un écran vide. */
async function pret() {
  await page
    .waitForFunction(() => !document.querySelector('main [aria-busy="true"]'), { timeout: 25000 })
    .catch(() => {});
  await page.waitForTimeout(600);
}

const etat = () =>
  page.evaluate(() => {
    const main = document.querySelector("main");
    return {
      html: main?.innerHTML ?? "",
      url: location.pathname + location.search,
      surcouches: document.querySelectorAll('[role="dialog"],[role="alertdialog"]').length,
      boutons: main
        ? [...main.querySelectorAll("button")].filter((b) => {
            const r = b.getBoundingClientRect();
            return r.width > 4 && r.height > 4 && !b.disabled;
          }).length
        : 0,
    };
  });

const morts = [];
const coincees = [];
const fautives = [];
let total = 0;

for (const route of ROUTES) {
  await page.goto(BASE + route);
  await pret();
  const depart = await etat();
  dire(`\n=== ${route} — ${depart.boutons} actions ===`);

  for (let i = 0; i < depart.boutons; i++) {
    // On repart d'un écran identique à celui de l'inventaire, sinon le
    // i-ème bouton ne désigne plus la même action.
    const ici = await etat();
    if (ici.url !== depart.url || ici.boutons !== depart.boutons || ici.surcouches > 0) {
      await page.goto(BASE + route);
      await pret();
    }

    const bouton = page
      .locator("main button")
      .filter({ hasNot: page.locator("[disabled]") })
      .nth(i);

    const libelle = await bouton
      .evaluate((b) =>
        (b.textContent || b.getAttribute("aria-label") || "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 50),
      )
      .catch(() => null);
    if (libelle === null) continue;

    const avant = await etat();
    erreursCourantes = [];
    telechargement = null;

    try {
      await bouton.click({ timeout: 3000 });
    } catch {
      morts.push(`${route} · #${i} « ${libelle} » : non cliquable`);
      dire(`  ✗ #${i} ${libelle} — non cliquable`);
      continue;
    }
    await page.waitForTimeout(650);
    total++;

    const apres = await etat();
    const toast = await page
      .locator('[data-sonner-toast],[role="status"]')
      .first()
      .textContent({ timeout: 300 })
      .catch(() => null);

    const effets = [];
    if (apres.url !== avant.url) effets.push(`va vers ${apres.url}`);
    if (apres.surcouches > avant.surcouches) effets.push("ouvre une surcouche");
    if (telechargement) effets.push(`télécharge ${telechargement}`);
    if (net(toast)) effets.push(`dit « ${net(toast).slice(0, 40)} »`);
    if (apres.html !== avant.html) effets.push("change l'écran");

    if (!effets.length) morts.push(`${route} · #${i} « ${libelle} » : AUCUN EFFET`);
    if (erreursCourantes.length) {
      fautives.push(`${route} · « ${libelle} » : ${erreursCourantes[0]}`);
    }

    // Une surcouche doit pouvoir se refermer : c'est la sortie de secours.
    if (apres.surcouches > avant.surcouches) {
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(500);
      const reste = (await etat()).surcouches;
      if (reste > avant.surcouches) {
        await page.keyboard.press("Escape").catch(() => {});
        await page.waitForTimeout(500);
        if ((await etat()).surcouches > avant.surcouches) {
          coincees.push(`${route} · « ${libelle} » : surcouche impossible à fermer par Échap`);
          effets.push("SURCOUCHE COINCÉE");
        }
      }
    }

    dire(
      `  ${effets.length && !effets.includes("SURCOUCHE COINCÉE") ? "✓" : "✗"} #${i} ${libelle} — ${effets.join(", ") || "AUCUN EFFET"}${erreursCourantes.length ? ` | ERREUR: ${erreursCourantes[0]}` : ""}`,
    );
  }
}

dire("\n########## SYNTHÈSE ##########");
dire(`actions testées            : ${total}`);
dire(`sans effet                 : ${morts.length}`);
morts.forEach((m) => dire("  ✗ " + m));
dire(`surcouches impossibles à fermer : ${coincees.length}`);
coincees.forEach((m) => dire("  ✗ " + m));
dire(`actions provoquant une erreur   : ${fautives.length}`);
[...new Set(fautives)].forEach((m) => dire("  ✗ " + m));

await nav.close();
