import { describe, expect, it, vi } from "vitest";
import { consommerQuotas, debutFenetre } from "@/lib/cadence-persistante";
import { reinitialiserCadence } from "@/lib/cadence-memoire";
import {
  adresseListeValide,
  DELAI_MINIMAL_MS,
  empreinteEmail,
  mailConfirmation,
  PLAFONDS,
  quotasListe,
  signesDeRobot,
  traiterInscription,
  validerEntreeListe,
  type Dependances,
} from "@/lib/liste-bailleurs";
import type { Sql } from "@/lib/sql";
import { verifierTurnstile } from "@/lib/turnstile";

const T0 = 1_800_000_000_000;

describe("adresse de la liste bailleurs", () => {
  it("accepte une adresse et refuse le reste", () => {
    expect(adresseListeValide("  Camille@Atelier.fr ")).toBe("camille@atelier.fr");
    expect(adresseListeValide("pas-une-adresse")).toBeNull();
    expect(adresseListeValide("")).toBeNull();
  });

  it("refuse les formes dangereuses ou absurdes", () => {
    for (const mauvaise of [
      '"<script>"@exemple.fr',
      "a b@exemple.fr",
      "a@exemple",
      "a@exemple.f",
      "a@-exemple.fr",
      "a..b@exemple.fr",
      ".a@exemple.fr",
      "a.@exemple.fr",
      "a@exemple.fr\r\nBcc: x@y.fr",
      "a@b.fr,c@d.fr",
      `${"a".repeat(65)}@exemple.fr`,
      `a@${"b".repeat(250)}.fr`,
      42,
      null,
      { email: "a@b.fr" },
    ]) {
      expect(adresseListeValide(mauvaise), String(mauvaise)).toBeNull();
    }
  });
});

describe("validation stricte de l'entrée", () => {
  const base = { email: "camille@atelier.fr", site: "", ouvertLe: T0 };

  it("accepte l'entrée du formulaire", () => {
    expect(validerEntreeListe(base)).toEqual({
      email: "camille@atelier.fr",
      piege: "",
      ouvertLe: T0,
    });
    expect(validerEntreeListe({ ...base, jeton: "x" }).jeton).toBe("x");
  });

  it("refuse champs inconnus, types faux et tailles excessives", () => {
    expect(() => validerEntreeListe(null)).toThrow();
    expect(() => validerEntreeListe([base])).toThrow();
    expect(() => validerEntreeListe({ ...base, admin: true })).toThrow();
    expect(() => validerEntreeListe({ ...base, email: "x" })).toThrow("Adresse e-mail invalide.");
    expect(() => validerEntreeListe({ ...base, ouvertLe: "1" })).toThrow();
    expect(() => validerEntreeListe({ ...base, ouvertLe: Number.NaN })).toThrow();
    expect(() => validerEntreeListe({ email: base.email, site: "" })).toThrow();
    expect(() => validerEntreeListe({ ...base, site: "x".repeat(201) })).toThrow();
    expect(() => validerEntreeListe({ ...base, jeton: "x".repeat(2049) })).toThrow();
  });
});

describe("signes de robot", () => {
  const entree = { email: "a@b.fr", piege: "", ouvertLe: T0 };
  it("champ piège rempli", () => {
    expect(signesDeRobot({ ...entree, piege: "http://spam" }, T0 + 10_000)).toBe(true);
  });
  it("envoi trop rapide, horodatage futur ou périmé", () => {
    expect(signesDeRobot(entree, T0 + DELAI_MINIMAL_MS - 1)).toBe(true);
    expect(signesDeRobot(entree, T0 - 1)).toBe(true);
    expect(signesDeRobot(entree, T0 + 25 * 60 * 60 * 1000)).toBe(true);
  });
  it("humain normal", () => {
    expect(signesDeRobot(entree, T0 + DELAI_MINIMAL_MS)).toBe(false);
  });
});

function dependances(surcharge: Partial<Dependances> = {}): Dependances {
  return {
    maintenant: () => T0 + 5000,
    consommer: vi.fn(async () => true),
    verifierCaptcha: vi.fn(async () => true),
    envoyer: vi.fn(async () => false),
    ...surcharge,
  };
}

describe("traiterInscription (aucun envoi réel : envoyer est simulé)", () => {
  const entree = { email: "camille@atelier.fr", piege: "", ouvertLe: T0 };

  it("cas nominal : quotas consommés puis mail préparé", async () => {
    const d = dependances();
    await expect(traiterInscription(entree, "liste-bailleurs:ip:192.0.2.1", d)).resolves.toEqual({
      ok: true,
      envoye: false,
    });
    expect(d.consommer).toHaveBeenCalledTimes(1);
    expect(d.envoyer).toHaveBeenCalledWith(mailConfirmation("camille@atelier.fr"));
  });

  it("robot : répond comme un succès sans rien compter ni envoyer", async () => {
    const d = dependances();
    await expect(
      traiterInscription({ ...entree, piege: "x" }, "liste-bailleurs:ip:192.0.2.1", d),
    ).resolves.toEqual({ ok: true, envoye: false });
    expect(d.consommer).not.toHaveBeenCalled();
    expect(d.envoyer).not.toHaveBeenCalled();
  });

  it("plafond atteint : erreur explicite, aucun envoi", async () => {
    const d = dependances({ consommer: vi.fn(async () => false) });
    await expect(traiterInscription(entree, "k", d)).rejects.toThrow("Trop de tentatives");
    expect(d.envoyer).not.toHaveBeenCalled();
  });

  it("captcha refusé : aucun quota consommé, aucun envoi", async () => {
    const d = dependances({ verifierCaptcha: vi.fn(async () => false) });
    await expect(traiterInscription(entree, "k", d)).rejects.toThrow("anti-robot");
    expect(d.consommer).not.toHaveBeenCalled();
    expect(d.envoyer).not.toHaveBeenCalled();
  });
});

