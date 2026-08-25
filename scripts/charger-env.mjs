import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Charge `.env.local` puis `.env` sans écraser une variable déjà présente.
 * Doit être importé **en premier** : Better Auth lit DATABASE_URL à l'init du module.
 */
for (const fichier of [".env.local", ".env"]) {
  const chemin = resolve(fichier);
  if (!existsSync(chemin)) continue;
  for (const ligne of readFileSync(chemin, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(ligne);
    if (!m?.[1] || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = (m[2] ?? "").trim().replace(/^["']|["']$/g, "");
  }
}
