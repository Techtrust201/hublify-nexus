import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DROITS_PAR_ROLE, type RoleId } from "@/auth/permissions";
import { LIVRETS_INITIAUX, type LivretAccueil } from "@/data/livrets";
import type { OrgSession } from "@/data/metier";
import {
  enregistrerExtraPrecheckin,
  enregistrerFicheUpsell,
  lireExtraPrecheckinOrg,
  lireFichesUpsell,
  lireLivrets,
  remplacerLivrets,
  retirerFicheUpsell,
  type DepsOutils,
} from "@/data/outils-distant";
import { semerOutilsDemo } from "@/data/seed-outils";
import { FICHES_DEFAUT, type FicheUpsell } from "@/data/upsells-catalogue";
import { EXTRA_PRECHECKIN_DEFAUT, type ExtraPrecheckin } from "@/lib/gestionnaire-planning";
import type { Sql } from "@/lib/sql";

const ORG_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const ORG_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2";

type LivretRow = { id: string; payload: unknown; position: number };
type FicheRow = FicheUpsell;
type ExtraRow = {
  recto_verso: boolean;
  photo: boolean;
  fichier: boolean;
  telephone: boolean;
  code_porte_jour_arrivee: boolean;
  caution_active: boolean;
  caution_montant: number;
  caution_baux: boolean;
  caution_voyageurs: boolean;
  upsells_proposes: string[];
};

const EXTRA_VIDE: ExtraRow = {
  recto_verso: true,
  photo: true,
  fichier: true,
  telephone: true,
  code_porte_jour_arrivee: false,
  caution_active: false,
  caution_montant: 0,
  caution_baux: true,
  caution_voyageurs: true,
  upsells_proposes: [],
};

/**
 * Postgres miniature, cloisonné par org_id. Il interprète uniquement les
 * requêtes de `outils-distant` et `seed-outils` : un oubli de filtre d'org
 * se voit parce que la ligne n'est pas rangée sous la bonne clé.
 */
function sqlMemoire() {
  const livrets = new Map<string, LivretRow[]>();
  const fiches = new Map<string, Map<string, FicheRow>>();
  const extras = new Map<string, ExtraRow>();
  const appels: { texte: string; valeurs: unknown[] }[] = [];

  const query = (texte: string, valeurs: unknown[] = []) => {
    appels.push({ texte, valeurs: [...valeurs] });
    const t = texte.replace(/\s+/g, " ").trim().toLowerCase();
    if (t.includes("org_livrets")) return Promise.resolve(livretsSql(t, valeurs));
    if (t.includes("org_upsell_fiches")) return Promise.resolve(fichesSql(t, valeurs));
    if (t.includes("org_precheckin_extra")) return Promise.resolve(extraSql(t, valeurs));
    return Promise.reject(new Error(`SQL inattendu : ${t.slice(0, 100)}`));
  };

  function orgDe(valeurs: unknown[]) {
    return String(valeurs[0]);
  }

  function livretsSql(t: string, valeurs: unknown[]) {
    const org = orgDe(valeurs);
    if (t.includes("jsonb_to_recordset")) {
      const saisie = JSON.parse(String(valeurs[1])) as LivretRow[];
      livrets.set(
        org,
        saisie.map((ligne) => ({
          id: ligne.id,
          payload: ligne.payload,
          position: ligne.position,
        })),
      );
      return [];
    }
    if (t.includes("do nothing")) {
      const liste = livrets.get(org) ?? [];
      const id = String(valeurs[1]);
      if (!liste.some((ligne) => ligne.id === id)) {
        liste.push({
          id,
          payload: JSON.parse(String(valeurs[2])) as unknown,
          position: Number(valeurs[3]),
        });
        livrets.set(org, liste);
      }
      return [];
    }
    const liste = (livrets.get(org) ?? [])
      .slice()
      .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
    return liste.map((ligne) => ({
      id: ligne.id,
      payload: ligne.payload,
      position: ligne.position,
    }));
  }

  function sac(org: string) {
    let map = fiches.get(org);
    if (!map) {
      map = new Map();
      fiches.set(org, map);
    }
    return map;
  }

  function fichesSql(t: string, valeurs: unknown[]) {
    const org = orgDe(valeurs);
    if (t.startsWith("delete")) {
      sac(org).delete(String(valeurs[1]));
      return [];
    }
    if (t.includes("do nothing") || t.includes("do update")) {
      const id = String(valeurs[1]);
      const map = sac(org);
      if (t.includes("do nothing") && map.has(id)) return [];
      map.set(id, {
        code: String(valeurs[2]),
        type: String(valeurs[3]),
        prestataire: String(valeurs[4]),
        ville: String(valeurs[5]),
        pieceJointe: String(valeurs[6]),
      });
      return [];
    }
    return [...sac(org).entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([upsellId, fiche]) => ({
        upsell_id: upsellId,
        code: fiche.code,
        type: fiche.type,
        prestataire: fiche.prestataire,
        ville: fiche.ville,
        piece_jointe: fiche.pieceJointe,
      }));
  }

  function extraSql(t: string, valeurs: unknown[]) {
    const org = orgDe(valeurs);
    if (t.includes("do nothing")) {
      if (!extras.has(org)) extras.set(org, { ...EXTRA_VIDE, upsells_proposes: [] });
      return [];
    }
    if (t.includes("do update")) {
      extras.set(org, {
        recto_verso: Boolean(valeurs[1]),
        photo: Boolean(valeurs[2]),
        fichier: Boolean(valeurs[3]),
        telephone: Boolean(valeurs[4]),
        code_porte_jour_arrivee: Boolean(valeurs[5]),
        caution_active: Boolean(valeurs[6]),
        caution_montant: Number(valeurs[7]),
        caution_baux: Boolean(valeurs[8]),
        caution_voyageurs: Boolean(valeurs[9]),
        upsells_proposes: [...(valeurs[10] as string[])],
      });
      return [];
    }
    const row = extras.get(org);
    return row ? [{ ...row, upsells_proposes: [...row.upsells_proposes] }] : [];
  }

  const tag = Object.assign((_g: TemplateStringsArray, ..._v: unknown[]) => Promise.resolve([]), {
    query,
  }) as Sql;
  return { sql: tag, appels };
}

