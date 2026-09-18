const CLE = "hublify.docs.recents.v2";
const MAX = 12;

export function idsDocsRecents(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return [];
    const lu: unknown = JSON.parse(brut);
    if (!Array.isArray(lu)) return [];
    return lu.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function marquerDocRecent(id: string) {
  if (typeof localStorage === "undefined" || !id) return;
  const ids = [id, ...idsDocsRecents().filter((x) => x !== id)].slice(0, MAX);
  localStorage.setItem(CLE, JSON.stringify(ids));
}

export function docsRecentsParmi<T extends { id: string }>(docs: T[]): T[] {
  const rang = new Map(idsDocsRecents().map((id, i) => [id, i]));
  return docs
    .filter((d) => rang.has(d.id))
    .sort((a, b) => (rang.get(a.id) ?? 99) - (rang.get(b.id) ?? 99));
}
