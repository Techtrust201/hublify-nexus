import { describe, expect, it } from "vitest";
import { compilerRequete, estUrlLocale } from "@/lib/sql";

function compiler(chaines: TemplateStringsArray, ...valeurs: unknown[]) {
  return compilerRequete(chaines, valeurs);
}

describe("compilerRequete", () => {
  it("place des placeholders sans interpoler les valeurs dans le SQL", () => {
    const id = "e9016520-9825-4a14-97bf-1642329da97c";
    const { texte, valeurs } = compiler`select payload from public.evenements where org_id = ${id}::uuid`;
    expect(texte).toBe("select payload from public.evenements where org_id = $1::uuid");
    expect(valeurs).toEqual([id]);
    expect(texte).not.toContain(id);
  });

  it("numérote plusieurs paramètres dans l'ordre", () => {
    const { texte, valeurs } = compiler`insert into t (a, b) values (${"x"}, ${2})`;
    expect(texte).toBe("insert into t (a, b) values ($1, $2)");
    expect(valeurs).toEqual(["x", 2]);
  });

  it("laisse intacte une requête sans paramètre", () => {
    const { texte, valeurs } = compiler`select 1`;
    expect(texte).toBe("select 1");
    expect(valeurs).toEqual([]);
  });

  it("refuse un modèle dont le nombre de trous ne correspond pas", () => {
    expect(() =>
      compilerRequete(Object.assign(["a", "b", "c"], { raw: ["a", "b", "c"] }), [1]),
    ).toThrow(/malformée/);
  });
});

describe("estUrlLocale", () => {
  it("désactive SSL sur loopback, pas sur un hôte distant", () => {
    expect(estUrlLocale("postgresql://127.0.0.1:5432/hublify")).toBe(true);
    expect(estUrlLocale("postgresql://localhost:5432/hublify")).toBe(true);
    expect(estUrlLocale("postgresql://u:p@ep-xxx.eu-central-1.aws.neon.tech/hublify")).toBe(false);
  });
});
