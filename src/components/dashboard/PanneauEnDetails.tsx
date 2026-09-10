import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, Home, LogIn, LogOut, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDroit } from "@/auth/auth-context";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  formatDateLongue,
  formatMontant,
  nuitsEntre,
  pourcentagePaiement,
} from "@/data/reservations-mo1";
import { annulerReservation, modifierReservation, useSession } from "@/data/session";
import { toastErreur, toastOk } from "@/lib/feedback";
import { telechargerFactureReservation } from "@/lib/exports-docs";
import { cn, useSessionBool } from "@/lib/utils";

export function PanneauEnDetails() {
  const session = useSession();
  const peutMod = useDroit("mod-reservations");
  const [ouvert, setOuvert] = useSessionBool("hublify.accordeon.en-details", true);
  const [selId, setSelId] = useState<string | null>(null);
  const [confirmer, setConfirmer] = useState(false);
  const [ajouterUpsell, setAjouterUpsell] = useState(false);
  const [saisiePaye, setSaisiePaye] = useState("");

  const actives = useMemo(
    () => session.reservationsDossier.filter((r) => r.statut !== "Annulé"),
    [session.reservationsDossier],
  );
  const reservation = actives.find((r) => r.id === selId) ?? actives[0];

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
          {actives.length > 1 && (
            <label className="mb-3 block text-xs text-ink-muted">
              Réservation
              <select
                value={reservation.id}
                onChange={(e) => setSelId(e.target.value)}
                className="mt-1 h-9 w-full rounded-card border border-line bg-white px-2 text-sm text-ink outline-none"
              >
                {actives.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.occupant} — {session.biens.find((b) => b.id === r.bienId)?.nom}
                  </option>
                ))}
              </select>
            </label>
          )}
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
            {peutMod && (
              <button
                type="button"
                onClick={() => setConfirmer(true)}
                className="ml-auto inline-flex h-11 items-center rounded-card border border-ink bg-accent-teal px-3 text-xs font-medium text-white md:h-[30px]"
              >
                Annuler
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
              <span className="rounded border border-ink-muted bg-line px-2 py-0.5 text-xs text-ink-status">
                Détails {pct}%
              </span>
            </div>
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
          <DialogTitle>Annuler cette réservation ?</DialogTitle>
          <DialogDescription>
            {reservation.occupant} disparaît du planning. Elle restera visible dans la liste, au
            statut Annulé.
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
                setSelId(null);
                setConfirmer(false);
                toastOk("Réservation annulée.");
              }}
              className="h-9 rounded-card bg-accent-teal px-3 text-xs font-medium text-white"
            >
              Confirmer
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
