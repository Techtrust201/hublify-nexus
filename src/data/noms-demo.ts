import type { EtatSession } from "@/data/etat-session";
import type { MembreEquipe } from "@/data/messagerie-mo1";

/**
 * Le corpus semé avant cet audit porte des noms de remplissage
 * (maquette anglaise, personnages). On les réécrit à la lecture pour que
 * les bases déjà peuplées affichent les mêmes identités que le code,
 * sans migration.
 */
const TEXTES: ReadonlyArray<readonly [string, string]> = [
  ["Brian Griffin", "Bruno Girard"],
  ["Cleveland Brown", "Camille Brun"],
  ["Albert Flores", "Alain Forest"],
  ["Floyd Miles", "François Millet"],
  ["Emily Smith", "Émilie Moreau"],
  ["Erik Dunnell", "Éric Durand"],
  ["Arthur Ajolk", "Arthur Rolland"],
  ["Lentil Entertainment", "Linge & Entretien"],
  ["Silverlight Studio", "Studio Sérénité"],
  ["Late Check-out (14h)", "Départ tardif (14 h)"],
  ["Late Check-out (14 h)", "Départ tardif (14 h)"],
  ["Mes teams mate", "Mes coéquipiers"],
  ["Welcome book manquant", "Livret d'accueil manquant"],
  ["Assignment Terra", "Portefeuille Lyon"],
  ["Assignment Origine", "Agence"],
  ["Assignment Pradela", "Littoral"],
  ["Assignment Makey", "Montagne"],
  ["Assignment Partners", "Partenaires"],
  ["Assignment Nord", "Nord"],
  ["Assignment Est", "Est"],
];

const MEMBRES: Record<
  string,
  Pick<MembreEquipe, "prenom" | "nom" | "initiales" | "affectation">
> = {
  "me-fo": {
    prenom: "Éric",
    nom: "Durand",
    initiales: "ED",
    affectation: "Portefeuille Lyon",
  },
  "me-kv": { prenom: "Émilie", nom: "Moreau", initiales: "EM", affectation: "Agence" },
  "me-mu": { prenom: "Arthur", nom: "Rolland", initiales: "AR", affectation: "Littoral" },
  "me-tu": { prenom: "Inès", nom: "Lambert", initiales: "IL", affectation: "Montagne" },
  "me-cr": { prenom: "Clara", nom: "Renard", initiales: "CR", affectation: "Nord" },
  "me-ld": { prenom: "Lucas", nom: "Dune", initiales: "LD", affectation: "Est" },
  "me-eu": { prenom: "Elena", nom: "Ulrich", initiales: "EU", affectation: "Partenaires" },
};

const CONVERSATIONS: Record<string, { nom: string; initiales: string }> = {
  "c-brian": { nom: "Bruno Girard", initiales: "BG" },
  "c-cleveland": { nom: "Camille Brun", initiales: "CB" },
  "c-albert": { nom: "Alain Forest", initiales: "AF" },
  "c-floyd": { nom: "François Millet", initiales: "FM" },
  "c-lentil": { nom: "Linge & Entretien", initiales: "LE" },
  "c-silver": { nom: "Studio Sérénité", initiales: "SS" },
};

function remplacerTextes<T>(valeur: T): T {
  const brut = JSON.stringify(valeur);
  let suivant = brut;
  for (const [de, vers] of TEXTES) {
    if (suivant.includes(de)) suivant = suivant.split(de).join(vers);
  }
  return suivant === brut ? valeur : (JSON.parse(suivant) as T);
}

export function corrigerCorpusDemo(etat: EtatSession): EtatSession {
  const texte = remplacerTextes(etat);
  return {
    ...texte,
    membres: texte.membres.map((m) => {
      const fixe = MEMBRES[m.id];
      return fixe ? { ...m, ...fixe } : m;
    }),
    conversations: texte.conversations.map((c) => {
      const fixe = CONVERSATIONS[c.id];
      return fixe ? { ...c, nom: fixe.nom, initiales: fixe.initiales } : c;
    }),
  };
}
