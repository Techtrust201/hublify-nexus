// SOURCE: Hublify V1.0 — Maq V1 Gestionnaire / Analyse
// Frames : Dashboard occupation, Revenus et paiements, Gestionnaires,
// Facture propriétaire, Analyse 2 (69:1700), Analyse 3 (69:2651).

import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useDroit } from "@/auth/auth-context";
import { Calendar, ChevronDown, ChevronRight, Download } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  debutDeMois,
  finDeMois,
  libelleMois,
  moisFrancais,
  partiesIso,
  plageAligneeSurLesMois,
} from "@/components/analyse/periode-mois";
import { cn } from "@/lib/utils";
import { AUJOURD_HUI_MO1 } from "@/data/planning-mo1";
import {
  ajouterMessageDash,
  ajouterNotif,
  definirRelanceLoyer,
  idNouveau,
  modifierMission,
  modifierReservation,
  useSession,
} from "@/data/session";
import { copierTexte, telechargerDemo, telechargerPdf, toastErreur, toastOk } from "@/lib/feedback";
import {
  descriptionVisible,
  ecrireDescription,
  facturationPrestation,
  facturesPrestataires,
  lireMetaPrestation,
  messageRefusPaiement,
  messageRelancePaiement,
  solderPrestation,
  type ResultatPaiement,
} from "@/lib/gestionnaire-planning";
import { jourLocalIso } from "@/lib/jour-local";
import { loyerDuSejour } from "@/lib/relance-loyer";
import { formatTaux, totauxFacture } from "@/lib/analyse-finance";
import { construireAnalyse, exerciceParDefaut, exporterEncaissementsCsv } from "@/lib/analyse-vue";

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

function situationImpaye(checkIn: string, encaisse: number, aujourdhui: string) {
  if (encaisse > 0) return "Paiement partiel";
  if (checkIn < aujourdhui) {
    const jours = Math.max(
      1,
      Math.round(
        (Date.parse(`${aujourdhui}T12:00:00Z`) - Date.parse(`${checkIn}T12:00:00Z`)) / 86400000,
      ),
    );
    return `${jours} jour${jours > 1 ? "s" : ""} de retard`;
  }
  return "À encaisser";
}

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
  const peutFinances = useDroit("mod-finances");
  const peutReserver = useDroit("mod-reservations");
  const peutMissions = useDroit("mod-missions");
  const peutMessages = useDroit("messagerie");
  const peutDossier = useDroit("voir-reservations");
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
  const factures = useMemo(
    () =>
      facturesPrestataires(session.missions, session.biens, {
        debut,
        fin,
        bienId: logement,
      }),
    [session.missions, session.biens, debut, fin, logement],
  );
  const impayes = analyse.lignes
    .filter((ligne) => ligne.restant > 0 && ligne.statut !== "Annulé")
    .map((ligne) => ({
      id: ligne.id,
      occupant: ligne.occupant,
      logement: ligne.logement,
      du: ligne.encaisse + ligne.restant,
      encaisse: ligne.encaisse,
      restant: ligne.restant,
      situation: situationImpaye(ligne.checkIn, ligne.encaisse, analyse.filtre.aujourdhui),
      relance: Boolean(loyerDuSejour(session.loyers, ligne)?.relanceAuto),
    }));

  const relancer = (id: string) => {
    const ligne = analyse.lignes.find((item) => item.id === id);
    if (!ligne) return;
    const jour = jourLocalIso();
    const lien = `${window.location.origin}/reservations?vue=liste&resa=${ligne.id}`;
    const texte = messageRelancePaiement({
      locataire: ligne.occupant,
      montant: ligne.restant / 100,
      bienNom: ligne.logement,
      echeance: ligne.checkIn,
      lien,
    });
    if (peutReserver) modifierReservation(ligne.id, { demandePaiementLe: jour });
    const loyer = loyerDuSejour(session.loyers, ligne);
    if (peutFinances && loyer) definirRelanceLoyer(loyer.id, true);
    if (peutMessages) {
      ajouterMessageDash({
        id: idNouveau("msg"),
        canal: "occupants",
        auteur: "Relance",
        initiales: "RL",
        bienNom: ligne.logement,
        texte,
        ilYa: "à l'instant",
      });
      ajouterNotif({
        titre: "Relance de paiement",
        detail: `${ligne.occupant} · ${ligne.logement}`,
        href: `/reservations?vue=liste&resa=${ligne.id}`,
      });
    }
    toastOk("Relance enregistrée.");
    void copierTexte(texte, "Message copié pour le mail ou le SMS.");
  };

  const payerPrestation = (id: string, ajout?: number): ResultatPaiement => {
    const mission = session.missions.find((item) => item.id === id);
    if (!mission || !peutMissions) return { ok: false, message: "Paiement impossible." };
    const meta = lireMetaPrestation(mission.description);
    const facture = facturationPrestation(meta);
    const du = facture.montant ?? 0;
    const resultat = solderPrestation(
      du,
      meta.payePrestataire ?? 0,
      ajout ?? du - (meta.payePrestataire ?? 0),
    );
    if (!resultat.ok) {
      const message = messageRefusPaiement(resultat.raison);
      toastErreur(message);
      return { ok: false, message };
    }
    modifierMission(id, {
      description: ecrireDescription(descriptionVisible(mission.description), {
        ...meta,
        payePrestataire: resultat.paye,
      }),
    });
    if (peutMessages) {
      ajouterNotif({
        titre: "Paiement prestataire",
        detail: `${mission.assigne || "Prestataire"} · ${resultat.paye.toLocaleString("fr-FR")} €`,
        href: "/analyse?onglet=revenus",
      });
    }
    toastOk(
      resultat.restant === 0 ? "Facture prestataire soldée." : "Paiement prestataire enregistré.",
    );
    return { ok: true };
  };

  const telechargerFacturePresta = (id: string) => {
    const ligne = factures.find((item) => item.id === id);
    if (!ligne) return;
    void telechargerPdf(`Facture ${ligne.prestataire}`, [
      `Prestataire : ${ligne.prestataire}`,
      `Logement : ${ligne.logement}`,
      `Date : ${ligne.date}`,
      `Montant facture : ${ligne.du} EUR`,
      `Deja regle : ${ligne.paye} EUR`,
      `Restant du : ${ligne.restant} EUR`,
    ]);
  };

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
            impayes={impayes}
            factures={factures}
            peutRelancer={peutFinances || peutReserver || peutMessages}
            peutPayer={peutMissions}
            peutDossier={peutDossier}
            onRelancer={relancer}
            onDossier={(id) => {
              void navigate({ to: "/reservations", search: { vue: "liste", resa: id } });
            }}
            onPayer={(id) => payerPrestation(id)}
            onAjouterPaiement={(id, montant) => payerPrestation(id, montant)}
            onFacture={telechargerFacturePresta}
          />
        )}
        {vue === "synthese" && onglet === "gestionnaires" && (
          <EcranGestionnaires vue={analyse} onFacture={() => onRecherche({ vue: "facture" })} />
        )}
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
  const [personnalisee, setPersonnalisee] = useState(() => !plageAligneeSurLesMois(debut, fin));

  const choisirMois = (cible: "debut" | "fin", annee: number, mois: number) => {
    if (cible === "debut") onDebut(debutDeMois(annee, mois));
    else onFin(finDeMois(annee, mois));
    setPersonnalisee(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <PiluleMois
            key={`debut-${debut}`}
            libelle="Mois de début"
            iso={debut}
            onChoisir={(annee, mois) => choisirMois("debut", annee, mois)}
          />
          <ChevronRight className="size-4 text-ink-muted" aria-hidden />
          <PiluleMois
            key={`fin-${fin}`}
            libelle="Mois de fin"
            iso={fin}
            onChoisir={(annee, mois) => choisirMois("fin", annee, mois)}
          />
          <select
            aria-label="Logements"
            value={logement}
            onChange={(e) => onLogement(e.target.value)}
            className="h-10 rounded-full border border-line bg-white px-3 text-sm text-ink shadow-[var(--shadow-carte)]"
          >
            <option value="tous">Tous les logements · {nb}</option>
            {logements.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nom}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setPersonnalisee((v) => !v)}
            className="h-10 rounded-full px-3 text-sm text-ink-body underline-offset-2 hover:underline"
            aria-expanded={personnalisee}
          >
            {personnalisee ? "Mois entiers" : "Plage personnalisée"}
          </button>
        </div>
        <button
          type="button"
          onClick={onExporter}
          className="inline-flex h-10 items-center justify-center gap-1 rounded-full border border-line bg-white px-3 text-xs text-ink-body shadow-[var(--shadow-carte)]"
        >
          <Download className="size-3.5" /> Exporter
        </button>
      </div>
      {personnalisee && (
        <div className="grid gap-2 sm:grid-cols-2 sm:max-w-md">
          <label className="text-xs text-ink-muted">
            Début
            <input
              type="date"
              value={debut}
              onChange={(e) => onDebut(e.target.value)}
              className="mt-1 h-10 w-full rounded-card border border-line bg-white px-3 text-sm text-ink"
            />
          </label>
          <label className="text-xs text-ink-muted">
            Fin
            <input
              type="date"
              value={fin}
              onChange={(e) => onFin(e.target.value)}
              className="mt-1 h-10 w-full rounded-card border border-line bg-white px-3 text-sm text-ink"
            />
          </label>
        </div>
      )}
    </div>
  );
}

