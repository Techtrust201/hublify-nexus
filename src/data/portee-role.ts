import { aLeDroit, estRolePortail, type DroitId, type RoleId } from "@/auth/permissions";
import { etatVide, type CollectionMetier, type EtatSession } from "@/data/etat-session";

/**
 * Portée métier par rôle. Les fonctions sont pures : le serveur les applique
 * avant toute lecture ou écriture, indépendamment de ce que l'interface affiche.
 */

export type ActeurPortee = {
  roleId: RoleId;
  droits: readonly string[];
  email?: string;
  prenom?: string;
  nom?: string;
};

const PRECHECKIN = [
  "precheckinStatut",
  "precheckinIdentite",
  "precheckinNbPersonnes",
  "precheckinHeureArrivee",
  "precheckinNote",
] as const;

const STATUTS_MISSION = new Set(["a_faire", "en_cours", "terminee"]);

/** Droit requis pour qu'un membre d'équipe écrive une collection. */
const DROIT_COLLECTION: Partial<Record<CollectionMetier, DroitId>> = {
  reservationsCalendrier: "mod-reservations",
  reservationsDossier: "mod-reservations",
  datesBloquees: "mod-reservations",
  datesBloqueesAnnuelles: "mod-reservations",
  occupants: "mod-reservations",
  dossiersLocation: "mod-reservations",
  partagesDossier: "mod-reservations",
  candidatures: "mod-reservations",
  actions: "mod-reservations",
  notifications: "messagerie",
  loyers: "mod-finances",
  ensembles: "mod-finances",
  regles: "mod-finances",
  biens: "mod-biens",
  immeubles: "mod-biens",
  inventaire: "mod-biens",
  prestataires: "mod-biens",
  contactsCopro: "mod-biens",
  missions: "mod-missions",
  rapportsIntervention: "mod-missions",
  conversations: "messagerie",
  messagesFil: "messagerie",
  messagesDash: "messagerie",
  documents: "voir-documents",
  modeles: "voir-documents",
  edl: "voir-documents",
  droitsPersonnalises: "gerer-equipe",
};

export function nomActeur(acteur: { prenom?: string; nom?: string }) {
  return `${acteur.prenom ?? ""} ${acteur.nom ?? ""}`.replace(/\s+/g, " ").trim().toLowerCase();
}

export function emailActeur(acteur: { email?: string }) {
  return (acteur.email ?? "").trim().toLowerCase();
}

function vide(partiel: Partial<EtatSession>): EtatSession {
  const base = etatVide();
  return { ...base, ...partiel, parametrage: partiel.parametrage ?? base.parametrage };
}

