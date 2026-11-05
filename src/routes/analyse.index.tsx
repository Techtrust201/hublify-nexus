// SOURCE: Hublify V1.0 — Maq V1 Gestionnaire / Analyse

import { useEffect, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AnalyseApp,
  type OngletSynthese,
  type RechercheAnalyse,
  type VueAnalyse,
} from "@/components/analyse/AnalyseApp";

const VUES: VueAnalyse[] = [
  "synthese",
  "encaissements",
  "cautions",
  "facture",
  "analyse-2",
  "analyse-3",
];
const ONGLETS: OngletSynthese[] = ["occupation", "revenus", "gestionnaires"];

export const Route = createFileRoute("/analyse/")({
  validateSearch: (raw: Record<string, unknown>): RechercheAnalyse => {
    const vue = VUES.find((v) => v === raw["vue"]);
    const onglet = ONGLETS.find((v) => v === raw["onglet"]);
    const logement = typeof raw["logement"] === "string" ? raw["logement"] : undefined;
    const debut = typeof raw["debut"] === "string" ? raw["debut"] : undefined;
    const fin = typeof raw["fin"] === "string" ? raw["fin"] : undefined;
    return {
      ...(vue && vue !== "synthese" ? { vue } : {}),
      ...(onglet && (vue === "analyse-2" || onglet !== "occupation") ? { onglet } : {}),
      ...(logement ? { logement } : {}),
      ...(debut ? { debut } : {}),
      ...(fin ? { fin } : {}),
    };
  },
  head: () => ({
    meta: [{ title: "Analyse — Hublify" }],
  }),
  component: PageAnalyse,
});

function rechercheVisible(suivant: RechercheAnalyse): RechercheAnalyse {
  return {
    ...(suivant.vue ? { vue: suivant.vue } : {}),
    ...(suivant.onglet ? { onglet: suivant.onglet } : {}),
    ...(suivant.logement ? { logement: suivant.logement } : {}),
    ...(suivant.debut ? { debut: suivant.debut } : {}),
    ...(suivant.fin ? { fin: suivant.fin } : {}),
  };
}

function PageAnalyse() {
  const navigate = useNavigate();
  const recherche = Route.useSearch();
  // Deux changements rapides (début puis fin) partagent encore l'ancienne
  // recherche du routeur : on mémorise le dernier envoi pour ne pas l'écraser.
  const courant = useRef(recherche);
  useEffect(() => {
    courant.current = recherche;
  }, [recherche]);
  return (
    <AnalyseApp
      recherche={recherche}
      onRecherche={(patch) => {
        const suivant = rechercheVisible({ ...courant.current, ...patch });
        courant.current = suivant;
        void navigate({ to: "/analyse", search: suivant });
      }}
    />
  );
}
