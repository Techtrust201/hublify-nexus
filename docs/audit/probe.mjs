import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://127.0.0.1:8080";
const ROUTE = process.env.ROUTE ?? "/profil";
const WIDTH = Number(process.env.WIDTH ?? 375);

const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome-stable",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"],
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.goto(`${BASE}/connexion`, { waitUntil: "load" });
await page.waitForTimeout(2500);
await page.getByLabel("Email").fill(process.env.DEMO_EMAIL ?? "contact@tech-trust.fr");
await page.getByLabel("Mot de passe").fill(process.env.DEMO_AUTH_PASSWORD ?? "Hublify-Demo-2026!");
await page.getByRole("button", { name: "Se connecter" }).click();
await page.waitForURL((u) => !u.pathname.includes("/connexion"), { timeout: 20_000 });

await page.setViewportSize({ width: WIDTH, height: 900 });
await page.goto(`${BASE}${ROUTE}`, { waitUntil: "load" });
await page.waitForTimeout(700);

const report = await page.evaluate((vw) => {
  const lines = [];
  const desc = (el) => {
    const cls = (el.getAttribute("class") ?? "").split(/\s+/).slice(0, 6).join(".");
    const src = el.getAttribute("data-tsd-source") ?? "";
    return `${el.tagName.toLowerCase()}${cls ? "." + cls : ""} ${src}`;
  };
  // éléments les plus larges que le viewport, en partant des plus hauts dans l'arbre
  const wide = Array.from(document.querySelectorAll("body *")).filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > vw + 1 && r.height > 1;
  });
  for (const el of wide.slice(0, 40)) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    lines.push(
      `${Math.round(r.width)}px (sw ${el.scrollWidth}, cw ${el.clientWidth}) ov=${cs.overflowX}/${cs.overflowY} minW=${cs.minWidth} disp=${cs.display} flex=${cs.flex} — ${desc(el)}`,
    );
  }
  return { vw, docScroll: document.documentElement.scrollWidth, lines };
}, WIDTH);

console.log(`ROUTE ${ROUTE} @ ${WIDTH} — doc scrollWidth ${report.docScroll}`);
for (const l of report.lines) console.log(" ", l);
await browser.close();
