import { useEffect, useState } from "react";
import { ibanValide } from "@/lib/iban";

export { ibanValide } from "@/lib/iban";

/**
 * Champs du compte gestionnaire (raison sociale, SIRET, carte T, RIB, équipe).
 * Persistés en base (`org_compte`). Le RIB ne doit plus rester dans localStorage.
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

const CLE_LEGACY = "hublify.compte-entreprise.v1";

function lireLegacyPuisPurger(): CompteEntreprise | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const brut = localStorage.getItem(CLE_LEGACY);
    localStorage.removeItem(CLE_LEGACY);
    if (!brut) return null;
    return normaliserCompte(JSON.parse(brut) as unknown);
  } catch {
    try {
      localStorage.removeItem(CLE_LEGACY);
    } catch {
      /* ignore */
    }
    return null;
  }
}

export function purgerCompteLocal() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(CLE_LEGACY);
  } catch {
    /* ignore */
  }
}

export function useCompteEntreprise() {
  const [compte, setCompte] = useState<CompteEntreprise>(COMPTE_DEFAUT);

  useEffect(() => {
    let actif = true;
    const legacy = lireLegacyPuisPurger();
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
          } else {
            setCompte(distant);
          }
        } else if (legacy) {
          setCompte(legacy);
        }
        purgerCompteLocal();
      }),
    );
    return () => {
      actif = false;
    };
  }, []);

  return {
    compte,
    sauver(suivant: CompteEntreprise) {
      const propre = normaliserCompte(suivant);
      setCompte(propre);
      purgerCompteLocal();
      void import("@/data/parametres-remote").then(({ sauverCompteDistant }) =>
        sauverCompteDistant({ data: propre }).finally(() => {
          purgerCompteLocal();
        }),
      );
    },
  };
}
