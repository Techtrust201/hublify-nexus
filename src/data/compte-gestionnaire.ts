import { creerMagasin } from "@/data/magasin-local";
import { useSyncExternalStore } from "react";

/**
 * Champs du compte gestionnaire absents du schéma `profils`
 * (raison sociale, SIRET, carte T, RIB, équipe). Persistés localement.
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

export function ibanValide(valeur: string): boolean {
  const compact = valeur.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(compact)) return false;
  const tourne = compact.slice(4) + compact.slice(0, 4);
  const chiffres = tourne
    .split("")
    .map((c) => (c >= "A" && c <= "Z" ? String(c.charCodeAt(0) - 55) : c))
    .join("");
  let reste = 0;
  for (const c of chiffres) {
    reste = (reste * 10 + Number(c)) % 97;
  }
  return reste === 1;
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

const magasin = creerMagasin("hublify.compte-entreprise.v1", COMPTE_DEFAUT, normaliserCompte);

export function useCompteEntreprise() {
  const compte = useSyncExternalStore(magasin.souscrire, magasin.lire, magasin.lireServeur);
  return {
    compte,
    sauver(suivant: CompteEntreprise) {
      magasin.ecrire(normaliserCompte(suivant));
    },
  };
}
