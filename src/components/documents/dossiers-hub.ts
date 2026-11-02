// SOURCE: Hublify V1.0 — Onglets Documents, six dossiers (frame Dashboard 2:53825)
// et annotations 196:12241, 196:12242, 196:12244, 196:12248, 196:12250, 198:14631.

import type { VueDocuments, OngletResident } from "@/data/documents-mo1";

export type DossierHub = {
  id: string;
  titre: string;
  desc: string;
  badge?: string;
  vue?: VueDocuments;
  href?: "/outils/etats-des-lieux";
  onglet?: OngletResident;
};

export const DOSSIERS_HUB: DossierHub[] = [
  {
    id: "occupants",
    titre: "Occupants logements",
    desc: "Baux, dossiers locataires, documents voyageurs",
    vue: "residents",
    onglet: "locataires",
  },
  {
    id: "edl",
    titre: "États des lieux, Inventaire",
    desc: "Inventaire logement, états des lieux entrée et sortie",
    vue: "etats",
    href: "/outils/etats-des-lieux",
  },
  {
    id: "logements",
    titre: "Documents logements",
    desc: "Factures, diagnostics et divers documents",
    vue: "logements",
  },
  {
    id: "prestataires",
    titre: "Prestataires",
    desc: "Rapports de prestation, factures…",
    vue: "residents",
    onglet: "prestataires",
  },
  {
    id: "proprietaires",
    titre: "Propriétaires",
    desc: "Justificatifs, attestations de propriété",
    badge: "Accès en version Pro",
    vue: "proprio",
  },
  {
    id: "acces",
    titre: "Gestion des accès",
    desc: "Fiche d'accès logement, gestion clés et badges",
    vue: "fiches",
  },
];
