import { describe, expect, it } from "vitest";
import { creerVerrouEnvoi } from "@/lib/verrou-envoi";

describe("creerVerrouEnvoi", () => {
  it("ignore un second envoi tant que le premier est en cours", async () => {
    const verrou = creerVerrouEnvoi();
    let appels = 0;
    let finir!: () => void;
    const premier = verrou.executer(
      () =>
        new Promise<string>((resolve) => {
          appels += 1;
          finir = () => resolve("ok");
        }),
    );
    expect(verrou.enCours()).toBe(true);
    const second = await verrou.executer(async () => {
      appels += 1;
      return "doublon";
    });
    expect(second).toBeUndefined();
    expect(appels).toBe(1);
    finir();
    expect(await premier).toBe("ok");
    expect(verrou.enCours()).toBe(false);
  });

  it("se libère après un refus ou une exception", async () => {
    const verrou = creerVerrouEnvoi();
    await expect(
      verrou.executer(async () => {
        throw new Error("échec");
      }),
    ).rejects.toThrow("échec");
    expect(verrou.enCours()).toBe(false);
    expect(await verrou.executer(async () => false)).toBe(false);
    expect(await verrou.executer(async () => "relance")).toBe("relance");
  });
});