describe("quotas et mail", () => {
  it("par IP, par e-mail (empreinte, jamais en clair) et global", async () => {
    const quotas = await quotasListe("camille@atelier.fr", "liste-bailleurs:ip:192.0.2.1");
    expect(quotas).toEqual([
      { cle: "liste-bailleurs:ip:192.0.2.1", ...PLAFONDS.ip },
      {
        cle: `liste-bailleurs:email:${await empreinteEmail("camille@atelier.fr")}`,
        ...PLAFONDS.email,
      },
      { cle: "liste-bailleurs:global", ...PLAFONDS.global },
    ]);
    expect(JSON.stringify(quotas)).not.toContain("camille");
  });

  it("échappe l'adresse dans le HTML", () => {
    expect(mailConfirmation("a'b@exemple.fr").html).toContain("a&#39;b@exemple.fr");
  });
});

describe("consommerQuotas", () => {
  it("fenêtre fixe", () => {
    expect(debutFenetre(T0 + 1234, 1000).getTime()).toBe(T0 + 1000);
  });

  it("persistant : refuse dès qu'un compteur dépasse son plafond", async () => {
    const compteurs = new Map<string, number>();
    const requetes: string[] = [];
    const sql = (async (chaines: TemplateStringsArray, ...valeurs: unknown[]) => {
      const texte = chaines.join("?");
      requetes.push(texte);
      if (texte.includes("insert into public.cadence_publique")) {
        const cle = `${String(valeurs[0])}|${String(valeurs[1])}`;
        const n = (compteurs.get(cle) ?? 0) + 1;
        compteurs.set(cle, n);
        return [{ nombre: n }];
      }
      return [];
    }) as unknown as Sql;
    const quotas = [
      { cle: "ip", max: 2, fenetreMs: 60_000 },
      { cle: "global", max: 10, fenetreMs: 60_000 },
    ];
    expect(await consommerQuotas(sql, quotas, T0, false)).toBe(true);
    expect(await consommerQuotas(sql, quotas, T0 + 1, false)).toBe(true);
    expect(await consommerQuotas(sql, quotas, T0 + 2, false)).toBe(false);
    expect(await consommerQuotas(sql, quotas, T0 + 60_000, false)).toBe(true);
    expect(requetes.some((r) => r.includes("delete"))).toBe(false);
    await consommerQuotas(sql, quotas, T0 + 60_001, true);
    expect(requetes.some((r) => r.includes("delete from public.cadence_publique"))).toBe(true);
  });

  it("table absente (migration non appliquée) : repli sur la mémoire", async () => {
    reinitialiserCadence();
    const sql = (async () => {
      throw Object.assign(new Error("relation does not exist"), { code: "42P01" });
    }) as unknown as Sql;
    const quotas = [{ cle: "repli", max: 1, fenetreMs: 60_000 }];
    expect(await consommerQuotas(sql, quotas, T0, false)).toBe(true);
    expect(await consommerQuotas(sql, quotas, T0 + 1, false)).toBe(false);
  });

  it("autre erreur base : remontée, pas avalée", async () => {
    const sql = (async () => {
      throw Object.assign(new Error("boom"), { code: "57P01" });
    }) as unknown as Sql;
    await expect(
      consommerQuotas(sql, [{ cle: "x", max: 1, fenetreMs: 1 }], T0, false),
    ).rejects.toThrow("boom");
  });

  it("sans base : mémoire", async () => {
    reinitialiserCadence();
    const quotas = [{ cle: "sans-base", max: 1, fenetreMs: 60_000 }];
    expect(await consommerQuotas(null, quotas, T0, false)).toBe(true);
    expect(await consommerQuotas(null, quotas, T0 + 1, false)).toBe(false);
  });
});

describe("Turnstile (désactivé par défaut, aucun appel réseau réel)", () => {
  it("sans clé secrète : toujours accepté, pas d'appel", async () => {
    const appel = vi.fn();
    await expect(verifierTurnstile(undefined, undefined, {}, appel)).resolves.toBe(true);
    expect(appel).not.toHaveBeenCalled();
  });

  it("avec clé : jeton requis et vérifié auprès de Cloudflare", async () => {
    const env = { TURNSTILE_SECRET_KEY: "cle-de-test" };
    const ok = vi.fn(async () => new Response(JSON.stringify({ success: true })));
    const ko = vi.fn(async () => new Response(JSON.stringify({ success: false })));
    await expect(verifierTurnstile(undefined, undefined, env, ok)).resolves.toBe(false);
    expect(ok).not.toHaveBeenCalled();
    await expect(verifierTurnstile("jeton", "192.0.2.1", env, ok)).resolves.toBe(true);
    const corps = (ok.mock.calls[0] as unknown as [string, { body: URLSearchParams }])[1].body;
    expect(corps.get("response")).toBe("jeton");
    expect(corps.get("remoteip")).toBe("192.0.2.1");
    await expect(verifierTurnstile("jeton", undefined, env, ko)).resolves.toBe(false);
    const panne = vi.fn(async () => {
      throw new Error("réseau");
    });
    await expect(verifierTurnstile("jeton", undefined, env, panne)).resolves.toBe(false);
  });
});
