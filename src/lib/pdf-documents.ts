import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import {
  enrichirContexte,
  kindDocument,
  titreLisible,
  type ContexteDocument,
} from "@/lib/contexte-document";
import { textePdf } from "@/lib/pdf";

export type { ContexteDocument };

const ENCRE = rgb(0.12, 0.16, 0.22);
const MUET = rgb(0.4, 0.45, 0.5);
const NAVY = rgb(0.08, 0.18, 0.32);
const FOND = rgb(0.96, 0.97, 0.98);
const LIGNE = rgb(0.82, 0.84, 0.86);

function t(valeur: string) {
  return textePdf(valeur);
}

function aujourdHui() {
  return new Date().toLocaleDateString("fr-FR");
}

function nomFichier(titre: string) {
  const base = titreLisible(titre)
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  return `${base || "document"}.pdf`;
}

function locataireDe(ctx: ContexteDocument) {
  return (
    ctx.locataire?.trim() ||
    ctx.titulaire?.trim() ||
    `${ctx.prenom ?? ""} ${ctx.nom ?? ""}`.trim() ||
    "Occupant du dossier"
  );
}

function champ(
  page: PDFPage,
  font: PDFFont,
  gras: PDFFont,
  label: string,
  valeur: string,
  x: number,
  y: number,
  largeur = 240,
) {
  page.drawText(t(label).toUpperCase(), { x, y, size: 8, font, color: MUET });
  page.drawText(t(valeur || "—").slice(0, 52), {
    x,
    y: y - 16,
    size: 11,
    font: gras,
    color: ENCRE,
  });
  page.drawLine({
    start: { x, y: y - 22 },
    end: { x: x + largeur, y: y - 22 },
    thickness: 0.6,
    color: LIGNE,
  });
}

function paragraphe(
  page: PDFPage,
  font: PDFFont,
  texte: string,
  x: number,
  y: number,
  taille = 10,
  largeur = 500,
) {
  const mots = t(texte).split(/\s+/);
  let ligne = "";
  let curseur = y;
  for (const mot of mots) {
    const essai = ligne ? `${ligne} ${mot}` : mot;
    if (font.widthOfTextAtSize(essai, taille) > largeur) {
      page.drawText(ligne, { x, y: curseur, size: taille, font, color: ENCRE });
      curseur -= 14;
      ligne = mot;
    } else {
      ligne = essai;
    }
  }
  if (ligne) {
    page.drawText(ligne, { x, y: curseur, size: taille, font, color: ENCRE });
    curseur -= 14;
  }
  return curseur;
}

function dessinerPhoto(page: PDFPage, x: number, y: number, largeur: number, hauteur: number) {
  page.drawRectangle({
    x,
    y,
    width: largeur,
    height: hauteur,
    color: rgb(0.9, 0.92, 0.94),
    borderColor: NAVY,
    borderWidth: 1.2,
  });
  const cx = x + largeur / 2;
  page.drawEllipse({
    x: cx,
    y: y + hauteur * 0.62,
    xScale: 22,
    yScale: 26,
    color: rgb(0.62, 0.68, 0.74),
  });
  page.drawEllipse({
    x: cx,
    y: y + 36,
    xScale: 40,
    yScale: 26,
    color: rgb(0.62, 0.68, 0.74),
  });
}

export async function octetsDocument(titre: string, ctx: ContexteDocument = {}) {
  const data = enrichirContexte(titre, ctx);
  const kind = kindDocument(titre, data.extra ?? []);
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const gras = await doc.embedFont(StandardFonts.HelveticaBold);

  if (kind === "identite") dessinerIdentite(page, font, gras, data);
  else if (kind === "domicile") dessinerDomicile(page, font, gras, data);
  else if (kind === "revenus") dessinerRevenus(page, font, gras, data);
  else if (kind === "rib") dessinerRib(page, font, gras, data);
  else if (kind === "modele") dessinerModele(page, font, gras, titre, data);
  else if (kind === "bail") dessinerBail(page, font, gras, titre, data);
  else if (kind === "quittance") dessinerQuittance(page, font, gras, titre, data);
  else if (kind === "avis") dessinerAvis(page, font, gras, titre, data);
  else if (kind === "photo") dessinerPhotoPreuve(page, font, gras, titre, data);
  else if (kind === "edl") dessinerEdl(page, font, gras, titre, data);
  else if (kind === "assurance") dessinerAssurance(page, font, gras, titre, data);
  else dessinerCourrier(page, font, gras, titre, data);

  return { nom: nomFichier(titre), octets: await doc.save() };
}