function meme(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** Fil seed (nom, sans assignation) ou fil créé par la personne (assigne = son e-mail). */
function conversationPourPersonne(
  conversation: { type: string; nom: string; assigne?: string },
  email: string,
  nom: string,
) {
  if (conversation.type === "team") return false;
  const assigne = (conversation.assigne ?? "").trim().toLowerCase();
  if (email && assigne === email) return true;
  return Boolean(nom) && !assigne && meme(conversation.nom, nom);
}

function logementDuBien(logement: string, biens: { nom: string }[]) {
  const cible = logement.toLowerCase();
  return biens.some((b) => {
    const nom = (b.nom ?? "").toLowerCase();
    return nom.length >= 4 && (cible.includes(nom) || nom.includes(cible));
  });
}

function notifsDuNom(etat: EtatSession, nom: string) {
  if (nom.length < 3) return [];
  return etat.notifications.filter((n) => `${n.titre} ${n.detail}`.toLowerCase().includes(nom));
}

function calendrierLie(
  resas: EtatSession["reservationsDossier"],
  calendrier: EtatSession["reservationsCalendrier"],
) {
  const ids = new Set(resas.flatMap((r) => [r.id, `cal-${r.id}`]));
  return calendrier.filter(
    (c) =>
      ids.has(c.id) ||
      resas.some(
        (r) =>
          r.bienId === c.bienId &&
          meme(r.occupant, c.voyageur) &&
          r.arrivee === c.arrivee &&
          r.depart === c.depart,
      ),
  );
}

function ancragePersonne(etat: EtatSession, acteur: ActeurPortee) {
  const email = emailActeur(acteur);
  const nom = nomActeur(acteur);
  const occupants = etat.occupants.filter(
    (o) => (email && o.email.toLowerCase() === email) || (nom && meme(o.nom, nom)),
  );
  const noms = new Set(occupants.map((o) => o.nom.toLowerCase()));
  if (nom) noms.add(nom);
  const logements = new Set(occupants.map((o) => o.logement.toLowerCase()).filter(Boolean));
  const resas = etat.reservationsDossier.filter(
    (r) => (email && r.email.toLowerCase() === email) || noms.has(r.occupant.toLowerCase()),
  );
  const bienIds = new Set(resas.map((r) => r.bienId));
  const biens = etat.biens.filter(
    (b) => bienIds.has(b.id) || logements.has((b.nom ?? "").toLowerCase()),
  );
  for (const b of biens) bienIds.add(b.id);
  const dossiers = etat.dossiersLocation.filter(
    (d) => (email && d.email.toLowerCase() === email) || noms.has(d.occupantNom.toLowerCase()),
  );
  const dossierIds = new Set(dossiers.map((d) => d.id));
  const conversations = etat.conversations.filter((c) => conversationPourPersonne(c, email, nom));
  const convIds = new Set(conversations.map((c) => c.id));
  return { email, nom, noms, biens, bienIds, resas, occupants, dossiers, dossierIds, conversations, convIds };
}

function filtrerLecteur(etat: EtatSession): EtatSession {
  return {
    ...etat,
    loyers: [],
    ensembles: [],
    regles: [],
    conversations: [],
    messagesFil: [],
    messagesDash: [],
    droitsPersonnalises: [],
  };
}

function filtrerLocataire(etat: EtatSession, acteur: ActeurPortee): EtatSession {
  const a = ancragePersonne(etat, acteur);
  return vide({
    parametrage: etat.parametrage,
    occupants: a.occupants,
    biens: a.biens,
    reservationsDossier: a.resas,
    reservationsCalendrier: calendrierLie(a.resas, etat.reservationsCalendrier),
    documents: etat.documents.filter((d) => logementDuBien(d.logement, a.biens)),
    loyers: etat.loyers.filter((l) => a.noms.has(l.locataire.toLowerCase())),
    conversations: a.conversations,
    messagesFil: etat.messagesFil.filter((m) => a.convIds.has(m.conversationId)),
    dossiersLocation: a.dossiers,
    partagesDossier: etat.partagesDossier.filter((p) => a.dossierIds.has(p.dossierId)),
    candidatures: etat.candidatures.filter((c) => a.dossierIds.has(c.dossierId)),
    edl: etat.edl.filter((d) => logementDuBien(d.logement, a.biens)),
    notifications: notifsDuNom(etat, a.nom),
  });
}

function filtrerVoyageur(etat: EtatSession, acteur: ActeurPortee): EtatSession {
  const a = ancragePersonne(etat, acteur);
  return vide({
    parametrage: etat.parametrage,
    occupants: a.occupants,
    biens: a.biens,
    reservationsDossier: a.resas,
    reservationsCalendrier: calendrierLie(a.resas, etat.reservationsCalendrier),
    documents: etat.documents.filter((d) => logementDuBien(d.logement, a.biens)),
    loyers: etat.loyers.filter((l) => a.noms.has(l.locataire.toLowerCase())),
    conversations: a.conversations,
    messagesFil: etat.messagesFil.filter((m) => a.convIds.has(m.conversationId)),
    edl: etat.edl.filter((d) => logementDuBien(d.logement, a.biens)),
    notifications: notifsDuNom(etat, a.nom),
  });
}

function filtrerProprietaire(etat: EtatSession, acteur: ActeurPortee): EtatSession {
  const nom = nomActeur(acteur);
  const biens = nom ? etat.biens.filter((b) => meme(b.proprietaire ?? "", nom)) : [];
  const immeubles = nom ? etat.immeubles.filter((i) => meme(i.proprietaire, nom)) : [];
  const bienIds = new Set(biens.map((b) => b.id));
  const resas = etat.reservationsDossier.filter((r) => bienIds.has(r.bienId));
  const conversations = etat.conversations.filter((c) =>
    conversationPourPersonne(c, emailActeur(acteur), nom),
  );
  const convIds = new Set(conversations.map((c) => c.id));
  return vide({
    parametrage: etat.parametrage,
    biens,
    immeubles,
    reservationsDossier: resas,
    reservationsCalendrier: etat.reservationsCalendrier.filter((r) => bienIds.has(r.bienId)),
    loyers: etat.loyers.filter((l) => logementDuBien(l.bienNom, biens)),
    documents: etat.documents.filter(
      (d) => d.vue === "proprio" || logementDuBien(d.logement, biens),
    ),
    occupants: etat.occupants.filter((o) => logementDuBien(o.logement, biens)),
    conversations,
    messagesFil: etat.messagesFil.filter((m) => convIds.has(m.conversationId)),
    edl: etat.edl.filter((d) => logementDuBien(d.logement, biens)),
    notifications: notifsDuNom(etat, nom),
  });
}

/** Réduit l'état à ce que le rôle a le droit de recevoir. L'équipe opérationnelle garde le parc. */
export function filtrerEtatPourRole(etat: EtatSession, acteur: ActeurPortee): EtatSession {
  if (acteur.roleId === "lecteur") return filtrerLecteur(etat);
  if (acteur.roleId === "locataire") return filtrerLocataire(etat, acteur);
  if (acteur.roleId === "voyageur") return filtrerVoyageur(etat, acteur);
  if (acteur.roleId === "proprietaire") return filtrerProprietaire(etat, acteur);
  return etat;
}

export function filtrerConversationsPrestataire<T extends { type: string; nom: string }>(
  conversations: readonly T[],
  nom: string,
): T[] {
  const presta = conversations.filter((c) => c.type === "prestataire");
  const cible = nom.trim().toLowerCase();
  if (!cible) return presta;
  const precis = presta.filter((c) => {
    const titre = c.nom.toLowerCase();
    return titre === cible || titre.includes(cible) || cible.includes(titre);
  });
  // Pas de clé entre un fil et un prestataire : si le nom ne correspond à
  // aucun fil, on garde les fils prestataire (cas Lucas / « Linge & Entretien »).
  return precis.length > 0 ? precis : presta;
}

export function peutEcrireCollection(acteur: ActeurPortee, collection: CollectionMetier) {
  if (acteur.roleId === "lecteur") return false;
  if (acteur.roleId === "voyageur") {
    return (
      collection === "messagesFil" ||
      collection === "conversations" ||
      collection === "reservationsDossier"
    );
  }
  if (acteur.roleId === "locataire") {
    return (
      collection === "messagesFil" ||
      collection === "conversations" ||
      collection === "dossiersLocation" ||
      collection === "partagesDossier" ||
      collection === "candidatures"
    );
  }
  if (acteur.roleId === "proprietaire") {
    return collection === "messagesFil" || collection === "conversations";
  }
  if (acteur.roleId === "prestataire") {
    return (
      collection === "missions" ||
      collection === "rapportsIntervention" ||
      collection === "messagesFil" ||
      collection === "conversations" ||
      collection === "documents"
    );
  }
  if (collection === "evenements") {
    return aLeDroit(acteur.droits, "mod-reservations") || aLeDroit(acteur.droits, "mod-finances");
  }
  const besoin = DROIT_COLLECTION[collection];
  if (!besoin) return false;
  return aLeDroit(acteur.droits, besoin);
}

export function peutInsererCollection(acteur: ActeurPortee, collection: CollectionMetier) {
  if (!peutEcrireCollection(acteur, collection)) return false;
  if (acteur.roleId === "voyageur" && collection === "reservationsDossier") return false;
  if (acteur.roleId === "prestataire" && collection === "missions") return false;
  return true;
}

export function peutModifierCollection(acteur: ActeurPortee, collection: CollectionMetier) {
  return peutEcrireCollection(acteur, collection);
}

/** Un remplacement de collection entière n'est sûr que pour l'équipe qui voit tout le parc. */
export function peutRemplacerCollections(acteur: ActeurPortee) {
  return acteur.roleId !== "lecteur" && !estRolePortail(acteur.roleId);
}

export function peutEcrireParametrage(acteur: ActeurPortee) {
  if (acteur.roleId === "lecteur" || estRolePortail(acteur.roleId)) return false;
  return aLeDroit(acteur.droits, "mod-biens") || aLeDroit(acteur.droits, "gerer-equipe");
}

export function chaineExcessive(valeur: unknown, max = 8000, profondeur = 0): boolean {
  if (profondeur > 5) return true;
  if (typeof valeur === "string") return valeur.length > max;
  if (Array.isArray(valeur)) return valeur.some((v) => chaineExcessive(v, max, profondeur + 1));
  if (valeur && typeof valeur === "object") {
    return Object.values(valeur as Record<string, unknown>).some((v) =>
      chaineExcessive(v, max, profondeur + 1),
    );
  }
  return false;
}

export type PatchReduit =
  | { ok: true; patch: Record<string, unknown> }
  | { ok: false; raison: "interdit" | "invalide" };

export function reduirePatch(
  acteur: ActeurPortee,
  collection: CollectionMetier,
  patch: Record<string, unknown>,
): PatchReduit {
  if (chaineExcessive(patch)) return { ok: false, raison: "invalide" };
  if (acteur.roleId === "voyageur" && collection === "reservationsDossier") {
    const reste: Record<string, unknown> = {};
    for (const cle of PRECHECKIN) {
      if (patch[cle] !== undefined) reste[cle] = patch[cle];
    }
    if (Object.keys(reste).length === 0) return { ok: false, raison: "interdit" };
    if (typeof reste["precheckinNote"] === "string" && reste["precheckinNote"].length > 2000) {
      return { ok: false, raison: "invalide" };
    }
    if (
      typeof reste["precheckinIdentite"] === "string" &&
      (reste["precheckinIdentite"].trim().length === 0 ||
        reste["precheckinIdentite"].length > 200)
    ) {
      return { ok: false, raison: "invalide" };
    }
    if (reste["precheckinNbPersonnes"] !== undefined) {
      const n = Number(reste["precheckinNbPersonnes"]);
      if (!Number.isFinite(n) || n < 1 || n > 30) return { ok: false, raison: "invalide" };
    }
    return { ok: true, patch: reste };
  }
  if (acteur.roleId === "prestataire" && collection === "missions") {
    if (!STATUTS_MISSION.has(String(patch["statut"] ?? ""))) {
      return { ok: false, raison: "interdit" };
    }
    return { ok: true, patch: { statut: patch["statut"] } };
  }
  if (collection === "reservationsDossier") {
    const montant = patch["montant"];
    if (typeof montant === "number" && (!Number.isFinite(montant) || montant < 0)) {
      return { ok: false, raison: "invalide" };
    }
    const arrivee = typeof patch["arrivee"] === "string" ? patch["arrivee"] : "";
    const depart = typeof patch["depart"] === "string" ? patch["depart"] : "";
    if (arrivee && depart && depart <= arrivee) return { ok: false, raison: "invalide" };
  }
  if (
    (acteur.roleId === "locataire" || acteur.roleId === "voyageur") &&
    collection === "dossiersLocation"
  ) {
    const reste = { ...patch };
    delete reste["departValide"];
    return { ok: true, patch: reste };
  }
  return { ok: true, patch };
}

export function validerInsertion(
  collection: CollectionMetier,
  item: { id: string } & Record<string, unknown>,
): "ok" | "invalide" {
  if (!item.id || String(item.id).length > 160) return "invalide";
  if (chaineExcessive(item)) return "invalide";
  if (collection === "reservationsDossier" || collection === "candidatures") {
    const montant = item["montant"];
    if (typeof montant === "number" && (!Number.isFinite(montant) || montant < 0)) return "invalide";
    const arrivee = typeof item["arrivee"] === "string" ? item["arrivee"] : "";
    const depart = typeof item["depart"] === "string" ? item["depart"] : "";
    if (arrivee && depart && depart <= arrivee) return "invalide";
  }
  if (collection === "messagesFil") {
    const texte = typeof item["texte"] === "string" ? item["texte"].trim() : "";
    if (!texte || texte.length > 4000) return "invalide";
  }
  if (collection === "loyers") {
    const montant = item["montant"];
    if (typeof montant === "number" && (!Number.isFinite(montant) || montant < 0)) return "invalide";
  }
  return "ok";
}

export function ligneAppartient(
  acteur: ActeurPortee,
  collection: CollectionMetier,
  ligne: Record<string, unknown>,
) {
  const email = emailActeur(acteur);
  const nom = nomActeur(acteur);
  if (collection === "reservationsDossier") {
    return (
      (email && String(ligne["email"] ?? "").toLowerCase() === email) ||
      (nom && meme(String(ligne["occupant"] ?? ""), nom))
    );
  }
  if (collection === "dossiersLocation") {
    return (
      (email && String(ligne["email"] ?? "").toLowerCase() === email) ||
      (nom && meme(String(ligne["occupantNom"] ?? ""), nom))
    );
  }
  if (collection === "conversations") {
    if (acteur.roleId === "prestataire") {
      return String(ligne["type"] ?? "") === "prestataire" && meme(String(ligne["nom"] ?? ""), nom);
    }
    return conversationPourPersonne(
      {
        type: String(ligne["type"] ?? ""),
        nom: String(ligne["nom"] ?? ""),
        assigne: typeof ligne["assigne"] === "string" ? ligne["assigne"] : "",
      },
      email,
      nom,
    );
  }
  return false;
}

/** Décision de retrait : on ne supprime un compte que s'il est membre de l'org courante. */
export function decisionRetrait(params: {
  acteurId: string;
  cibleId: string;
  roleCible: RoleId | null;
}): { ok: true } | { ok: false; erreur: string } {
  if (params.cibleId === params.acteurId) {
    return { ok: false, erreur: "Impossible de se retirer soi-même" };
  }
  if (!params.roleCible) return { ok: false, erreur: "Membre introuvable" };
  if (params.roleCible === "super-admin") {
    return { ok: false, erreur: "Un super-administrateur ne peut pas être retiré" };
  }
  return { ok: true };
}

export function roleInvitable(roleId: RoleId) {
  return roleId !== "super-admin" && roleId !== "prestataire" && !estRolePortail(roleId);
}