function session(roleId: RoleId, orgId: string): OrgSession {
  return {
    orgId,
    orgType: roleId === "prestataire" ? "prestataire" : "gestionnaire",
    roleId,
    droits: DROITS_PAR_ROLE[roleId],
  };
}

function depsPour(sql: Sql, roleId: RoleId, orgId: string): DepsOutils {
  return {
    sessionOrg: async () => session(roleId, orgId),
    sql: () => sql,
  };
}

const livret = (): LivretAccueil => ({
  ...LIVRETS_INITIAUX[0]!,
  pages: LIVRETS_INITIAUX[0]!.pages.map((page) => ({ ...page })),
});

describe("migration 014", () => {
  it("est additive : elle ne détruit aucune table", () => {
    const sql = readFileSync(
      new URL("../../db/migrations/014-livrets-upsells-precheckin.sql", import.meta.url),
      "utf8",
    ).toLowerCase();
    expect(sql).not.toMatch(/\bdrop\b/);
    expect(sql).not.toMatch(/\btruncate\b/);
    expect(sql).toContain("create table if not exists public.org_livrets");
    expect(sql).toContain("create table if not exists public.org_upsell_fiches");
    expect(sql).toContain("create table if not exists public.org_precheckin_extra");
  });
});

describe("livrets par organisation", () => {
  it("refuse sans session, sans base, au lecteur et au portail", async () => {
    const { sql, appels } = sqlMemoire();
    const anonyme: DepsOutils = { sessionOrg: async () => null, sql: () => sql };
    expect(await lireLivrets(anonyme)).toEqual({ ok: false, raison: "non_authentifie" });
    expect(await remplacerLivrets(anonyme, [livret()])).toEqual({
      ok: false,
      raison: "non_authentifie",
    });

    const sansBase = depsPour(sql, "gestionnaire", ORG_A);
    sansBase.sql = () => null;
    expect(await lireLivrets(sansBase)).toEqual({ ok: false, raison: "non_configure" });

    const lecteur = depsPour(sql, "lecteur", ORG_A);
    expect((await lireLivrets(lecteur)).ok).toBe(true);
    expect(await remplacerLivrets(lecteur, [livret()])).toEqual({ ok: false, raison: "interdit" });

    const voyageur = depsPour(sql, "voyageur", ORG_A);
    expect(await lireLivrets(voyageur)).toEqual({ ok: false, raison: "interdit" });
    expect(await remplacerLivrets(voyageur, [livret()])).toEqual({
      ok: false,
      raison: "interdit",
    });
    expect(appels.every((appel) => appel.valeurs[0] !== ORG_B)).toBe(true);
  });

  it("crée, modifie, relit, et n'expose rien à l'autre organisation", async () => {
    const { sql, appels } = sqlMemoire();
    const a = depsPour(sql, "gestionnaire", ORG_A);
    const b = depsPour(sql, "administrateur", ORG_B);
    const cree = livret();
    expect(await remplacerLivrets(a, [cree])).toEqual({ ok: true });

    const premiere = await lireLivrets(a);
    expect(premiere.ok && premiere.livrets.map((l) => l.nom)).toEqual([cree.nom]);

    const edite: LivretAccueil = { ...cree, nom: "Livret persisté" };
    expect(await remplacerLivrets(a, [edite])).toEqual({ ok: true });
    const relue = await lireLivrets(a);
    expect(relue.ok && relue.livrets.map((l) => l.nom)).toEqual(["Livret persisté"]);
    expect(appels.flatMap((appel) => appel.valeurs)).not.toContain(ORG_B);

    const autre = await lireLivrets(b);
    expect(autre.ok && autre.livrets).toEqual([]);
    expect(appels.some((appel) => appel.valeurs[0] === ORG_A)).toBe(true);
  });

  it("rejette un livret sans page et un doublon d'identifiant", async () => {
    const { sql } = sqlMemoire();
    const a = depsPour(sql, "gestionnaire", ORG_A);
    const source = livret();
    expect(await remplacerLivrets(a, [{ ...source, pages: [] }])).toEqual({
      ok: false,
      raison: "invalide",
    });
    expect(await remplacerLivrets(a, [source, { ...source }])).toEqual({
      ok: false,
      raison: "invalide",
    });
  });
});

