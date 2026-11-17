import { autoriserCadence } from "@/lib/cadence-memoire";
import type { Sql } from "@/lib/sql";

export type Quota = { cle: string; max: number; fenetreMs: number };

/** Début de la fenêtre fixe qui contient `maintenant`. */
export function debutFenetre(maintenant: number, fenetreMs: number) {
  return new Date(Math.floor(maintenant / fenetreMs) * fenetreMs);
}

function tableAbsente(erreur: unknown) {
  return (erreur as { code?: string } | null)?.code === "42P01";
}

/**
 * Compte une tentative pour chaque quota et dit si TOUS restent sous leur plafond.
 * Persistant (table `cadence_publique`) pour tenir entre instances serverless.
 * Sans base, ou tant que la migration 021 n'est pas appliquée, retombe sur le
 * compteur en mémoire : la protection baisse mais le formulaire ne casse pas.
 */
export async function consommerQuotas(
  sql: Sql | null,
  quotas: Quota[],
  maintenant = Date.now(),
  purger = Math.random() < 0.02,
) {
  if (!sql) return quotas.every((q) => autoriserCadence(q.cle, q.max, q.fenetreMs, maintenant));
  try {
    let autorise = true;
    for (const q of quotas) {
      const lignes = (await sql`
        insert into public.cadence_publique (cle, fenetre, nombre)
        values (${q.cle}, ${debutFenetre(maintenant, q.fenetreMs).toISOString()}::timestamptz, 1)
        on conflict (cle, fenetre) do update set nombre = public.cadence_publique.nombre + 1
        returning nombre
      `) as { nombre: number }[];
      if (Number(lignes[0]?.nombre ?? 0) > q.max) autorise = false;
    }
    if (purger) {
      await sql`delete from public.cadence_publique where fenetre < now() - interval '2 days'`;
    }
    return autorise;
  } catch (erreur) {
    if (!tableAbsente(erreur)) throw erreur;
    return quotas.every((q) => autoriserCadence(q.cle, q.max, q.fenetreMs, maintenant));
  }
}
