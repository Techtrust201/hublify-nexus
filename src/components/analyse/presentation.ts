import { formatCentimes } from "@/lib/analyse-finance";

/** Tokens gestionnaire : texte #4A5565, foncé #1E2939, secondaire #99A1AF. */
export const ENCRE = "#4A5565";
export const AMBRE = "#99A1AF";
export const SAUGE = "#1E2939";
export const GRIS = "#D1D5DB";
export const VERT = "#99E0B6";
export const ROUGE = "rgb(248 113 89 / 70%)";

export const COULEURS_CANAL = ["#1E2939", "#4A5565", "#6B7280", "#99A1AF", "#D1D5DB"];

export function euro(centimes: number) {
  return formatCentimes(centimes, "auto");
}

export function euroFixe(centimes: number) {
  return formatCentimes(centimes, 2);
}

export function dateCourte(iso: string) {
  if (!iso?.includes("-")) return iso || "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function tonStatut(statut: string): "ok" | "attente" | "stop" | "neutre" {
  if (statut === "Validé" || statut === "Confirmé") return "ok";
  if (statut === "En attente") return "attente";
  if (statut === "Annulé" || statut === "Non validé") return "stop";
  return "neutre";
}
