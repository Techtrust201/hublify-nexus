import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatDateLongue, type ReservationMo1 } from "@/data/reservations-mo1";
import { modifierReservation } from "@/data/session";
import { toastOk } from "@/lib/feedback";

export function DialoguePrecheckin({
  reservation,
  ouvert,
  onFermer,
  lectureSeule = true,
}: {
  reservation: ReservationMo1 | null;
  ouvert: boolean;
  onFermer: () => void;
  lectureSeule?: boolean;
}) {
  if (!reservation) return null;
  const fait = reservation.precheckinStatut === "fait";

  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onFermer()}>
      <DialogContent className="max-w-md">
        <DialogTitle>Pré-checkin</DialogTitle>
        <DialogDescription>
          {fait
            ? "Le voyageur a renseigné son arrivée. Ces informations sont visibles ici."
            : "Le voyageur n'a pas encore complété son pré-checkin."}
        </DialogDescription>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-ink-muted">Statut</dt>
            <dd className="font-medium text-ink">{fait ? "Fait" : "Pas fait"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-muted">Identité</dt>
            <dd className="text-ink">{reservation.precheckinIdentite || reservation.occupant}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-muted">Dates</dt>
            <dd className="text-ink">
              {formatDateLongue(reservation.arrivee)} → {formatDateLongue(reservation.depart)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-muted">Voyageurs</dt>
            <dd className="text-ink">
              {reservation.precheckinNbPersonnes || reservation.voyageurs} personne
              {(reservation.precheckinNbPersonnes || reservation.voyageurs) > 1 ? "s" : ""}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-muted">Heure d'arrivée</dt>
            <dd className="text-ink">
              {reservation.precheckinHeureArrivee || reservation.heureArrivee}
            </dd>
          </div>
          {reservation.precheckinNote && (
            <div>
              <dt className="text-ink-muted">Note</dt>
              <dd className="mt-1 text-ink-body">{reservation.precheckinNote}</dd>
            </div>
          )}
        </dl>
        {!lectureSeule && !fait && (
          <button
            type="button"
            onClick={() => {
              modifierReservation(reservation.id, {
                precheckinStatut: "fait",
                precheckinIdentite: reservation.occupant,
                precheckinNbPersonnes: reservation.voyageurs,
                precheckinHeureArrivee: reservation.heureArrivee,
              });
              toastOk("Pré-checkin enregistré.");
              onFermer();
            }}
            className="mt-4 h-9 w-full rounded-card bg-ink text-xs font-medium text-white"
          >
            Marquer comme fait
          </button>
        )}
        <button
          type="button"
          onClick={onFermer}
          className="mt-2 h-9 w-full rounded-card border border-line text-xs text-ink-body"
        >
          Fermer
        </button>
      </DialogContent>
    </Dialog>
  );
}
