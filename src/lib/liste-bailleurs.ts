import type { Quota } from "@/lib/cadence-persistante";
import type { Mail } from "@/lib/mail";

/** Délai minimal entre l'affichage du formulaire et l'envoi : un humain met plus longtemps. */
export const DELAI_MINIMAL_MS = 2000;
/** Au-delà, le formulaire est périmé (ou l'horodatage est forgé). */
export const DELAI_MAXIMAL_MS = 24 * 60 * 60 * 1000;
const HEURE = 60 * 60 * 1000;
const JOUR = 24 * HEURE;
export const PLAFONDS = {
  ip: { max: 5, fenetreMs: HEURE },
  email: { max: 2, fenetreMs: JOUR },
  global: { max: 50, fenetreMs: HEURE },
} as const;

// Partie locale et domaine restreints : pas d'espace, de chevrons, de guillemets ni
// de caractères de contrôle. Le domaine doit avoir un TLD alphabétique d'au moins 2 lettres.
const EMAIL =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;

export function adresseListeValide(valeur: unknown) {
  if (typeof valeur !== "string") return null;
  const email = valeur.trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) return null;
  if (email.includes("..") || email.startsWith(".") || email.split("@")[0]!.endsWith(".")) {
    return null;
  }
  return email;
}

export type EntreeListe = {
  email: string;
  /** Champ piège invisible : rempli = robot. */
  piege: string;
  /** Horodatage (ms) de l'affichage du formulaire côté navigateur. */
  ouvertLe: number;
  jeton?: string;
};

const CHAMPS = new Set(["email", "site", "ouvertLe", "jeton"]);

/** Validation stricte : objet simple, champs connus, types et tailles bornés. */
export function validerEntreeListe(input: unknown): EntreeListe {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Requête invalide.");
  }
  const brut = input as Record<string, unknown>;
  if (Object.keys(brut).some((k) => !CHAMPS.has(k))) throw new Error("Requête invalide.");
  const email = adresseListeValide(brut["email"]);
  if (!email) throw new Error("Adresse e-mail invalide.");
  const piege = brut["site"] ?? "";
  if (typeof piege !== "string" || piege.length > 200) throw new Error("Requête invalide.");
  const ouvertLe = brut["ouvertLe"];
  if (typeof ouvertLe !== "number" || !Number.isFinite(ouvertLe)) {
    throw new Error("Requête invalide.");
  }
  const jeton = brut["jeton"];
  if (jeton !== undefined && (typeof jeton !== "string" || jeton.length > 2048)) {
    throw new Error("Requête invalide.");
  }
  return { email, piege, ouvertLe, ...(typeof jeton === "string" ? { jeton } : {}) };
}

/** Robot probable : réponse identique à un succès, mais rien n'est envoyé. */
export function signesDeRobot(entree: EntreeListe, maintenant: number) {
  if (entree.piege.trim() !== "") return true;
  const ecoule = maintenant - entree.ouvertLe;
  return ecoule < DELAI_MINIMAL_MS || ecoule > DELAI_MAXIMAL_MS;
}

export async function empreinteEmail(email: string) {
  const octets = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email));
  return Array.from(new Uint8Array(octets), (o) => o.toString(16).padStart(2, "0")).join("");
}

export async function quotasListe(email: string, cleIp: string): Promise<Quota[]> {
  return [
    { cle: `${cleIp}`, ...PLAFONDS.ip },
    { cle: `liste-bailleurs:email:${await empreinteEmail(email)}`, ...PLAFONDS.email },
    { cle: "liste-bailleurs:global", ...PLAFONDS.global },
  ];
}

function echapper(texte: string) {
  return texte.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

export function mailConfirmation(email: string): Mail {
  return {
    a: email,
    sujet: "Hublify — inscription à la liste des bailleurs",
    html: `<p>Votre adresse ${echapper(email)} est inscrite à la liste des bailleurs Hublify.</p>`,
  };
}

export type Dependances = {
  maintenant: () => number;
  consommer: (quotas: Quota[]) => Promise<boolean>;
  verifierCaptcha: (jeton: string | undefined) => Promise<boolean>;
  envoyer: (mail: Mail) => Promise<boolean>;
};

/**
 * Ordre : robot (silencieux) → captcha → plafonds → envoi. Les rejets « robot »
 * répondent comme un succès pour ne rien apprendre au script.
 */
export async function traiterInscription(entree: EntreeListe, cleIp: string, d: Dependances) {
  if (signesDeRobot(entree, d.maintenant())) return { ok: true as const, envoye: false };
  if (!(await d.verifierCaptcha(entree.jeton))) {
    throw new Error("Vérification anti-robot échouée. Rechargez la page.");
  }
  if (!(await d.consommer(await quotasListe(entree.email, cleIp)))) {
    throw new Error("Trop de tentatives. Réessayez plus tard.");
  }
  const envoye = await d.envoyer(mailConfirmation(entree.email));
  return { ok: true as const, envoye };
}
