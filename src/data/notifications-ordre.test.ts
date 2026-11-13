import { describe, expect, it } from "vitest";
import { listerCollection, ordreDeListe } from "@/data/metier";

describe("ordre des notifications (cloche)", () => {
  it("lit les notifications du plus récent au plus ancien", () => {
    expect(ordreDeListe("notifications")).toBe("created_at desc, id desc");
    expect(ordreDeListe("documents")).toBe("id");
  });

  it("interroge la base avec cet ordre pour que la cloche garde les 8 plus récentes", async () => {
    const requetes: string[] = [];
    const sql = {
      query: async (texte: string) => {
        requetes.push(texte);
        return [];
      },
    };
    await listerCollection(sql as never, "notifications", "00000000-0000-4000-8000-000000000001");
    expect(requetes[0]).toContain("order by created_at desc, id desc");
  });
});
