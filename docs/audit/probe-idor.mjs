// Sonde de sécurité : un compte à faibles droits ne doit pas pouvoir lire
// l'état métier d'un autre compte via l'endpoint /_serverFn, même en forgeant
// un userId dans la requête.
//
// Usage : set -a && . ./.env.local && set +a && node docs/audit/probe-idor.mjs

import { chromium } from "playwright";

const BASE = process.env["BASE"] ?? "http://127.0.0.1:8080";
const MDP = process.env["DEMO_AUTH_PASSWORD"] ?? "Hublify-Demo-2026!";
const ADMIN = "contact@tech-trust.fr";
const LECTEUR = "claire.lecture@hublify.app";

const nav = await chromium.launch({
  headless: true,
  executablePath: "/usr/bin/google-chrome-stable",
  args: ["--no-sandbox", "--disable-gpu"],
});

/** Ouvre un contexte authentifié et capture l'appel de chargement d'état. */
async function ouvrirSession(email) {
  const ctx = await nav.newContext({ baseURL: BASE });
  const page = await ctx.newPage();
  const rep = await page.request.post("/api/auth/sign-in/email", {
    data: { email, password: MDP },
  });
  if (!rep.ok()) throw new Error(`connexion refusée pour ${email} : ${rep.status()}`);

  const session = await (await page.request.get("/api/auth/get-session")).json();
  const userId = session?.user?.id;

  let appel = null;
  page.on("request", (r) => {
    const u = r.url();
    if (appel || !u.includes("/_serverFn/")) return;
    const jeton = u.split("/_serverFn/")[1]?.split("?")[0] ?? "";
    let decode = "";
    try {
      decode = Buffer.from(jeton, "base64").toString("utf8");
    } catch {
      return;
    }
    if (decode.includes("session-remote")) appel = { url: u, headers: r.headers() };
  });

  await page.goto("/", { waitUntil: "load" });
  for (let i = 0; i < 60 && !appel; i += 1) await page.waitForTimeout(250);
  if (!appel) throw new Error(`appel de chargement d'état non capté pour ${email}`);
  return { ctx, page, userId, appel };
}

/** Rejoue l'appel depuis la page (cookies + Origin réels), éventuellement forgé. */
async function lireEtat(page, appel, userIdForge) {
  const urls = userIdForge
    ? [
        `${appel.url}${appel.url.includes("?") ? "&" : "?"}payload=${encodeURIComponent(
          JSON.stringify({ data: { userId: userIdForge } }),
        )}`,
        `${appel.url}${appel.url.includes("?") ? "&" : "?"}data=${encodeURIComponent(
          JSON.stringify({ userId: userIdForge }),
        )}`,
      ]
    : [appel.url];

  const resultats = [];
  for (const url of urls) {
    const r = await page.evaluate(
      async ([u, h]) => {
        const rep = await fetch(u, { headers: h, credentials: "include" });
        return { statut: rep.status, corps: await rep.text() };
      },
      [url, appel.headers],
    );
    resultats.push({ url, ...r });
  }
  return resultats;
}

const empreinte = (corps) => `${corps.length} octets`;
const extraitTitres = (corps) => [...corps.matchAll(/"titre":"([^"]{3,40})"/g)].map((m) => m[1]);

const admin = await ouvrirSession(ADMIN);
const lecteur = await ouvrirSession(LECTEUR);

console.log("admin   userId", admin.userId);
console.log("lecteur userId", lecteur.userId);
if (admin.userId === lecteur.userId) throw new Error("les deux comptes ont le même id");

const [etatAdmin] = await lireEtat(admin.page, admin.appel);
const [etatLecteur] = await lireEtat(lecteur.page, lecteur.appel);
console.log("état admin  ", etatAdmin.statut, empreinte(etatAdmin.corps));
console.log("état lecteur", etatLecteur.statut, empreinte(etatLecteur.corps));

const forges = await lireEtat(lecteur.page, lecteur.appel, admin.userId);

let verdict = "OK";
for (const f of forges) {
  const identiqueAdmin = f.corps === etatAdmin.corps;
  const identiqueLecteur = f.corps === etatLecteur.corps;
  console.log(
    `\nforge -> ${f.url.slice(f.url.indexOf("?"))}\n  statut ${f.statut} ${empreinte(f.corps)}` +
      `\n  identique à l'état admin   : ${identiqueAdmin}` +
      `\n  identique à l'état lecteur : ${identiqueLecteur}`,
  );
  if (identiqueAdmin && !identiqueLecteur) verdict = "FUITE";
}

// Contrôle croisé : un titre présent chez l'admin et absent chez le lecteur
// ne doit jamais apparaître dans une réponse servie au lecteur.
const titresAdmin = new Set(extraitTitres(etatAdmin.corps));
const titresLecteur = new Set(extraitTitres(etatLecteur.corps));
const propresAdmin = [...titresAdmin].filter((t) => !titresLecteur.has(t));
console.log("\ntitres propres à l'admin :", propresAdmin.length ? propresAdmin : "(aucun)");
for (const f of forges) {
  const fuite = propresAdmin.filter((t) => f.corps.includes(t));
  if (fuite.length) {
    verdict = "FUITE";
    console.log("  FUITE via titres :", fuite);
  }
}

console.log(`\nVERDICT : ${verdict}`);
await nav.close();
process.exit(verdict === "OK" ? 0 : 1);