function enTete(page: PDFPage, font: PDFFont, gras: PDFFont, sousTitre: string) {
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: height - 72, width, height: 72, color: NAVY });
  page.drawText("HUBLIFY", { x: 40, y: height - 38, size: 11, font: gras, color: rgb(1, 1, 1) });
  page.drawText(t(sousTitre), { x: 40, y: height - 56, size: 16, font: gras, color: rgb(1, 1, 1) });
}

function pied(page: PDFPage, font: PDFFont, mention: string) {
  page.drawLine({
    start: { x: 40, y: 48 },
    end: { x: 555, y: 48 },
    thickness: 0.6,
    color: LIGNE,
  });
  page.drawText(t(mention).slice(0, 90), { x: 40, y: 32, size: 8, font, color: MUET });
  page.drawText(t("Copie dossier — ne vaut pas original officiel."), {
    x: 40,
    y: 20,
    size: 8,
    font,
    color: MUET,
  });
}

function statutDe(ctx: ContexteDocument) {
  const brut =
    ctx.extra?.find((l) => l.toLowerCase().includes("statut")) ?? ctx.extra?.[0] ?? "Vérifié";
  return brut.replace(/^Statut\s*:\s*/i, "").trim() || "Vérifié";
}

function dessinerIdentite(page: PDFPage, font: PDFFont, gras: PDFFont, ctx: ContexteDocument) {
  enTete(page, font, gras, "Pièce d'identité");
  page.drawText(t("Copie conservée au dossier gestionnaire"), {
    x: 40,
    y: 748,
    size: 10,
    font,
    color: MUET,
  });

  page.drawRectangle({
    x: 36,
    y: 430,
    width: 523,
    height: 300,
    color: rgb(1, 1, 1),
    borderColor: NAVY,
    borderWidth: 1.4,
  });
  dessinerPhoto(page, 52, 478, 120, 154);
  page.drawText("Photo d'identité", { x: 64, y: 458, size: 8, font, color: MUET });

  champ(page, font, gras, "Nom", (ctx.nom ?? "—").toUpperCase(), 192, 612, 340);
  champ(page, font, gras, "Prénom", ctx.prenom ?? "—", 192, 564, 340);
  champ(page, font, gras, "Né(e) le", ctx.naissance ?? "—", 192, 516, 160);
  champ(page, font, gras, "Nationalité", "Française", 372, 516, 160);
  champ(page, font, gras, "N° dossier", ctx.identifiant ?? "ID-HUB-2026", 192, 468, 340);

  const statut = statutDe(ctx);
  page.drawRectangle({ x: 36, y: 348, width: 523, height: 64, color: rgb(0.93, 0.97, 0.94) });
  page.drawText("Contrôle Hublify", { x: 52, y: 388, size: 9, font: gras, color: NAVY });
  page.drawText(t(`Statut : ${statut}`), { x: 52, y: 368, size: 12, font: gras, color: ENCRE });
  page.drawText(t(`Vérifié le ${ctx.date ?? aujourdHui()}`), {
    x: 320,
    y: 368,
    size: 11,
    font,
    color: ENCRE,
  });

  page.drawText("Coordonnées du titulaire", { x: 40, y: 318, size: 11, font: gras, color: ENCRE });
  champ(page, font, gras, "E-mail", ctx.email ?? "—", 40, 286, 250);
  champ(page, font, gras, "Téléphone", ctx.telephone ?? "—", 310, 286, 250);

  page.drawText("Mention", { x: 40, y: 220, size: 11, font: gras, color: ENCRE });
  paragraphe(
    page,
    font,
    "Cette fiche identifie le titulaire dans Hublify. Elle ne remplace pas la pièce originale (CNI ou passeport), conservée par le titulaire.",
    40,
    200,
  );

  page.drawText("Signature", { x: 40, y: 150, size: 9, font, color: MUET });
  page.drawRectangle({ x: 40, y: 72, width: 220, height: 70, borderColor: LIGNE, borderWidth: 1 });
  page.drawText(t(`${ctx.prenom ?? ""} ${ctx.nom ?? ""}`.trim() || locataireDe(ctx)), {
    x: 52,
    y: 84,
    size: 10,
    font,
    color: MUET,
  });
  pied(
    page,
    font,
    `Pièce d'identité — ${ctx.prenom ?? ""} ${ctx.nom ?? ""} — ${ctx.date ?? aujourdHui()}`,
  );
}

