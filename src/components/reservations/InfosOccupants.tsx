import { LogIn, LogOut } from "lucide-react";
import {
  bienParId,
  formatJourCourt,
  formatMontant,
  nuitsEntre,
  paiementDe,
  type ReservationMo1,
} from "@/data/reservations-mo1";

export function InfosOccupants({
  reservation,
  onFermer,
  onModifier,
}: {
  reservation: ReservationMo1;
  onFermer: () => void;
  onModifier?: () => void;
}) {
  const bien = bienParId(reservation.bienId);
  const paiement = paiementDe(reservation);
  const nuits = nuitsEntre(reservation.arrivee, reservation.depart);
  const labelPaiement =
    paiement === "paye" ? "Payé" : paiement === "partiel" ? "Partiel" : "Impayé";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4">
      <div
        role="dialog"
        aria-labelledby="infos-occupant-titre"
        className="w-full max-w-[480px] overflow-hidden rounded-card border border-line bg-white shadow-lg"
      >
        <header className="flex items-center justify-between border-b border-surface-soft px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-line text-xs text-ink-body">
              {reservation.initiales}
            </span>
            <div>
              <p id="infos-occupant-titre" className="text-sm text-ink">
                {reservation.occupant}
              </p>
              <p className="text-xs text-ink-muted">{bien?.nom}</p>
            </div>
          </div>
          <span className="rounded border border-line-strong bg-surface px-2 py-0.5 text-xs text-ink-subtle">
            {reservation.plateforme === "Booking.com" ? "Booking.com" : reservation.plateforme}
          </span>
        </header>

        <div className="space-y-3 px-5 py-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-card border border-surface-soft bg-surface p-2.5">
              <p className="flex items-center gap-1 text-xs text-ink-muted">
                <LogIn className="size-2.5" />
                Arrivée
              </p>
              <p className="mt-1 text-xs text-ink">{formatJourCourt(reservation.arrivee)}</p>
              <p className="text-xs text-ink-subtle">{reservation.heureArrivee}</p>
            </div>
            <div className="rounded-card border border-surface-soft bg-surface p-2.5">
              <p className="flex items-center gap-1 text-xs text-ink-muted">
                <LogOut className="size-2.5" />
                Départ
              </p>
              <p className="mt-1 text-xs text-ink">{formatJourCourt(reservation.depart)}</p>
              <p className="text-xs text-ink-subtle">{reservation.heureDepart}</p>
            </div>
            <div className="rounded-card border border-surface-soft bg-surface p-2.5">
              <p className="text-xs text-ink-muted">Séjour</p>
              <p className="mt-1 text-xs text-ink">
                {nuits} nuit{nuits > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-ink-subtle">
                {reservation.adultes} adulte{reservation.adultes > 1 ? "s" : ""}
                {reservation.enfants > 0 ? ` · ${reservation.enfants} enf.` : ""}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-card border border-surface-soft p-2.5">
              <p className="text-xs text-ink-muted">Email</p>
              <p className="mt-1 text-xs text-ink">{reservation.email}</p>
            </div>
            <div className="rounded-card border border-surface-soft p-2.5">
              <p className="text-xs text-ink-muted">Téléphone</p>
              <p className="mt-1 text-xs text-ink">{reservation.telephone}</p>
            </div>
          </div>

          <div className="rounded-card border border-surface-soft p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-muted">Paiement</span>
              <span className="rounded border border-line-strong px-2 py-0.5 text-xs text-ink-subtle">
                {labelPaiement}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-soft">
              <div
                className="h-full rounded-full bg-ink"
                style={{
                  width: `${reservation.montant ? Math.round((reservation.paye / reservation.montant) * 100) : 0}%`,
                }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-ink-subtle">
              <span>Payé : {formatMontant(reservation.paye)}</span>
              <span>Total : {formatMontant(reservation.montant)}</span>
            </div>
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-surface-soft px-5 py-3">
          <button
            type="button"
            onClick={onFermer}
            className="h-[30px] rounded border border-line-strong bg-white px-3 text-xs font-medium text-ink-body"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={onModifier}
            className="h-[30px] rounded bg-ink px-3 text-xs font-medium text-white"
          >
            Modifier la réservation
          </button>
        </footer>
      </div>
    </div>
  );
}
