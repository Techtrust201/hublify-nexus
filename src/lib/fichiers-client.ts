/**
 * Prépare un fichier côté navigateur avant l'envoi serveur.
 * L'aperçu est une URL d'objet, jamais une dataURL persistée.
 */
import { OCTETS_MAX, type ContexteFichier } from "@/lib/fichiers-deposes";

export type FichierPret = {
  nom: string;
  mime: string;
  base64: string;
  taille: number;
};

const SEUIL_RECOMPRESSION: Record<ContexteFichier, number> = {
  profil: 400_000,
  patrimoine: 350_000,
  dossier: 400_000,
  mission: 400_000,
};

function octetsVersBase64(octets: Uint8Array) {
  let binaire = "";
  const pas = 0x8000;
  for (let i = 0; i < octets.length; i += pas) {
    binaire += String.fromCharCode(...octets.subarray(i, i + pas));
  }
  return btoa(binaire);
}

export function base64VersOctets(base64: string) {
  const binaire = atob(base64);
  const octets = new Uint8Array(binaire.length);
  for (let i = 0; i < binaire.length; i += 1) octets[i] = binaire.charCodeAt(i) & 0xff;
  return octets;
}

export function urlDepuisBase64(mime: string, base64: string) {
  const octets = base64VersOctets(base64);
  const copie = new Uint8Array(octets.byteLength);
  copie.set(octets);
  return URL.createObjectURL(new Blob([copie], { type: mime }));
}

async function blobCanvas(canvas: HTMLCanvasElement | OffscreenCanvas, qualite: number) {
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: "image/jpeg", quality: qualite });
  }
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", qualite);
  });
}

async function reduireImage(
  fichier: File,
  maxOctets: number,
): Promise<
  { ok: true; nom: string; mime: string; octets: Uint8Array } | { ok: false; erreur: string }
> {
  if (typeof createImageBitmap !== "function") {
    return { ok: false, erreur: "Compression d'image indisponible sur cet appareil." };
  }
  const bitmap = await createImageBitmap(fichier);
  const maxCote = 1600;
  const ratio = Math.min(1, maxCote / Math.max(bitmap.width, bitmap.height));
  const largeur = Math.max(1, Math.round(bitmap.width * ratio));
  const hauteur = Math.max(1, Math.round(bitmap.height * ratio));
  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(largeur, hauteur)
      : Object.assign(document.createElement("canvas"), { width: largeur, height: hauteur });
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close?.();
    return { ok: false, erreur: "Aperçu impossible." };
  }
  ctx.drawImage(bitmap, 0, 0, largeur, hauteur);
  bitmap.close?.();
  let qualite = 0.72;
  let blob: Blob | null = null;
  for (let essai = 0; essai < 5; essai += 1) {
    blob = await blobCanvas(canvas, qualite);
    if (blob && blob.size <= maxOctets) break;
    qualite -= 0.12;
  }
  if (!blob || blob.size > maxOctets || blob.size === 0) {
    return {
      ok: false,
      erreur: `Image trop lourde après compression (${Math.round(maxOctets / 1024)} Ko max).`,
    };
  }
  const nom = fichier.name.replace(/\.[^.]+$/, "") + ".jpg";
  return { ok: true, nom, mime: "image/jpeg", octets: new Uint8Array(await blob.arrayBuffer()) };
}

export async function preparerFichier(
  fichier: File,
  contexte: ContexteFichier,
): Promise<{ ok: true; fichier: FichierPret } | { ok: false; erreur: string }> {
  const mime = (fichier.type || "").toLowerCase();
  const images = mime.startsWith("image/");
  const pdf = mime === "application/pdf";
  if (!images && !pdf) return { ok: false, erreur: "Format refusé. Utilisez une photo ou un PDF." };
  if (contexte === "patrimoine" && !images) {
    return { ok: false, erreur: "Le logement n'accepte que des photos." };
  }
  if (contexte === "mission" && !images) {
    return { ok: false, erreur: "Le rapport n'accepte que des photos." };
  }
  const plafond = OCTETS_MAX[contexte];
  let nom = fichier.name;
  let mimeSortie = mime || "application/octet-stream";
  let octets: Uint8Array;
  if (images && fichier.size > SEUIL_RECOMPRESSION[contexte]) {
    const reduit = await reduireImage(fichier, plafond);
    if (reduit.ok && reduit.octets.byteLength < fichier.size) {
      nom = reduit.nom;
      mimeSortie = reduit.mime;
      octets = reduit.octets;
    } else if (fichier.size <= plafond) {
      octets = new Uint8Array(await fichier.arrayBuffer());
    } else {
      return reduit.ok
        ? { ok: false, erreur: `Fichier trop volumineux (${Math.round(plafond / 1024)} Ko max).` }
        : reduit;
    }
  } else if (fichier.size > plafond) {
    return { ok: false, erreur: `Fichier trop volumineux (${Math.round(plafond / 1024)} Ko max).` };
  } else {
    octets = new Uint8Array(await fichier.arrayBuffer());
  }
  if (octets.byteLength === 0) return { ok: false, erreur: "Fichier vide." };
  return {
    ok: true,
    fichier: { nom, mime: mimeSortie, base64: octetsVersBase64(octets), taille: octets.byteLength },
  };
}