describe("fiches upsell par organisation", () => {
  it("enregistre, relit, retire, et isole les organisations", async () => {
    const { sql } = sqlMemoire();
    const a = depsPour(sql, "gestionnaire", ORG_A);
    const b = depsPour(sql, "gestionnaire", ORG_B);
    const fiche: FicheUpsell = { ...FICHES_DEFAUT["u-dej"]!, ville: "Antibes" };

    expect(await enregistrerFicheUpsell(a, "u-dej", fiche)).toEqual({ ok: true });
    expect(await enregistrerFicheUpsell(b, "u-dej", { ...fiche, ville: "Lyon" })).toEqual({
      ok: true,
    });

    const lues = await lireFichesUpsell(a);
    expect(lues.ok && lues.fiches["u-dej"]?.ville).toBe("Antibes");
    const autres = await lireFichesUpsell(b);
    expect(autres.ok && autres.fiches["u-dej"]?.ville).toBe("Lyon");

    expect(await enregistrerFicheUpsell(a, "u-dej", { ...fiche, ville: "Nice" })).toEqual({
      ok: true,
    });
    const reeditees = await lireFichesUpsell(a);
    expect(reeditees.ok && reeditees.fiches["u-dej"]?.ville).toBe("Nice");
    const bApres = await lireFichesUpsell(b);
    expect(bApres.ok && bApres.fiches["u-dej"]?.ville).toBe("Lyon");

    expect(await retirerFicheUpsell(a, "u-dej")).toEqual({ ok: true });
    const vide = await lireFichesUpsell(a);
    expect(vide.ok && vide.fiches["u-dej"]).toBeUndefined();
    const bFinal = await lireFichesUpsell(b);
    expect(bFinal.ok && bFinal.fiches["u-dej"]?.ville).toBe("Lyon");
  });

  it("refuse le lecteur et le voyageur", async () => {
    const { sql } = sqlMemoire();
    const fiche = FICHES_DEFAUT["u-dej"]!;
    expect(await lireFichesUpsell(depsPour(sql, "lecteur", ORG_A))).toEqual({
      ok: false,
      raison: "interdit",
    });
    expect(await enregistrerFicheUpsell(depsPour(sql, "voyageur", ORG_A), "u-dej", fiche)).toEqual({
      ok: false,
      raison: "interdit",
    });
    expect(await enregistrerFicheUpsell(depsPour(sql, "gestionnaire", ORG_A), "  ", fiche)).toEqual(
      { ok: false, raison: "invalide" },
    );
  });
});

