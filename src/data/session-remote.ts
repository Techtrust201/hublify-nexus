import { createServerFn } from "@tanstack/react-start";
import {
  chargerEntite,
  ecrireCollections,
  estPayloadValide,
  insererEntite,
  lireEtat,
  modifierEntite,
  type DepsEtat,
} from "@/data/etat-distant";
import { estCollectionMetier, type CollectionMetier, type EtatSession } from "@/data/etat-session";
import { sessionDepuisRequete } from "@/lib/session-serveur.server";
import { getSql } from "@/lib/sql";

const deps: DepsEtat = {
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

export const chargerEtatDistant = createServerFn({ method: "GET" }).handler(() => lireEtat(deps));

export const sauverEtatDistant = createServerFn({ method: "POST" })
  .validator((input: { patch?: Partial<EtatSession>; payload?: EtatSession }) => {
    const source = input.patch ?? input.payload;
    if (!estPayloadValide(source)) throw new Error("État de session invalide");
    return { patch: source };
  })
  .handler(({ data }) => ecrireCollections(deps, data.patch));

export const insererLigneMetier = createServerFn({ method: "POST" })
  .validator((input: { collection: string; item: { id: string } }) => {
    if (!estCollectionMetier(input.collection)) throw new Error("Collection inconnue");
    if (!input.item?.id) throw new Error("Identifiant requis");
    return { collection: input.collection as CollectionMetier, item: input.item };
  })
  .handler(({ data }) => insererEntite(deps, data.collection, data.item));

export const modifierLigneMetier = createServerFn({ method: "POST" })
  .validator((input: { collection: string; id: string; patch: Record<string, unknown> }) => {
    if (!estCollectionMetier(input.collection)) throw new Error("Collection inconnue");
    if (!input.id) throw new Error("Identifiant requis");
    return {
      collection: input.collection as CollectionMetier,
      id: input.id,
      patch: input.patch ?? {},
    };
  })
  .handler(({ data }) => modifierEntite(deps, data.collection, data.id, data.patch));

export const chargerLigneMetier = createServerFn({ method: "POST" })
  .validator((input: { collection: string; id: string }) => {
    if (!estCollectionMetier(input.collection)) throw new Error("Collection inconnue");
    if (!input.id) throw new Error("Identifiant requis");
    return { collection: input.collection as CollectionMetier, id: input.id };
  })
  .handler(async ({ data }) => {
    const res = await chargerEntite(deps, data.collection, data.id);
    if (!res.ok) return res;
    return { ok: true as const, json: JSON.stringify(res.entite) };
  });
