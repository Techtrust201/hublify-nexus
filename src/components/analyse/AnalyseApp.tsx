// SOURCE: Hublify V1.0 — Maq V1 Gestionnaire / Analyse
// Frames : Dashboard occupation, Revenus et paiements, Gestionnaires,
// Facture propriétaire, Analyse 2 (69:1700), Analyse 3 (69:2651).

import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  EcranAnalyse2,
  EcranAnalyse3,
  EcranCautions,
  EcranEncaissements,
  EcranFacture,
  EcranGestionnaires,
  EcranOccupation,
  EcranRevenus,
} from "@/components/analyse/ecrans";
import { dateCourte, euroFixe } from "@/components/analyse/presentation";
import { BarreOnglets } from "@/components/analyse/widgets";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { AUJOURD_HUI_MO1 } from "@/data/planning-mo1";
import { useSession } from "@/data/session";
import { formatTaux, totauxFacture } from "@/lib/analyse-finance";
import { construireAnalyse, exerciceParDefaut, exporterEncaissementsCsv } from "@/lib/analyse-vue";
import { telechargerDemo } from "@/lib/feedback";

export type VueAnalyse =
  "synthese" | "encaissements" | "cautions" | "facture" | "analyse-2" | "analyse-3";

export type OngletSynthese = "occupation" | "revenus" | "gestionnaires";

export type RechercheAnalyse = {
  vue?: VueAnalyse | undefined;
  onglet?: OngletSynthese | undefined;
  logement?: string | undefined;
  debut?: string | undefined;
  fin?: string | undefined;
};

const VUES: Array<{ id: VueAnalyse; label: string }> = [
  { id: "synthese", label: "Tableau de bord" },
  { id: "analyse-2", label: "Analyse 2" },
  { id: "analyse-3", label: "Analyse 3" },
];

const ONGLETS: Array<{ id: OngletSynthese; label: string }> = [
  { id: "occupation", label: "Occupation" },
  { id: "revenus", label: "Revenus et paiements" },
  { id: "gestionnaires", label: "Gestionnaires" },
];

function dateValide(valeur: string | undefined) {
  return Boolean(valeur && /^\d{4}-\d{2}-\d{2}$/.test(valeur));
}

