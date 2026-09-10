import { toast } from "sonner";
import { demanderConfirmation, type DemandeConfirmation } from "@/lib/confirmation";
import type { ContexteDocument } from "@/lib/contexte-document";

export type { ContexteDocument };

export function toastOk(message: string) {
  toast.success(message);
}

export function toastInfo(message: string) {
  toast.message(message);
}

export function toastErreur(message: string) {
  toast.error(message);
}

export function confirmer(demande: DemandeConfirmation | string) {
  return demanderConfirmation(demande);
}

function declencherTelechargement(nom: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast.success(`Téléchargement : ${nom}`);
}

export type FichierChoisi = {
  nom: string;
  mime: string;
  base64: string;
  taille: string;
};

export type FichierExportable = {
  nom: string;
  mime?: string;
  base64?: string;
};

export function tailleHumaine(octets: number) {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.max(1, Math.round(octets / 1024))} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

export function telechargerBase64(nom: string, mime: string, base64: string) {
  const binaire = atob(base64);
  const octets = new Uint8Array(binaire.length);
  for (let i = 0; i < binaire.length; i += 1) octets[i] = binaire.charCodeAt(i);
  declencherTelechargement(nom, new Blob([octets], { type: mime }));
}

export function exporterFichier(fichier: FichierExportable, ctx: ContexteDocument = {}) {
  if (fichier.base64) {
    telechargerBase64(fichier.nom, fichier.mime || "application/octet-stream", fichier.base64);
    return;
  }
  void telechargerPdf(fichier.nom, ctx.extra ?? [fichier.nom], ctx);
}

export async function telechargerPdf(
  titre: string,
  lignes: string[] = [],
  ctx: ContexteDocument = {},
) {
  try {
    const { octetsDocument } = await import("@/lib/pdf-documents");
    const extra = ctx.extra ?? (lignes.length ? lignes : undefined);
    const { nom, octets } = await octetsDocument(
      titre,
      extra ? { ...ctx, extra } : { ...ctx, extra: [] },
    );
    declencherTelechargement(nom, new Blob([new Uint8Array(octets)], { type: "application/pdf" }));
  } catch {
    toastErreur("Génération du PDF impossible.");
  }
}

export async function ouvrirPdf(titre: string, lignes: string[] = [], ctx: ContexteDocument = {}) {
  await telechargerPdf(titre, lignes, ctx);
}

export function telechargerDemo(nomFichier: string, contenu?: string) {
  const nom = nomFichier.includes(".") ? nomFichier : `${nomFichier}.txt`;
  if (nom.toLowerCase().endsWith(".pdf")) {
    void telechargerPdf(
      nom.replace(/\.pdf$/i, ""),
      (contenu ?? "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    );
    return;
  }
  const csv = nom.endsWith(".csv");
  declencherTelechargement(
    nom,
    new Blob([contenu ?? `Hublify — ${nom}\n\nDocument de démonstration.\n`], {
      type: csv ? "text/csv;charset=utf-8" : "text/plain;charset=utf-8",
    }),
  );
}

export function ouvrirBase64(nom: string, mime: string, base64: string) {
  const binaire = atob(base64);
  const octets = new Uint8Array(binaire.length);
  for (let i = 0; i < binaire.length; i += 1) octets[i] = binaire.charCodeAt(i);
  const blob = new Blob([octets], { type: mime });
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank");
  if (!opened) {
    declencherTelechargement(nom, blob);
    URL.revokeObjectURL(url);
    return;
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  toast.success(`Aperçu : ${nom}`);
}

export function copierTexte(texte: string, message = "Copié dans le presse-papiers.") {
  void navigator.clipboard.writeText(texte).then(
    () => toastOk(message),
    () => toastErreur("Copie impossible."),
  );
}

export function choisirFichier(onChoisi: (nom: string) => void) {
  choisirFichierComplet((fichier) => onChoisi(fichier.nom));
}

export function choisirFichierComplet(onChoisi: (fichier: FichierChoisi) => void) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.txt";
  input.onchange = () => {
    const fichier = input.files?.[0];
    if (!fichier) return;
    if (fichier.size > 4 * 1024 * 1024) {
      toastErreur("Fichier trop volumineux (4 Mo max).");
      return;
    }
    const lecteur = new FileReader();
    lecteur.onload = () => {
      const brut = String(lecteur.result ?? "");
      const base64 = brut.includes(",") ? brut.slice(brut.indexOf(",") + 1) : brut;
      onChoisi({
        nom: fichier.name,
        mime: fichier.type || "application/octet-stream",
        base64,
        taille: tailleHumaine(fichier.size),
      });
    };
    lecteur.readAsDataURL(fichier);
  };
  input.click();
}
