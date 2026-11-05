/** Point WGS84 renvoyé par Nominatim, sans clé API. */
export type PointOsm = { lat: number; lon: number };

export function pointOsm(lat: unknown, lon: unknown): PointOsm | null {
  const la = typeof lat === "number" ? lat : Number(lat);
  const lo = typeof lon === "number" ? lon : Number(lon);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return null;
  if (la < -90 || la > 90 || lo < -180 || lo > 180) return null;
  return { lat: la, lon: lo };
}

/** Iframe OpenStreetMap (export/embed, couche Mapnik) centrée sur le logement. */
export function urlIntegrerOsm(point: PointOsm): string {
  const marge = 0.008;
  const bbox = [point.lon - marge, point.lat - marge, point.lon + marge, point.lat + marge]
    .map((n) => n.toFixed(6))
    .join(",");
  const lat = point.lat.toFixed(6);
  const lon = point.lon.toFixed(6);
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`;
}
