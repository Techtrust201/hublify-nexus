import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  chargerEntite,
  lireAcces,
  lireEtat,
  modifierEntite,
  type DepsEtat,
} from "@/data/etat-distant";
import { assemblerEtat, lireMissionsPrestataire, type OrgSession } from "@/data/metier";
import { filtrerEtatPourRole } from "@/data/portee-role";
import { etatVide } from "@/data/etat-session";
import { DROITS_PAR_ROLE, type RoleId } from "@/auth/permissions";
import type { Sql } from "@/lib/sql";

// Données fictives uniquement. Aucune connexion réelle : la base est simulée.
const ORG_GEST = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const ORG_PRESTA = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2";
const ORG_TIERCE = "cccccccc-cccc-4ccc-8ccc-ccccccccccc3";
const ORG_SOLO = "dddddddd-dddd-4ddd-8ddd-ddddddddddd4";

const ALICE = "alice@exemple.test";
const BRUNO = "bruno@exemple.test";
const CHLOE = "chloe@exemple.test";
const SOLO = "solo@exemple.test";

type MissionFictive = {
  id: string;
  org_id: string;
  org_prestataire_id: string | null;
  assigne: string;
  bienId: string;
};

const MISSIONS: MissionFictive[] = [
  {
    id: "m-alice",
    org_id: ORG_GEST,
    org_prestataire_id: ORG_PRESTA,
    assigne: ALICE,
    bienId: "b-alice",
  },
  {
    id: "m-bruno",
    org_id: ORG_GEST,
    org_prestataire_id: ORG_PRESTA,
    assigne: BRUNO,
    bienId: "b-bruno",
  },
  // Pas encore attribuée à une personne de l'organisation prestataire.
  {
    id: "m-libre",
    org_id: ORG_GEST,
    org_prestataire_id: ORG_PRESTA,
    assigne: "",
    bienId: "b-libre",
  },
  // Mission de la même organisation gestionnaire, sans prestataire.
  {
    id: "m-interne",
    org_id: ORG_GEST,
    org_prestataire_id: null,
    assigne: "Lucas Interne",
    bienId: "b-interne",
  },
  // Organisation prestataire tierce.
  {
    id: "m-tierce",
    org_id: ORG_GEST,
    org_prestataire_id: ORG_TIERCE,
    assigne: CHLOE,
    bienId: "b-tierce",
  },
  // Organisation prestataire d'un seul compte (cas du compte de démo : un nom, pas un e-mail).
  {
    id: "m-solo",
    org_id: ORG_GEST,
    org_prestataire_id: ORG_SOLO,
    assigne: "Solo Menage",
    bienId: "b-solo",
  },
  // Autre organisation gestionnaire.
  {
    id: "m-autre-org",
    org_id: ORG_TIERCE,
    org_prestataire_id: null,
    assigne: CHLOE,
    bienId: "b-autre",
  },
];

// Deux prestataires actifs dans ORG_PRESTA (et un invité en attente qui ne compte pas), un seul dans ORG_SOLO.
const MEMBRES = [
  { org_id: ORG_PRESTA, role_id: "prestataire", statut: "actif" },
  { org_id: ORG_PRESTA, role_id: "prestataire", statut: "actif" },
  { org_id: ORG_PRESTA, role_id: "prestataire", statut: "attente" },
  { org_id: ORG_PRESTA, role_id: "administrateur", statut: "actif" },
  { org_id: ORG_TIERCE, role_id: "prestataire", statut: "actif" },
  { org_id: ORG_SOLO, role_id: "prestataire", statut: "actif" },
  { org_id: ORG_SOLO, role_id: "prestataire", statut: "attente" },
];

const CONVERSATIONS = [
  { id: "c-voyageur", org_id: ORG_GEST, type: "voyageur", nom: "Fil voyageur", assigne: "" },
  { id: "c-alice", org_id: ORG_GEST, type: "prestataire", nom: "Fil Alice", assigne: ALICE },
  { id: "c-bruno", org_id: ORG_GEST, type: "prestataire", nom: "Fil Bruno", assigne: BRUNO },
];

const BIENS = ["b-alice", "b-bruno", "b-libre", "b-interne", "b-tierce", "b-solo"].map((id) => ({
  id,
  org_id: ORG_GEST,
  nom: `Logement ${id}`,
}));

const ACCES = BIENS.map((b) => ({ org_id: ORG_GEST, bienId: b.id, codeCles: `code-${b.id}` }));

const LIENS = [
  { org_prestataire_id: ORG_PRESTA, id: ORG_GEST },
  { org_prestataire_id: ORG_TIERCE, id: ORG_GEST },
  { org_prestataire_id: ORG_SOLO, id: ORG_GEST },
];