function dessinerDomicile(page: PDFPage, font: PDFFont, gras: PDFFont, ctx: ContexteDocument) {
  enTete(page, font, gras, "Justificatif de domicile");
  const nom = `${ctx.prenom ?? ""} ${ctx.nom ?? ""}`.trim() || locataireDe(ctx);
  page.drawText("Attestation pour le dossier gestionnaire", {
    x: 40,
    y: 740,
    size: 10,
    font,
    color: MUET,
  });
  page.drawText("Je soussigné(e)", { x: 40, y: 700, size: 11, font, color: ENCRE });
  page.drawText(t(nom), { x: 40, y: 680, size: 16, font: gras, color: ENCRE });
  page.drawText(t("atteste résider à l'adresse suivante :"), {
    x: 40,
    y: 650,
    size: 11,
    font,
    color: ENCRE,
  });
  page.drawRectangle({ x: 40, y: 560, width: 515, height: 72, color: FOND });
  page.drawText(t(ctx.adresse ?? "—"), { x: 56, y: 592, size: 13, font: gras, color: ENCRE });
  champ(page, font, gras, "Téléphone", ctx.telephone ?? "—", 40, 530, 230);
  champ(page, font, gras, "E-mail", ctx.email ?? "—", 290, 530, 230);
  champ(page, font, gras, "Date d'émission", ctx.date ?? aujourdHui(), 40, 478, 230);
  champ(page, font, gras, "Référence dossier", ctx.identifiant ?? "HUB-DOM", 290, 478, 230);
  pied(page, font, `Justificatif de domicile — ${nom}`);
}

function dessinerRevenus(page: PDFPage, font: PDFFont, gras: PDFFont, ctx: ContexteDocument) {
  const nom = `${ctx.prenom ?? ""} ${ctx.nom ?? ""}`.trim() || locataireDe(ctx);
  enTete(page, font, gras, "Justificatif de revenus");
  champ(page, font, gras, "Titulaire", nom, 40, 700, 515);
  champ(page, font, gras, "Période", ctx.periode ?? "Année 2026", 40, 648, 230);
  champ(page, font, gras, "Statut", statutDe(ctx), 290, 648, 230);
  page.drawRectangle({ x: 40, y: 470, width: 515, height: 120, color: FOND });
  page.drawText("Revenus locatifs déclarés (dossier)", {
    x: 56,
    y: 560,
    size: 10,
    font: gras,
    color: MUET,
  });
  page.drawText("3 410 EUR  encaissés", { x: 56, y: 532, size: 14, font: gras, color: ENCRE });
  page.drawText("1 280 EUR  en attente", { x: 56, y: 508, size: 12, font, color: ENCRE });
  pied(page, font, `Justificatif de revenus — ${nom}`);
}

function dessinerRib(page: PDFPage, font: PDFFont, gras: PDFFont, ctx: ContexteDocument) {
  const nom = `${ctx.prenom ?? ""} ${ctx.nom ?? ""}`.trim() || locataireDe(ctx);
  enTete(page, font, gras, "Relevé d'identité bancaire");
  champ(page, font, gras, "Titulaire du compte", nom, 40, 720, 515);
  page.drawRectangle({
    x: 40,
    y: 470,
    width: 515,
    height: 200,
    color: FOND,
    borderColor: LIGNE,
    borderWidth: 1,
  });
  page.drawText("IBAN", { x: 56, y: 640, size: 8, font, color: MUET });
  page.drawText("FR76 3000 6000 0112 3456 7890 189", {
    x: 56,
    y: 618,
    size: 14,
    font: gras,
    color: ENCRE,
  });
  page.drawText("BIC", { x: 56, y: 580, size: 8, font, color: MUET });
  page.drawText("AGRIFRPPXXX", { x: 56, y: 558, size: 14, font: gras, color: ENCRE });
  champ(page, font, gras, "Email de notification", ctx.email ?? "—", 40, 440, 515);
  pied(page, font, `RIB — ${nom}`);
}

