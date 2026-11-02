import { describe, expect, it, vi } from "vitest";
import {
  CLE_COMPTE_LEGACY,
  COMPTE_DEFAUT,
  ecrireCompteLegacy,
  lireCompteLegacy,
  persisterCompteEntreprise,
  purgerCompteLocal,
} from "@/data/compte-gestionnaire";

function memoireStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
    key: (i: number) => [...map.keys()][i] ?? null,
  };
}

describe("legacy RIB — purge après succès uniquement", () => {
  it("lit le legacy sans le supprimer", () => {
    const stockage = memoireStorage({
      [CLE_COMPTE_LEGACY]: JSON.stringify({
        ...COMPTE_DEFAUT,
        iban: "FR1420041010050500013M02606",
        titulaireRib: "Agence",
      }),
    });
    const lu = lireCompteLegacy(stockage);
    expect(lu?.iban).toContain("FR14");
    expect(stockage.getItem(CLE_COMPTE_LEGACY)).toBeTruthy();
  });

  it("purge seulement après une sauvegarde distante réussie", async () => {
    const stockage = memoireStorage();
    ecrireCompteLegacy(
      { ...COMPTE_DEFAUT, iban: "FR14 2004 1010 0505 0001 3M02 606", titulaireRib: "Agence" },
      stockage,
    );
    const sauverDistant = vi.fn(async (data: typeof COMPTE_DEFAUT) => ({
      ok: true as const,
      data,
    }));
    const res = await persisterCompteEntreprise(
      { ...COMPTE_DEFAUT, iban: "FR14 2004 1010 0505 0001 3M02 606", titulaireRib: "Agence" },
      { sauverDistant, stockage },
    );
    expect(res).toEqual({ ok: true });
    expect(sauverDistant).toHaveBeenCalledOnce();
    expect(stockage.getItem(CLE_COMPTE_LEGACY)).toBeNull();
  });

  it("conserve le legacy et signale l'erreur si la sauvegarde échoue", async () => {
    const stockage = memoireStorage();
    const sauverDistant = vi.fn(async () => ({
      ok: false as const,
      raison: "interdit" as const,
    }));
    const res = await persisterCompteEntreprise(
      { ...COMPTE_DEFAUT, iban: "FR14 2004 1010 0505 0001 3M02 606", titulaireRib: "Agence" },
      { sauverDistant, stockage },
    );
    expect(res).toEqual({ ok: false, raison: "interdit" });
    expect(lireCompteLegacy(stockage)?.titulaireRib).toBe("Agence");
    purgerCompteLocal(stockage);
  });

  it("ne prétend pas réussir sur un IBAN invalide", async () => {
    const sauverDistant = vi.fn();
    const res = await persisterCompteEntreprise(
      { ...COMPTE_DEFAUT, iban: "FR00" },
      { sauverDistant, stockage: memoireStorage() },
    );
    expect(res).toEqual({ ok: false, raison: "invalide" });
    expect(sauverDistant).not.toHaveBeenCalled();
  });
});
