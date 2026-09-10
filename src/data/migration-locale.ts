import type { DocMo1, ItemInventaire, ModeleDoc } from "@/data/documents-mo1";
import { LOGEMENTS_PATRIMOINE } from "@/data/documents-mo1";
import type { DossierEdl } from "@/data/edl-mo1";
import type { ImmeubleSession } from "@/data/etat-session";
import type { DroitPersonnalise } from "@/data/messagerie-mo1";
import type { OccupantMo1 } from "@/data/reservations-mo1";
import { versIsoJour } from "@/data/reservations-mo1";
import { modifierSession, type EtatSession } from "@/data/session";
import { sauverAccesLieu } from "@/data/session-remote";
import { sauverDocumentsProfilDistants, sauverIdentiteDistante } from "@/data/profil-remote";

const DRAPEAU = "hublify.migration.bdd.v1";

const CLES_LEGACY = [
  "hublify.docs.ajouts.v1",
  "hublify.docs.masques.v1",
  "hublify.edl.dossiers.v1",
  "hublify.occupants.liste",
  "hublify.modeles.v1",
  "hublify.inventaire.v1",
  "hublify.lieux.config",
  "hublify.lieux.masques.v1",
  "hublify.lieux.meta.v1",
  "hublify.immeubles.v1",
  "hublify.profil.identite.v1",
  "hublify.profil.docs.v1",
  "hublify.team.droits-perso",
] as const;

type ConfigLieuLegacy = {
  codeCles?: string;
  wifi?: string;
  wifiMdp?: string;
  alarme?: string;
  consignes?: string;
};

type IdentiteLegacy = {
  prenom?: string;
  nom?: string;
  telephone1?: string;
  telephone2?: string;
  naissance?: string;
};

type DocumentProfilLegacy = {
  id: string;
  titre: string;
  statut: "Vérifié" | "En attente";
  fichier?: { nom: string; mime: string; base64: string };
};

function lire<T>(cle: string): T | null {
  try {
    const brut = localStorage.getItem(cle);
    return brut ? (JSON.parse(brut) as T) : null;
  } catch {
    return null;
  }
}

function listeNonVide<T>(valeur: T[] | null): T[] | null {
  return Array.isArray(valeur) && valeur.length > 0 ? valeur : null;
}

/**
 * Les écrans stockaient une partie du métier dans le navigateur. Au premier
 * chargement suivant la bascule en base, on remonte ce qui s'y trouve puis on
 * purge les clés : la base devient l'unique source de vérité.
 *
 * Idempotente et sans effet si l'utilisateur n'a jamais rien saisi localement.
 */
export async function migrerDonneesLocales(etat: EtatSession) {
  if (typeof localStorage === "undefined") return;
  const presentes = CLES_LEGACY.filter((c) => localStorage.getItem(c) !== null);
  if (localStorage.getItem(DRAPEAU) && presentes.length === 0) return;
  if (presentes.length === 0) {
    localStorage.setItem(DRAPEAU, "1");
    return;
  }

  const patch: Partial<EtatSession> = {};

  // Le nom fait le lien entre les identifiants de maquette (l1…) et les biens.
  const bienParNom = new Map(etat.biens.map((b) => [b.nom.toLowerCase(), b.id]));
  const bienDepuisLegacy = (idLegacy: string) => {
    if (etat.biens.some((b) => b.id === idLegacy)) return idLegacy;
    const seed = LOGEMENTS_PATRIMOINE.find((l) => l.id === idLegacy);
    return seed ? bienParNom.get(seed.nom.toLowerCase()) : undefined;
  };

  const occupants = listeNonVide(lire<OccupantMo1[]>("hublify.occupants.liste"));
  if (occupants) {
    patch.occupants = occupants.map((o) => ({
      ...o,
      arrivee: versIsoJour(o.arrivee),
      ...(o.depart ? { depart: versIsoJour(o.depart) } : {}),
    }));
  }

  const modeles = listeNonVide(lire<ModeleDoc[]>("hublify.modeles.v1"));
  if (modeles) patch.modeles = modeles;

  const inventaire = listeNonVide(lire<ItemInventaire[]>("hublify.inventaire.v1"));
  if (inventaire) patch.inventaire = inventaire;

  const edl = listeNonVide(lire<DossierEdl[]>("hublify.edl.dossiers.v1"));
  if (edl) patch.edl = edl;

  const immeubles = listeNonVide(lire<ImmeubleSession[]>("hublify.immeubles.v1"));
  if (immeubles) patch.immeubles = immeubles;

  const droits = listeNonVide(lire<DroitPersonnalise[]>("hublify.team.droits-perso"));
  if (droits) patch.droitsPersonnalises = droits;

  const ajouts = lire<DocMo1[]>("hublify.docs.ajouts.v1") ?? [];
  const masquesDocs = lire<string[]>("hublify.docs.masques.v1") ?? [];
  if (ajouts.length > 0 || masquesDocs.length > 0) {
    const restants = etat.documents.filter((d) => !masquesDocs.includes(d.id));
    const nouveaux = ajouts.filter((a) => !restants.some((d) => d.id === a.id));
    patch.documents = [...nouveaux, ...restants];
  }

  const meta = lire<Record<string, { typologie?: string }>>("hublify.lieux.meta.v1") ?? {};
  const masquesLieux = lire<string[]>("hublify.lieux.masques.v1") ?? [];
  const idsMasques = new Set(
    masquesLieux.map(bienDepuisLegacy).filter((id): id is string => Boolean(id)),
  );
  if (Object.keys(meta).length > 0 || idsMasques.size > 0) {
    patch.biens = etat.biens
      .filter((b) => !idsMasques.has(b.id))
      .map((b) => {
        const typologie = meta[b.id]?.typologie;
        return typologie ? { ...b, typologie } : b;
      });
  }

  if (Object.keys(patch).length > 0) modifierSession((e) => ({ ...e, ...patch }));

  // Les codes d'accès passent par leur propre route : ils sont chiffrés en base.
  const configs = lire<Record<string, ConfigLieuLegacy>>("hublify.lieux.config") ?? {};
  for (const [idLegacy, config] of Object.entries(configs)) {
    const bienId = bienDepuisLegacy(idLegacy);
    if (!bienId || idsMasques.has(bienId)) continue;
    await sauverAccesLieu({
      data: {
        bienId,
        wifi: config.wifi ?? "",
        consignes: config.consignes ?? "",
        codeCles: config.codeCles ?? "",
        wifiMdp: config.wifiMdp ?? "",
        alarme: config.alarme ?? "",
      },
    });
  }

  const identite = lire<IdentiteLegacy>("hublify.profil.identite.v1");
  if (identite?.prenom && identite.nom) {
    await sauverIdentiteDistante({
      data: {
        prenom: identite.prenom,
        nom: identite.nom,
        telephone1: identite.telephone1 ?? "",
        telephone2: identite.telephone2 ?? "",
        naissance: versIsoJour(identite.naissance),
      },
    });
  }

  const docsProfil = listeNonVide(lire<DocumentProfilLegacy[]>("hublify.profil.docs.v1"));
  if (docsProfil) await sauverDocumentsProfilDistants({ data: { documents: docsProfil } });

  for (const cle of CLES_LEGACY) localStorage.removeItem(cle);
  localStorage.setItem(DRAPEAU, "1");
}
