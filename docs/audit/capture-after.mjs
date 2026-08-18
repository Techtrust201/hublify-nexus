import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = "http://127.0.0.1:8080";
const OUT = path.resolve("docs/audit");

const shots = [
  { name: "after-01-dashboard-320", url: "/", w: 320, h: 844 },
  { name: "after-02-dashboard-375", url: "/", w: 375, h: 812 },
  { name: "after-03-reservations-375", url: "/reservations", w: 375, h: 812 },
  { name: "after-04-messagerie-375", url: "/messagerie", w: 375, h: 812 },
  { name: "after-05-occupants-375", url: "/occupants", w: 375, h: 812 },
  { name: "after-06-documents-375", url: "/documents", w: 375, h: 812 },
  { name: "after-07-dashboard-810", url: "/", w: 810, h: 1080 },
  { name: "after-08-dashboard-1440", url: "/", w: 1440, h: 900 },
  { name: "after-09-reservations-768", url: "/reservations", w: 768, h: 1024 },
  { name: "after-10-occupants-1440", url: "/occupants", w: 1440, h: 900 },
  { name: "after-11-messagerie-1440", url: "/messagerie", w: 1440, h: 900 },
  { name: "after-12-team-375", url: "/team", w: 375, h: 812 },
  { name: "after-13-profil-375", url: "/profil", w: 375, h: 812 },
  { name: "after-14-outils-375", url: "/outils", w: 375, h: 812 },
  { name: "after-15-vue-annuelle-375", url: "/outils/vue-annuelle", w: 375, h: 812 },
];

async function measure(page) {
  return page.evaluate(() => {
    const el = document.documentElement;
    const overflow = el.scrollWidth - el.clientWidth;
    const hamburger = document.querySelector('[aria-controls="nav-mobile"]');
    const hb = hamburger?.getBoundingClientRect();
    return {
      overflow,
      hamburger: hb ? { w: Math.round(hb.width), h: Math.round(hb.height) } : null,
    };
  });
}

const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome-stable",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"],
});
await mkdir(OUT, { recursive: true });
const report = [];

for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: s.w, height: s.h } });
  await page.goto(`${BASE}${s.url}`, { waitUntil: "load", timeout: 20_000 });
  await page.waitForTimeout(600);
  const m = await measure(page);
  await page.screenshot({ path: path.join(OUT, `${s.name}.png`), fullPage: false });
  report.push({ ...s, ...m });
  await page.close();
}

const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
await page.goto(`${BASE}/messagerie`, { waitUntil: "load", timeout: 20_000 });
await page.waitForTimeout(300);
const conv = page.locator("main aside button").filter({ hasNotText: "Écrire" }).nth(1);
if (await conv.count()) {
  await conv.click();
  await page.waitForTimeout(300);
  await page.screenshot({
    path: path.join(OUT, "after-04b-messagerie-fil-375.png"),
    fullPage: false,
  });
  report.push({
    name: "after-04b-messagerie-fil-375",
    ...(await measure(page)),
  });
}
await page.close();

console.log(JSON.stringify(report, null, 2));
await browser.close();
