import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = "http://127.0.0.1:8080";
const OUT = path.resolve("docs/audit");

/** Paires de référence (PNG gitignorés). Relancer avec le serveur local. */
const shots = [
  { name: "after-dashboard-375", url: "/", w: 375, h: 812 },
  { name: "after-occupants-375", url: "/occupants", w: 375, h: 812 },
  { name: "after-messagerie-375", url: "/messagerie", w: 375, h: 812 },
  { name: "after-dashboard-1440", url: "/", w: 1440, h: 900 },
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

console.log(JSON.stringify(report, null, 2));
await browser.close();