function sansChampsInternes<T extends Record<string, unknown>>(ligne: T) {
  const { org_id: _o, org_prestataire_id: _p, ...reste } = ligne;
  return reste;
}

/** Base simulée : elle ne répond qu'aux requêtes que le serveur émet pour ces cas. */
function fausseBase() {
  const query = async (texte: string, v: unknown[] = []) => {
    const t = texte.replace(/\s+/g, " ");
    if (/from public\.org_membres/.test(t)) {
      return [
        {
          n: MEMBRES.filter(
            (m) => m.org_id === v[0] && m.role_id === "prestataire" && m.statut !== "attente",
          ).length,
        },
      ];
    }
    if (/from public\.missions/.test(t)) {
      if (/org_prestataire_id = \$1/.test(t)) {
        return MISSIONS.filter((m) => m.org_prestataire_id === v[0]).map((m) => ({
          ...sansChampsInternes(m),
          date: "2026-11-18",
          titre: "Intervention",
          type: "Menage",
          statut: "a_faire",
        }));
      }
      if (/where org_id = \$1/.test(t)) {
        return MISSIONS.filter((m) => m.org_id === v[0]).map((m) => ({
          ...sansChampsInternes(m),
          date: "2026-11-18",
          titre: "Intervention",
          type: "Menage",
          statut: "a_faire",
        }));
      }
    }
    if (/from public\.liens_org/.test(t)) {
      return LIENS.filter((l) => l.org_prestataire_id === v[0]).map((l) => ({ id: l.id }));
    }
    if (/from public\.biens/.test(t)) {
      const ids = (v[1] as string[] | undefined) ?? null;
      return BIENS.filter((b) => b.org_id === v[0] && (!ids || ids.includes(b.id))).map(
        sansChampsInternes,
      );
    }
    if (/from public\.conversations/.test(t)) {
      return CONVERSATIONS.filter((c) => c.org_id === v[0]).map(sansChampsInternes);
    }
    if (/from public\.lieux_acces/.test(t)) {
      return ACCES.filter((a) => a.org_id === v[0]).map(sansChampsInternes);
    }
    if (/^update public\.missions/.test(t)) {
      const id = v[v.length - 2];
      const org = v[v.length - 1];
      return MISSIONS.filter(
        (m) => m.id === id && (m.org_id === org || m.org_prestataire_id === org),
      ).map((m) => ({ id: m.id }));
    }
    return [];
  };
  const appels: string[] = [];
  const espion = async (texte: string, v?: unknown[]) => {
    appels.push(texte.replace(/\s+/g, " "));
    return query(texte, v);
  };
  const tag = Object.assign(async () => [], { query: espion }) as unknown as Sql;
  return { tag, appels };
}

function compte(
  orgId: string,
  orgType: "gestionnaire" | "prestataire",
  roleId: RoleId,
  email: string,
  nom = "",
): OrgSession {
  return {
    orgId,
    orgType,
    roleId,
    droits: [...DROITS_PAR_ROLE[roleId]],
    email,
    prenom: "Test",
    nom,
  };
}

function deps(org: OrgSession) {
  const base = fausseBase();
  const d: DepsEtat = {
    sessionOrg: async () => org,
    sql: () => base.tag,
    cleChiffrement: () => "cle-de-test",
  };
  return { d, ...base };
}

async function etatDe(org: OrgSession) {
  const { d } = deps(org);
  const r = await lireEtat(d);
  if (!r.ok) throw new Error(r.raison);
  return r.payload;
}

const ids = (liste: { id: string }[]) => liste.map((m) => m.id).sort();

