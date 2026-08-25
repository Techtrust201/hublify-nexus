import type { DroitId, RoleId } from "@/auth/permissions";
import {
  COLLECTIONS_METIER,
  TABLE_COLLECTION,
  etatVide,
  type CollectionMetier,
  type EtatSession,
} from "@/data/etat-session";
import type { Sql } from "@/lib/sql";
import type { OrgType } from "@/lib/orgs";

const TABLES_AUTORISEES = new Set(Object.values(TABLE_COLLECTION));

export type OrgSession = {
  orgId: string;
  orgType: OrgType;
  roleId: RoleId;
  droits: readonly DroitId[];
};

function extraireId(item: unknown, indice: number): string {
  if (typeof item === "string") return item;
  if (item && typeof item === "object" && "id" in item && typeof item.id === "string") {
    return item.id;
  }
  return `ligne-${indice}`;
}

function payloadDe(item: unknown, id: string): unknown {
  if (typeof item === "string") return { id, date: item };
  return item;
}

export async function listerCollection(
  sql: Sql,
  table: string,
  orgId: string,
): Promise<unknown[]> {
  if (!TABLES_AUTORISEES.has(table)) throw new Error("Collection inconnue");
  const lignes = (await sql.query(
    `select id, payload from public.${table} where org_id = $1::uuid order by id`,
    [orgId],
  )) as { id: string; payload: unknown }[];
  return lignes.map((l) => l.payload);
}

export async function assemblerEtat(
  sql: Sql,
  org: OrgSession,
): Promise<EtatSession> {
  const vide = etatVide();
  const orgIdLecture = org.orgId;

  const lire = async (cle: CollectionMetier) => {
    if (org.orgType === "prestataire" && cle === "missions") {
      const lignes = (await sql.query(
        `select payload from public.missions where org_prestataire_id = $1::uuid order by id`,
        [orgIdLecture],
      )) as { payload: unknown }[];
      return lignes.map((l) => l.payload);
    }
    if (org.orgType === "prestataire" && cle !== "notifications" && cle !== "actions") {
      return [];
    }
    return listerCollection(sql, TABLE_COLLECTION[cle], orgIdLecture);
  };

  const etat: EtatSession = { ...vide };
  for (const cle of COLLECTIONS_METIER) {
    const items = await lire(cle);
    if (cle === "datesBloqueesAnnuelles") {
      etat[cle] = items.map((x) => {
        if (typeof x === "string") return x;
        if (x && typeof x === "object" && "date" in x && typeof x.date === "string") return x.date;
        if (x && typeof x === "object" && "id" in x && typeof x.id === "string") return x.id;
        return "";
      }).filter(Boolean);
    } else {
      (etat[cle] as unknown[]) = items;
    }
  }
  return etat;
}

export async function remplacerCollection(
  sql: Sql,
  orgId: string,
  collection: CollectionMetier,
  items: unknown[],
) {
  const table = TABLE_COLLECTION[collection];
  if (!TABLES_AUTORISEES.has(table)) throw new Error("Collection inconnue");
  await sql.query(`delete from public.${table} where org_id = $1::uuid`, [orgId]);
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const id = extraireId(item, i);
    const payload = payloadDe(item, id);
    if (table === "biens" && payload && typeof payload === "object" && "nom" in payload) {
      const raw = payload as { nom?: string; baseNuit?: unknown };
      const nom = String(raw.nom ?? id);
      const base = typeof raw.baseNuit === "number" ? raw.baseNuit : 0;
      await sql.query(
        `insert into public.biens (org_id, id, nom, base_nuit, payload, updated_at)
         values ($1::uuid, $2, $3, $4, $5::jsonb, now())`,
        [orgId, id, nom, base, JSON.stringify(payload)],
      );
    } else {
      await sql.query(
        `insert into public.${table} (org_id, id, payload, updated_at)
         values ($1::uuid, $2, $3::jsonb, now())`,
        [orgId, id, JSON.stringify(payload)],
      );
    }
  }
}

export async function upsertLigne(
  sql: Sql,
  orgId: string,
  collection: CollectionMetier,
  item: { id: string },
  orgPrestataireId?: string | null,
) {
  const table = TABLE_COLLECTION[collection];
  if (!TABLES_AUTORISEES.has(table)) throw new Error("Collection inconnue");
  if (table === "missions") {
    await sql.query(
      `insert into public.missions (org_id, id, payload, org_prestataire_id, updated_at)
       values ($1::uuid, $2, $3::jsonb, $4::uuid, now())
       on conflict (org_id, id) do update
         set payload = excluded.payload,
             org_prestataire_id = coalesce(excluded.org_prestataire_id, public.missions.org_prestataire_id),
             updated_at = now()`,
      [orgId, item.id, JSON.stringify(item), orgPrestataireId ?? null],
    );
    return;
  }
  if (table === "biens") {
    const nom = "nom" in item ? String(item.nom) : item.id;
    const base = "baseNuit" in item && typeof item.baseNuit === "number" ? item.baseNuit : 0;
    await sql.query(
      `insert into public.biens (org_id, id, nom, base_nuit, payload, updated_at)
       values ($1::uuid, $2, $3, $4, $5::jsonb, now())
       on conflict (org_id, id) do update
         set nom = excluded.nom, base_nuit = excluded.base_nuit, payload = excluded.payload, updated_at = now()`,
      [orgId, item.id, nom, base, JSON.stringify(item)],
    );
    return;
  }
  await sql.query(
    `insert into public.${table} (org_id, id, payload, updated_at)
     values ($1::uuid, $2, $3::jsonb, now())
     on conflict (org_id, id) do update set payload = excluded.payload, updated_at = now()`,
    [orgId, item.id, JSON.stringify(item)],
  );
}

export async function majLigneVisible(
  sql: Sql,
  org: OrgSession,
  collection: CollectionMetier,
  id: string,
  patch: Record<string, unknown>,
): Promise<boolean> {
  const table = TABLE_COLLECTION[collection];
  if (table === "missions") {
    const lignes = (await sql.query(
      `select org_id, payload from public.missions
       where id = $1 and (org_id = $2::uuid or org_prestataire_id = $2::uuid)
       limit 1`,
      [id, org.orgId],
    )) as { org_id: string; payload: Record<string, unknown> }[];
    const ligne = lignes[0];
    if (!ligne) return false;
    const prochain = { ...ligne.payload, ...patch, id };
    await sql.query(
      `update public.missions set payload = $1::jsonb, updated_at = now()
       where org_id = $2::uuid and id = $3`,
      [JSON.stringify(prochain), ligne.org_id, id],
    );
    return true;
  }
  const lignes = (await sql.query(
    `select payload from public.${table} where org_id = $1::uuid and id = $2 limit 1`,
    [org.orgId, id],
  )) as { payload: Record<string, unknown> }[];
  const ligne = lignes[0];
  if (!ligne) return false;
  const prochain = { ...ligne.payload, ...patch, id };
  await sql.query(
    `update public.${table} set payload = $1::jsonb, updated_at = now()
     where org_id = $2::uuid and id = $3`,
    [JSON.stringify(prochain), org.orgId, id],
  );
  return true;
}

export async function lireLigne(
  sql: Sql,
  orgId: string,
  collection: CollectionMetier,
  id: string,
): Promise<unknown | null> {
  const table = TABLE_COLLECTION[collection];
  const lignes = (await sql.query(
    `select payload from public.${table} where org_id = $1::uuid and id = $2 limit 1`,
    [orgId, id],
  )) as { payload: unknown }[];
  return lignes[0]?.payload ?? null;
}
