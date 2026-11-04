import { describe, expect, it } from "vitest";
import {
  decoderBase64,
  nomFichierSur,
  normaliserBase64,
  validerDepot,
} from "@/lib/fichiers-deposes";

function base64De(octets: number) {
  return Buffer.from(new Uint8Array(octets)).toString("base64");
}

describe("fichiers déposés", () => {
  it("retire le préfixe dataURL avant stockage", () => {
    expect(normaliserBase64("data:image/png;base64,aaaa")).toBe("aaaa");
    expect(normaliserBase64("  YWJj \n")).toBe("YWJj");
  });

  it("refuse une dataURL comme contenu et un fichier trop lourd", () => {
    const petit = validerDepot({
      contexte: "profil",
      refId: "ignore",
      cote: "recto",
      nom: "../secrets/cni.png",
      mime: "image/png",
      base64: "data:image/png;base64," + base64De(32),
    });
    expect(petit.ok).toBe(true);
    if (petit.ok) {
      expect(petit.depot.base64.startsWith("data:")).toBe(false);
      expect(petit.depot.nom).toBe("cni.png");
      expect(petit.octets.byteLength).toBe(32);
    }

    const lourd = validerDepot({
      contexte: "patrimoine",
      refId: "suzette",
      cote: "",
      nom: "salon.jpg",
      mime: "image/jpeg",
      base64: base64De(500_001),
    });
    expect(lourd.ok).toBe(false);

    const versoManquant = validerDepot({
      contexte: "profil",
      cote: "",
      nom: "cni.png",
      mime: "image/png",
      base64: base64De(8),
    });
    expect(versoManquant.ok).toBe(false);

    const pdfLieu = validerDepot({
      contexte: "patrimoine",
      refId: "suzette",
      cote: "",
      nom: "plan.pdf",
      mime: "application/pdf",
      base64: base64De(8),
    });
    expect(pdfLieu.ok).toBe(false);
  });

  it("garde le nom lisible et décode le binaire", () => {
    expect(nomFichierSur("C:\\pièces\\avis 2026.pdf")).toBe("avis 2026.pdf");
    expect(decoderBase64("YQ==")).toEqual(new Uint8Array([97]));
    expect(decoderBase64("@@@")).toBeNull();
  });
});
