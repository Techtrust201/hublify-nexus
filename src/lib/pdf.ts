import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function pdfTexte(titre: string, lignes: string[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const gras = await doc.embedFont(StandardFonts.HelveticaBold);
  const { height } = page.getSize();
  page.drawText("Hublify", {
    x: 50,
    y: height - 50,
    size: 11,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  page.drawText(titre, {
    x: 50,
    y: height - 80,
    size: 18,
    font: gras,
    color: rgb(0.1, 0.1, 0.1),
  });
  let y = height - 120;
  for (const ligne of lignes) {
    page.drawText(ligne.slice(0, 110), {
      x: 50,
      y,
      size: 11,
      font,
      color: rgb(0.15, 0.15, 0.15),
    });
    y -= 18;
    if (y < 60) break;
  }
  return doc.save();
}

export function octetsVersBase64(octets: Uint8Array) {
  let binaire = "";
  for (const octet of octets) binaire += String.fromCharCode(octet);
  return btoa(binaire);
}
