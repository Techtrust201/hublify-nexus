import { formatCentimes } from "@/lib/analyse-finance";

export const ENCRE = "#243044";
export const AMBRE = "#e0b03a";
export const SAUGE = "#1f8f78";
export const GRIS = "#8aa0a8";

export const COULEURS_CANAL = [ENCRE, "#5d6b7c", "#8b97a3", SAUGE, AMBRE, "#5591a9", "#c4a574"];

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