function dessinerBail(
  page: PDFPage,
  font: PDFFont,
  gras: PDFFont,
  titre: string,
  ctx: ContexteDocument,
) {
  const locataire = locataireDe(ctx);
  const logement = ctx.logement ?? "Logement du dossier";
  const adresse = ctx.adresse ?? logement;
  enTete(page, font, gras, "Bail — extrait de dossier");
  page.drawText(t(titreLisible(titre)), { x: 40, y: 748, size: 11, font: gras, color: ENCRE });
  champ(page, font, gras, "Bailleur", ctx.bailleur ?? "Hublify", 40, 710, 230);
  champ(page, font, gras, "Gestionnaire", "Hublify", 290, 710, 230);
  champ(page, font, gras, "Locataire", locataire, 40, 658, 515);
  champ(page, font, gras, "Logement", logement, 40, 606, 230);
  champ(page, font, gras, "Adresse", adresse, 290, 606, 230);
  champ(page, font, gras, "Prise d'effet", ctx.date ?? "01/01/2026", 40, 554, 230);
  champ(page, font, gras, "Durée", "12 mois renouvelable", 290, 554, 230);
  champ(page, font, gras, "Loyer hors charges", ctx.loyer ?? "1 280 EUR / mois", 40, 502, 230);
  champ(page, font, gras, "Charges", ctx.charges ?? "80 EUR / mois", 290, 502, 230);
  page.drawText("Clauses essentielles", { x: 40, y: 450, size: 11, font: gras, color: ENCRE });
  let y = 428;
  for (const c of [
    `Le bien ${logement} est loué à ${locataire} pour un usage exclusif d'habitation.`,
    "Dépôt de garantie équivalent à un mois de loyer hors charges.",
    "Entretien courant à la charge du locataire.",
    "État des lieux d'entrée et de sortie obligatoires.",
  ]) {
    y = paragraphe(page, font, `- ${c}`, 48, y, 10, 490);
    y -= 4;
  }
  page.drawText("Signature du locataire", { x: 40, y: 150, size: 9, font, color: MUET });
  page.drawRectangle({ x: 40, y: 72, width: 220, height: 70, borderColor: LIGNE, borderWidth: 1 });
  page.drawText(t(locataire), { x: 52, y: 84, size: 10, font, color: MUET });
  pied(page, font, `Bail — ${locataire} — ${logement} — ${ctx.date ?? aujourdHui()}`);
}

function dessinerQuittance(
  page: PDFPage,
  font: PDFFont,
  gras: PDFFont,
  titre: string,
  ctx: ContexteDocument,
) {
  const locataire = locataireDe(ctx);
  enTete(page, font, gras, "Quittance de loyer");
  page.drawText(t(titreLisible(titre)), { x: 40, y: 748, size: 12, font: gras, color: ENCRE });
  champ(page, font, gras, "Bailleur / gestionnaire", ctx.bailleur ?? "Hublify", 40, 710, 515);
  champ(page, font, gras, "Locataire", locataire, 40, 658, 515);
  champ(page, font, gras, "Logement", ctx.logement ?? "—", 40, 606, 230);
  champ(page, font, gras, "Adresse", ctx.adresse ?? "—", 290, 606, 230);
  champ(page, font, gras, "Période", ctx.periode ?? ctx.date ?? "—", 40, 554, 230);
  champ(page, font, gras, "Total encaissé", ctx.total ?? ctx.loyer ?? "—", 290, 554, 230);
  champ(page, font, gras, "Loyer nu", ctx.loyer ?? "—", 40, 502, 230);
  champ(page, font, gras, "Charges", ctx.charges ?? "—", 290, 502, 230);
  paragraphe(
    page,
    font,
    `Le gestionnaire Hublify reconnaît avoir reçu de ${locataire} le loyer et les charges correspondant à la période ${ctx.periode ?? ctx.date ?? ""}.`,
    40,
    440,
    11,
  );
  page.drawText("Signature", { x: 40, y: 150, size: 9, font, color: MUET });
  page.drawRectangle({ x: 40, y: 72, width: 220, height: 70, borderColor: LIGNE, borderWidth: 1 });
  page.drawText("Hublify", { x: 52, y: 84, size: 10, font, color: MUET });
  pied(page, font, `Quittance — ${locataire} — ${ctx.periode ?? ctx.date ?? aujourdHui()}`);
}

