import { useEffect, useState } from "react";
import { ibanValide } from "@/lib/iban";

export { ibanValide } from "@/lib/iban";

/**
 * Champs du compte gestionnaire (raison sociale, SIRET, carte T, RIB, équipe).
 * Persistés en base (`org_compte`). Le RIB ne doit plus rester dans localStorage
 * une fois la sauvegarde distante confirmée.
 * SOURCE: Hublify V1.0 — Compte gestionnaire, annotation 220:20741.
 */

export type CompteEntreprise = {
  offreCommerciale: string;
  raisonSociale: string;
  siret: string;
  adresse: string;
  detenteurCarteT: boolean;
  numeroAgrement: string;
  iban: string;
  titulaireRib: string;
  equipeHote: string;
  equipeQuittee: boolean;
};

export const COMPTE_DEFAUT: CompteEntreprise = {
  offreCommerciale: "Gestion locative",
  raisonSociale: "",
  siret: "",
  adresse: "",
  detenteurCarteT: false,
  numeroAgrement: "",
  iban: "",
  titulaireRib: "",
  equipeHote: "THIERRY",
  equipeQuittee: false,
};

export const CLE_COMPTE_LEGACY = "hublify.compte-entreprise.v1";

export function normaliserCompte(brut: unknown): CompteEntreprise {
  if (!brut || typeof brut !== "object") return { ...COMPTE_DEFAUT };
  const o = brut as Partial<CompteEntreprise>;
  return {
    ...COMPTE_DEFAUT,
    ...o,
    detenteurCarteT: Boolean(o.detenteurCarteT),
    equipeQuittee: Boolean(o.equipeQuittee),
    equipeHote: o.equipeHote?.trim() || COMPTE_DEFAUT.equipeHote,
    offreCommerciale: o.offreCommerciale?.trim() || COMPTE_DEFAUT.offreCommerciale,
  };
}

/** Luhn, tel que le SIRET français l'applique sur 14 chiffres. */
export function luhnValide(chiffres: string): boolean {
  if (!/^\d+$/.test(chiffres)) return false;
  let somme = 0;
  let alterner = false;
  for (let i = chiffres.length - 1; i >= 0; i -= 1) {
    let n = Number(chiffres[i]);
    if (alterner) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    somme += n;
    alterner = !alterner;
  }
  return somme % 10 === 0;
}

export function siretValide(valeur: string): boolean {
  const chiffres = valeur.replace(/\s/g, "");
  return chiffres.length === 14 && luhnValide(chiffres);
}

export function profilCarteTVerifie(input: {
  detenteurCarteT: boolean;
  numeroAgrement: string;
  recto: boolean;
  verso: boolean;
}): boolean {
  const agrement = input.numeroAgrement.replace(/\s/g, "");
  return input.detenteurCarteT && agrement.length >= 5 && input.recto && input.verso;
}

export function messageCompte(compte: CompteEntreprise): string | null {
  if (compte.siret.trim() && !siretValide(compte.siret)) {
    return "Le SIRET doit comporter 14 chiffres et une clé valide.";
  }
  if (compte.iban.trim() && !ibanValide(compte.iban)) {
    return "Cet IBAN est incomplet ou sa clé est incorrecte.";
  }
  if (compte.detenteurCarteT && compte.numeroAgrement.replace(/\s/g, "").length < 5) {
    return "Indiquez le numéro d'agrément du détenteur de la carte T pour vérifier le profil.";
  }
  return null;
}

/** Lecture seule du legacy — ne purge jamais. */
export function lireCompteLegacy(
  stockage: Storage | null = defautStorage(),
): CompteEntreprise | null {
  if (!stockage) return null;
  try {
    const brut = stockage.getItem(CLE_COMPTE_LEGACY);
    if (!brut) return null;
    return normaliserCompte(JSON.parse(brut) as unknown);
  } catch {
    return null;
  }
}

export function ecrireCompteLegacy(
  compte: CompteEntreprise,
  stockage: Storage | null = defautStorage(),
) {
  if (!stockage) return;
  try {
    stockage.setItem(CLE_COMPTE_LEGACY, JSON.stringify(normaliserCompte(compte)));
  } catch {
    /* quota */
  }
}

export function purgerCompteLocal(stockage: Storage | null = defautStorage()) {
  if (!stockage) return;
  try {
    stockage.removeItem(CLE_COMPTE_LEGACY);
  } catch {
    /* ignore */
  }
}

function defautStorage(): Storage | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage;
}

export type ResultatSauverCompte =
  | { ok: true }
  | { ok: false; raison: "non_authentifie" | "non_configure" | "interdit" | "reseau" | "invalide" };

/**
 * Persiste le compte distant. Ne purge le RIB local qu'après succès confirmé.
 * En cas d'échec, conserve (ou réécrit) le legacy pour ne pas perdre la saisie.
 */
export async function persisterCompteEntreprise(
  suivant: CompteEntreprise,
  deps?: {
    sauverDistant?: (
      data: CompteEntreprise,
    ) => Promise<
      | { ok: true; data: CompteEntreprise }
      | { ok: false; raison: "non_authentifie" | "non_configure" | "interdit" }
    >;
    stockage?: Storage | null;
  },
): Promise<ResultatSauverCompte> {
  const propre = normaliserCompte(suivant);
  const err = messageCompte(propre);
  if (err) return { ok: false, raison: "invalide" };
  const stockage = deps?.stockage === undefined ? defautStorage() : deps.stockage;
  try {
    const sauver =
      deps?.sauverDistant ??
      (async (data: CompteEntreprise) => {
        const mod = await import("@/data/parametres-remote");
        return mod.sauverCompteDistant({ data });
      });
    const res = await sauver(propre);
    if (res.ok) {
      purgerCompteLocal(stockage);
      return { ok: true };
    }
    ecrireCompteLegacy(propre, stockage);
    return { ok: false, raison: res.raison };
  } catch {
    ecrireCompteLegacy(propre, stockage);
    return { ok: false, raison: "reseau" };
  }
}

export function useCompteEntreprise() {
  const [compte, setCompte] = useState<CompteEntreprise>(COMPTE_DEFAUT);

  useEffect(() => {
    let actif = true;
    const legacy = lireCompteLegacy();
    void import("@/data/parametres-remote").then(({ chargerCompteDistant, sauverCompteDistant }) =>
      chargerCompteDistant().then(async (res) => {
        if (!actif) return;
        if (res.ok) {
          const distant = res.data;
          const vide =
            !distant.iban && !distant.raisonSociale && !distant.siret && !distant.titulaireRib;
          if (vide && legacy) {
            setCompte(legacy);
            const sauve = await sauverCompteDistant({ data: legacy });
            if (sauve.ok) purgerCompteLocal();
            // Échec : on garde le legacy intact jusqu'à une sauvegarde réussie.
          } else {
            setCompte(distant);
            if (!vide) purgerCompteLocal();
          }
        } else if (legacy) {
          setCompte(legacy);
        }
      }),
    );
    return () => {
      actif = false;
    };
  }, []);

  return {
    compte,
    async sauver(suivant: CompteEntreprise): Promise<ResultatSauverCompte> {
      const propre = normaliserCompte(suivant);
      setCompte(propre);
      return persisterCompteEntreprise(propre);
    },
  };
}