describe("portail prestataire — missions envoyées par le serveur", () => {
  it("deux prestataires d'une même organisation ne reçoivent chacun que leurs missions", async () => {
    const alice = await etatDe(compte(ORG_PRESTA, "prestataire", "prestataire", ALICE, "Alice"));
    const bruno = await etatDe(compte(ORG_PRESTA, "prestataire", "prestataire", BRUNO, "Bruno"));
    expect(ids(alice.missions)).toEqual(["m-alice"]);
    expect(ids(bruno.missions)).toEqual(["m-bruno"]);
    expect(JSON.stringify(alice)).not.toContain("m-bruno");
    expect(JSON.stringify(bruno)).not.toContain("m-alice");
  });

  it("ne donne ni les logements ni les fils d'un collègue", async () => {
    const alice = await etatDe(compte(ORG_PRESTA, "prestataire", "prestataire", ALICE, "Alice"));
    expect(ids(alice.biens)).toEqual(["b-alice"]);
    expect(ids(alice.conversations)).toEqual(["c-alice"]);
  });

  it("la casse et les espaces de l'e-mail ne changent rien, un autre e-mail ne donne rien", async () => {
    const maj = await etatDe(
      compte(ORG_PRESTA, "prestataire", "prestataire", "  Alice@Exemple.TEST ", "Alice"),
    );
    expect(ids(maj.missions)).toEqual(["m-alice"]);
    const inconnu = await etatDe(
      compte(ORG_PRESTA, "prestataire", "prestataire", "inconnu@exemple.test", "Alice"),
    );
    expect(inconnu.missions).toEqual([]);
    expect(inconnu.biens).toEqual([]);
  });

  it("un prestataire d'une organisation tierce ne reçoit rien des autres organisations", async () => {
    const chloe = await etatDe(compte(ORG_TIERCE, "prestataire", "prestataire", CHLOE, "Chloé"));
    expect(ids(chloe.missions)).toEqual(["m-tierce"]);
    expect(JSON.stringify(chloe)).not.toMatch(/m-alice|m-bruno|m-libre|m-solo|m-interne/);
  });

  it("un nom vide ou sans e-mail ne donne pas toutes les missions", async () => {
    const nomVide = await etatDe(compte(ORG_PRESTA, "prestataire", "prestataire", ALICE, ""));
    expect(ids(nomVide.missions)).toEqual(["m-alice"]);
    const sansEmail = await etatDe(compte(ORG_PRESTA, "prestataire", "prestataire", "", ""));
    expect(sansEmail.missions).toEqual([]);
    const emailSansArobase = await etatDe(
      compte(ORG_PRESTA, "prestataire", "prestataire", "alice", ""),
    );
    expect(emailSansArobase.missions).toEqual([]);
  });

  it("un morceau de nom, ou « lucas », ne donne aucune mission", async () => {
    const e = compte(ORG_PRESTA, "prestataire", "prestataire", "lucas@exemple.test", "Lucas");
    expect(ids((await etatDe(e)).missions)).toEqual([]);
  });

  it("une mission sans personne attribuée n'est envoyée à aucun prestataire d'une équipe", async () => {
    const alice = await etatDe(compte(ORG_PRESTA, "prestataire", "prestataire", ALICE, "Alice"));
    const bruno = await etatDe(compte(ORG_PRESTA, "prestataire", "prestataire", BRUNO, "Bruno"));
    expect(ids(alice.missions)).not.toContain("m-libre");
    expect(ids(bruno.missions)).not.toContain("m-libre");
  });

  it("non-régression : le seul prestataire d'une organisation (compte de démo) garde sa mission", async () => {
    const solo = await etatDe(compte(ORG_SOLO, "prestataire", "prestataire", SOLO, "Menage"));
    expect(ids(solo.missions)).toEqual(["m-solo"]);
    expect(ids(solo.biens)).toEqual(["b-solo"]);
  });

  it("un administrateur d'une organisation prestataire garde toutes les missions de l'organisation", async () => {
    const admin = await etatDe(
      compte(ORG_PRESTA, "prestataire", "administrateur", "admin@exemple.test", "Admin"),
    );
    expect(ids(admin.missions)).toEqual(["m-alice", "m-bruno", "m-libre"]);
  });
});

describe("portail prestataire — rôle mal rattaché à une organisation gestionnaire", () => {
  const malRattache = compte(ORG_GEST, "gestionnaire", "prestataire", ALICE, "Alice");

  it("ne reçoit rien : ni missions, ni documents, ni messages, ni logements", async () => {
    const etat = await etatDe(malRattache);
    expect(etat).toEqual(etatVide());
    expect(etat.missions).toEqual([]);
    expect(etat.documents).toEqual([]);
    expect(etat.conversations).toEqual([]);
    expect(etat.messagesFil).toEqual([]);
    expect(etat.biens).toEqual([]);
  });

  it("n'émet aucune lecture de données de l'organisation", async () => {
    const { tag, appels } = fausseBase();
    await assemblerEtat(tag, malRattache);
    expect(appels).toEqual([]);
  });

  it("ne peut lire aucune fiche seule", async () => {
    const { d } = deps(malRattache);
    for (const [collection, id] of [
      ["missions", "m-alice"],
      ["missions", "m-interne"],
      ["biens", "b-alice"],
      ["conversations", "c-voyageur"],
    ] as const) {
      const r = await chargerEntite(d, collection, id);
      expect(r).toEqual({ ok: false, raison: "introuvable" });
    }
  });

  it("ne reçoit aucun code d'accès de logement", async () => {
    const { d, appels } = deps(malRattache);
    const r = await lireAcces(d);
    expect(r).toEqual({ ok: true, acces: [] });
    expect(appels.some((a) => a.includes("lieux_acces"))).toBe(false);
  });

  it("ne peut modifier aucune mission de l'organisation", async () => {
    const { d, appels } = deps(malRattache);
    const r = await modifierEntite(d, "missions", "m-interne", { statut: "terminee" });
    expect(r).toEqual({ ok: false, raison: "introuvable" });
    expect(appels.some((a) => a.startsWith("update public.missions"))).toBe(false);
  });

  it("la défense du filtre de rôle renvoie un état vide pour un rôle prestataire", () => {
    const plein = { ...etatVide(), missions: [{ id: "m1" }] } as unknown as ReturnType<
      typeof etatVide
    >;
    const filtre = filtrerEtatPourRole(plein, malRattache);
    expect(filtre.missions).toEqual([]);
    expect(filtre.documents).toEqual([]);
    expect(filtre.conversations).toEqual([]);
  });
});