describe("extra pré-check-in par organisation", () => {
  it("enregistre, relit et n'écrase pas l'autre organisation", async () => {
    const { sql } = sqlMemoire();
    const a = depsPour(sql, "gestionnaire", ORG_A);
    const b = depsPour(sql, "gestionnaire", ORG_B);
    const extra: ExtraPrecheckin = {
      ...EXTRA_PRECHECKIN_DEFAUT,
      cautionActive: true,
      cautionMontant: 321,
      upsellsProposes: ["u-dej"],
      codePorteJourArrivee: true,
    };
    expect(await enregistrerExtraPrecheckin(a, extra)).toEqual({ ok: true });
    const relu = await lireExtraPrecheckinOrg(a);
    expect(relu.ok && relu.enregistre).toBe(true);
    expect(relu.ok && relu.extra.cautionMontant).toBe(321);
    expect(relu.ok && relu.extra.upsellsProposes).toEqual(["u-dej"]);
    expect(relu.ok && relu.extra.codePorteJourArrivee).toBe(true);

    const vide = await lireExtraPrecheckinOrg(b);
    expect(vide.ok && vide.enregistre).toBe(false);
    expect(vide.ok && vide.extra.cautionMontant).toBe(0);

    expect(
      await enregistrerExtraPrecheckin(b, { ...EXTRA_PRECHECKIN_DEFAUT, cautionMontant: 999 }),
    ).toEqual({ ok: true });
    const aToujours = await lireExtraPrecheckinOrg(a);
    expect(aToujours.ok && aToujours.extra.cautionMontant).toBe(321);
  });

  it("laisse le voyageur lire et lui interdit d'écrire", async () => {
    const { sql } = sqlMemoire();
    const gestionnaire = depsPour(sql, "gestionnaire", ORG_A);
    await enregistrerExtraPrecheckin(gestionnaire, {
      ...EXTRA_PRECHECKIN_DEFAUT,
      cautionActive: true,
      cautionMontant: 180,
      cautionVoyageurs: true,
    });
    const voyageur = depsPour(sql, "voyageur", ORG_A);
    const lu = await lireExtraPrecheckinOrg(voyageur);
    expect(lu.ok && lu.extra.cautionMontant).toBe(180);
    expect(
      await enregistrerExtraPrecheckin(voyageur, {
        ...EXTRA_PRECHECKIN_DEFAUT,
        cautionMontant: 1,
      }),
    ).toEqual({ ok: false, raison: "interdit" });
    const intact = await lireExtraPrecheckinOrg(gestionnaire);
    expect(intact.ok && intact.extra.cautionMontant).toBe(180);
    expect(await lireExtraPrecheckinOrg(depsPour(sql, "lecteur", ORG_A))).toMatchObject({
      ok: true,
    });
    expect(
      await enregistrerExtraPrecheckin(depsPour(sql, "lecteur", ORG_A), EXTRA_PRECHECKIN_DEFAUT),
    ).toEqual({ ok: false, raison: "interdit" });
  });
});

describe("semence démo idempotente", () => {
  it("insère les modèles puis ne réécrit pas une personnalisation", async () => {
    const { sql } = sqlMemoire();
    const a = depsPour(sql, "gestionnaire", ORG_A);
    await semerOutilsDemo(sql, ORG_A);

    const livrets = await lireLivrets(a);
    expect(livrets.ok && livrets.livrets.map((l) => l.id).sort()).toEqual(
      LIVRETS_INITIAUX.map((l) => l.id).sort(),
    );
    const fiches = await lireFichesUpsell(a);
    expect(fiches.ok && fiches.fiches["u-dej"]?.ville).toBe("Cannes");
    const extra = await lireExtraPrecheckinOrg(a);
    expect(extra.ok && extra.enregistre).toBe(true);

    const source = livrets.ok ? livrets.livrets : [];
    const personnalises = source.map((l) =>
      l.id === "livret-standard" ? { ...l, nom: "Livret de la maison" } : l,
    );
    expect(await remplacerLivrets(a, personnalises)).toEqual({ ok: true });
    expect(
      await enregistrerFicheUpsell(a, "u-dej", { ...FICHES_DEFAUT["u-dej"]!, ville: "Antibes" }),
    ).toEqual({ ok: true });
    expect(
      await enregistrerExtraPrecheckin(a, {
        ...EXTRA_PRECHECKIN_DEFAUT,
        cautionActive: true,
        cautionMontant: 450,
      }),
    ).toEqual({ ok: true });

    await semerOutilsDemo(sql, ORG_A);
    await semerOutilsDemo(sql, ORG_A);

    const livresApres = await lireLivrets(a);
    expect(livresApres.ok && livresApres.livrets.find((l) => l.id === "livret-standard")?.nom).toBe(
      "Livret de la maison",
    );
    const fichesApres = await lireFichesUpsell(a);
    expect(fichesApres.ok && fichesApres.fiches["u-dej"]?.ville).toBe("Antibes");
    const extraApres = await lireExtraPrecheckinOrg(a);
    expect(extraApres.ok && extraApres.extra.cautionMontant).toBe(450);

    const b = await lireLivrets(depsPour(sql, "gestionnaire", ORG_B));
    expect(b.ok && b.livrets).toEqual([]);
  });
});
