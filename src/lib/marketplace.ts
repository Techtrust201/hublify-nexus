/**
 * Marketplace des missions ouvertes (chantier « Créer une Mission », PR 5/6, règle R2 :
 * « Ouvert » = marketplace).
 *
 * Avant la prise, un prestataire ne reçoit QUE ces sept champs. La projection est écrite
 * champ par champ : on ne filtre jamais un objet complet, et rien d'autre ne sort (ni
 * consigne, ni adresse, ni voyageur, ni réservation, ni propriétaire, ni tarif).
 */
import { aLeDroit } from "@/auth/permissions";
import { heureAffichee, lireMetaPrestation } from "@/lib/gestionnaire-planning";

export type MissionOuverte = {
  id: string;
  date: string;
  type: string;
  titre: string;
  plage: string;
  logement: string;
  ville: string;
};

/** Ligne lue par le serveur pour construire la projection. Jamais renvoyée telle quelle. */
export type LigneMissionOuverte = {
  id: unknown;
  jour: unknown;
  type_mission: unknown;
  titre: unknown;
  heure: unknown;
  description: unknown;
  bien_nom: unknown;
  bien_adresse: unknown;
};

function texte(v: unknown) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

/** Dernier morceau de l'adresse, après la dernière virgule : la ville, sans la rue. */
export function villeDepuisAdresse(adresse: unknown) {
  const morceaux = texte(adresse).split(",");
  if (morceaux.length < 2) return "";
  const ville = (morceaux.pop() ?? "").trim();
  // Un code postal seul ou un morceau qui contient encore un numéro de rue ne passe pas.
  return ville
    .replace(/^\d{4,5}\s+/, "")
    .replace(/\d+.*$/, "")
    .trim();
}

/** Plage horaire : celle de la méta si elle existe, sinon l'heure de la mission. */
export function plageMission(heure: unknown, description: unknown) {
  return heureAffichee(texte(heure), lireMetaPrestation(texte(description)));
}

export function projeterMissionOuverte(l: LigneMissionOuverte): MissionOuverte {
  return {
    id: texte(l.id),
    date: texte(l.jour).slice(0, 10),
    type: texte(l.type_mission),
    titre: texte(l.titre),
    plage: plageMission(l.heure, l.description),
    logement: texte(l.bien_nom),
    ville: villeDepuisAdresse(l.bien_adresse),
  };
}

export type ActeurMarketplace = {
  orgType: string;
  roleId: string;
  droits: readonly string[];
  email?: string;
};

/**
 * Seul un compte au rôle prestataire, dans une organisation prestataire, avec le droit de
 * modifier ses missions et un e-mail, accède à la marketplace. Un compte mal rattaché
 * (rôle prestataire sur une organisation gestionnaire) n'y accède jamais.
 */
export function peutUtiliserMarketplace(acteur: ActeurMarketplace) {
  if (acteur.orgType !== "prestataire") return false;
  if (acteur.roleId !== "prestataire") return false;
  if (!aLeDroit(acteur.droits, "mod-missions")) return false;
  return (acteur.email ?? "").includes("@");
}
