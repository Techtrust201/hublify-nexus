/**
 * Champs de la maquette « Inventaire consommables » (nœud 2:46225).
 * Ils tiennent dans `inventaire_items.serie`, colonne déjà en production :
 * pas de migration à appliquer. Le préfixe `mq1|` distingue cet encodage
 * des anciens numéros de série (`REF-101`, `LINGE`).
 */

export type ChampsConsommable = {
  marque: string;
  typeArticle: string;
  prixCentimes: number;
  lieuStockage: string;
  seuil: number;
  qteParOccupant: number;
};

export const CHAMPS_VIDES: ChampsConsommable = {
  marque: "",
  typeArticle: "",
  prixCentimes: 0,
  lieuStockage: "",
  seuil: 0,
  qteParOccupant: 0,
};

const PREFIXE = "mq1|";

export function lireConsommable(serie: string | undefined): ChampsConsommable | null {
  if (!serie?.startsWith(PREFIXE)) return null;
  const parts = serie.slice(PREFIXE.length).split("|");
  const [marque, typeArticle, prix, lieu, seuil, qte] = parts;
  return {
    marque: decoder(marque),
    typeArticle: decoder(typeArticle),
    prixCentimes: entier(prix),
    lieuStockage: decoder(lieu),
    seuil: entier(seuil),
    qteParOccupant: entier(qte),
  };
}

export function ecrireConsommable(champs: ChampsConsommable) {
  return (
    PREFIXE +
    [
      encoder(champs.marque),
      encoder(champs.typeArticle),
      String(Math.max(0, Math.round(champs.prixCentimes))),
      encoder(champs.lieuStockage),
      String(Math.max(0, Math.round(champs.seuil))),
      String(Math.max(0, Math.round(champs.qteParOccupant))),
    ].join("|")
  );
}

export function champsDe(serie: string | undefined): ChampsConsommable {
  return lireConsommable(serie) ?? CHAMPS_VIDES;
}

/** Série à enregistrer : on garde un ancien numéro s'il n'y a aucun champ maquette. */
export function serieAEnregistrer(champs: ChampsConsommable, precedente = "") {
  const vide =
    !champs.marque.trim() &&
    !champs.typeArticle.trim() &&
    champs.prixCentimes <= 0 &&
    !champs.lieuStockage.trim() &&
    champs.seuil <= 0 &&
    champs.qteParOccupant <= 0;
  if (vide && precedente && !precedente.startsWith(PREFIXE)) return precedente;
  return ecrireConsommable(champs);
}

export function lieuxDepuisSerie(serie: string | undefined) {
  if (!serie?.startsWith("lieux:")) return [];
  return serie.slice("lieux:".length).split("|").map(decoder).filter(Boolean);
}

export function serieDepuisLieux(noms: readonly string[]) {
  return `lieux:${noms
    .map((n) => encoder(n.trim()))
    .filter(Boolean)
    .join("|")}`;
}

export type VerdictStock = "correct" | "insuffisant" | "non-suivi";

export function besoinStock(champs: ChampsConsommable, occupants: number) {
  if (champs.qteParOccupant > 0) return champs.qteParOccupant * Math.max(0, occupants);
  return Math.max(0, champs.seuil);
}

export function verdictStock(qte: number, besoin: number): VerdictStock {
  if (besoin <= 0) return "non-suivi";
  return qte >= besoin ? "correct" : "insuffisant";
}

export function euroCentimes(centimes: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    centimes / 100,
  );
}

export function centimesDepuisSaisie(saisie: string) {
  const brut = saisie.trim().replace(/\s/g, "").replace("€", "").replace(",", ".");
  if (!brut) return 0;
  const n = Number(brut);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function encoder(valeur: string | undefined) {
  return encodeURIComponent(valeur ?? "");
}

function decoder(valeur: string | undefined) {
  if (!valeur) return "";
  try {
    return decodeURIComponent(valeur);
  } catch {
    return valeur;
  }
}

function entier(valeur: string | undefined) {
  const n = Number(valeur);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}
