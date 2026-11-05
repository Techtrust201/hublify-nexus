import { createServerFn } from "@tanstack/react-start";
import type { LivretAccueil } from "@/data/livrets";
import {
  enregistrerExtraPrecheckin,
  enregistrerFicheUpsell,
  lireExtraPrecheckinOrg,
  lireFichesUpsell,
  lireLivrets,
  remplacerLivrets,
  retirerFicheUpsell,
  type DepsOutils,
} from "@/data/outils-distant";
import { ficheStockee, type FicheUpsell } from "@/data/upsells-catalogue";
import { normaliserExtra, type ExtraPrecheckin } from "@/lib/gestionnaire-planning";
import { sessionDepuisRequete } from "@/lib/session-serveur.server";
import { getSql } from "@/lib/sql";

const deps: DepsOutils = {
  sessionOrg: async () => {
    const s = await sessionDepuisRequete();
    if (!s) return null;
    return {
      orgId: s.orgId,
      orgType: s.orgType,
      roleId: s.roleId,
      droits: s.droits,
    };
  },
  sql: () => getSql(),
};

export const chargerLivretsDistants = createServerFn({ method: "GET" }).handler(() =>
  lireLivrets(deps),
);

export const sauverLivretsDistants = createServerFn({ method: "POST" })
  .validator((input: { livrets?: LivretAccueil[] }) => {
    if (!Array.isArray(input?.livrets)) throw new Error("Liste de livrets invalide");
    return { livrets: input.livrets };
  })
  .handler(({ data }) => remplacerLivrets(deps, data.livrets));

export const chargerFichesUpsellDistantes = createServerFn({ method: "GET" }).handler(() =>
  lireFichesUpsell(deps),
);

export const sauverFicheUpsellDistante = createServerFn({ method: "POST" })
  .validator((input: { upsellId?: string; fiche?: FicheUpsell }) => {
    const upsellId = String(input?.upsellId ?? "").trim();
    const fiche = ficheStockee(input?.fiche);
    if (!upsellId || !fiche) throw new Error("Fiche upsell invalide");
    return { upsellId, fiche };
  })
  .handler(({ data }) => enregistrerFicheUpsell(deps, data.upsellId, data.fiche));

export const retirerFicheUpsellDistante = createServerFn({ method: "POST" })
  .validator((input: { upsellId?: string }) => {
    const upsellId = String(input?.upsellId ?? "").trim();
    if (!upsellId) throw new Error("Identifiant requis");
    return { upsellId };
  })
  .handler(({ data }) => retirerFicheUpsell(deps, data.upsellId));

export const chargerExtraPrecheckinDistant = createServerFn({ method: "GET" }).handler(() =>
  lireExtraPrecheckinOrg(deps),
);

export const sauverExtraPrecheckinDistant = createServerFn({ method: "POST" })
  .validator((input: ExtraPrecheckin) => normaliserExtra(input))
  .handler(({ data }) => enregistrerExtraPrecheckin(deps, data));