function PiluleMois({
  libelle,
  iso,
  onChoisir,
}: {
  libelle: string;
  iso: string;
  onChoisir: (annee: number, mois: number) => void;
}) {
  const { annee } = partiesIso(iso);
  const [anneeVue, setAnneeVue] = useState(annee);
  const [ouvert, setOuvert] = useState(false);
  const texte = libelleMois(iso);

  return (
    <Popover
      open={ouvert}
      onOpenChange={(o) => {
        setOuvert(o);
        if (o) setAnneeVue(annee);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${libelle}, ${texte}`}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-white px-3 text-sm text-ink shadow-[var(--shadow-carte)]"
        >
          <Calendar className="size-3.5 text-ink-muted" aria-hidden />
          {texte}
          <ChevronDown className="size-3.5 text-ink-muted" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        role="dialog"
        aria-label="Choisir le mois"
        className="w-64 border-line bg-white p-3 text-ink"
      >
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            aria-label="Année précédente"
            className="flex size-8 items-center justify-center rounded-full hover:bg-surface"
            onClick={() => setAnneeVue((a) => a - 1)}
          >
            <ChevronRight className="size-4 rotate-180" />
          </button>
          <span className="text-sm font-medium">{anneeVue}</span>
          <button
            type="button"
            aria-label="Année suivante"
            className="flex size-8 items-center justify-center rounded-full hover:bg-surface"
            onClick={() => setAnneeVue((a) => a + 1)}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 12 }, (_, i) => {
            const mois = i + 1;
            const actif = libelleMois(iso) === `${moisFrancais(i)} ${anneeVue}`;
            return (
              <button
                key={mois}
                type="button"
                aria-pressed={actif}
                className={cn(
                  "h-9 rounded-full text-xs",
                  actif ? "bg-ink text-white" : "text-ink-body hover:bg-surface",
                )}
                onClick={() => {
                  onChoisir(anneeVue, mois);
                  setOuvert(false);
                }}
              >
                {moisFrancais(i)}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
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
