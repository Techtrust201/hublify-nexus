import { useState, type ReactNode } from "react";
import { Bell, CreditCard, PenLine } from "lucide-react";
import type { ParametrageSession } from "@/data/parametrage-mo1";
import {
  OFFRES,
  planPrestationsAuto,
  type OffreAbonnement,
  type ReglagesEtendus,
} from "@/data/reglages-etendus";
import { confirmer, toastOk } from "@/lib/feedback";
import { cn } from "@/lib/utils";

export function PanneauNotifications({
  brouillon,
  reglages,
  sale,
  onPatch,
  onReglages,
  onAnnuler,
  onEnregistrer,
}: {
  brouillon: ParametrageSession;
  reglages: ReglagesEtendus;
  sale: boolean;
  onPatch: (p: Partial<ParametrageSession>) => void;
  onReglages: (p: Partial<ReglagesEtendus>) => void;
  onAnnuler: () => void;
  onEnregistrer: () => void;
}) {
  const [offreOuverte, setOffreOuverte] = useState(false);
  const exemple = planPrestationsAuto(reglages, {
    debut: "1er juin",
    fin: "8 juin",
    bail: true,
  });

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="space-y-5 rounded-card border border-line bg-white p-5">
        <div>
          <h2 className="text-sm font-medium text-ink">Préférences de notifications</h2>
          <p className="text-xs text-ink-muted">Choisissez comment vous souhaitez être informé</p>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-medium text-ink">Notifications</p>
          <Ligne
            label="Nouvelles notifications et alertes"
            detail="Arrivées, réservations, événements à venir et plus encore"
            actif={brouillon.notifAlertes}
            onChange={(v) => onPatch({ notifAlertes: v })}
          />
          <Ligne
            label="Nouveaux paiements reçus"
            detail="Loyers, cautions, arrhes et paiements reçus"
            actif={brouillon.notifLoyer}
            onChange={(v) => onPatch({ notifLoyer: v })}
          />
          <Ligne
            label="Aide et suivi"
            detail="Infobulles"
            actif={brouillon.notifAide}
            onChange={(v) => onPatch({ notifAide: v })}
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-ink">Canaux de communication</p>
          <Ligne
            label="E-mail"
            detail="Recevoir les notifications par mail"
            actif={brouillon.notifsEmail}
            onChange={(v) => onPatch({ notifsEmail: v })}
          />
          <Ligne
            label="Push navigateur"
            detail="Notifications en temps réel sur votre navigateur"
            actif={brouillon.notifsPush}
            onChange={(v) => onPatch({ notifsPush: v })}
          />
          <Ligne
            label="SMS"
            detail="Alertes urgentes (loyers, missions du jour)"
            actif={brouillon.notifsSms}
            onChange={(v) => onPatch({ notifsSms: v })}
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-ink">Rappels et relances</p>
          <Ligne
            label={`Rappel de paiement ${brouillon.rappelPaiementHeures || "24"} h avant le début de la réservation`}
            detail="Recevoir les notifications par mail, message, notification des réservations non payées avant l'arrivée."
            actif={brouillon.rappelPaiement}
            onChange={(v) => onPatch({ rappelPaiement: v })}
          >
            <label className="mt-2 block text-xs text-ink-muted">
              Heures avant la réservation
              <input
                value={brouillon.rappelPaiementHeures}
                onChange={(e) => onPatch({ rappelPaiementHeures: e.target.value })}
                className="mt-1 h-9 w-24 rounded-card border border-line px-3 text-sm text-ink outline-none"
              />
            </label>
          </Ligne>
          <Relance
            label="Relance automatique d'appel de loyer"
            detail="Envoi par mail. Une relance d'appel de loyer part après l'échéance, puis tous les quelques jours."
            actif={reglages.relanceLoyer}
            message={reglages.messageRelanceLoyer}
            onActif={(relanceLoyer) => onReglages({ relanceLoyer })}
            onMessage={(messageRelanceLoyer) => onReglages({ messageRelanceLoyer })}
          />
          <Relance
            label="Relance automatique de facture"
            detail="Envoi par mail. Concerne les factures prestataires, voyageurs et occupants."
            actif={reglages.relanceFacture}
            message={reglages.messageRelanceFacture}
            onActif={(relanceFacture) => onReglages({ relanceFacture })}
            onMessage={(messageRelanceFacture) => onReglages({ messageRelanceFacture })}
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-ink">Paramétrage prestation automatique</p>
          <Ligne
            label="Création automatique d'une prestation de ménage à la date de fin d'une réservation"
            detail="Lors de la création d'une réservation, une prestation de ménage sera automatiquement créée le jour de la date de fin."
            actif={reglages.autoMenage}
            onChange={(autoMenage) => onReglages({ autoMenage })}
          />
          <Ligne
            label="Création automatique d'un état des lieux à la date de début et à la date de fin d'un bail"
            detail="Lors de la création d'un bail, une prestation d'état des lieux sera automatiquement créée le jour de la date d'entrée et de sortie."
            actif={reglages.autoEdlBail}
            onChange={(autoEdlBail) => onReglages({ autoEdlBail })}
          />
          {exemple.length > 0 && (
            <p className="text-xs text-ink-muted">
              Exemple, bail du 1er au 8 juin : {exemple.join(" ")}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-ink">Portail voyageur</p>
          <Ligne
            label="Activer le portail voyageur"
            detail="Un portail spécifique est créé automatiquement lors de la création d'une réservation. Il permet au voyageur d'accéder à son espace sur l'appli mobile."
            actif={brouillon.portailVoyageurs}
            onChange={(v) => onPatch({ portailVoyageurs: v })}
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-ink">Paramétrage message automatique</p>
          <Ligne
            label="Activer les messages automatiques"
            detail="Relances, pré-check-in et rappel de départ. Le texte de chaque message se règle ici et dans l'onglet Formulaires."
            actif={reglages.messagesAuto}
            onChange={(messagesAuto) => onReglages({ messagesAuto })}
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-ink">Abonnement</p>
          <div className="rounded-card border border-line px-4 py-3">
            <p className="text-sm text-ink">Votre abonnement actuel</p>
            <p className="text-xs text-ink-muted">
              {reglages.abonnementActif ? reglages.abonnementRef : "Résilié"} ·{" "}
              {OFFRES.find((o) => o.id === reglages.offre)?.label}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="h-11 rounded-card border border-line px-3 text-xs text-ink md:h-9"
                onClick={() => setOffreOuverte((v) => !v)}
              >
                Modifier mon abonnement
              </button>
              <button
                type="button"
                className="h-11 rounded-card border border-line px-3 text-xs text-ink md:h-9"
                onClick={() => {
                  void confirmer({
                    titre: "Supprimer les données locales de réglage ?",
                    description:
                      "Les notifications déjà enregistrées sur le compte restent. Seuls les textes de relance et le choix d'offre, stockés sur cet appareil, sont effacés.",
                    libelleConfirmer: "Supprimer",
                    danger: true,
                  }).then((ok) => {
                    if (!ok) return;
                    onReglages({
                      messageRelanceLoyer: "",
                      messageRelanceFacture: "",
                      offre: "essentiel",
                    });
                    toastOk("Réglages locaux effacés. Le compte n'a pas été supprimé.");
                  });
                }}
              >
                Supprimer mes données
              </button>
              <button
                type="button"
                className="h-11 rounded-card border border-line px-3 text-xs text-ink-body md:h-9"
                onClick={() => {
                  void confirmer({
                    titre: reglages.abonnementActif
                      ? "Me désabonner ?"
                      : "Réactiver l'abonnement ?",
                    description: reglages.abonnementActif
                      ? "La demande est notée sur cet appareil. Aucun prélèvement n'est relié : Stripe n'est pas connecté en V1."
                      : "L'offre redevient active sur cet appareil.",
                    libelleConfirmer: reglages.abonnementActif ? "Me désabonner" : "Réactiver",
                    danger: reglages.abonnementActif,
                  }).then((ok) => {
                    if (!ok) return;
                    onReglages({ abonnementActif: !reglages.abonnementActif });
                  });
                }}
              >
                {reglages.abonnementActif ? "Me désabonner" : "Réactiver"}
              </button>
            </div>
            {offreOuverte && (
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {OFFRES.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() =>
                      onReglages({ offre: o.id as OffreAbonnement, abonnementActif: true })
                    }
                    className={cn(
                      "rounded-card border px-3 py-2 text-left",
                      reglages.offre === o.id ? "border-ink bg-surface" : "border-line",
                    )}
                  >
                    <span className="block text-sm text-ink">{o.label}</span>
                    <span className="block text-xs text-ink-muted">{o.detail}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="text-xs text-ink-muted">
            {sale ? "Modifications non sauvegardées" : "Réglages à jour"}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onAnnuler}
              className="h-11 rounded-card border border-line px-4 text-sm text-ink-body md:h-9"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={onEnregistrer}
              className="h-11 rounded-card bg-ink px-4 text-sm font-medium text-white md:h-9"
            >
              Enregistrer les modifications
            </button>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <section className="space-y-3 rounded-card border border-line bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-medium text-ink">
            <PenLine className="size-4" /> Signature
          </h2>
          <Ligne
            label="Signature du voyageur"
            detail="L'invité principal doit fournir sa signature numérique."
            actif={brouillon.signatureVoyageur}
            onChange={(v) => onPatch({ signatureVoyageur: v })}
          />
        </section>
        <section className="space-y-3 rounded-card border border-line bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-medium text-ink">
            <CreditCard className="size-4" /> Paiements
          </h2>
          <Ligne
            label="Activer la passerelle de paiement"
            detail="Les invités peuvent régler le dépôt de garantie via le portail Hublify."
            actif={brouillon.passerellePaiement}
            onChange={(v) => onPatch({ passerellePaiement: v })}
          />
          <p className="text-xs text-ink-muted">
            Stripe : non connecté. La passerelle Hublify reste le canal de paiement de la V1.
          </p>
        </section>
        {brouillon.notifAlertes && (
          <article className="rounded-card border border-line bg-white p-4 shadow-sm">
            <p className="flex items-center gap-2 text-xs font-medium text-ink">
              <Bell className="size-3.5" /> Exemple de notification
            </p>
            <p className="mt-2 text-sm text-ink">
              OBLIG : la location de votre logement du 12 au 15 janvier est validée
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Aperçu du libellé vu par le gestionnaire. Ce n'est pas une alerte en cours.
            </p>
          </article>
        )}
      </aside>
    </div>
  );
}

function Ligne({
  label,
  detail,
  actif,
  onChange,
  children,
}: {
  label: string;
  detail?: string;
  actif: boolean;
  onChange: (v: boolean) => void;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-card border border-line px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-ink">{label}</p>
          {detail && <p className="text-xs text-ink-muted">{detail}</p>}
        </div>
        <Interrupteur label={label} actif={actif} onChange={onChange} />
      </div>
      {actif && children}
    </div>
  );
}

function Relance({
  label,
  detail,
  actif,
  message,
  onActif,
  onMessage,
}: {
  label: string;
  detail: string;
  actif: boolean;
  message: string;
  onActif: (v: boolean) => void;
  onMessage: (v: string) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <Ligne label={label} detail={detail} actif={actif} onChange={onActif}>
      <button
        type="button"
        className="mt-2 text-xs font-medium text-ink underline decoration-line underline-offset-2"
        onClick={() => setOuvert((v) => !v)}
      >
        Message de la relance
      </button>
      {ouvert && (
        <textarea
          value={message}
          onChange={(e) => onMessage(e.target.value)}
          aria-label={label}
          className="mt-2 h-20 w-full rounded-card border border-line px-3 py-2 text-sm text-ink outline-none"
        />
      )}
    </Ligne>
  );
}

function Interrupteur({
  label,
  actif,
  onChange,
}: {
  label: string;
  actif: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      aria-label={label}
      onClick={() => onChange(!actif)}
      className="flex size-11 shrink-0 items-center justify-center"
    >
      <span className={cn("relative h-6 w-10 rounded-full", actif ? "bg-ink" : "bg-line")}>
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white transition",
            actif ? "left-4" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}