export function AnalyseApp({
  recherche,
  onRecherche,
}: {
  recherche: RechercheAnalyse;
  onRecherche: (patch: Partial<RechercheAnalyse>) => void;
}) {
  const navigate = useNavigate();
  const session = useSession();
  const defaut = exerciceParDefaut(AUJOURD_HUI_MO1);
  const debut = dateValide(recherche.debut) ? recherche.debut! : defaut.debut;
  const fin = dateValide(recherche.fin) ? recherche.fin! : defaut.fin;
  const vue = recherche.vue ?? "synthese";
  const onglet = recherche.onglet ?? (vue === "analyse-2" ? "revenus" : "occupation");
  const logement = recherche.logement ?? "tous";
  const analyse = useMemo(
    () =>
      construireAnalyse(session, {
        debut,
        fin,
        bienId: logement,
        aujourdhui: AUJOURD_HUI_MO1,
      }),
    [session, debut, fin, logement],
  );
  const [notes, setNotes] = useState(false);
  const [voyageur, setVoyageur] = useState<string | null>(null);
  const [resa, setResa] = useState<string | null>(null);
  const factureVoyageur = analyse.facturesVoyageurs.find((f) => f.id === voyageur) ?? null;
  const ligneResa = analyse.historique.find((h) => h.id === resa) ?? null;
  const periodeInvalide = fin < debut;

  const sousTitre =
    vue === "encaissements"
      ? "Tableau récapitulatif des encaissements sur la période sélectionnée."
      : vue === "cautions"
        ? "Encaissements et remboursements de caution."
        : vue === "facture"
          ? "Facture propriétaire : honoraires, TVA, montant reversé ou dû."
          : vue === "analyse-2"
            ? "Suivi détaillé des revenus et des commissions"
            : vue === "analyse-3"
              ? "Historique complet des transactions"
              : onglet === "occupation"
                ? "Suivez les logements occupés et préparez les prochaines locations."
                : onglet === "gestionnaires"
                  ? "Portefeuille, commissions et frais par propriétaire."
                  : "Comprenez vos encaissements et identifiez les paiements à suivre.";

  return (
    <AppShell attendDonnees titre="Analyse, Revenus & Paiements" sousTitre={sousTitre}>
      <div className="space-y-4 rounded-card bg-line p-3 sm:p-4">
        <BarreOnglets
          label="Écrans d'analyse"
          valeur={
            vue === "encaissements" || vue === "cautions" || vue === "facture" ? "synthese" : vue
          }
          options={VUES}
          onChange={(id) =>
            onRecherche({
              vue: id === "synthese" ? undefined : id,
              onglet: id === "analyse-2" ? "revenus" : undefined,
            })
          }
        />

        <Filtres
          debut={debut}
          fin={fin}
          logement={logement}
          logements={analyse.logements}
          nb={analyse.kpi.logements}
          onDebut={(v) => onRecherche({ debut: v })}
          onFin={(v) => onRecherche({ fin: v })}
          onLogement={(v) => onRecherche({ logement: v === "tous" ? undefined : v })}
          onExporter={() =>
            telechargerDemo("encaissements-hublify.csv", exporterEncaissementsCsv(analyse))
          }
        />

        {periodeInvalide && (
          <p className="rounded-card border border-line bg-white px-3 py-2 text-sm text-ink-body">
            La date de fin précède la date de début.
          </p>
        )}

        {vue === "synthese" && (
          <BarreOnglets
            label="Vues du tableau de bord"
            valeur={onglet}
            options={ONGLETS}
            onChange={(id) => onRecherche({ onglet: id === "occupation" ? undefined : id })}
          />
        )}

        {(vue === "encaissements" || vue === "cautions" || vue === "facture") && (
          <button
            type="button"
            onClick={() => onRecherche({ vue: undefined, onglet: "revenus" })}
            className="inline-flex min-h-11 items-center text-sm font-medium text-accent-teal"
          >
            ← Retour aux revenus
          </button>
        )}

        {vue === "synthese" && onglet === "occupation" && <EcranOccupation vue={analyse} />}
        {vue === "synthese" && onglet === "revenus" && (
          <EcranRevenus
            vue={analyse}
            passerelle={session.parametrage.passerellePaiement}
            onOuvrir={(cible) => onRecherche({ vue: cible })}
            onNotes={() => setNotes(true)}
          />
        )}
        {vue === "synthese" && onglet === "gestionnaires" && <EcranGestionnaires vue={analyse} />}
        {vue === "encaissements" && <EcranEncaissements vue={analyse} />}
        {vue === "cautions" && <EcranCautions vue={analyse} />}
        {vue === "facture" && <EcranFacture vue={analyse} onVoyageur={setVoyageur} />}
        {vue === "analyse-2" && (
          <div className="space-y-4">
            <BarreOnglets
              label="Analyse 2"
              valeur={onglet === "gestionnaires" ? "revenus" : onglet}
              options={[
                { id: "occupation", label: "Occupation" },
                { id: "revenus", label: "Revenus & Paiements" },
                { id: "gestionnaires", label: "Historique" },
              ]}
              onChange={(id) => {
                if (id === "gestionnaires") onRecherche({ vue: "analyse-3", onglet: undefined });
                else onRecherche({ onglet: id });
              }}
            />
            {onglet === "occupation" && <EcranOccupation vue={analyse} />}
            {onglet !== "occupation" && (
              <EcranAnalyse2 vue={analyse} onNotes={() => setNotes(true)} onVoir={setResa} />
            )}
          </div>
        )}
        {vue === "analyse-3" && (
          <div className="space-y-4">
            <BarreOnglets
              label="Analyse 3"
              valeur="gestionnaires"
              options={[
                { id: "occupation", label: "Occupation" },
                { id: "revenus", label: "Revenus & Paiements" },
                { id: "gestionnaires", label: "Historique" },
              ]}
              onChange={(id) => {
                if (id === "gestionnaires") return;
                onRecherche({
                  vue: "analyse-2",
                  onglet: id === "occupation" ? undefined : "revenus",
                });
              }}
            />
            <EcranAnalyse3 vue={analyse} onVoir={setResa} />
          </div>
        )}
      </div>

      <Dialog open={notes} onOpenChange={setNotes}>
        <DialogContent className="max-w-md">
          <DialogTitle>Avis des logements</DialogTitle>
          <DialogDescription>
            Notes déjà portées sur les fiches. L'extraction des notes Airbnb ou Booking n'est pas
            branchée.
          </DialogDescription>
          <ul className="mt-3 space-y-2 text-sm">
            {session.biens
              .filter((b) => logement === "tous" || b.id === logement)
              .map((b) => (
                <li key={b.id} className="flex justify-between gap-3">
                  <span>{b.nom}</span>
                  <span>
                    {typeof b.note === "number" ? `${b.note.toLocaleString("fr-FR")}/5` : "—"}
                  </span>
                </li>
              ))}
          </ul>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(factureVoyageur)} onOpenChange={(o) => !o && setVoyageur(null)}>
        <DialogContent className="max-w-lg">
          <DialogTitle>Facture voyageur</DialogTitle>
          <DialogDescription>
            {factureVoyageur ? `${factureVoyageur.occupant} · ${factureVoyageur.logement}` : ""}
          </DialogDescription>
          {factureVoyageur && (
            <FactureVoyageurDetail
              lignes={factureVoyageur.lignes}
              onExporter={() => {
                const corps = factureVoyageur.lignes
                  .map(
                    (l) =>
                      `${l.nature};${l.periode};${(l.prixUnitaireHt / 100).toFixed(2)};${formatTaux(l.tauxTva)}`,
                  )
                  .join("\n");
                telechargerDemo(
                  `facture-voyageur-${factureVoyageur.reference}.csv`,
                  `Nature;Période;HT;TVA\n${corps}`,
                );
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(ligneResa)} onOpenChange={(o) => !o && setResa(null)}>
        <DialogContent className="max-w-md">
          <DialogTitle>{ligneResa?.nom}</DialogTitle>
          <DialogDescription>
            {ligneResa?.logement} · {ligneResa?.reference}
          </DialogDescription>
          {ligneResa && (
            <div className="mt-3 space-y-2 text-sm text-ink-body">
              <p>
                {dateCourte(ligneResa.arrivee)} → {dateCourte(ligneResa.depart)} · {ligneResa.nuits}{" "}
                nuits
              </p>
              <p>Canal : {ligneResa.canal}</p>
              <p>
                Loyer {euroFixe(ligneResa.montant)} · commission OTA{" "}
                {euroFixe(ligneResa.commission)}
              </p>
              <p>Net propriétaire {euroFixe(ligneResa.net)}</p>
              <p>Statut : {ligneResa.statutPaiement}</p>
              <button
                type="button"
                onClick={() =>
                  void navigate({
                    to: "/reservations",
                    search: { vue: "liste", resa: ligneResa.id },
                  })
                }
                className="mt-2 inline-flex min-h-11 items-center rounded-card bg-accent-teal px-3 text-xs font-medium text-white"
              >
                Ouvrir la réservation
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Filtres({
  debut,
  fin,
  logement,
  logements,
  nb,
  onDebut,
  onFin,
  onLogement,
  onExporter,
}: {
  debut: string;
  fin: string;
  logement: string;
  logements: Array<{ id: string; nom: string }>;
  nb: number;
  onDebut: (v: string) => void;
  onFin: (v: string) => void;
  onLogement: (v: string) => void;
  onExporter: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="grid flex-1 gap-2 sm:grid-cols-3">
        <label className="text-xs text-ink-muted">
          Début
          <input
            type="date"
            value={debut}
            onChange={(e) => onDebut(e.target.value)}
            className="mt-1 h-11 w-full rounded-card border border-line bg-white px-3 text-sm text-ink"
          />
        </label>
        <label className="text-xs text-ink-muted">
          Fin
          <input
            type="date"
            value={fin}
            onChange={(e) => onFin(e.target.value)}
            className="mt-1 h-11 w-full rounded-card border border-line bg-white px-3 text-sm text-ink"
          />
        </label>
        <label className="text-xs text-ink-muted">
          Logements
          <select
            value={logement}
            onChange={(e) => onLogement(e.target.value)}
            className="mt-1 h-11 w-full rounded-card border border-line bg-white px-3 text-sm text-ink"
          >
            <option value="tous">Tous les logements · {nb}</option>
            {logements.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nom}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="button"
        onClick={onExporter}
        className="inline-flex min-h-11 items-center justify-center gap-1 rounded-card border border-line bg-white px-3 text-xs text-ink-body"
      >
        <Download className="size-3.5" /> Exporter
      </button>
    </div>
  );
}

function FactureVoyageurDetail({
  lignes,
  onExporter,
}: {
  lignes: Array<{
    id: string;
    nature: string;
    periode: string;
    quantite: number;
    prixUnitaireHt: number;
    tauxTva: number;
    tvaForcee?: number;
  }>;
  onExporter: () => void;
}) {
  const totaux = totauxFacture(lignes);
  return (
    <div className="mt-3 space-y-3 text-sm">
      <ul className="space-y-2">
        {lignes.map((l) => (
          <li key={l.id} className="flex justify-between gap-3">
            <span>
              {l.nature}
              <span className="block text-xs text-ink-muted">
                {l.periode} · TVA {formatTaux(l.tauxTva)}
              </span>
            </span>
            <span>{euroFixe(l.prixUnitaireHt)}</span>
          </li>
        ))}
      </ul>
      <p className="flex justify-between border-t border-line pt-2 font-medium">
        <span>Total TTC</span>
        <span>{euroFixe(totaux.totalTtc)}</span>
      </p>
      <button
        type="button"
        onClick={onExporter}
        className="inline-flex min-h-11 items-center text-xs font-medium text-accent-teal"
      >
        Exporter la facture
      </button>
    </div>
  );
}