describe("portail prestataire — fiche seule et codes d'accès", () => {
  const alice = compte(ORG_PRESTA, "prestataire", "prestataire", ALICE, "Alice");

  it("lit sa mission, mais pas celle d'un collègue ni d'une autre organisation", async () => {
    const { d } = deps(alice);
    const mienne = await chargerEntite(d, "missions", "m-alice");
    expect(mienne.ok).toBe(true);
    for (const id of ["m-bruno", "m-libre", "m-tierce", "m-interne", "m-autre-org"]) {
      expect(await chargerEntite(d, "missions", id)).toEqual({ ok: false, raison: "introuvable" });
    }
  });

  it("ne reçoit que le code des logements de ses propres missions", async () => {
    const { d } = deps(alice);
    const r = await lireAcces(d);
    if (!r.ok) throw new Error(r.raison);
    expect(r.acces.map((a) => a.bienId)).toEqual(["b-alice"]);
    expect(JSON.stringify(r)).not.toContain("code-b-bruno");
  });

  it("un prestataire sans e-mail ne reçoit aucun code d'accès", async () => {
    const { d } = deps(compte(ORG_PRESTA, "prestataire", "prestataire", "", ""));
    const r = await lireAcces(d);
    if (!r.ok) throw new Error(r.raison);
    expect(r.acces).toEqual([]);
  });

  it("non-régression : le seul prestataire d'une organisation reçoit le code de son logement", async () => {
    const { d } = deps(compte(ORG_SOLO, "prestataire", "prestataire", SOLO, "Menage"));
    const r = await lireAcces(d);
    if (!r.ok) throw new Error(r.raison);
    expect(r.acces.map((a) => a.bienId)).toEqual(["b-solo"]);
  });

  it("change le statut de sa mission, pas celui d'un collègue", async () => {
    const { d } = deps(alice);
    expect(await modifierEntite(d, "missions", "m-alice", { statut: "en_cours" })).toEqual({
      ok: true,
    });
    expect(await modifierEntite(d, "missions", "m-bruno", { statut: "en_cours" })).toEqual({
      ok: false,
      raison: "introuvable",
    });
  });
});

describe("gestionnaires et administrateurs — non-régression", () => {
  it("un administrateur de l'organisation gestionnaire reçoit toutes les missions de l'organisation", async () => {
    const admin = await etatDe(
      compte(ORG_GEST, "gestionnaire", "administrateur", "admin@exemple.test", "Admin"),
    );
    expect(ids(admin.missions)).toEqual([
      "m-alice",
      "m-bruno",
      "m-interne",
      "m-libre",
      "m-solo",
      "m-tierce",
    ]);
  });

  it("un gestionnaire reçoit lui aussi toutes les missions de l'organisation", async () => {
    const gest = await etatDe(
      compte(ORG_GEST, "gestionnaire", "gestionnaire", "gest@exemple.test", "Gest"),
    );
    expect(ids(gest.missions)).toEqual([
      "m-alice",
      "m-bruno",
      "m-interne",
      "m-libre",
      "m-solo",
      "m-tierce",
    ]);
    const { d } = deps(
      compte(ORG_GEST, "gestionnaire", "gestionnaire", "gest@exemple.test", "Gest"),
    );
    const fiche = await lireAcces(d);
    expect(fiche.ok).toBe(true);
  });

  it("lireMissionsPrestataire ne s'applique qu'aux comptes d'une organisation prestataire", async () => {
    const { tag } = fausseBase();
    const m = await lireMissionsPrestataire(
      tag,
      compte(ORG_GEST, "gestionnaire", "prestataire", ALICE, "Alice"),
    );
    expect(m).toEqual([]);
  });
});

describe("écran des missions du portail", () => {
  it("n'a plus de filtre par nom ni de nom écrit en dur : il affiche ce que le serveur envoie", () => {
    const source = readFileSync("src/components/portail/MissionsPortail.tsx", "utf8");
    expect(source.toLowerCase()).not.toContain("lucas");
    expect(source).not.toContain("includes(");
  });
});
