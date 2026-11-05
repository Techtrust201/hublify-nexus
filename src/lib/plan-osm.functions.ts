import { createServerFn } from "@tanstack/react-start";
import { pointOsm, type PointOsm } from "@/lib/plan-osm";
import { sessionDepuisRequete } from "@/lib/session-serveur.server";

const cache = new Map<string, PointOsm>();

/**
 * Géocode l'adresse du logement via Nominatim (OpenStreetMap, sans clé).
 * Une requête par adresse, mise en cache pour le processus.
 */
export const geocoderAdresseLivret = createServerFn({ method: "POST" })
  .validator((input: { adresse?: string }) => {
    const adresse = String(input?.adresse ?? "")
      .replace(/\s+/g, " ")
      .trim();
    if (adresse.length < 3 || adresse.length > 180) throw new Error("Adresse invalide");
    return { adresse };
  })
  .handler(async ({ data }): Promise<{ point: PointOsm | null }> => {
    const session = await sessionDepuisRequete();
    if (!session) return { point: null };
    const cle = data.adresse.toLocaleLowerCase("fr");
    const deja = cache.get(cle);
    if (deja) return { point: deja };
    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("limit", "1");
      url.searchParams.set("q", data.adresse);
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "hUblify/1.0 (livret d'accueil)",
        },
      });
      if (!res.ok) return { point: null };
      const rows = (await res.json()) as { lat?: string; lon?: string }[];
      const point = pointOsm(rows[0]?.lat, rows[0]?.lon);
      if (point) cache.set(cle, point);
      return { point };
    } catch {
      return { point: null };
    }
  });
