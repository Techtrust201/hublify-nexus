// SOURCE: Hublify V1.0 — Maq V1 Gestionnaire / Analyse, Analyse 2, Analyse 3

import { Download, FileDown } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ScrollHint } from "@/components/layout/ScrollHint";
import {
  GraphiqueCanaux,
  GraphiqueEncaissements,
  GraphiqueOccupation,
  GraphiqueProgression,
} from "@/components/analyse/graphiques";
import {
  COULEURS_CANAL,
  dateCourte,
  euro,
  euroFixe,
  tonStatut,
} from "@/components/analyse/presentation";
import { Carte, Kpi, Pastille } from "@/components/analyse/widgets";
import { formatTaux, totauxFacture } from "@/lib/analyse-finance";
import {
  exporterEncaissementsCsv,
  piedsFacture,
  type AnalyseVue,
  type LigneEncaissementAnalyse,
  type LigneHistorique,
} from "@/lib/analyse-vue";
import { telechargerDemo } from "@/lib/feedback";
import { montantDepuisSaisie, type ResultatPaiement } from "@/lib/gestionnaire-planning";
import { cn } from "@/lib/utils";

function vide(vue: AnalyseVue) {
  return vue.lignes.length === 0;
}

export function EcranOccupation({ vue }: { vue: AnalyseVue }) {
  const k = vue.kpi;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Carte teinte="menthe" className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-ink-body">Taux d'occupation</p>
              <p className="mt-1 text-4xl tracking-tight text-ink">{k.tauxOccupation} %</p>
            </div>
            <p className="max-w-[14rem] text-right text-xs text-ink-muted">
              {k.nuitsReservees} nuits occupées sur {k.nuitsDisponibles} disponibles
              {k.logements > 0 ? ` · ${k.logementsOccupes} logements sur ${k.logements}` : ""}
            </p>
          </div>
          <GraphiqueOccupation mois={vue.mois} />
        </Carte>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Kpi
            titre="Nuits disponibles"
            valeur={String(k.nuitsDisponibles)}
            detail="Sur la période sélectionnée"
          />
          <Kpi
            titre="Total de nuits réservées"
            valeur={String(k.nuitsReservees)}
            detail="Sur la période sélectionnée"
            extra={`${k.sejours} séjour${k.sejours > 1 ? "s" : ""}`}
          />
          <Kpi
            titre="Nombre de voyageurs"
            valeur={String(k.voyageurs)}
            detail="Voyageurs accueillis"
          />
          <Kpi
            titre="Nuits bloquées"
            valeur={String(k.nuitsBloquees)}
            detail="Maintenance et privées"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Carte>
          <h2 className="text-sm font-medium text-ink">Répartition par canaux</h2>
          <p className="text-xs text-ink-muted">Distribution des nuits réservées</p>
          {vue.canaux.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">
              Aucune nuit sur cette période.
            </p>
          ) : (
            <div className="mt-2 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
              <GraphiqueCanaux canaux={vue.canaux} />
              <ul className="w-full space-y-2 text-sm">
                {vue.canaux.map((c, i) => (
                  <li key={c.canal} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-ink-body">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ background: COULEURS_CANAL[i % COULEURS_CANAL.length] }}
                      />
                      {c.canal}
                    </span>
                    <span className="text-ink">
                      {c.partNuits} % <span className="text-ink-muted">{c.nuits} nuits</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Carte>
        <Carte className="min-w-0">
          <h2 className="text-sm font-medium text-ink">Progression de l'occupation</h2>
          <p className="text-xs text-ink-muted">
            Période sélectionnée et même fenêtre, un an plus tôt
          </p>
          <GraphiqueProgression
            mois={vue.mois}
            serieA="taux"
            serieB="tauxPrecedent"
            nomA="Cette période"
            nomB="Année précédente"
          />
          <p className="mt-2 flex items-center gap-2 rounded-card bg-gest-vert px-3 py-2 text-xs text-ink">
            {k.nuitsReservees} nuits occupées cette période
            {k.variationEncaisse !== null
              ? ` · encaissements ${k.variationEncaisse > 0 ? "+" : ""}${k.variationEncaisse} %`
              : ""}
          </p>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-card border border-line px-3 py-3">
            <p className="text-sm text-ink-body">Durée moyenne de séjour</p>
            <p className="text-lg text-ink">
              {k.dureeMoyenne.toLocaleString("fr-FR")}{" "}
              <span className="text-xs text-ink-muted">nuits, hors bail</span>
            </p>
          </div>
        </Carte>
      </div>
    </div>
  );
}

export type ImpayeAnalyse = {
  id: string;
  occupant: string;
  logement: string;
  du: number;
  encaisse: number;
  restant: number;
  situation: string;
  relance: boolean;
};

export type FacturePrestaVue = {
  id: string;
  titre: string;
  prestataire: string;
  logement: string;
  date: string;
  du: number;
  paye: number;
  restant: number;
};

function euroSaisi(montant: number) {
  return `${montant.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €`;
}

export function EcranRevenus({
  vue,
  passerelle,
  onOuvrir,
  onNotes,
  impayes = [],
  factures = [],
  peutRelancer = false,
  peutPayer = false,
  peutDossier = true,
  onRelancer,
  onDossier,
  onPayer,
  onAjouterPaiement,
  onFacture,
}: {
  vue: AnalyseVue;
  passerelle: boolean;
  onOuvrir: (vue: "encaissements" | "cautions" | "facture") => void;
  onNotes: () => void;
  impayes?: ImpayeAnalyse[];
  factures?: FacturePrestaVue[];
  peutRelancer?: boolean;
  peutPayer?: boolean;
  peutDossier?: boolean;
  onRelancer?: (id: string) => void;
  onDossier?: (id: string) => void;
  onPayer?: (id: string) => void;
  /** Renvoie `ok: false` (avec le message) pour laisser le dialogue ouvert. */
  onAjouterPaiement?: (id: string, montant: number) => ResultatPaiement;
  onFacture?: (id: string) => void;
}) {
  const [paiement, setPaiement] = useState<FacturePrestaVue | null>(null);
  const [montantSaisi, setMontantSaisi] = useState("");
  const [erreurPaiement, setErreurPaiement] = useState("");
  const k = vue.kpi;
  const variation =
    k.variationEncaisse === null
      ? "Pas d'exercice précédent comparable"
      : `${k.variationEncaisse > 0 ? "+" : ""}${k.variationEncaisse} % par rapport à l'année précédente`;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-3">
        <Kpi
          titre="Loyers attendus"
          valeur={euro(k.loyerAttendu)}
          detail="Loyers de la période, hors charges refacturées"
          extra={variation}
        />
        <Kpi
          teinte="menthe"
          titre="Loyers encaissés"
          valeur={euro(k.loyerEncaisse)}
          detail="Montant déjà reçu, plafonné au loyer dû"
        />
        <Kpi
          teinte="sable"
          titre="Restant en attente"
          valeur={euro(k.loyerRestant)}
          detail="Écart entre le loyer attendu et le loyer encaissé"
        />
      </div>
      <p className="text-xs text-ink-muted">
        {passerelle
          ? "Passerelle de paiement activée dans le paramétrage. Les encaissements viennent du dossier : aucune connexion Stripe n'est ouverte."
          : "Aucune passerelle de paiement activée. La connexion Stripe reste à brancher ; rien n'est prélevé depuis cet écran."}
      </p>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
        <Carte className="min-w-0">
          <h2 className="text-sm font-medium text-ink">Encaissements hors caution</h2>
          <p className="text-xs text-ink-muted">
            Encaissés et restant à encaisser, par mois d'arrivée
          </p>
          <GraphiqueEncaissements mois={vue.mois} />
        </Carte>
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <Kpi
            titre="Cautions et dépôts"
            valeur={euro(k.cautionEncaissee)}
            detail={`${euro(k.cautionRendue)} rendus`}
            action="Voir les mouvements →"
            onAction={() => onOuvrir("cautions")}
          />
          <Kpi
            titre="Montant retenu"
            valeur={euro(k.cautionRetenue)}
            detail="Sur la période sélectionnée"
          />
          <Kpi
            titre="Upsells et ventes additionnelles"
            valeur={euro(k.upsells)}
            detail="Sur la période sélectionnée"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          titre="Frais de gestion"
          valeur={euro(k.fraisGestionHt)}
          detail="Ménage, linge, consommables, check-in, check-out, travaux"
          extra="Hors net propriétaire"
          action="Détail et facture →"
          onAction={() => onOuvrir("facture")}
        />
        <Kpi
          titre="Commissions OTA et taxes"
          valeur={euro(k.commissionsOta + k.taxes)}
          detail={`OTA ${euro(k.commissionsOta)} · taxes ${euro(k.taxes)}`}
          extra="Déduite du net seulement si paye absent"
        />
        <Kpi
          titre="Commissions de gestion"
          valeur={euro(k.commissionAgenceTtc)}
          detail="Honoraires TTC, par plateforme dans le tableau"
          extra="Hors net propriétaire"
        />
        <Kpi
          teinte="menthe"
          titre="Montant encaissé net"
          valeur={euro(k.net)}
          detail="Payout : paye saisi, sinon montant − OTA"
          action="Tableau des encaissements →"
          onAction={() => onOuvrir("encaissements")}
        />
      </div>

      <Carte className="min-w-0">
        <h2 className="text-sm font-medium text-ink">Commissions par plateforme</h2>
        <p className="text-xs text-ink-muted">
          Taux effectif = commission OTA ÷ prix de référence. Les parts de nuits totalisent 100 %.
        </p>
        <TableauCanaux vue={vue} />
      </Carte>

      <Carte className="min-w-0">
        <h2 className="text-sm font-medium text-ink">Progression du bénéfice net</h2>
        <p className="text-xs text-ink-muted">Net propriétaire et loyer brut, par mois d'arrivée</p>
        <GraphiqueProgression mois={vue.mois} serieA="net" serieB="brut" nomA="Net" nomB="Brut" />
        <button
          type="button"
          onClick={onNotes}
          className="mt-2 inline-flex min-h-11 items-center text-xs font-medium text-accent-teal"
        >
          Avis des logements
          {k.noteMoyenne !== null ? ` · ${k.noteMoyenne.toLocaleString("fr-FR")}/5` : ""} →
        </button>
      </Carte>
      <Carte id="paiements-attente" className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-medium text-ink">Paiements en attente</h2>
            <p className="text-xs text-ink-muted">
              {impayes.length} paiement{impayes.length > 1 ? "s" : ""} à suivre sur la période
            </p>
          </div>
          <a href="/#paiements" className="text-xs font-medium text-accent-teal">
            Suivre les relances
          </a>
        </div>
        {impayes.length === 0 ? (
          <p className="py-6 text-sm text-ink-muted">
            Aucun paiement en attente sur cette période.
          </p>
        ) : (
          <ScrollHint className="mt-3">
            <table className="w-full min-w-[720px] text-left text-xs">
              <caption className="sr-only">Paiements de loyers encore dus</caption>
              <thead className="border-b border-surface-soft text-ink-subtle">
                <tr>
                  {[
                    "Locataire / logement",
                    "Loyer dû",
                    "Encaissé",
                    "Restant",
                    "Situation",
                    "Action",
                  ].map((h) => (
                    <th key={h} scope="col" className="px-2 py-2 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {impayes.map((l) => (
                  <tr key={l.id} className="border-b border-surface-soft last:border-0">
                    <td className="px-2 py-2 text-ink">
                      {l.occupant}
                      <span className="block text-ink-muted">{l.logement}</span>
                    </td>
                    <td className="px-2 py-2">{euro(l.du)}</td>
                    <td className="px-2 py-2">{euro(l.encaisse)}</td>
                    <td className="px-2 py-2">{euro(l.restant)}</td>
                    <td className="px-2 py-2">
                      {l.situation}
                      {l.relance ? " · relance armée" : ""}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-2">
                        {peutRelancer && onRelancer && (
                          <button
                            type="button"
                            onClick={() => onRelancer(l.id)}
                            className="inline-flex h-8 items-center rounded-full bg-ink px-3 text-xs font-medium text-white"
                          >
                            Relancer
                          </button>
                        )}
                        {peutDossier && onDossier && (
                          <button
                            type="button"
                            onClick={() => onDossier(l.id)}
                            className="inline-flex h-8 items-center rounded-full border border-line px-3 text-xs"
                          >
                            Voir le dossier
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollHint>
        )}
      </Carte>

      <Carte className="min-w-0">
        <h2 className="text-sm font-medium text-ink">Facturation prestataires</h2>
        <p className="text-xs text-ink-muted">
          Factures des prestations dont le tarif est posé. Le paiement est enregistré sur la
          mission.
        </p>
        {factures.length === 0 ? (
          <p className="py-6 text-sm text-ink-muted">
            Aucune facture prestataire sur cette période.
          </p>
        ) : (
          <ScrollHint className="mt-3">
            <table className="w-full min-w-[760px] text-left text-xs">
              <caption className="sr-only">Factures dues aux prestataires</caption>
              <thead className="border-b border-surface-soft text-ink-subtle">
                <tr>
                  {["Prestataire", "Logement", "Date", "Facturé", "Restant", "Action"].map((h) => (
                    <th key={h} scope="col" className="px-2 py-2 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {factures.map((f) => (
                  <tr key={f.id} className="border-b border-surface-soft last:border-0">
                    <td className="px-2 py-2 text-ink">
                      {f.prestataire}
                      <span className="block text-ink-muted">{f.titre}</span>
                    </td>
                    <td className="px-2 py-2">{f.logement}</td>
                    <td className="px-2 py-2">{dateCourte(f.date)}</td>
                    <td className="px-2 py-2">{euroSaisi(f.du)}</td>
                    <td className="px-2 py-2">{euroSaisi(f.restant)}</td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-2">
                        {peutPayer && f.restant > 0 && onPayer && (
                          <button
                            type="button"
                            onClick={() => onPayer(f.id)}
                            className="inline-flex h-8 items-center rounded-full bg-ink px-3 text-xs font-medium text-white"
                          >
                            Payer
                          </button>
                        )}
                        {peutPayer && f.restant > 0 && onAjouterPaiement && (
                          <button
                            type="button"
                            onClick={() => {
                              setPaiement(f);
                              setMontantSaisi(String(f.restant));
                              setErreurPaiement("");
                            }}
                            className="inline-flex h-8 items-center rounded-full border border-line px-3 text-xs"
                          >
                            Ajouter paiement
                          </button>
                        )}
                        {f.restant === 0 && (
                          <span className="inline-flex h-8 items-center text-ink-muted">Payé</span>
                        )}
                        {onFacture && (
                          <button
                            type="button"
                            onClick={() => onFacture(f.id)}
                            aria-label={`Télécharger la facture de ${f.prestataire}`}
                            className="inline-flex h-8 items-center gap-1 rounded-full border border-line px-3 text-xs"
                          >
                            <FileDown className="size-3" />
                            Facture
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollHint>
        )}
      </Carte>

      <Dialog
        open={Boolean(paiement)}
        onOpenChange={(ouvert) => {
          if (ouvert) return;
          setPaiement(null);
          setErreurPaiement("");
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogTitle>Ajouter un paiement prestataire</DialogTitle>
          <DialogDescription>
            {paiement ? `${paiement.prestataire} · restant ${euroSaisi(paiement.restant)}` : ""}
          </DialogDescription>
          <form
            className="mt-3 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!paiement || !onAjouterPaiement) return;
              const resultat = onAjouterPaiement(paiement.id, montantDepuisSaisie(montantSaisi));
              // Le dialogue ne se ferme qu'après succès : sinon on garde la saisie et l'erreur.
              if (!resultat.ok) {
                setErreurPaiement(resultat.message);
                return;
              }
              setErreurPaiement("");
              setPaiement(null);
            }}
          >
            <label className="block text-xs text-ink-muted">
              Montant (€)
              <input
                value={montantSaisi}
                onChange={(e) => {
                  setMontantSaisi(e.target.value);
                  setErreurPaiement("");
                }}
                inputMode="decimal"
                aria-invalid={erreurPaiement ? true : undefined}
                className="mt-1 h-10 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
              />
            </label>
            {erreurPaiement && (
              <p role="alert" className="text-xs text-red-600">
                {erreurPaiement}
              </p>
            )}
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-full bg-ink px-4 text-sm font-medium text-white"
            >
              Enregistrer
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {vide(vue) && <p className="text-sm text-ink-muted">Aucune réservation sur cette période.</p>}
    </div>
  );
}

function TableauCanaux({ vue }: { vue: AnalyseVue }) {
  if (vue.canaux.length === 0) {
    return <p className="py-6 text-sm text-ink-muted">Aucune commission sur cette période.</p>;
  }
  return (
    <ScrollHint className="mt-3">
      <table className="w-full min-w-[640px] text-left text-xs">
        <caption className="sr-only">Commissions OTA par plateforme</caption>
        <thead className="border-b border-surface-soft text-ink-subtle">
          <tr>
            {[
              "Plateforme",
              "Nuits",
              "Part",
              "Prix de référence",
              "Commission OTA",
              "Taux effectif",
            ].map((h) => (
              <th key={h} scope="col" className="px-2 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {vue.canaux.map((c) => (
            <tr key={c.canal} className="border-b border-surface-soft last:border-0">
              <td className="px-2 py-2 text-ink">{c.canal}</td>
              <td className="px-2 py-2">{c.nuits}</td>
              <td className="px-2 py-2">{c.partNuits} %</td>
              <td className="px-2 py-2">{euroFixe(c.prix)}</td>
              <td className="px-2 py-2">{euroFixe(c.commissionOta)}</td>
              <td className="px-2 py-2">{formatTaux(c.tauxEffectif)}</td>
            </tr>
          ))}
          <tr className="font-medium text-ink">
            <td className="px-2 py-2">Total</td>
            <td className="px-2 py-2">{vue.canaux.reduce((n, c) => n + c.nuits, 0)}</td>
            <td className="px-2 py-2">100 %</td>
            <td className="px-2 py-2">{euroFixe(vue.canaux.reduce((n, c) => n + c.prix, 0))}</td>
            <td className="px-2 py-2">{euroFixe(vue.kpi.commissionsOta)}</td>
            <td className="px-2 py-2" />
          </tr>
        </tbody>
      </table>
    </ScrollHint>
  );
}

export function EcranGestionnaires({ vue }: { vue: AnalyseVue }) {
  const k = vue.kpi;
  const proprietaires = Math.max(1, vue.proprietaires.length);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          titre="Portefeuille moyen"
          valeur={String(Math.round((k.logements / proprietaires) * 10) / 10)}
          detail={`${k.logements} logements répartis entre ${vue.proprietaires.length} propriétaire${vue.proprietaires.length > 1 ? "s" : ""}`}
        />
        <Kpi
          titre="Commissions encaissées nettes"
          valeur={euro(k.commissionAgenceTtc)}
          detail="Honoraires TTC de la période"
        />
        <Kpi
          titre="Frais de gestion"
          valeur={euro(k.fraisGestionHt)}
          detail="Linge, consommables, missions"
        />
        <Kpi
          titre="Bénéfice net des upsells"
          valeur={euro(k.upsells)}
          detail="Sur la période sélectionnée"
        />
      </div>
      <Carte className="min-w-0">
        <h2 className="text-sm font-medium text-ink">Portefeuille en gestion</h2>
        <p className="text-xs text-ink-muted">
          Une ligne par propriétaire mandant. Le gestionnaire du compte consolide ces soldes.
        </p>
        {vue.proprietaires.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">
            Aucun propriétaire sur cette période.
          </p>
        ) : (
          <ScrollHint className="mt-3">
            <table className="w-full min-w-[760px] text-left text-xs">
              <caption className="sr-only">Encaissements par propriétaire</caption>
              <thead className="border-b border-surface-soft text-ink-subtle">
                <tr>
                  {[
                    "Propriétaire",
                    "Logements",
                    "Occupation",
                    "Encaissements",
                    "Net propriétaire",
                    "Commission OTA",
                  ].map((h) => (
                    <th key={h} scope="col" className="px-2 py-2 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vue.proprietaires.map((p) => (
                  <tr key={p.id} className="border-b border-surface-soft last:border-0">
                    <td className="px-2 py-3">
                      <span className="inline-flex items-center gap-2 text-ink">
                        <span className="flex size-7 items-center justify-center rounded-full bg-surface-soft text-[10px]">
                          {p.initiales}
                        </span>
                        {p.nom}
                      </span>
                    </td>
                    <td className="px-2 py-3">{p.logements}</td>
                    <td className="px-2 py-3">
                      <p>{p.taux} %</p>
                      <span className="mt-1 block h-1.5 w-28 overflow-hidden rounded-full bg-surface-soft">
                        <span className="block h-full bg-ink" style={{ width: `${p.taux}%` }} />
                      </span>
                      <p className="mt-1 text-ink-muted">
                        {p.nuitsReservees} / {p.nuitsDisponibles} nuits
                      </p>
                    </td>
                    <td className="px-2 py-3">
                      <p>{euro(p.encaisse)}</p>
                      <p className="text-ink-muted">sur {euro(p.attendu)}</p>
                      <span className="mt-1 block h-1.5 w-28 overflow-hidden rounded-full bg-surface-soft">
                        <span
                          className="block h-full bg-ink-body"
                          style={{
                            width: `${p.attendu > 0 ? Math.min(100, Math.round((p.encaisse / p.attendu) * 100)) : 0}%`,
                          }}
                        />
                      </span>
                    </td>
                    <td className="px-2 py-3 text-ink">{euroFixe(p.net)}</td>
                    <td className="px-2 py-3">{euroFixe(p.commissionOta)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollHint>
        )}
      </Carte>
    </div>
  );
}

const COLONNES_TRI = [
  { id: "logement", label: "Logement" },
  { id: "reference", label: "Référence" },
  { id: "checkIn", label: "Check-in" },
  { id: "checkOut", label: "Check-out" },
  { id: "prix", label: "Prix" },
  { id: "ajustements", label: "Ajustements" },
  { id: "menage", label: "Ménage" },
  { id: "autres", label: "Autres services" },
  { id: "taxe", label: "Taxe de séjour" },
  { id: "ota", label: "Commission OTA" },
  { id: "agence", label: "Commission agence TTC" },
  { id: "net", label: "Net propriétaire" },
] as const;

type CleTri = (typeof COLONNES_TRI)[number]["id"];

function valeurTri(l: LigneEncaissementAnalyse, cle: CleTri) {
  switch (cle) {
    case "logement":
      return l.logement;
    case "reference":
      return l.reference;
    case "checkIn":
      return l.checkIn;
    case "checkOut":
      return l.checkOut;
    case "prix":
      return l.ventilation.prixReference;
    case "ajustements":
      return l.ventilation.ajustements;
    case "menage":
      return l.ventilation.menageLocataire;
    case "autres":
      return l.ventilation.autresServices;
    case "taxe":
      return l.ventilation.taxeSejour;
    case "ota":
      return l.ventilation.commissionOta;
    case "agence":
      return l.ventilation.commissionAgenceTtc;
    case "net":
      return l.net;
  }
}

export function EcranEncaissements({ vue }: { vue: AnalyseVue }) {
  const [tri, setTri] = useState<{ cle: CleTri; sens: 1 | -1 }>({ cle: "checkIn", sens: 1 });
  const lignes = useMemo(() => {
    return [...vue.lignes].sort((a, b) => {
      const va = valeurTri(a, tri.cle);
      const vb = valeurTri(b, tri.cle);
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb));
      return cmp * tri.sens;
    });
  }, [tri, vue.lignes]);
  const total = vue.lignes.reduce(
    (s, l) => ({
      prix: s.prix + l.ventilation.prixReference,
      ajustements: s.ajustements + l.ventilation.ajustements,
      menage: s.menage + l.ventilation.menageLocataire,
      autres: s.autres + l.ventilation.autresServices,
      taxe: s.taxe + l.ventilation.taxeSejour,
      ota: s.ota + l.ventilation.commissionOta,
      agence: s.agence + l.ventilation.commissionAgenceTtc,
      net: s.net + l.net,
    }),
    { prix: 0, ajustements: 0, menage: 0, autres: 0, taxe: 0, ota: 0, agence: 0, net: 0 },
  );

  return (
    <section className="overflow-hidden rounded-card border border-line bg-white">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-surface-soft px-4 py-3">
        <div>
          <h2 className="text-sm font-medium text-ink">Tableau récapitulatif des encaissements</h2>
          <p className="text-xs text-ink-muted">
            Sur la période sélectionnée · {lignes.length} réservations
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            telechargerDemo("encaissements-hublify.csv", exporterEncaissementsCsv(vue))
          }
          className="inline-flex min-h-11 items-center gap-1 rounded-card border border-line px-3 text-xs text-ink-body"
        >
          <Download className="size-3.5" /> Exporter
        </button>
      </header>
      {lignes.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-ink-muted">
          Aucune réservation sur cette période.
        </p>
      ) : (
        <ScrollHint>
          <table className="w-full table-fixed text-left text-[11px] leading-snug [&_td]:px-1.5 [&_th]:px-1.5">
            <caption className="sr-only">Encaissements, commissions et net propriétaire</caption>
            <thead className="border-b border-surface-soft bg-[#f7f8fa] text-ink-subtle">
              <tr>
                {COLONNES_TRI.map((c) => (
                  <th key={c.id} scope="col" className="px-2 py-2 font-medium">
                    <button
                      type="button"
                      className="inline-flex min-h-11 items-center gap-1 sm:min-h-0"
                      onClick={() =>
                        setTri((t) => ({
                          cle: c.id,
                          sens: t.cle === c.id && t.sens === 1 ? -1 : 1,
                        }))
                      }
                    >
                      {c.label}
                      <span aria-hidden>
                        {tri.cle === c.id ? (tri.sens === 1 ? "↑" : "↓") : "↕"}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => (
                <tr key={l.id} className="border-b border-surface-soft">
                  <td className="px-2 py-2 text-ink">{l.logement}</td>
                  <td className="px-2 py-2">{l.reference}</td>
                  <td className="px-2 py-2">{dateCourte(l.checkIn)}</td>
                  <td className="px-2 py-2">{dateCourte(l.checkOut)}</td>
                  <td className="px-2 py-2">{euroFixe(l.ventilation.prixReference)}</td>
                  <td className="px-2 py-2">{euroFixe(l.ventilation.ajustements)}</td>
                  <td className="px-2 py-2">{euroFixe(l.ventilation.menageLocataire)}</td>
                  <td className="px-2 py-2">{euroFixe(l.ventilation.autresServices)}</td>
                  <td className="px-2 py-2">
                    {l.taxeGereeParPlateforme
                      ? "Taxe gérée par la plateforme"
                      : euroFixe(l.ventilation.taxeSejour)}
                  </td>
                  <td className="px-2 py-2">{euroFixe(l.ventilation.commissionOta)}</td>
                  <td className="px-2 py-2">{euroFixe(l.ventilation.commissionAgenceTtc)}</td>
                  <td className="px-2 py-2 font-medium text-ink">{euroFixe(l.net)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#f7f8fa] font-medium text-ink">
                <td className="px-2 py-2" colSpan={4}>
                  Total
                </td>
                <td className="px-2 py-2">{euroFixe(total.prix)}</td>
                <td className="px-2 py-2">{euroFixe(total.ajustements)}</td>
                <td className="px-2 py-2">{euroFixe(total.menage)}</td>
                <td className="px-2 py-2">{euroFixe(total.autres)}</td>
                <td className="px-2 py-2">{euroFixe(total.taxe)}</td>
                <td className="px-2 py-2">{euroFixe(total.ota)}</td>
                <td className="px-2 py-2">{euroFixe(total.agence)}</td>
                <td className="px-2 py-2">{euroFixe(total.net)}</td>
              </tr>
            </tfoot>
          </table>
        </ScrollHint>
      )}
      <p className="px-4 py-3 text-xs text-ink-muted">
        Net propriétaire = montant payé (paye) s'il est renseigné, sinon prix de référence −
        commission OTA. Ménage locataire, commission agence, autres services et taxe de séjour sont
        affichés à titre informatif et ne sont pas déduits. La colonne Ajustements reprend les
        remboursements voyageur.
      </p>
    </section>
  );
}

export function EcranCautions({ vue }: { vue: AnalyseVue }) {
  const total = vue.cautions.reduce(
    (s, c) => ({
      du: s.du + c.du,
      encaisse: s.encaisse + c.encaisse,
      rembourse: s.rembourse + c.rembourse,
      retenu: s.retenu + c.retenu,
      solde: s.solde + c.solde,
    }),
    { du: 0, encaisse: 0, rembourse: 0, retenu: 0, solde: 0 },
  );
  return (
    <section className="overflow-hidden rounded-card border border-line bg-white">
      <header className="border-b border-surface-soft px-4 py-3">
        <h2 className="text-sm font-medium text-ink">Encaissements et remboursements de caution</h2>
        <p className="text-xs text-ink-muted">
          Encaissée à l'arrivée, restituée au départ, diminuée d'une retenue explicitement motivée.
        </p>
      </header>
      {vue.cautions.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-ink-muted">
          Aucune caution sur cette période.
        </p>
      ) : (
        <>
          <ul className="divide-y divide-surface-soft md:hidden">
            {vue.cautions.map((c) => (
              <li key={c.id} className="space-y-1 px-4 py-3 text-sm">
                <p className="font-medium text-ink">
                  {c.logement} · {c.occupant}
                </p>
                <p className="text-xs text-ink-muted">
                  {c.reference} · {dateCourte(c.checkIn)} → {dateCourte(c.checkOut)}
                </p>
                <p>Encaissé {euroFixe(c.encaisse)}</p>
                <p>Remboursé {euroFixe(c.rembourse)}</p>
                <p>Retenu {euroFixe(c.retenu)}</p>
                <p className="text-ink">Solde détenu {euroFixe(c.solde)}</p>
              </li>
            ))}
          </ul>
          <ScrollHint className="hidden md:block">
            <table className="w-full min-w-[860px] text-left text-xs">
              <caption className="sr-only">Cautions encaissées, remboursées et retenues</caption>
              <thead className="border-b border-surface-soft bg-[#f7f8fa] text-ink-subtle">
                <tr>
                  {[
                    "Logement",
                    "Référence",
                    "Voyageur",
                    "Arrivée",
                    "Départ",
                    "Due",
                    "Encaissée",
                    "Remboursée",
                    "Retenue",
                    "Solde détenu",
                  ].map((h) => (
                    <th key={h} scope="col" className="px-2 py-2 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vue.cautions.map((c) => (
                  <tr key={c.id} className="border-b border-surface-soft">
                    <td className="px-2 py-2 text-ink">{c.logement}</td>
                    <td className="px-2 py-2">{c.reference}</td>
                    <td className="px-2 py-2">{c.occupant}</td>
                    <td className="px-2 py-2">{dateCourte(c.dateEncaissement ?? c.checkIn)}</td>
                    <td className="px-2 py-2">{dateCourte(c.checkOut)}</td>
                    <td className="px-2 py-2">{euroFixe(c.du)}</td>
                    <td className="px-2 py-2">{euroFixe(c.encaisse)}</td>
                    <td className="px-2 py-2">{euroFixe(c.rembourse)}</td>
                    <td className="px-2 py-2">{euroFixe(c.retenu)}</td>
                    <td className="px-2 py-2 font-medium">{euroFixe(c.solde)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#f7f8fa] font-medium">
                  <td className="px-2 py-2" colSpan={5}>
                    Total
                  </td>
                  <td className="px-2 py-2">{euroFixe(total.du)}</td>
                  <td className="px-2 py-2">{euroFixe(total.encaisse)}</td>
                  <td className="px-2 py-2">{euroFixe(total.rembourse)}</td>
                  <td className="px-2 py-2">{euroFixe(total.retenu)}</td>
                  <td className="px-2 py-2">{euroFixe(total.solde)}</td>
                </tr>
              </tfoot>
            </table>
          </ScrollHint>
        </>
      )}
    </section>
  );
}

export function EcranFacture({
  vue,
  onVoyageur,
}: {
  vue: AnalyseVue;
  onVoyageur: (id: string) => void;
}) {
  const totaux = totauxFacture(vue.factureProprietaire);
  const pieds = piedsFacture(vue);
  return (
    <div className="space-y-4">
      <article className="rounded-card border border-line bg-white p-4 sm:p-6">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-subtle">
              Mandat de gestion
            </p>
            <h2 className="mt-1 text-xl text-ink">Facture propriétaire</h2>
            <p className="text-sm text-ink-muted">
              {dateCourte(vue.filtre.debut)} → {dateCourte(vue.filtre.fin)}
            </p>
          </div>
          <p className="max-w-sm text-xs leading-relaxed text-ink-body">
            Inclut les honoraires de mise en location et l'état des lieux lorsqu'ils sont prévus au
            mandat.
          </p>
        </header>

        <p className="mt-4 text-sm leading-relaxed text-ink-body">
          Prestation facturée : nature précise, période concernée, quantité si elle s'applique, prix
          unitaire HT et taux de TVA. Les montants donnent le total HT, la TVA par taux et le total
          TTC.
        </p>
        <p className="mt-2 text-xs text-ink-muted">
          Quand les honoraires sont un pourcentage du loyer, le taux TTC et la base figurent sur la
          ligne. Les frais correspondent à ce qui est prévu contractuellement.
        </p>

        {vue.factureProprietaire.length === 0 ? (
          <p className="py-8 text-sm text-ink-muted">
            Aucune prestation à facturer sur cette période.
          </p>
        ) : (
          <ScrollHint className="mt-4">
            <table className="w-full min-w-[760px] text-left text-xs">
              <caption className="sr-only">Lignes de la facture propriétaire</caption>
              <thead className="border-b border-surface-soft text-ink-subtle">
                <tr>
                  {["Nature", "Période", "Qté", "PU HT", "TVA", "Total HT", "TVA", "TTC"].map(
                    (h, i) => (
                      <th key={`${h}-${i}`} scope="col" className="px-2 py-2 font-medium">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {vue.factureProprietaire.map((l) => {
                  const m = {
                    ht: l.quantite * l.prixUnitaireHt,
                    tva: l.tvaForcee ?? Math.round(l.quantite * l.prixUnitaireHt * l.tauxTva),
                  };
                  return (
                    <tr key={l.id} className="border-b border-surface-soft align-top">
                      <td className="px-2 py-2 text-ink">{l.nature}</td>
                      <td className="px-2 py-2">{l.periode}</td>
                      <td className="px-2 py-2">{l.quantite}</td>
                      <td className="px-2 py-2">{euroFixe(l.prixUnitaireHt)}</td>
                      <td className="px-2 py-2">{formatTaux(l.tauxTva)}</td>
                      <td className="px-2 py-2">{euroFixe(m.ht)}</td>
                      <td className="px-2 py-2">{euroFixe(m.tva)}</td>
                      <td className="px-2 py-2">{euroFixe(m.ht + m.tva)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollHint>
        )}

        <dl className="mt-4 grid gap-2 text-sm sm:max-w-sm sm:ml-auto">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Total HT</dt>
            <dd>{euroFixe(totaux.totalHt)}</dd>
          </div>
          {totaux.tvaParTaux.map((t) => (
            <div key={t.taux} className="flex justify-between gap-4">
              <dt className="text-ink-muted">TVA {formatTaux(t.taux)}</dt>
              <dd>{euroFixe(t.tva)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 border-t border-line pt-2 font-medium text-ink">
            <dt>Total TTC</dt>
            <dd>{euroFixe(totaux.totalTtc)}</dd>
          </div>
        </dl>

        <div className="mt-6 grid gap-3 border-t border-line pt-4 md:grid-cols-2">
          <Carte teinte="menthe">
            <p className="text-xs text-ink-body">
              Montant reversé dans le cas où le mandataire perçoit les loyers
            </p>
            <p className="mt-2 text-2xl text-[#0f7a45]">{euroFixe(pieds.reverse)}</p>
            <p className="mt-1 text-xs text-ink-muted">
              Somme des nets des séjours encaissés par le mandataire.
            </p>
          </Carte>
          <Carte teinte="sable">
            <p className="text-xs text-ink-body">
              Montant dû au titre des commissions et honoraires dans le cas où le mandataire ne
              perçoit pas les loyers
            </p>
            <p className="mt-2 text-2xl text-[#8a5a00]">{euroFixe(pieds.du)}</p>
            <p className="mt-1 text-xs text-ink-muted">
              Honoraires TTC des séjours encaissés par le propriétaire, plus les frais de gestion
              avancés.
            </p>
          </Carte>
        </div>
      </article>

      <section className="rounded-card border border-line bg-white p-4">
        <h2 className="text-sm font-medium text-ink">Factures voyageurs</h2>
        <p className="text-xs text-ink-muted">
          Une facture par séjour : loyer exonéré, services à 20 % et taxe de séjour hors TVA.
        </p>
        {vue.facturesVoyageurs.length === 0 ? (
          <p className="py-6 text-sm text-ink-muted">Aucun séjour à facturer.</p>
        ) : (
          <ul className="mt-3 divide-y divide-surface-soft">
            {vue.facturesVoyageurs.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="text-sm text-ink">{f.occupant}</p>
                  <p className="text-xs text-ink-muted">
                    {f.logement} · {f.reference} · {f.periode}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-ink">{euroFixe(f.totalTtc)}</span>
                  <button
                    type="button"
                    onClick={() => onVoyageur(f.id)}
                    className="inline-flex min-h-11 items-center text-xs font-medium text-accent-teal"
                  >
                    Voir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {vue.fraisGestion.length > 0 && (
        <section className="rounded-card border border-line bg-white p-4">
          <h2 className="text-sm font-medium text-ink">Détail des frais de gestion</h2>
          <p className="text-xs text-ink-muted">
            Ménage, linge, consommables, check-in, check-out, commission exceptionnelle (travaux).
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {vue.fraisGestion.map((f) => (
              <li key={f.nature} className="flex justify-between gap-3">
                <span>
                  {f.nature} · {f.quantite} × {euroFixe(f.prixUnitaireHt)}
                </span>
                <span>{euroFixe(f.totalHt)} HT</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function EcranAnalyse2({
  vue,
  onNotes,
  onVoir,
}: {
  vue: AnalyseVue;
  onNotes: () => void;
  onVoir: (id: string) => void;
}) {
  const k = vue.kpi;
  const courts = vue.lignes.filter((l) => l.nuits <= 90 && l.canal !== "Bail");
  const nuits = courts.reduce((n, l) => n + l.nuits, 0);
  const brut = courts.reduce((n, l) => n + l.ventilation.prixReference, 0);
  const revenuNuit = nuits > 0 ? Math.round(brut / nuits) : 0;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Kpi
          titre="Revenu total"
          valeur={euro(k.loyerAttendu)}
          detail={
            k.variationEncaisse === null
              ? "Pas de mois précédent comparable"
              : `${k.variationEncaisse > 0 ? "+" : ""}${k.variationEncaisse} % vs période précédente`
          }
        />
        <Kpi
          titre="Revenu moyen par nuit"
          valeur={euro(revenuNuit)}
          detail="Courte durée, toutes plateformes"
          extra={`${nuits} nuits`}
        />
        <Kpi
          titre="Frais de ménage"
          valeur={euro(k.fraisGestionHt)}
          detail="Frais collectés sur les missions"
        />
        <Kpi
          titre="Commissions"
          valeur={euro(k.commissionsOta)}
          detail="Plateformes OTA"
          extra={
            k.loyerAttendu ? formatTaux(k.commissionsOta / k.loyerAttendu) + " moy." : undefined
          }
        />
        <Kpi titre="Autres revenus" valeur={euro(k.upsells)} detail="Services additionnels" />
        <Kpi
          titre="Avis, notes et commentaires"
          valeur={k.noteMoyenne !== null ? `${k.noteMoyenne.toLocaleString("fr-FR")}/5` : "—"}
          detail={
            k.nbNotes
              ? `Basé sur ${k.nbNotes} logement${k.nbNotes > 1 ? "s" : ""}`
              : "Aucune note enregistrée"
          }
          extra="La note des plateformes n'est pas importée"
          action="Voir le détail →"
          onAction={onNotes}
        />
      </div>
      <Carte className="min-w-0">
        <h2 className="text-sm font-medium text-ink">Évolution des revenus</h2>
        <p className="text-xs text-ink-muted">Revenus bruts et nets, après commissions</p>
        <GraphiqueProgression mois={vue.mois} serieA="net" serieB="brut" nomA="Net" nomB="Brut" />
      </Carte>
      <TableauHistorique
        titre="Liste des réservations"
        sousTitre={`${vue.historique.length} réservations`}
        lignes={vue.historique}
        variante="reservations"
        onVoir={onVoir}
      />
    </div>
  );
}

export function EcranAnalyse3({ vue, onVoir }: { vue: AnalyseVue; onVoir: (id: string) => void }) {
  const k = vue.kpi;
  const [selection, setSelection] = useState<string[]>([]);
  const toggle = (id: string) =>
    setSelection((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const exporterFiche = () => {
    const source =
      selection.length > 0
        ? vue.historique.filter((h) => selection.includes(h.id))
        : vue.historique;
    const lignes = [
      "Nom;Logement;Arrivée;Départ;Référence;Montant;Commission OTA;Canal;Statut",
      ...source.map(
        (h) =>
          `${h.nom};${h.logement};${dateCourte(h.arrivee)};${dateCourte(h.depart)};${h.reference};${(h.montant / 100).toFixed(2)};${(h.commission / 100).toFixed(2)};${h.canal};${h.statutPaiement}`,
      ),
    ];
    telechargerDemo("fiche-paiement-hublify.csv", lignes.join("\n"));
  };
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg text-ink">Historique des paiements</h2>
        <p className="text-sm text-ink-body">
          Historique complet des transactions · logements et gestionnaires
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi
          titre="Revenu total"
          valeur={euro(k.loyerAttendu)}
          detail="Propriétaires et gestionnaires"
        />
        <Kpi
          titre="Revenus validés"
          valeur={euro(k.revenusValides)}
          detail="Montant net des séjours soldés"
          extra={k.net ? formatTaux(k.revenusValides / Math.max(k.net, 1)) : undefined}
        />
        <Kpi
          titre="Commissions totales"
          valeur={euro(k.commissionsOta)}
          detail="Frais et commissions OTA"
          extra={k.loyerAttendu ? formatTaux(k.commissionsOta / k.loyerAttendu) : undefined}
        />
      </div>
      <TableauHistorique
        titre="Historique des paiements"
        sousTitre={`Solde par propriétaire : ${vue.historique.length} transactions · ${selection.length} sélectionnées`}
        lignes={vue.historique}
        variante="paiements"
        selection={selection}
        onToggle={toggle}
        onVoir={onVoir}
        action={
          <button
            type="button"
            onClick={exporterFiche}
            className="inline-flex min-h-11 items-center gap-1 rounded-card bg-ink px-3 text-xs font-medium text-white"
          >
            Créer une fiche de paiement
          </button>
        }
      />
    </div>
  );
}

function TableauHistorique({
  titre,
  sousTitre,
  lignes,
  variante,
  selection,
  onToggle,
  onVoir,
  action,
}: {
  titre: string;
  sousTitre: string;
  lignes: LigneHistorique[];
  variante: "reservations" | "paiements";
  selection?: string[];
  onToggle?: (id: string) => void;
  onVoir: (id: string) => void;
  action?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-card border border-line bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-soft px-4 py-3">
        <div>
          <h2 className="text-sm font-medium text-ink">{titre}</h2>
          <p className="text-xs text-ink-muted">{sousTitre}</p>
        </div>
        {action}
      </header>
      {lignes.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-ink-muted">
          Aucune réservation sur cette période.
        </p>
      ) : (
        <>
          <ul className="divide-y divide-surface-soft lg:hidden">
            {lignes.map((h) => (
              <li key={h.id} className="space-y-1 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-ink">{h.nom}</p>
                  <Pastille ton={tonStatut(h.statutPaiement)}>{h.statutPaiement}</Pastille>
                </div>
                <p className="text-xs text-ink-muted">
                  {h.logement} · {h.localisation} · {h.canal}
                </p>
                <p className="text-xs text-ink-body">
                  {dateCourte(h.arrivee)} → {dateCourte(h.depart)} · {h.nuits} nuits
                </p>
                <p className="text-sm text-ink">
                  {euro(h.montant)}
                  {variante === "paiements" && (
                    <span className="text-danger-loyer"> −{euro(h.commission)}</span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => onVoir(h.id)}
                  className="inline-flex min-h-11 items-center text-xs font-medium text-accent-teal"
                >
                  Voir
                </button>
              </li>
            ))}
          </ul>
          <ScrollHint className="hidden lg:block">
            <table className="w-full min-w-[920px] text-left text-xs">
              <caption className="sr-only">{titre}</caption>
              <thead className="border-b border-surface-soft text-ink-subtle">
                <tr>
                  {variante === "paiements" && <th className="w-10 px-3 py-2" />}
                  {(variante === "paiements"
                    ? [
                        "Nom",
                        "Logement",
                        "Arrivée",
                        "Départ",
                        "Référence",
                        "Montant",
                        "Commission",
                        "Canal",
                        "Statut",
                        "",
                      ]
                    : [
                        "Logement",
                        "Localisation",
                        "Référence",
                        "Arrivée",
                        "Départ",
                        "Nuits",
                        "Canal",
                        "Montant",
                        "Statut",
                        "",
                      ]
                  ).map((h) => (
                    <th key={h || "actions"} scope="col" className="px-2 py-2 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lignes.map((h) => (
                  <tr key={h.id} className="border-b border-surface-soft last:border-0">
                    {variante === "paiements" && (
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selection?.includes(h.id) ?? false}
                          onChange={() => onToggle?.(h.id)}
                          aria-label={`Sélectionner ${h.nom}`}
                        />
                      </td>
                    )}
                    {variante === "paiements" ? (
                      <td className="px-2 py-2">
                        <span className="inline-flex items-center gap-2 text-ink">
                          <span className="flex size-6 items-center justify-center rounded-full bg-surface-soft text-[10px]">
                            {h.initiales}
                          </span>
                          {h.nom}
                        </span>
                      </td>
                    ) : (
                      <td className="px-2 py-2 text-ink">{h.logement}</td>
                    )}
                    <td className="px-2 py-2">
                      {variante === "paiements" ? h.logement : h.localisation}
                    </td>
                    {variante === "reservations" && <td className="px-2 py-2">{h.reference}</td>}
                    <td className="px-2 py-2">{dateCourte(h.arrivee)}</td>
                    <td className="px-2 py-2">{dateCourte(h.depart)}</td>
                    {variante === "paiements" ? (
                      <td className="px-2 py-2">{h.reference}</td>
                    ) : (
                      <td className="px-2 py-2">{h.nuits}</td>
                    )}
                    {variante === "reservations" && <td className="px-2 py-2">{h.canal}</td>}
                    <td className="px-2 py-2">{euro(h.montant)}</td>
                    {variante === "paiements" && (
                      <td className={cn("px-2 py-2", h.commission > 0 && "text-danger-loyer")}>
                        −{euro(h.commission)}
                      </td>
                    )}
                    {variante === "paiements" && <td className="px-2 py-2">{h.canal}</td>}
                    <td className="px-2 py-2">
                      <Pastille
                        ton={tonStatut(
                          variante === "reservations" ? h.statutSejour : h.statutPaiement,
                        )}
                      >
                        {variante === "reservations" ? h.statutSejour : h.statutPaiement}
                      </Pastille>
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => onVoir(h.id)}
                        className="font-medium text-accent-teal"
                      >
                        Voir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollHint>
        </>
      )}
    </section>
  );
}