function dessinerAvis(
  page: PDFPage,
  font: PDFFont,
  gras: PDFFont,
  titre: string,
  ctx: ContexteDocument,
) {
  const locataire = locataireDe(ctx);
  enTete(page, font, gras, "Avis d'échéance");
  page.drawText(t(titreLisible(titre)), { x: 40, y: 748, size: 12, font: gras, color: ENCRE });
  champ(page, font, gras, "Locataire", locataire, 40, 700, 515);
  champ(page, font, gras, "Bailleur", ctx.bailleur ?? "Hublify", 40, 648, 515);
  champ(page, font, gras, "Logement", ctx.logement ?? ctx.adresse ?? "—", 40, 596, 515);
  champ(page, font, gras, "Mois", ctx.periode ?? ctx.date ?? aujourdHui(), 40, 544, 230);
  champ(page, font, gras, "Loyer nu", ctx.loyer ?? "—", 40, 492, 230);
  champ(page, font, gras, "Charges", ctx.charges ?? "—", 290, 492, 230);
  paragraphe(
    page,
    font,
    "Merci de régler le montant avant la date d'échéance indiquée.",
    40,
    430,
    11,
  );
  pied(page, font, `Avis d'échéance — ${locataire}`);
}

function dessinerPhotoPreuve(
  page: PDFPage,
  font: PDFFont,
  gras: PDFFont,
  titre: string,
  ctx: ContexteDocument,
) {
  enTete(page, font, gras, "Photo de preuve");
  page.drawText(t(titreLisible(titre)), { x: 40, y: 748, size: 12, font: gras, color: ENCRE });
  dessinerPhoto(page, 160, 380, 270, 320);
  champ(page, font, gras, "Légende", ctx.legende ?? titreLisible(titre), 40, 340, 515);
  champ(page, font, gras, "Pièce", ctx.piece ?? "—", 40, 288, 250);
  champ(page, font, gras, "Logement", ctx.logement ?? ctx.adresse ?? "—", 310, 288, 245);
  champ(page, font, gras, "Date", ctx.date ?? aujourdHui(), 40, 236, 250);
  champ(page, font, gras, "Occupant", locataireDe(ctx), 310, 236, 245);
  pied(page, font, `Photo — ${ctx.piece ?? titreLisible(titre)} — ${ctx.logement ?? ""}`);
}

function dessinerEdl(
  page: PDFPage,
  font: PDFFont,
  gras: PDFFont,
  titre: string,
  ctx: ContexteDocument,
) {
  enTete(page, font, gras, "État des lieux");
  page.drawText(t(titreLisible(titre)), { x: 40, y: 748, size: 12, font: gras, color: ENCRE });
  champ(page, font, gras, "Occupant", locataireDe(ctx), 40, 710, 515);
  champ(page, font, gras, "Logement", ctx.logement ?? "—", 40, 658, 230);
  champ(page, font, gras, "Adresse", ctx.adresse ?? "—", 290, 658, 230);
  champ(page, font, gras, "Date", ctx.date ?? aujourdHui(), 40, 606, 230);
  page.drawText("Pièces contrôlées", { x: 40, y: 560, size: 11, font: gras, color: ENCRE });
  let y = 538;
  for (const p of ["Salon", "Cuisine", "Chambre"]) {
    page.drawText(t(`- ${p} : relevé joint au dossier`), {
      x: 48,
      y,
      size: 11,
      font,
      color: ENCRE,
    });
    y -= 18;
  }
  pied(page, font, `État des lieux — ${locataireDe(ctx)} — ${ctx.logement ?? ""}`);
}

