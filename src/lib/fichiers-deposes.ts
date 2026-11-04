/**
 * Contrat des téléversements (photo ou fichier, recto/verso).
 * Le navigateur n'est pas la source de vérité : on valide ici le binaire
 * avant de l'écrire dans `fichiers_deposes`.
 */

export const CONTEXTES_FICHIER = ["profil", "patrimoine", "dossier", "mission"] as const;
export type ContexteFichier = (typeof CONTEXTES_FICHIER)[number];
export type CoteFichier = "" | "recto" | "verso";

export const OCTETS_MAX: Record<ContexteFichier, number> = {
  profil: 1_500_000,
  patrimoine: 500_000,
  dossier: 1_500_000,
  mission: 1_500_000,
};

const MIMES: Record<ContexteFichier, readonly string[]> = {
  profil: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  patrimoine: ["image/jpeg", "image/png", "image/webp"],
  dossier: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  mission: ["image/jpeg", "image/png", "image/webp"],
};

export type DepotFichier = {
  contexte: ContexteFichier;
  refId: string;
  cote: CoteFichier;
  nom: string;
  mime: string;
  base64: string;
};

export type FichierMeta = {
  id: string;
  contexte: ContexteFichier;
  refId: string;
  cote: CoteFichier;
  nom: string;
  mime: string;
  taille: number;
};

const REF = /^[A-Za-z0-9_.:-]{1,160}$/;

export function estContexteFichier(valeur: string): valeur is ContexteFichier {
  return (CONTEXTES_FICHIER as readonly string[]).includes(valeur);
}

/** Retire un éventuel préfixe dataURL : on ne stocke jamais `data:` en base. */
export function normaliserBase64(valeur: string): string {
  const brut = valeur.trim();
  const coupe = brut.indexOf(",");
  const charge = brut.startsWith("data:") && coupe >= 0 ? brut.slice(coupe + 1) : brut;
  return charge.replace(/\s/g, "");
}

export function decoderBase64(valeur: string): Uint8Array | null {
  const charge = normaliserBase64(valeur);
  if (!charge || !/^[A-Za-z0-9+/]+={0,2}$/.test(charge) || charge.length % 4 === 1) return null;
  try {
    const binaire = atob(charge);
    const octets = new Uint8Array(binaire.length);
    for (let i = 0; i < binaire.length; i += 1) octets[i] = binaire.charCodeAt(i) & 0xff;
    return octets;
  } catch {
    return null;
  }
}

export function nomFichierSur(nom: string): string {
  const base = nom.replace(/\\/g, "/").split("/").pop() ?? "";
  const propre = base.replace(/[^\p{L}\p{N}.\- ()+]/gu, "").trim();
  return (propre || "fichier").slice(0, 180);
}

export function coteAttendue(contexte: ContexteFichier, cote: string): CoteFichier | null {
  if (contexte === "profil") return cote === "recto" || cote === "verso" ? cote : null;
  if (contexte === "dossier")
    return cote === "" || cote === "recto" || cote === "verso" ? cote : null;
  return cote === "" ? "" : null;
}

export function validerDepot(
  input: unknown,
): { ok: true; depot: DepotFichier; octets: Uint8Array } | { ok: false; erreur: string } {
  const brut = input && typeof input === "object" ? (input as Record<string, unknown>) : null;
  if (!brut) return { ok: false, erreur: "Dépôt illisible." };
  const contexte = String(brut["contexte"] ?? "");
  if (!estContexteFichier(contexte)) return { ok: false, erreur: "Contexte de fichier inconnu." };
  const cote = coteAttendue(contexte, String(brut["cote"] ?? ""));
  if (cote == null) {
    return {
      ok: false,
      erreur:
        contexte === "profil"
          ? "Déposez le recto ou le verso de la pièce."
          : "Ce dépôt n'accepte pas de recto/verso.",
    };
  }
  const refId = String(brut["refId"] ?? "").trim();
  if (contexte !== "profil" && !REF.test(refId)) {
    return { ok: false, erreur: "Référence de fichier invalide." };
  }
  const mime = String(brut["mime"] ?? "").toLowerCase();
  if (!MIMES[contexte].includes(mime)) {
    return { ok: false, erreur: "Format refusé. Utilisez une photo ou un PDF." };
  }
  const octets = decoderBase64(String(brut["base64"] ?? ""));
  if (!octets || octets.byteLength === 0)
    return { ok: false, erreur: "Fichier vide ou illisible." };
  const plafond = OCTETS_MAX[contexte];
  if (octets.byteLength > plafond) {
    return {
      ok: false,
      erreur: `Fichier trop volumineux (${Math.round(plafond / 1024)} Ko max).`,
    };
  }
  return {
    ok: true,
    octets,
    depot: {
      contexte,
      refId: contexte === "profil" ? "profil" : refId,
      cote,
      nom: nomFichierSur(String(brut["nom"] ?? "")),
      mime,
      base64: normaliserBase64(String(brut["base64"] ?? "")),
    },
  };
}
