import { formatCentimes } from "@/lib/analyse-finance";

/** Gris foncé de la maquette Analyse (barres, donut, courbes), pas le sarcelle produit. */
export const ENCRE = "#4B5563";
export const AMBRE = "#9CA3AF";
export const SAUGE = "#1E2939";
export const GRIS = "#D1D5DB";

export const COULEURS_CANAL = ["#1E2939", "#4B5563", "#6B7280", "#9CA3AF", "#D1D5DB"];

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
