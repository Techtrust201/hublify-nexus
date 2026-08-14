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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#1e2939]/40 p-4">
      <div
        role="dialog"
        aria-labelledby="infos-occupant-titre"
        className="w-full max-w-[480px] overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white shadow-lg"
      >
        <header className="flex items-center justify-between border-b border-[#f3f4f6] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-[#e5e7eb] text-xs text-[#4a5565]">
              {reservation.initiales}
            </span>
            <div>
              <p id="infos-occupant-titre" className="text-sm text-[#1e2939]">
                {reservation.occupant}
              </p>
              <p className="text-xs text-[#99a1af]">{bien?.nom}</p>
            </div>
          </div>
          <span className="rounded border border-[#d1d5dc] bg-[#f9fafb] px-2 py-0.5 text-xs text-[#6a7282]">
            {reservation.plateforme === "Booking.com" ? "Booking.com" : reservation.plateforme}
          </span>
        </header>

        <div className="space-y-3 px-5 py-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-[10px] border border-[#f3f4f6] bg-[#f9fafb] p-2.5">
              <p className="flex items-center gap-1 text-xs text-[#99a1af]">
                <LogIn className="size-2.5" />
                Arrivée
              </p>
              <p className="mt-1 text-xs text-[#1e2939]">{formatJourCourt(reservation.arrivee)}</p>
              <p className="text-xs text-[#6a7282]">{reservation.heureArrivee}</p>
            </div>
            <div className="rounded-[10px] border border-[#f3f4f6] bg-[#f9fafb] p-2.5">
              <p className="flex items-center gap-1 text-xs text-[#99a1af]">
                <LogOut className="size-2.5" />
                Départ
              </p>
              <p className="mt-1 text-xs text-[#1e2939]">{formatJourCourt(reservation.depart)}</p>
              <p className="text-xs text-[#6a7282]">{reservation.heureDepart}</p>
            </div>
            <div className="rounded-[10px] border border-[#f3f4f6] bg-[#f9fafb] p-2.5">
              <p className="text-xs text-[#99a1af]">Séjour</p>
              <p className="mt-1 text-xs text-[#1e2939]">
                {nuits} nuit{nuits > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-[#6a7282]">
                {reservation.adultes} adulte{reservation.adultes > 1 ? "s" : ""}
                {reservation.enfants > 0 ? ` · ${reservation.enfants} enf.` : ""}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[10px] border border-[#f3f4f6] p-2.5">
              <p className="text-xs text-[#99a1af]">Email</p>
              <p className="mt-1 text-xs text-[#1e2939]">{reservation.email}</p>
            </div>
            <div className="rounded-[10px] border border-[#f3f4f6] p-2.5">
              <p className="text-xs text-[#99a1af]">Téléphone</p>
              <p className="mt-1 text-xs text-[#1e2939]">{reservation.telephone}</p>
            </div>
          </div>

          <div className="rounded-[10px] border border-[#f3f4f6] p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#99a1af]">Paiement</span>
              <span className="rounded border border-[#d1d5dc] px-2 py-0.5 text-xs text-[#6a7282]">
                {labelPaiement}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f3f4f6]">
              <div
                className="h-full rounded-full bg-[#1e2939]"
                style={{
                  width: `${reservation.montant ? Math.round((reservation.paye / reservation.montant) * 100) : 0}%`,
                }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-[#6a7282]">
              <span>Payé : {formatMontant(reservation.paye)}</span>
              <span>Total : {formatMontant(reservation.montant)}</span>
            </div>
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-[#f3f4f6] px-5 py-3">
          <button
            type="button"
            onClick={onFermer}
            className="h-[30px] rounded border border-[#d1d5dc] bg-white px-3 text-xs font-medium text-[#4a5565]"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={onModifier}
            className="h-[30px] rounded bg-[#1e2939] px-3 text-xs font-medium text-white"
          >
            Modifier la réservation
          </button>
        </footer>
      </div>
    </div>
  );
}
