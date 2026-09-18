import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  ClipboardList,
  Eye,
  Home,
  LogIn,
  LogOut,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDroit } from "@/auth/auth-context";
import { CreatePrestationDialog } from "@/components/dashboard/CreatePrestationDialog";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { DialoguePrecheckin } from "@/components/reservations/DialoguePrecheckin";
import { ajouterDocument } from "@/data/documents-store";
import type { MissionMo1 } from "@/data/planning-mo1";
import {
  formatDateLongue,
  formatMontant,
  nuitsEntre,
  pourcentagePaiement,
} from "@/data/reservations-mo1";
import { detailMontantsReservation, paiementViaPlateforme } from "@/data/v1-metier";
import {
  annulerReservation,
  idNouveau,
  modifierReservation,
  modifierSession,
  retirerMission,
  useSession,
} from "@/data/session";
import { confirmer, toastErreur, toastOk } from "@/lib/feedback";
import { telechargerAvoir, telechargerFactureReservation } from "@/lib/exports-docs";
import { cn, useSessionBool } from "@/lib/utils";

export function PanneauEnDetails({
  reservationId,
  mission,
  onFermer,
}: {
  reservationId?: string | null;
  mission?: MissionMo1 | null;
  onFermer?: () => void;
}) {
  if (mission) return <PanneauMission mission={mission} onFermer={onFermer} />;
  return <PanneauReservation reservationId={reservationId} onFermer={onFermer} />;
}

