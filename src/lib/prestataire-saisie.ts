import { emailValide, telephoneValide } from "@/lib/saisie";

export type SaisiePrestataire = {
  nom: string;
  ville: string;
  telephone: string;
  email: string;
};

export function normaliserPrestataire(saisie: SaisiePrestataire) {
  return {
    nom: saisie.nom.trim(),
    ville: saisie.ville.trim(),
    telephone: saisie.telephone.trim(),
    email: saisie.email.trim().toLowerCase(),
  };
}

export function saisiePrestataireValide(saisie: SaisiePrestataire) {
  const propre = normaliserPrestataire(saisie);
  return Boolean(
    propre.nom && propre.ville && emailValide(propre.email) && telephoneValide(propre.telephone),
  );
}
