import { chromium } from "playwright";
import { PROBE } from "./probe-page.mjs";

const BASE = process.env.BASE ?? "http://127.0.0.1:8080";
const ROUTES = (
  process.env.ROUTES ??
  "/,/missions,/reservations,/occupants,/documents,/prestataires,/patrimoines,/inventaire,/messagerie,/tarifs,/team,/outils/modeles,/outils/vue-annuelle,/profil"
).split(",");
const WIDTHS = (process.env.WIDTHS ?? "375,768").split(",").map(Number);

// Boutons susceptibles d'ouvrir une surcouche.
const DECLENCHEURS =
  /(cr[ée]er|ajouter|inviter|nouveau|nouvelle|voir|modifier|g[ée]rer|filtre|envoyer|valider|g[ée]n[ée]rer|d[ée]tail|ouvrir|assigner|partager|param|configurer|ins[ée]rer|dupliquer|importer|exporter|planifier|affecter|editer|éditer|fiche|options|plus)/i;

/** Mesure la surcouche ouverte. */
const PROBE_OVERLAY = () => {
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  const panneaux = Array.from(
    document.querySelectorAll('[role="dialog"], [role="alertdialog"], [data-slot="sheet-content"]'),
  ).filter((el) => el.getBoundingClientRect().width > 1);
  if (panneaux.length === 0) return null;

  const desc = (el) => {
    const cls = (el.getAttribute("class") ?? "").split(/\s+/).slice(0, 5).join(".");
    const src = el.getAttribute("data-tsd-source") ?? "";
    return `${el.tagName.toLowerCase()}${cls ? "." + cls : ""} ${src}`;
  };

  const soucis = [];
  for (const p of panneaux) {
    const r = p.getBoundingClientRect();
    const titre = (p.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
    // tolérance 2 px : l'animation d'entrée des panneaux laisse un sous-pixel
    if (r.right > vw + 2 || r.left < -2) {
      soucis.push(
        `panneau hors écran « ${titre} » x=${Math.round(r.left)}→${Math.round(r.right)} (vw ${vw})`,
      );
    }
    if (r.height > vh + 1 && getComputedStyle(p).overflowY === "visible") {
      soucis.push(
        `panneau plus haut que l'écran sans scroll « ${titre} » h=${Math.round(r.height)} (vh ${vh})`,
      );
    }
    // contenu qui déborde du panneau
    for (const el of p.querySelectorAll("*")) {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      const er = el.getBoundingClientRect();
      if (er.width < 1) continue;
      if (er.right > vw + 1) {
        soucis.push(`contenu hors écran ${desc(el)} droite=${Math.round(er.right)} (vw ${vw})`);
      }
      if (cs.overflowX === "visible" && el.clientWidth > 0 && el.scrollWidth - el.clientWidth > 4) {
        const pcs = el.parentElement ? getComputedStyle(el.parentElement) : null;
        if (pcs && (pcs.display.includes("flex") || pcs.display.includes("grid"))) {
          soucis.push(
            `contenu écrasé ${desc(el)} ${el.clientWidth}px pour ${el.scrollWidth}px`,
          );
        }
      }
    }
  }
  return {
    docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    soucis: [...new Set(soucis)],
  };
};

const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome-stable",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"],
});
let ouvertes = 0;
const ignorees = [];
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
    viewport: { width, height: Number(process.env.HEIGHT ?? 812) },
    storageState,
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    await page.goto(`${BASE}${route}`, { waitUntil: "load" });
    await page.waitForTimeout(600);

    const noms = await page.evaluate((re) => {
      const rx = new RegExp(re.source, re.flags);
      const vus = new Set();
      const out = [];
      for (const b of document.querySelectorAll("button, [role=button]")) {
        const t = (b.getAttribute("aria-label") ?? b.textContent ?? "").trim().replace(/\s+/g, " ");
        if (!t || t.length > 48 || !rx.test(t) || vus.has(t)) continue;
        vus.add(t);
        out.push(t);
      }
      return out.slice(0, 14);
    }, { source: DECLENCHEURS.source, flags: DECLENCHEURS.flags });

    for (const nom of noms) {
      try {
        const cible = page.getByRole("button", { name: nom, exact: true }).first();
        if (!(await cible.isVisible())) continue;
        await cible.click({ timeout: 2500 });
        await page.waitForTimeout(450);
        const res = await page.evaluate(PROBE_OVERLAY);
        if (res) ouvertes++;
        else ignorees.push(`${route}@${width}: ${nom}`);
        // Mesure aussi la page entière : couvre les panneaux non modaux
        // (fiches latérales, encarts dépliés) qui ne portent pas role=dialog.
        const pageRes = await page.evaluate(PROBE);
        const ennuis = [
          ...(res?.soucis ?? []),
          ...(pageRes.pageOverflow > 1 ? [`SCROLL-X PAGE ${pageRes.pageOverflow}px`] : []),
          ...pageRes.squeezed.map((x) => `SQUEEZE ${x.el} ${x.w}px pour ${x.content}px`),
          ...pageRes.bleed.map((x) => `BLEED ${x.el} [${x.left}→${x.right}]`),
          ...pageRes.overlaps.map((x) => `OVERLAP ${x.a} || ${x.b} (${x.overlap})`),
          ...pageRes.clipped.map((x) => `CLIP ${x.el} (-${x.hidden}px)`),
          ...pageRes.smallTargets.map((x) => `TARGET ${x.el} ${x.w}x${x.h}`),
        ];
        if (ennuis.length) {
          console.log(`\n### ${route} @ ${width} — «${nom}»`);
          for (const s of [...new Set(ennuis)].slice(0, 10)) console.log("   -", s);
        }
        await page.keyboard.press("Escape");
        await page.waitForTimeout(250);
        // On repart d'une page propre si la surcouche a navigué.
        if (!page.url().endsWith(route)) {
          await page.goto(`${BASE}${route}`, { waitUntil: "load" });
          await page.waitForTimeout(400);
        }
      } catch {
        // déclencheur non cliquable : on continue
      }
    }
  }
  await ctx.close();
}
console.log(`\n---- ${ouvertes} surcouches ouvertes et mesurées ----`);
console.log(`---- ${ignorees.length} clics sans surcouche ----`);
console.log(ignorees.slice(0, 60).join("\n"));
await browser.close();