function PanneauMission({
  mission,
  onFermer,
}: {
  mission: MissionMo1;
  onFermer?: (() => void) | undefined;
}) {
  const session = useSession();
  const [ouvert, setOuvert] = useSessionBool("hublify.accordeon.en-details", true);
  const [edition, setEdition] = useState(false);
  const live = session.missions.find((m) => m.id === mission.id);

  useEffect(() => {
    setOuvert(true);
  }, [mission.id, setOuvert]);

  if (!live) return null;
  const bienNom = session.biens.find((b) => b.id === live.bienId)?.nom ?? live.bienId;

  return (
    <section className="mt-4 overflow-hidden rounded-card border border-line bg-white">
      <button
        type="button"
        className="flex w-full items-center justify-between border-b border-surface-soft px-4 py-3"
        onClick={() => setOuvert((o) => !o)}
      >
        <span className="flex items-center gap-2 text-sm text-ink">
          <ClipboardList className="size-4 opacity-50" />
          En détails
        </span>
        {ouvert ? (
          <ChevronUp className="size-4 text-ink-muted" />
        ) : (
          <ChevronDown className="size-4 text-ink-muted" />
        )}
      </button>
      {ouvert && (
        <div className="p-4">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-surface-soft pb-3">
            <div>
              <p className="text-base text-ink">{live.titre}</p>
              <p className="mt-1 text-xs text-ink-subtle">
                {live.emoji} {live.type === "Menage" ? "Ménage" : live.type} · {bienNom}
              </p>
            </div>
            <span className="rounded border border-line-strong px-2 py-1 text-xs text-ink-body">
              {live.statut === "terminee"
                ? "Terminée"
                : live.statut === "en_cours"
                  ? "En cours"
                  : "À faire"}
            </span>
          </header>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <MiniCarte
              label="Date & heure"
              valeur={new Date(`${live.date}T12:00:00`).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              extra={live.heure}
            />
            <MiniCarte label="Assigné à" extra={live.assigne} />
          </div>
          <div className="mt-2 rounded-card border border-surface-soft bg-surface p-3">
            <p className="text-xs text-ink-muted">Description</p>
            <p className="mt-1 text-xs leading-5 text-ink-body">{live.description}</p>
          </div>
          <footer className="mt-3 flex flex-wrap justify-end gap-2 border-t border-surface-soft pt-3">
            <button
              type="button"
              onClick={() => setEdition(true)}
              className="inline-flex h-11 items-center gap-1 rounded-card border border-line px-3 text-xs font-medium text-ink-body md:h-[30px]"
            >
              <Pencil className="size-3" />
              Modifier
            </button>
            <button
              type="button"
              onClick={async () => {
                const ok = await confirmer({
                  titre: "Supprimer cette prestation ?",
                  description: `${live.titre} disparaît du calendrier.`,
                  libelleConfirmer: "Supprimer",
                  danger: true,
                });
                if (!ok) return;
                retirerMission(live.id);
                onFermer?.();
                toastOk("Prestation supprimée.");
              }}
              className="inline-flex h-11 items-center gap-1 rounded-card border border-line px-3 text-xs font-medium text-ink-body md:h-[30px]"
            >
              <Trash2 className="size-3" />
              Supprimer
            </button>
            {live.statut !== "terminee" && (
              <button
                type="button"
                onClick={() => {
                  const statut = live.statut === "a_faire" ? "en_cours" : "terminee";
                  modifierSession((e) => ({
                    ...e,
                    missions: e.missions.map((m) => (m.id === live.id ? { ...m, statut } : m)),
                  }));
                  toastOk(statut === "terminee" ? "Mission terminée." : "Mission démarrée.");
                }}
                className="inline-flex h-11 items-center rounded-card bg-ink px-3 text-xs font-medium text-white md:h-[30px]"
              >
                {live.statut === "a_faire" ? "Démarrer" : "Terminer"}
              </button>
            )}
          </footer>
        </div>
      )}
      <CreatePrestationDialog
        ouvert={edition}
        onFermer={() => setEdition(false)}
        bienId={live.bienId}
        date={live.date}
        mission={live}
      />
    </section>
  );
}

function PanneauReservation({
  reservationId,
  onFermer,
}: {
  reservationId?: string | null | undefined;
  onFermer?: (() => void) | undefined;
}) {
  const session = useSession();
  const peutMod = useDroit("mod-reservations");
  const [ouvert, setOuvert] = useSessionBool("hublify.accordeon.en-details", true);
  const [confirmer, setConfirmer] = useState(false);
  const [ajouterUpsell, setAjouterUpsell] = useState(false);
  const [saisiePaye, setSaisiePaye] = useState("");
  const [voirPrecheckin, setVoirPrecheckin] = useState(false);
  const [rembourse, setRembourse] = useState(false);
  const [rembMotif, setRembMotif] = useState("");
  const [rembMontant, setRembMontant] = useState("");
  const [rembNote, setRembNote] = useState("");
  const [voirDetail, setVoirDetail] = useState(false);
  const [avoir, setAvoir] = useState<{
    motif: string;
    montant: number;
    note: string;
    date: string;
    numero: string;
  } | null>(null);

  const actives = useMemo(
    () => session.reservationsDossier.filter((r) => r.statut !== "Annulé"),
    [session.reservationsDossier],
  );
  const reservation = reservationId
    ? actives.find((r) => r.id === reservationId)
    : undefined;

  const catalogue = session.parametrage.upsells.filter((u) => u.actif);
  const upsellsChoisis = reservation?.upsellIds ?? [];
  const upsells = catalogue.filter((u) => upsellsChoisis.includes(u.id));
  const upsellsMontant = upsells.reduce((s, u) => s + u.prix, 0);
  const enregistrerUpsells = (ids: string[]) => {
    if (!reservation) return;
    modifierReservation(reservation.id, { upsellIds: ids });
  };

  useEffect(() => {
    if (!reservation) return;
    setSaisiePaye(String(reservation.paye));
  }, [reservation?.id, reservation?.paye]);

  useEffect(() => {
    if (reservationId) setOuvert(true);
  }, [reservationId, setOuvert]);

  if (!reservation) return null;
  const bien = session.biens.find((b) => b.id === reservation.bienId);
  const pct = pourcentagePaiement(reservation);
  const nuits = nuitsEntre(reservation.arrivee, reservation.depart);
  const typeLibelle =
    reservation.type === "Location saisonnière" || !reservation.type
      ? "Saisonnière"
      : reservation.type;
  const note =
    reservation.services
      ?.filter((s) => !s.startsWith("Occupant 2 :") && !/ animaux?$/.test(s))
      .join(" · ") || session.parametrage.consignesArrivee;
  const precheckinFait = reservation.precheckinStatut === "fait";
  const viaPlateforme = paiementViaPlateforme(reservation.plateforme);
  const occupantLie = session.occupants.find(
    (o) =>
      o.nom.toLowerCase() === reservation.occupant.toLowerCase() ||
      o.email.toLowerCase() === reservation.email.toLowerCase(),
  );
  const detail = detailMontantsReservation({
    montant: reservation.montant,
    paye: reservation.paye,
    taxeSejour: reservation.taxeSejour,
    commissionMontant: reservation.commissionMontant,
    caution: reservation.caution,
    fraisMenage: reservation.fraisMenage,
    reductionPourcent: reservation.reductionPourcent,
    reductionMontant: reservation.reductionMontant,
    fraisPlateforme: reservation.fraisPlateforme,
    montantVoyageur: reservation.montantVoyageur,
    upsellsMontant,
  });

  return (
    <section className="mt-4 overflow-hidden rounded-card border border-line bg-white">
      <button
        type="button"
        className="flex w-full items-center justify-between border-b border-surface-soft px-4 py-3"
        onClick={() => setOuvert((o) => !o)}
      >
        <span className="flex items-center gap-2 text-sm text-ink">
          <Home className="size-4 opacity-50" />
          En détails
        </span>
        {ouvert ? (
          <ChevronUp className="size-4 text-ink-muted" />
        ) : (
          <ChevronDown className="size-4 text-ink-muted" />
        )}
      </button>
      {ouvert && (
        <div className="p-4">
          <header className="flex flex-wrap items-center gap-3 border-b border-surface-soft pb-3">
            <span className="flex size-8 items-center justify-center rounded-full border border-line bg-surface-soft text-xs text-ink-body">
              {reservation.initiales}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink-deep">{reservation.occupant}</p>
              <p className="text-xs text-ink-muted">{bien?.nom}</p>
            </div>
            <span className="rounded border border-ink-muted bg-surface-soft px-2 py-0.5 text-xs text-ink-status">
              {typeLibelle}
            </span>
            <span className="rounded border border-ink-muted bg-surface-soft px-2 py-0.5 text-xs text-ink-status">
              {reservation.plateforme}
            </span>
            <p className="text-[10px] text-ink">N° de réservation : #{reservation.id.slice(-6)}</p>
            {occupantLie && (
              <Link
                to="/dossiers/$occupantId"
                params={{ occupantId: occupantLie.id }}
                className="inline-flex h-11 items-center rounded-card border border-line px-2 text-[11px] font-medium text-ink-body md:h-[30px]"
              >
                Fiche occupant
              </Link>
            )}
            <button
              type="button"
              onClick={() => setVoirPrecheckin(true)}
              className="inline-flex h-11 items-center gap-1.5 rounded-card border border-ink px-2.5 text-[11px] font-medium text-ink md:h-[30px]"
              aria-label={`Pré-checkin ${precheckinFait ? "fait" : "pas fait"}, voir`}
            >
              {precheckinFait ? (
                <CheckCircle2 className="size-4 text-accent-teal" />
              ) : (
                <Circle className="size-4 text-ink-muted" />
              )}
              <span>Pré-checkin {precheckinFait ? "fait" : "pas fait"}</span>
              <Eye className="size-3.5" />
            </button>
            {peutMod && (
              <button
                type="button"
                onClick={() => setConfirmer(true)}
                className="ml-auto inline-flex h-11 items-center rounded-card border border-ink bg-accent-teal px-3 text-xs font-medium text-white md:h-[30px]"
              >
                Supprimer
              </button>
            )}
          </header>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <MiniCarte
              icone={LogIn}
              label="Arrivée"
              valeur={formatDateLongue(reservation.arrivee)}
              extra={reservation.heureArrivee}
            />
            <MiniCarte label="Durée" extra={`${nuits} nuit${nuits > 1 ? "s" : ""}`} />
            <MiniCarte
              icone={LogOut}
              label="Départ"
              valeur={formatDateLongue(reservation.depart)}
              extra={reservation.heureDepart}
            />
            <MiniCarte
              label="Composition"
              valeur={`${reservation.adultes} adulte${reservation.adultes > 1 ? "s" : ""}`}
              extra={`${reservation.enfants} enfant${reservation.enfants > 1 ? "s" : ""}`}
            />
            <MiniCarte
              label="Chambre"
              extra={reservation.services?.find((s) => /lit|chambre/i.test(s)) ?? "Non renseigné"}
            />
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <MiniCarte
              label="Email"
              extra={reservation.email}
              href={`mailto:${reservation.email}`}
            />
            <MiniCarte
              label="Téléphone"
              extra={reservation.telephone}
              href={`tel:${reservation.telephone.replace(/\s+/g, "")}`}
            />
          </div>

          <div className="mt-2 rounded-card border border-surface-soft bg-surface p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-ink-subtle">Paiement du séjour</p>
              <button
                type="button"
                onClick={() => setVoirDetail((v) => !v)}
                className="rounded border border-ink-muted bg-line px-2 py-0.5 text-xs text-ink-status"
              >
                Détails {pct}%
              </button>
            </div>
            <p className="mt-2 text-sm text-ink">
              Payé : {formatMontant(reservation.paye)} / {formatMontant(reservation.montant)}
              <span className="ml-2 text-xs text-ink-muted">
                Caution {formatMontant(detail.caution)} · Loyer {formatMontant(detail.loyer)}
              </span>
            </p>
            {voirDetail && (
              <dl className="mt-2 grid gap-1 text-xs text-ink-body sm:grid-cols-2">
                <div className="flex justify-between gap-2">
                  <dt>Loyer / séjour</dt>
                  <dd>{formatMontant(detail.loyer)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Caution</dt>
                  <dd>{formatMontant(detail.caution)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Ménage</dt>
                  <dd>{formatMontant(detail.menage)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Taxes OTA / séjour</dt>
                  <dd>{formatMontant(detail.taxe)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Réduction</dt>
                  <dd>
                    −{formatMontant(detail.reduction)}
                    {reservation.reductionPourcent ? ` (${reservation.reductionPourcent} %)` : ""}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Frais plateforme</dt>
                  <dd>{formatMontant(detail.frais)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Commission gestion</dt>
                  <dd>
                    {formatMontant(detail.comm)}
                    {reservation.commissionPourcent ? ` (${reservation.commissionPourcent} %)` : ""}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Upsells</dt>
                  <dd>{formatMontant(detail.upsells)}</dd>
                </div>
                <div className="flex justify-between gap-2 font-medium text-ink">
                  <dt>Payé voyageur</dt>
                  <dd>{formatMontant(detail.voyageur)}</dd>
                </div>
                <div className="flex justify-between gap-2 font-medium text-ink">
                  <dt>Net perçu</dt>
                  <dd>{formatMontant(detail.net)}</dd>
                </div>
              </dl>
            )}
            <p className="mt-2 text-[11px] uppercase tracking-wide text-ink-muted">
              Vérifier attribution
              {reservation.attributionCommission
                ? ` · ${reservation.attributionCommission}`
                : viaPlateforme
                  ? " · commission plateforme à ventiler"
                  : " · encaissement direct"}
            </p>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <BarrePaiement
                label={`Payé : ${formatMontant(reservation.paye)}`}
                extra={` / ${formatMontant(reservation.montant)}`}
                pct={pct}
                couleur="bg-[#d8f3e3]"
              />
              <BarrePaiement
                label={`Services : ${formatMontant(upsellsMontant)}`}
                extra={upsellsMontant > 0 ? " (catalogue)" : " — aucun"}
                pct={upsellsMontant ? 100 : 0}
                couleur="bg-[#d8f3e3]"
              />
            </div>
            {peutMod && (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                <label className="block min-w-0 flex-1 text-xs text-ink-muted">
                  Montant encaissé
                  <input
                    value={saisiePaye}
                    onChange={(e) => setSaisiePaye(e.target.value)}
                    inputMode="decimal"
                    className="mt-1 h-11 w-full rounded-card border border-line bg-white px-3 text-sm text-ink outline-none md:h-9"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const n = Number(saisiePaye.replace(",", "."));
                      if (Number.isNaN(n)) {
                        toastErreur("Indiquez un montant valide.");
                        return;
                      }
                      const paye = Math.max(0, Math.min(reservation.montant, Math.round(n)));
                      modifierReservation(reservation.id, { paye });
                      toastOk(
                        paye >= reservation.montant
                          ? "Réservation soldée."
                          : `Paiement enregistré : ${formatMontant(paye)}.`,
                      );
                    }}
                    className="inline-flex h-11 items-center rounded-card border border-line px-3 text-xs font-medium text-ink-body md:h-9"
                  >
                    Enregistrer
                  </button>
                  {pct < 100 && (
                    <button
                      type="button"
                      onClick={() => {
                        modifierReservation(reservation.id, { paye: reservation.montant });
                        toastOk("Réservation soldée.");
                      }}
                      className="inline-flex h-11 items-center rounded-card bg-ink px-3 text-xs font-medium text-white md:h-9"
                    >
                      Marquer soldé
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setRembourse(true)}
                    className="inline-flex h-11 items-center rounded-card border border-line px-3 text-xs font-medium text-ink-body md:h-9"
                  >
                    Remboursement
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-2 rounded-card border border-surface-soft bg-surface p-3">
            <p className="text-xs text-ink-muted">Note</p>
            <p className="mt-1 text-xs text-ink-body">{note}</p>
          </div>

          <div className="mt-2 rounded-card border border-surface-soft bg-surface p-3">
            <p className="text-xs text-ink">Upsells</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {upsells.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className="inline-flex h-11 items-center gap-1 rounded-card bg-surface-soft px-2.5 text-xs text-ink-body md:h-6"
                  onClick={() => {
                    enregistrerUpsells(upsellsChoisis.filter((id) => id !== u.id));
                    toastOk(`${u.nom} retiré.`);
                  }}
                  aria-label={`Retirer ${u.nom}`}
                >
                  {u.nom}
                  <X className="size-2.5" />
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAjouterUpsell(true)}
                className="inline-flex h-11 items-center rounded-card bg-surface-soft px-2.5 text-xs text-ink-body md:h-6"
              >
                Ajouter Upsells
              </button>
            </div>
          </div>

          <footer className="mt-3 flex flex-col gap-2 border-t border-surface-soft pt-3 sm:flex-row sm:flex-wrap sm:justify-end">
            <button
              type="button"
              onClick={() => void telechargerFactureReservation(reservation, bien?.nom)}
              className="inline-flex h-11 items-center justify-center rounded-card border border-ink bg-accent-teal px-3 text-xs font-medium text-white md:h-[30px]"
            >
              Télécharger la facture
            </button>
            {session.parametrage.afficherEdl && (
              <Link
                to="/outils/etats-des-lieux"
                className="inline-flex h-11 items-center justify-center rounded-card border border-line px-3 text-xs font-medium text-ink-body md:h-[30px]"
              >
                État des lieux
              </Link>
            )}
            {session.parametrage.afficherFichesAcces && (
              <Link
                to="/documents"
                search={{ vue: "fiches" }}
                className="inline-flex h-11 items-center justify-center rounded-card border border-line px-3 text-xs font-medium text-ink-body md:h-[30px]"
              >
                Fiche d'accès
              </Link>
            )}
            {peutMod && (
              <button
                type="button"
                onClick={() => setRembourse(true)}
                className="inline-flex h-11 items-center justify-center rounded-card border border-line px-3 text-xs font-medium text-ink-body md:h-[30px]"
              >
                Remboursement
              </button>
            )}
            {peutMod && (
              <Link
                to="/reservations/nouveau"
                search={{ id: reservation.id }}
                className="inline-flex h-11 items-center justify-center rounded-card border border-ink bg-accent-teal px-3 text-xs font-medium text-white md:h-[30px]"
              >
                Modifier la réservation
              </Link>
            )}
          </footer>
        </div>
      )}

      <Dialog open={confirmer} onOpenChange={(o) => !o && setConfirmer(false)}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Supprimer cette réservation ?</DialogTitle>
          <DialogDescription>
            {reservation.occupant} disparaît du planning et de la liste. Vous la retrouverez
            uniquement dans Supprimées.
          </DialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmer(false)}
              className="h-9 rounded-card border border-line px-3 text-xs text-ink-body"
            >
              Garder
            </button>
            <button
              type="button"
              onClick={() => {
                annulerReservation(reservation.id);
                setConfirmer(false);
                onFermer?.();
                toastOk("Réservation supprimée.");
              }}
              className="h-9 rounded-card bg-accent-teal px-3 text-xs font-medium text-white"
            >
              Supprimer
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={ajouterUpsell} onOpenChange={(o) => !o && setAjouterUpsell(false)}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Ajouter un upsell</DialogTitle>
          <DialogDescription>Services actifs du paramétrage.</DialogDescription>
          <ul className="mt-3 space-y-2">
            {catalogue.map((u) => {
              const actif = upsellsChoisis.includes(u.id);
              return (
                <li key={u.id}>
                  <button
                    type="button"
                    disabled={actif}
                    onClick={() => {
                      enregistrerUpsells([...upsellsChoisis, u.id]);
                      setAjouterUpsell(false);
                      toastOk(`${u.nom} ajouté.`);
                    }}
                    className="flex w-full items-center justify-between rounded-card border border-line px-3 py-2 text-left text-sm disabled:opacity-40"
                  >
                    <span>{u.nom}</span>
                    <span className="text-xs text-ink-muted">{formatMontant(u.prix)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {catalogue.length === 0 && (
            <p className="mt-2 text-xs text-ink-muted">
              Aucun upsell actif. Activez-en dans Paramétrage.
            </p>
          )}
          {peutMod && (
            <Link
              to="/parametrage"
              className="mt-3 inline-block text-xs font-medium text-accent-teal"
              onClick={() => setAjouterUpsell(false)}
            >
              Gérer le catalogue
            </Link>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={rembourse} onOpenChange={(o) => !o && setRembourse(false)}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Remboursement</DialogTitle>
          <DialogDescription>
            Motif, montant et note. Le montant est déduit de l'encaissé.
          </DialogDescription>
          <div className="mt-3 space-y-2">
            <label className="block text-xs text-ink-muted">
              Motif *
              <input
                value={rembMotif}
                onChange={(e) => setRembMotif(e.target.value)}
                className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm outline-none"
              />
            </label>
            <label className="block text-xs text-ink-muted">
              Montant *
              <input
                value={rembMontant}
                onChange={(e) => setRembMontant(e.target.value)}
                inputMode="decimal"
                className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm outline-none"
              />
            </label>
            <label className="block text-xs text-ink-muted">
              Note
              <textarea
                value={rembNote}
                onChange={(e) => setRembNote(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-card border border-line px-3 py-2 text-sm outline-none"
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRembourse(false)}
              className="h-9 rounded-card border border-line px-3 text-xs"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => {
                if (!rembMotif.trim()) {
                  toastErreur("Indiquez le motif du remboursement.");
                  return;
                }
                const montant = Number(rembMontant.replace(",", ".")) || 0;
                if (montant <= 0) {
                  toastErreur("Indiquez un montant positif.");
                  return;
                }
                const montantArrondi = Math.round(montant);
                const paye = Math.max(0, reservation.paye - montantArrondi);
                const date = new Date().toISOString().slice(0, 10);
                const numero = `AV-${date.replace(/-/g, "")}-${reservation.id.slice(-4).toUpperCase()}`;
                modifierReservation(reservation.id, {
                  paye,
                  remboursements: [
                    ...(reservation.remboursements ?? []),
                    {
                      id: idNouveau("rb"),
                      date,
                      motif: rembMotif.trim(),
                      montant: montantArrondi,
                      note: rembNote.trim(),
                    },
                  ],
                });
                ajouterDocument({
                  id: idNouveau("doc"),
                  titre: `Avoir ${numero} — ${reservation.occupant}`,
                  type: "Avoir",
                  filtre: "Correspondances",
                  logement: bien?.nom ?? reservation.bienId,
                  date,
                  taille: "1 page",
                  modifiePar: "Gestionnaire",
                  photos: 0,
                  vue: "residents",
                  occupant: "locataires",
                });
                setAvoir({
                  motif: rembMotif.trim(),
                  montant: montantArrondi,
                  note: rembNote.trim(),
                  date,
                  numero,
                });
                setRembourse(false);
                setRembMotif("");
                setRembMontant("");
                setRembNote("");
                toastOk(`Avoir ${numero} généré.`);
              }}
              className="h-9 rounded-card bg-ink px-3 text-xs font-medium text-white"
            >
              Confirmer
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(avoir)} onOpenChange={(o) => !o && setAvoir(null)}>
        <DialogContent className="max-w-lg">
          <DialogTitle>Avoir</DialogTitle>
          <DialogDescription>Document de remboursement à remettre au client.</DialogDescription>
          {avoir && (
            <div className="mt-3 rounded-card border border-line bg-white p-4 text-sm text-ink">
              <p className="text-center text-lg font-semibold tracking-wide">AVOIR</p>
              <div className="mt-3 flex justify-between gap-4 text-xs">
                <div>
                  <p>Client : {reservation.occupant}</p>
                  <p>{reservation.email}</p>
                </div>
                <div className="text-right">
                  <p>Avoir n° {avoir.numero}</p>
                  <p>Date : {avoir.date}</p>
                  <p>
                    Réf. {reservation.plateforme} · {reservation.id}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs">Objet : {avoir.motif}</p>
              <p className="text-xs">
                Logement : {bien?.nom ?? reservation.bienId} · séjour {reservation.arrivee} →{" "}
                {reservation.depart}
              </p>
              <table className="mt-3 w-full text-xs">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="py-1 font-medium">Désignation</th>
                    <th className="py-1 text-right font-medium">Montant TTC</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1">
                      {avoir.motif}
                      {avoir.note ? ` — ${avoir.note}` : ""}
                    </td>
                    <td className="py-1 text-right">{formatMontant(avoir.montant)}</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-3 text-right font-medium">
                Total avoir TTC {formatMontant(avoir.montant)}
              </p>
            </div>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAvoir(null)}
              className="h-9 rounded-card border border-line px-3 text-xs"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={() => {
                if (!avoir) return;
                void telechargerAvoir({
                  occupant: reservation.occupant,
                  email: reservation.email,
                  reservationId: reservation.id,
                  plateforme: reservation.plateforme,
                  motif: avoir.motif,
                  montant: avoir.montant,
                  note: avoir.note,
                  logement: bien?.nom ?? reservation.bienId,
                  arrivee: reservation.arrivee,
                  depart: reservation.depart,
                  numero: avoir.numero,
                  date: avoir.date,
                });
              }}
              className="h-9 rounded-card bg-ink px-3 text-xs font-medium text-white"
            >
              Télécharger
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <DialoguePrecheckin
        reservation={reservation}
        ouvert={voirPrecheckin}
        onFermer={() => setVoirPrecheckin(false)}
      />
    </section>
  );
}

function MiniCarte({
  icone: Icone,
  label,
  valeur,
  extra,
  href,
}: {
  icone?: typeof LogIn;
  label: string;
  valeur?: string;
  extra?: string;
  href?: string;
}) {
  return (
    <div className="rounded-card border border-surface-soft bg-surface p-2.5">
      <p className="flex items-center gap-1 text-xs text-ink-muted">
        {Icone && <Icone className="size-2.5" />}
        {label}
      </p>
      {valeur && <p className="mt-1 text-xs text-ink">{valeur}</p>}
      {extra &&
        (href ? (
          <a
            href={href}
            className={cn(
              "text-xs text-accent-teal underline-offset-2 hover:underline",
              !valeur && "mt-1 block",
            )}
          >
            {extra}
          </a>
        ) : (
          <p className={cn("text-xs text-ink-subtle", !valeur && "mt-1")}>{extra}</p>
        ))}
    </div>
  );
}

function BarrePaiement({
  label,
  extra,
  pct,
  couleur,
}: {
  label: string;
  extra: string;
  pct: number;
  couleur: string;
}) {
  return (
    <div>
      <div className="h-1.5 overflow-hidden rounded-full bg-line">
        <div
          className={cn("h-full rounded-full", couleur)}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-ink-subtle">
        {label}
        <span className="italic">{extra}</span>
      </p>
    </div>
  );
}
