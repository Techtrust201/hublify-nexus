// SOURCE: Hublify V1.0 — Pré chekin
// La première carte Figma est vide : on y place le message et le délai d'envoi.
// Les upsells y sont intégrés (annotation « intégrer les upsells dans le pré-checkin »).
// La caution utilise le même mécanisme pour les baux et les voyageurs.

import { useEffect, useState } from "react";
import { useDroit } from "@/auth/auth-context";
import { poserParametrage, useSession } from "@/data/session";
import type { ParametrageSession } from "@/data/parametrage-mo1";
import { toastOk } from "@/lib/feedback";
import {
  cautionDemandee,
  ecrireExtraPrecheckin,
  lireExtraPrecheckin,
  type ExtraPrecheckin,
} from "@/lib/gestionnaire-planning";
import { cn } from "@/lib/utils";

export function PrecheckinGestionnaire() {
  const session = useSession();
  const peutReserver = useDroit("mod-reservations");
  const peutBiens = useDroit("mod-biens");
  const peutMod = peutReserver || peutBiens;
  const [base, setBase] = useState<ParametrageSession>(session.parametrage);
  const [extra, setExtra] = useState<ExtraPrecheckin>(() => lireExtraPrecheckin());

  useEffect(() => {
    setExtra(lireExtraPrecheckin());
  }, []);

  const patch = (p: Partial<ParametrageSession>) => setBase((b) => ({ ...b, ...p }));
  const patchExtra = (p: Partial<ExtraPrecheckin>) => setExtra((e) => ({ ...e, ...p }));

  const enregistrer = () => {
    poserParametrage(base);
    ecrireExtraPrecheckin(extra);
    toastOk("Pré-checkin enregistré.");
  };

  const cautionBail = cautionDemandee(extra, "bail");
  const cautionVoyageur = cautionDemandee(extra, "voyageur");

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className="rounded-card border border-line bg-white p-5">
        <h2 className="text-sm font-medium text-ink">Configuration Pré-checkin</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Message envoyé au voyageur, et déclenchement à la création manuelle ou importée d'une
          réservation.
        </p>
        <Interrupteur
          label="Envoyer le pré-checkin par e-mail"
          detail="Le parcours peut être désactivé ou modifié à la création d'une réservation manuelle."
          actif={base.emailPreCheckin}
          onChange={(v) => patch({ emailPreCheckin: v })}
        />
        <label className="mt-4 block text-xs text-ink-muted">
          Message
          <textarea
            value={base.messagePreCheckin}
            onChange={(e) => patch({ messagePreCheckin: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-card border border-line px-3 py-2 text-sm text-ink outline-none"
          />
        </label>
        <label className="mt-3 block text-xs text-ink-muted">
          Délai d'envoi (jours avant l'arrivée)
          <input
            value={base.delaiEnvoiJours}
            onChange={(e) => patch({ delaiEnvoiJours: e.target.value })}
            className="mt-1 h-11 w-28 rounded-card border border-line px-3 text-sm text-ink outline-none md:h-9"
          />
        </label>
      </section>

      <section className="rounded-card border border-line bg-white p-5">
        <h2 className="text-sm font-medium text-ink">Documents à fournir obligatoires</h2>
        <Interrupteur
          label="Exiger le téléchargement du justificatif d'identité"
          detail="Photo, fichier classique, ou recherche sur le téléphone. Recto et verso."
          actif={base.exigerIdentifiant}
          onChange={(v) => patch({ exigerIdentifiant: v })}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Puce actif={extra.photo} onClick={() => patchExtra({ photo: !extra.photo })}>
            Photo
          </Puce>
          <Puce actif={extra.fichier} onClick={() => patchExtra({ fichier: !extra.fichier })}>
            Fichier
          </Puce>
          <Puce actif={extra.telephone} onClick={() => patchExtra({ telephone: !extra.telephone })}>
            Recherche téléphone
          </Puce>
          <Puce
            actif={extra.rectoVerso}
            onClick={() => patchExtra({ rectoVerso: !extra.rectoVerso })}
          >
            Recto et verso
          </Puce>
        </div>
        <Interrupteur
          label="Exiger l'identifiant légal pour tous les voyageurs"
          detail="Sinon, seul le voyageur principal dépose une pièce."
          actif={base.identifiantTousVoyageurs}
          onChange={(v) => patch({ identifiantTousVoyageurs: v })}
        />
        <Interrupteur
          label="Accepter n'importe quel pièce d'identité"
          detail="Carte nationale, passeport ou titre de séjour."
          actif={base.accepterToutePiece}
          onChange={(v) => patch({ accepterToutePiece: v })}
        />
      </section>

      <section className="rounded-card border border-line bg-white p-5">
        <h2 className="text-sm font-medium text-ink">Caution</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Même mécanisme pour les baux et les voyageurs.
        </p>
        <Interrupteur
          label="Demander une caution"
          detail={`Bail : ${cautionBail.demandee ? `${cautionBail.montant} €` : "non demandée"} · Voyageur : ${cautionVoyageur.demandee ? `${cautionVoyageur.montant} €` : "non demandée"}`}
          actif={extra.cautionActive}
          onChange={(v) => patchExtra({ cautionActive: v })}
        />
        <label className="mt-3 block text-xs text-ink-muted">
          Montant (€)
          <input
            inputMode="decimal"
            value={String(extra.cautionMontant)}
            onChange={(e) =>
              patchExtra({
                cautionMontant: Math.max(0, Number(e.target.value.replace(",", ".")) || 0),
              })
            }
            className="mt-1 h-11 w-32 rounded-card border border-line px-3 text-sm text-ink outline-none md:h-9"
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <Puce
            actif={extra.cautionBaux}
            onClick={() => patchExtra({ cautionBaux: !extra.cautionBaux })}
          >
            Baux
          </Puce>
          <Puce
            actif={extra.cautionVoyageurs}
            onClick={() => patchExtra({ cautionVoyageurs: !extra.cautionVoyageurs })}
          >
            Voyageurs
          </Puce>
        </div>
      </section>

      <section className="rounded-card border border-line bg-white p-5">
        <h2 className="text-sm font-medium text-ink">Check-in</h2>
        <Interrupteur
          label="Montrer le code de la porte seulement quand la réservation a été payée"
          actif={base.codePorteSiPaye}
          onChange={(v) => patch({ codePorteSiPaye: v })}
        />
        <Interrupteur
          label="Le code de la porte sera affiché le jour de l'enregistrement"
          detail="Le code n'apparaît pas avant le jour d'arrivée."
          actif={extra.codePorteJourArrivee}
          onChange={(v) => patchExtra({ codePorteJourArrivee: v })}
        />
      </section>

      <section className="rounded-card border border-line bg-white p-5">
        <h2 className="text-sm font-medium text-ink">Inventaire</h2>
        <Interrupteur
          label="Afficher l'inventaire"
          detail="Draps et consommables de la conciergerie, pas l'inventaire mobilier."
          actif={base.afficherFichesAcces}
          onChange={(v) => patch({ afficherFichesAcces: v })}
        />
        <Interrupteur
          label="Afficher la fiche logement"
          actif={base.portailVoyageurs}
          onChange={(v) => patch({ portailVoyageurs: v })}
        />
        <Interrupteur
          label="Afficher l'état des lieux"
          actif={base.afficherEdl}
          onChange={(v) => patch({ afficherEdl: v })}
        />
      </section>

      <section className="rounded-card border border-line bg-white p-5">
        <h2 className="text-sm font-medium text-ink">Upsells proposés au pré-checkin</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Le voyageur peut les ajouter avant l'arrivée. Le catalogue se gère aussi dans le
          paramétrage.
        </p>
        <ul className="mt-3 divide-y divide-surface-soft">
          {base.upsells.map((u) => {
            const propose = extra.upsellsProposes.includes(u.id);
            return (
              <li key={u.id} className="flex items-center justify-between gap-3 py-3">
                <span>
                  <span className="block text-sm text-ink">{u.nom}</span>
                  <span className="text-xs text-ink-muted">
                    {u.prix.toLocaleString("fr-FR")} € · {u.actif ? "actif" : "inactif"}
                  </span>
                </span>
                <button
                  type="button"
                  aria-pressed={propose}
                  disabled={!u.actif}
                  onClick={() =>
                    patchExtra({
                      upsellsProposes: propose
                        ? extra.upsellsProposes.filter((id) => id !== u.id)
                        : [...extra.upsellsProposes, u.id],
                    })
                  }
                  className={cn(
                    "h-8 rounded-full px-3 text-xs font-medium disabled:opacity-40",
                    propose ? "bg-ink text-white" : "border border-line text-ink-body",
                  )}
                >
                  {propose ? "Proposé" : "Proposer"}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!peutMod}
          onClick={enregistrer}
          className="h-11 rounded-card bg-ink px-4 text-sm font-medium text-white disabled:opacity-40"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}

function Interrupteur({
  label,
  detail,
  actif,
  onChange,
}: {
  label: string;
  detail?: string;
  actif: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="mt-4 flex items-start justify-between gap-4 border-t border-surface-soft pt-4 first:mt-3 first:border-t-0 first:pt-0">
      <div>
        <p className="text-sm text-ink">{label}</p>
        {detail && <p className="mt-1 text-xs text-ink-muted">{detail}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={actif}
        onClick={() => onChange(!actif)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          actif ? "bg-ink" : "bg-line",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white transition-transform",
            actif ? "left-5" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}

function Puce({
  actif,
  onClick,
  children,
}: {
  actif: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={actif}
      onClick={onClick}
      className={cn(
        "h-8 rounded-full px-3 text-xs font-medium",
        actif ? "bg-ink text-white" : "border border-line text-ink-body",
      )}
    >
      {children}
    </button>
  );
}