function dessinerAssurance(
  page: PDFPage,
  font: PDFFont,
  gras: PDFFont,
  titre: string,
  ctx: ContexteDocument,
) {
  enTete(page, font, gras, "Attestation");
  page.drawText(t(titreLisible(titre)), { x: 40, y: 748, size: 12, font: gras, color: ENCRE });
  champ(page, font, gras, "Assuré", locataireDe(ctx), 40, 710, 515);
  champ(page, font, gras, "Logement", ctx.logement ?? "—", 40, 658, 230);
  champ(page, font, gras, "Adresse", ctx.adresse ?? "—", 290, 658, 230);
  champ(page, font, gras, "Date", ctx.date ?? aujourdHui(), 40, 606, 230);
  paragraphe(
    page,
    font,
    `Attestation jointe au dossier de ${locataireDe(ctx)} pour le logement ${ctx.logement ?? ""}.`,
    40,
    540,
    11,
  );
  pied(page, font, `Attestation — ${locataireDe(ctx)}`);
}

function dessinerModele(
  page: PDFPage,
  font: PDFFont,
  gras: PDFFont,
  titre: string,
  ctx: ContexteDocument,
) {
  enTete(page, font, gras, "Modèle à personnaliser");
  page.drawText(t(titreLisible(titre)), { x: 40, y: 748, size: 13, font: gras, color: ENCRE });
  page.drawText(t(`Référence ${ctx.identifiant ?? "MODELE"}`), {
    x: 40,
    y: 728,
    size: 10,
    font,
    color: MUET,
  });
  champ(page, font, gras, "Locataire", "[Nom du locataire]", 40, 690, 515);
  champ(page, font, gras, "Logement", "[Nom du logement]", 40, 638, 230);
  champ(page, font, gras, "Adresse", "[Adresse complète]", 290, 638, 230);
  champ(page, font, gras, "Date d'effet", "[JJ/MM/AAAA]", 40, 586, 230);
  champ(page, font, gras, "Loyer HC", "[Montant] EUR / mois", 290, 586, 230);
  page.drawText("Clauses types (à adapter)", { x: 40, y: 530, size: 11, font: gras, color: ENCRE });
  let y = 508;
  for (const c of [
    "Usage exclusif d'habitation.",
    "Dépôt de garantie : un mois de loyer hors charges.",
    "Entretien courant à la charge du locataire.",
    "États des lieux d'entrée et de sortie obligatoires.",
  ]) {
    page.drawText(`- ${t(c)}`, { x: 48, y, size: 11, font, color: ENCRE });
    y -= 18;
  }
  page.drawRectangle({ x: 40, y: 160, width: 515, height: 70, color: FOND });
  page.drawText("Exemple de remplissage automatique", {
    x: 56,
    y: 208,
    size: 9,
    font: gras,
    color: MUET,
  });
  page.drawText(t("ex. Jean Dupont — Appartement Colette — 3 bd Haussmann, Paris"), {
    x: 56,
    y: 186,
    size: 11,
    font,
    color: ENCRE,
  });
  pied(page, font, `${titreLisible(titre)} — modèle Hublify`);
}

function dessinerCourrier(
  page: PDFPage,
  font: PDFFont,
  gras: PDFFont,
  titre: string,
  ctx: ContexteDocument,
) {
  enTete(page, font, gras, "Document Hublify");
  page.drawText(t(titreLisible(titre)).slice(0, 70), {
    x: 40,
    y: 748,
    size: 14,
    font: gras,
    color: ENCRE,
  });
  champ(page, font, gras, "Dossier", locataireDe(ctx), 40, 710, 515);
  champ(page, font, gras, "Logement", ctx.logement ?? "—", 40, 658, 230);
  champ(page, font, gras, "Date", ctx.date ?? aujourdHui(), 290, 658, 230);
  page.drawRectangle({ x: 40, y: 160, width: 515, height: 420, color: FOND });
  let y = 552;
  const lignes = (ctx.extra?.length ? ctx.extra : ["Document rattaché au dossier Hublify."]).slice(
    0,
    18,
  );
  for (const ligne of lignes) {
    page.drawText(t(ligne).slice(0, 90), { x: 56, y, size: 11, font, color: ENCRE });
    y -= 18;
  }
  pied(page, font, `${titreLisible(titre)} — ${ctx.date ?? aujourdHui()}`);
}
