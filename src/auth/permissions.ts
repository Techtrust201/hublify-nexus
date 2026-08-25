import type { OrgType } from "@/lib/orgs";

export const DROITS_CATALOGUE = [
  {
    id: "voir-reservations",
    groupe: "Lecture",
    titre: "Voir les réservations",
    description: "Accès en lecture aux réservations",
  },
  {
    id: "voir-finances",
    groupe: "Lecture",
    titre: "Voir les finances",
    description: "Accès en lecture aux données financières",
  },
  {
    id: "voir-biens",
    groupe: "Lecture",
    titre: "Voir les biens",
    description: "Accès en lecture aux fiches biens",
  },
  {
    id: "voir-documents",
    groupe: "Lecture",
    titre: "Voir les documents",
    description: "Accès aux documents et contrats",
  },
  {
    id: "messagerie",
    groupe: "Lecture",
    titre: "Messagerie",
    description: "Envoyer et recevoir des messages",
  },
  {
    id: "voir-calendrier",
    groupe: "Lecture",
    titre: "Voir le calendrier",
    description: "Accès au calendrier et aux vues annuelles",
  },
  {
    id: "mod-reservations",
    groupe: "Modification",
    titre: "Modifier les réservations",
    description: "Créer et modifier des réservations",
  },
  {
    id: "mod-finances",
    groupe: "Modification",
    titre: "Modifier les finances",
    description: "Saisir et modifier les montants",
  },
  {
    id: "mod-biens",
    groupe: "Modification",
    titre: "Modifier les biens",
    description: "Créer et modifier les fiches biens",
  },
  {
    id: "mod-missions",
    groupe: "Modification",
    titre: "Mettre à jour les missions",
    description: "Changer le statut des missions et interventions",
  },
  {
    id: "gerer-equipe",
    groupe: "Administration",
    titre: "Gérer l'équipe",
    description: "Inviter, modifier les droits et supprimer des membres",
  },
] as const;

export type DroitId = (typeof DROITS_CATALOGUE)[number]["id"];
export type GroupeDroit = (typeof DROITS_CATALOGUE)[number]["groupe"];

export const SUPER_ADMINS = [
  {
    email: "contact@tech-trust.fr",
    prenom: "Hugo",
    nom: "Portier",
    affectation: "Direction technique",
  },
  {
    email: "redris.gestion@gmail.com",
    prenom: "Yannick",
    nom: "Ratti",
    affectation: "Direction",
  },
  {
    email: "sasgilbois@gmail.com",
    prenom: "Viktor",
    nom: "Dubois",
    affectation: "Commercial",
  },
] as const;

export type SuperAdminEmail = (typeof SUPER_ADMINS)[number]["email"];

export function estSuperAdmin(email: string | null | undefined) {
  if (!email) return false;
  const cible = email.trim().toLowerCase();
  return SUPER_ADMINS.some((c) => c.email === cible);
}

export function superAdminParEmail(email: string) {
  const cible = email.trim().toLowerCase();
  return SUPER_ADMINS.find((c) => c.email === cible);
}

export const ROLES = [
  {
    id: "super-admin",
    label: "Super-administrateur",
    description: "Accès intégral, comptes fondateurs protégés",
  },
  {
    id: "administrateur",
    label: "Administrateur",
    description: "Pilotage complet, équipe et finances",
  },
  {
    id: "gestionnaire",
    label: "Gestionnaire",
    description: "Opérations quotidiennes sans administration d'équipe",
  },
  {
    id: "prestataire",
    label: "Prestataire",
    description: "Missions, documents d'intervention et messagerie",
  },
  {
    id: "lecteur",
    label: "Lecture",
    description: "Consultation seule, sans modification",
  },
] as const;

export type RoleId = (typeof ROLES)[number]["id"];
export type RoleLabel = (typeof ROLES)[number]["label"];

const TOUS = DROITS_CATALOGUE.map((d) => d.id);

export const DROITS_PAR_ROLE: Record<RoleId, readonly DroitId[]> = {
  "super-admin": TOUS,
  administrateur: TOUS,
  gestionnaire: TOUS.filter((id) => id !== "gerer-equipe"),
  prestataire: ["voir-calendrier", "voir-documents", "messagerie", "mod-missions"],
  lecteur: ["voir-reservations", "voir-biens", "voir-documents", "voir-calendrier"],
};

export function estDroitId(valeur: string): valeur is DroitId {
  return DROITS_CATALOGUE.some((d) => d.id === valeur);
}

export function aLeDroit(droits: readonly string[], id: DroitId) {
  return droits.includes(id);
}

export function droitsEffectifs(
  roleId: RoleId,
  personnalises?: readonly string[] | null,
) {
  if (roleId === "super-admin") {
    return [...DROITS_PAR_ROLE["super-admin"]];
  }
  if (personnalises && personnalises.length > 0) {
    return personnalises.filter(estDroitId);
  }
  return [...DROITS_PAR_ROLE[roleId]];
}

export const ROLES_EQUIPE = ROLES.filter(
  (r) => r.id !== "prestataire" && r.id !== "super-admin",
);

export function droitRequisPourChemin(pathname: string): DroitId | undefined {
  const regles: Array<{ prefixe: string; droit: DroitId }> = [
    { prefixe: "/team", droit: "gerer-equipe" },
    { prefixe: "/tarifs", droit: "voir-finances" },
    { prefixe: "/reservations/nouveau", droit: "mod-reservations" },
    { prefixe: "/outils/debuter", droit: "mod-reservations" },
    { prefixe: "/messagerie", droit: "messagerie" },
    { prefixe: "/documents", droit: "voir-documents" },
    { prefixe: "/outils/modeles", droit: "voir-documents" },
    { prefixe: "/outils/vue-annuelle", droit: "voir-calendrier" },
    { prefixe: "/missions", droit: "voir-calendrier" },
    { prefixe: "/reservations", droit: "voir-reservations" },
    { prefixe: "/occupants", droit: "voir-reservations" },
    { prefixe: "/patrimoines", droit: "voir-biens" },
    { prefixe: "/prestataires", droit: "voir-biens" },
    { prefixe: "/inventaire", droit: "voir-biens" },
  ];
  return [...regles]
    .sort((a, b) => b.prefixe.length - a.prefixe.length)
    .find((r) => pathname === r.prefixe || pathname.startsWith(`${r.prefixe}/`))?.droit;
}

export function roleParLabel(label: string): RoleId {
  const trouve = ROLES.find((r) => r.label === label);
  return trouve?.id ?? "lecteur";
}

export function labelDuRole(id: RoleId): RoleLabel {
  return ROLES.find((r) => r.id === id)?.label ?? "Lecture";
}

export function initialesDe(prenom: string, nom: string) {
  const a = prenom.trim().charAt(0);
  const b = nom.trim().charAt(0) || prenom.trim().charAt(1);
  return `${a}${b}`.toUpperCase();
}

export type AuthContexte = {
  userId: string;
  email: string;
  prenom: string;
  nom: string;
  initiales: string;
  roleId: RoleId;
  role: RoleLabel;
  droits: DroitId[];
  affectation: string;
  orgId: string;
  orgType: OrgType;
  orgNom: string;
};
