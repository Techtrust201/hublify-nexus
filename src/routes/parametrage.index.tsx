import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { modifierSession, useSession } from "@/data/session";
import {
  fusionnerParametrage,
  type ParametrageSession,
  type UpsellParam,
} from "@/data/parametrage-mo1";
import { confirmer, toastOk } from "@/lib/feedback";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/parametrage/")({
  head: () => ({
    meta: [{ title: "Paramétrage — Hublify" }],
  }),
  component: PageParametrage,
});

type Onglet = "notif" | "formulaires" | "upsells";

function PageParametrage() {
  const { parametrage: sauve } = useSession();
  const [onglet, setOnglet] = useState<Onglet>("notif");
  const [brouillon, setBrouillon] = useState<ParametrageSession>(() => fusionnerParametrage(sauve));
  const [touche, setTouche] = useState(false);
  const [creer, setCreer] = useState(false);
  const [nomUpsell, setNomUpsell] = useState("");
  const [prixUpsell, setPrixUpsell] = useState("15");

  useEffect(() => {
    if (!touche) setBrouillon(fusionnerParametrage(sauve));
  }, [sauve, touche]);

  const sale = useMemo(
    () => JSON.stringify(brouillon) !== JSON.stringify(fusionnerParametrage(sauve)),
    [brouillon, sauve],
  );

  const patch = (p: Partial<ParametrageSession>) => {
    setTouche(true);
    setBrouillon((b) => ({ ...b, ...p }));
  };

  const enregistrer = () => {
    modifierSession((e) => ({ ...e, parametrage: brouillon }));
    setTouche(false);
    toastOk("Modifications enregistrées.");
  };

  const annuler = () => {
    setBrouillon(fusionnerParametrage(sauve));
    setTouche(false);
  };

  return (
    <AppShell
      attendDonnees
      titre="Paramètres du compte"
      sousTitre="Configurez vos notifications, formulaires et services additionnels"
    >
      {sale && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-white px-4 py-3">
          <p className="text-sm text-ink">Modifications non sauvegardées</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={annuler}
              className="inline-flex h-11 items-center rounded-card border border-line px-4 text-sm text-ink-body md:h-9"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={enregistrer}
              className="h-11 rounded-card bg-accent-teal px-4 text-sm font-medium text-white md:h-9"
            >
              Enregistrer les modifications
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-line">
        {(
          [
            ["notif", "Notifications"],
            ["formulaires", "Formulaires"],
            ["upsells", "Upsells"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setOnglet(id)}
            className={cn(
              "h-11 shrink-0 border-b-2 px-4 text-sm font-medium md:h-[46px]",
              onglet === id
                ? "border-ink bg-tab-active text-ink-deep"
                : "border-transparent text-ink-subtle",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {onglet === "notif" && (
        <section className="space-y-5 rounded-card border border-line bg-white p-5">
          <div>
            <h2 className="text-sm font-medium text-ink">Préférences de notifications</h2>
            <p className="text-xs text-ink-muted">Choisissez comment vous souhaitez être informé</p>
          </div>
          <Toggle
            label="Nouvelles notifications et alertes"
            detail="Arrivées, réservations, événements à venir et plus encore"
            actif={brouillon.notifAlertes}
            onChange={(v) => patch({ notifAlertes: v })}
          />
          <Toggle
            label="Aide et suivi"
            detail="infos bulles"
            actif={brouillon.notifAide}
            onChange={(v) => patch({ notifAide: v })}
          />
          <Toggle
            label="Mise à jour automatique"
            detail="recherche de Maj"
            actif={brouillon.notifMaj}
            onChange={(v) => patch({ notifMaj: v })}
          />

          <h2 className="pt-2 text-sm font-medium text-ink">Canaux de communication</h2>
          <Toggle
            label="Email"
            detail="Recevoir les notifications par mail"
            actif={brouillon.notifsEmail}
            onChange={(v) => patch({ notifsEmail: v })}
          />
          <Toggle
            label="Push navigateur"
            detail="Notifications en temps réel sur votre navigateur"
            actif={brouillon.notifsPush}
            onChange={(v) => patch({ notifsPush: v })}
          />
          <Toggle
            label="SMS"
            detail="Alertes urgentes (loyers, missions du jour)"
            actif={brouillon.notifsSms}
            onChange={(v) => patch({ notifsSms: v })}
          />
          <Toggle
            label="Rappels et notifications de paiement"
            detail={`rappel de paiement ${brouillon.rappelPaiementHeures}h avant le début de la réservation, mail sms`}
            actif={brouillon.rappelPaiement}
            onChange={(v) => patch({ rappelPaiement: v })}
          />
          {brouillon.rappelPaiement && (
            <label className="block text-xs text-ink-muted">
              Heures avant la réservation
              <input
                value={brouillon.rappelPaiementHeures}
                onChange={(e) => patch({ rappelPaiementHeures: e.target.value })}
                className="mt-1 h-9 w-24 rounded-card border border-line px-3 text-sm text-ink outline-none"
              />
            </label>
          )}
        </section>
      )}

      {onglet === "formulaires" && (
        <div className="space-y-4">
          <section className="rounded-card border border-line bg-white p-5">
            <h2 className="text-sm font-medium text-ink">Informations sur le Portail Voyageurs</h2>
            <p className="mt-2 text-sm text-ink-body">
              Le Portail voyageurs Hublify vous permet d'afficher les informations de Wi-Fi et de
              contact à vos invités, avec un accès accordé une fois leur réservation confirmée et
              leur arrivée proche. Si vous souhaitez que vos invités paient avant d'accéder à leurs
              identifiants, suivez les instructions ci-dessous. Ces paramètres s'appliquent à toutes
              les annonces du compte.
            </p>
          </section>

          <Bloc titre="Configuration">
            <Toggle
              label="Activer l'e-mail de Pré-check-in"
              detail="Envoi automatique du formulaire de pré-check-in : coordonnées, arrivée, nombre de voyageurs."
              actif={brouillon.emailPreCheckin}
              onChange={(v) => patch({ emailPreCheckin: v })}
            />
            <label className="block text-xs text-ink-muted">
              Ajouter un message à l'e-mail de Pré check-in
              <textarea
                value={brouillon.messagePreCheckin}
                onChange={(e) => patch({ messagePreCheckin: e.target.value })}
                className="mt-1 h-24 w-full rounded-card border border-line px-3 py-2 text-sm text-ink outline-none"
              />
            </label>
            <Toggle
              label={"Envoyer dans l'e-mail un lien pour installer l'application \"Voyageur\""}
              detail="Informations de séjour, avis et accueil avant l'arrivée."
              actif={brouillon.lienAppVoyageur}
              onChange={(v) => patch({ lienAppVoyageur: v })}
            />
            <Toggle
              label="Activer le délai d'envoi x jours avant arrivée"
              detail="Lorsque cette option est activée, renseignez le délai dans le champ x."
              actif={brouillon.delaiEnvoiActif}
              onChange={(v) => patch({ delaiEnvoiActif: v })}
            />
            {brouillon.delaiEnvoiActif && (
              <label className="block text-xs text-ink-muted">
                Délai d'envoi (jours)
                <input
                  value={brouillon.delaiEnvoiJours}
                  onChange={(e) => patch({ delaiEnvoiJours: e.target.value })}
                  className="mt-1 h-9 w-24 rounded-card border border-line px-3 text-sm text-ink outline-none"
                />
              </label>
            )}
            <label className="block text-xs text-ink-muted">
              Ajouter un message personnalisé avec le lien
              <textarea
                value={brouillon.messageLienPerso}
                onChange={(e) => patch({ messageLienPerso: e.target.value })}
                className="mt-1 h-20 w-full rounded-card border border-line px-3 py-2 text-sm text-ink outline-none"
              />
            </label>
          </Bloc>

          <Bloc titre="Documents à fournir obligatoires">
            <Toggle
              label="Exiger le téléchargement de l'identifiant légal"
              detail="Photographie de la pièce d'identité en plus des données saisies."
              actif={brouillon.exigerIdentifiant}
              onChange={(v) => patch({ exigerIdentifiant: v })}
            />
            <Toggle
              label="Exiger l'identifiant légal pour tous les voyageurs"
              detail="Tous les voyageurs, pas seulement le voyageur principal."
              actif={brouillon.identifiantTousVoyageurs}
              onChange={(v) => patch({ identifiantTousVoyageurs: v })}
            />
            <Toggle
              label="Accepter n'importe quelle pièce d'identité"
              detail="Toute pièce d'identité officielle délivrée par un gouvernement."
              actif={brouillon.accepterToutePiece}
              onChange={(v) => patch({ accepterToutePiece: v })}
            />
          </Bloc>

          <Bloc titre="Détail de contact">
            <Toggle
              label="Demande d'informations supplémentaires pour les voyageurs"
              detail="Numéro de téléphone et adresse mail de tous les voyageurs."
              actif={brouillon.infosContactSupp}
              onChange={(v) => patch({ infosContactSupp: v })}
            />
          </Bloc>

          <Bloc titre="Signature">
            <Toggle
              label="Signature du voyageur"
              detail="L'invité principal doit fournir sa signature numérique."
              actif={brouillon.signatureVoyageur}
              onChange={(v) => patch({ signatureVoyageur: v })}
            />
          </Bloc>

          <Bloc titre="Paiements">
            <Toggle
              label="Activer la passerelle de paiement"
              detail="Les invités peuvent régler le dépôt de garantie via le Portail Hublify."
              actif={brouillon.passerellePaiement}
              onChange={(v) => patch({ passerellePaiement: v })}
            />
          </Bloc>

          <Bloc titre="Portail voyageurs">
            <Toggle
              label="Activer le portail voyageurs"
              detail="Afficher Wi-Fi et contact une fois la réservation confirmée et l'arrivée proche."
              actif={brouillon.portailVoyageurs}
              onChange={(v) => patch({ portailVoyageurs: v })}
            />
          </Bloc>

          <Bloc titre="Check-in">
            <Toggle
              label="Montrer le code de la porte seulement quand la réservation a été payée"
              detail="Le code est affiché le jour de l'enregistrement. Option actuelle : NUITS."
              actif={brouillon.codePorteSiPaye}
              onChange={(v) => patch({ codePorteSiPaye: v })}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <ChampHeure
                label="Heure de check-in"
                value={brouillon.heureCheckIn}
                onChange={(v) => patch({ heureCheckIn: v })}
              />
              <ChampHeure
                label="Heure de check-out"
                value={brouillon.heureCheckOut}
                onChange={(v) => patch({ heureCheckOut: v })}
              />
              <label className="block text-xs text-ink-muted">
                Délai ménage (min)
                <input
                  value={brouillon.delaiMenageMin}
                  onChange={(e) => patch({ delaiMenageMin: e.target.value })}
                  className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
                />
              </label>
            </div>
            <label className="block text-xs text-ink-muted">
              Consignes d'arrivée
              <textarea
                value={brouillon.consignesArrivee}
                onChange={(e) => patch({ consignesArrivee: e.target.value })}
                className="mt-1 h-24 w-full rounded-card border border-line px-3 py-2 text-sm text-ink outline-none"
              />
            </label>
          </Bloc>

          <Bloc titre="Check-out">
            <Toggle
              label="Activer le message de rappel des instructions de check-out, x jours avant le départ"
              detail="Applicable à tous les appartements ; modifiable par logement."
              actif={brouillon.rappelCheckout}
              onChange={(v) => patch({ rappelCheckout: v })}
            />
            {brouillon.rappelCheckout && (
              <label className="block text-xs text-ink-muted">
                Jours avant le départ
                <input
                  value={brouillon.rappelCheckoutJours}
                  onChange={(e) => patch({ rappelCheckoutJours: e.target.value })}
                  className="mt-1 h-9 w-24 rounded-card border border-line px-3 text-sm text-ink outline-none"
                />
              </label>
            )}
            <label className="block text-xs text-ink-muted">
              Consignes de départ
              <textarea
                value={brouillon.consignesDepart}
                onChange={(e) => patch({ consignesDepart: e.target.value })}
                className="mt-1 h-24 w-full rounded-card border border-line px-3 py-2 text-sm text-ink outline-none"
              />
            </label>
          </Bloc>

          <Bloc titre="Inventaire">
            <Toggle
              label="Afficher la/les fiche(s) accès"
              detail="Les voyageurs voient la fiche d'accès du logement réservé."
              actif={brouillon.afficherFichesAcces}
              onChange={(v) => patch({ afficherFichesAcces: v })}
            />
            <Toggle
              label="Afficher l'état des lieux"
              detail="Les voyageurs voient l'état des lieux du logement réservé."
              actif={brouillon.afficherEdl}
              onChange={(v) => patch({ afficherEdl: v })}
            />
          </Bloc>
        </div>
      )}

      {onglet === "upsells" && (
        <div className="space-y-4">
          <section className="rounded-card border border-line bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium text-ink">Services additionnels (Upsells)</h2>
                <p className="text-xs text-ink-muted">
                  Proposez des services premium à vos voyageurs
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreer(true)}
                className="inline-flex h-11 items-center gap-1 rounded-card bg-accent-teal px-4 text-sm font-medium text-white md:h-9"
              >
                <Plus className="size-3.5" /> Créer un Upsell
              </button>
            </div>
            <ul className="mt-4 divide-y divide-surface-soft">
              {brouillon.upsells.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center gap-3 py-3">
                  <p className="min-w-0 flex-1 text-sm text-ink">{u.nom}</p>
                  <p className="text-xs text-ink-muted">Prix : {u.prix}€</p>
                  <Toggle
                    label={u.actif ? "Actif" : "Inactif"}
                    actif={u.actif}
                    onChange={(v) =>
                      patch({
                        upsells: brouillon.upsells.map((x): UpsellParam =>
                          x.id === u.id ? { ...x, actif: v } : x,
                        ),
                      })
                    }
                  />
                  <button
                    type="button"
                    aria-label={`Retirer ${u.nom}`}
                    onClick={() => {
                      void (async () => {
                        const ok = await confirmer({
                          titre: `Retirer « ${u.nom} » du catalogue ?`,
                          description:
                            "Le service ne sera plus proposé sur les nouvelles réservations. Les réservations qui l'utilisent déjà le conservent.",
                          libelleConfirmer: "Retirer",
                          danger: true,
                        });
                        if (!ok) return;
                        patch({
                          upsells: brouillon.upsells.filter((x) => x.id !== u.id),
                        });
                        toastOk("Upsell retiré.");
                      })();
                    }}
                    className="flex size-11 items-center justify-center rounded-card text-ink-muted hover:bg-surface hover:text-ink md:size-8"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <aside className="rounded-card border border-line bg-white p-5">
            <h2 className="text-sm font-medium text-ink">Augmentez vos revenus avec les Upsells</h2>
            <p className="mt-2 text-sm text-ink-body">
              Les services additionnels permettent d'augmenter le panier moyen de vos réservations.
              Proposez des options pertinentes comme le petit-déjeuner, le parking, ou le late
              check-out.
            </p>
            <p className="mt-3 text-sm font-medium text-accent-teal">+30% de revenus en moyenne</p>
            <p className="text-xs text-ink-muted">Paiement en ligne sécurisé</p>
          </aside>
        </div>
      )}

      <Dialog open={creer} onOpenChange={(o) => !o && setCreer(false)}>
        <DialogContent>
          <DialogTitle>Créer un Upsell</DialogTitle>
          <DialogDescription>Service premium proposé aux voyageurs.</DialogDescription>
          <label className="mt-3 block text-xs text-ink-muted">
            Nom
            <input
              value={nomUpsell}
              onChange={(e) => setNomUpsell(e.target.value)}
              className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
            />
          </label>
          <label className="mt-3 block text-xs text-ink-muted">
            Prix (€)
            <input
              value={prixUpsell}
              onChange={(e) => setPrixUpsell(e.target.value)}
              className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
            />
          </label>
          <button
            type="button"
            className="mt-4 h-11 rounded-card bg-accent-teal px-4 text-sm font-medium text-white md:h-9"
            onClick={() => {
              const prix = Number(prixUpsell.replace(",", "."));
              if (!nomUpsell.trim() || Number.isNaN(prix)) return;
              const suivant = {
                ...brouillon,
                upsells: [
                  ...brouillon.upsells,
                  { id: `u-${Date.now().toString(36)}`, nom: nomUpsell.trim(), prix, actif: true },
                ],
              };
              setBrouillon(suivant);
              modifierSession((e) => ({ ...e, parametrage: suivant }));
              setTouche(false);
              setNomUpsell("");
              setPrixUpsell("15");
              setCreer(false);
              toastOk("Upsell ajouté.");
            }}
          >
            Ajouter
          </button>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Bloc({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-card border border-line bg-white p-5">
      <h2 className="text-sm font-medium text-ink">{titre}</h2>
      {children}
    </section>
  );
}

function Toggle({
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
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-ink">{label}</p>
        {detail && <p className="text-xs text-ink-muted">{detail}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={actif}
        aria-label={label}
        onClick={() => onChange(!actif)}
        className="flex size-11 shrink-0 items-center justify-center"
      >
        <span
          className={cn("relative h-6 w-10 rounded-full", actif ? "bg-accent-teal" : "bg-line")}
        >
          <span
            className={cn(
              "absolute top-0.5 size-5 rounded-full bg-white transition",
              actif ? "left-4" : "left-0.5",
            )}
          />
        </span>
      </button>
    </div>
  );
}

function ChampHeure({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-xs text-ink-muted">
      {label}
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
      />
    </label>
  );
}
