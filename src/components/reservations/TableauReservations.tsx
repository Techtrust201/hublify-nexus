import { Link } from "@tanstack/react-router";
import {
  Calendar,
  ChevronRight,
  Clock,
  Download,
  History,
  LogIn,
  LogOut,
  Search,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  AUJOURD_HUI_MO1,
  CODE_PLATEFORME,
  RESERVATIONS_MO1,
  bienParId,
  formatDateLongue,
  formatMontant,
  nuitsEntre,
  pourcentagePaiement,
  type ReservationMo1,
  type StatutReservationMo1,
} from "@/data/reservations-mo1";
import { cn } from "@/lib/utils";

type FiltrePeriode = "tous" | "en_cours" | "a_venir" | "departs" | "passes";

const PAGE = 8;

export function TableauReservations() {
  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState<"tout" | StatutReservationMo1>("tout");
  const [periode, setPeriode] = useState<FiltrePeriode>("tous");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<ReservationMo1 | null>(null);

  const filtrees = useMemo(() => {
    return RESERVATIONS_MO1.filter((r) => {
      const bien = bienParId(r.bienId);
      const q = recherche.trim().toLowerCase();
      if (
        q &&
        !r.occupant.toLowerCase().includes(q) &&
        !bien?.nom.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (statut !== "tout" && r.statut !== statut) return false;
      if (periode === "en_cours") return r.arrivee <= AUJOURD_HUI_MO1 && r.depart > AUJOURD_HUI_MO1;
      if (periode === "a_venir") return r.arrivee > AUJOURD_HUI_MO1;
      if (periode === "departs") return r.depart === AUJOURD_HUI_MO1;
      if (periode === "passes") return r.depart < AUJOURD_HUI_MO1;
      return true;
    });
  }, [recherche, statut, periode]);

  const pages = Math.max(1, Math.ceil(filtrees.length / PAGE));
  const pageCourante = Math.min(page, pages);
  const visibles = filtrees.slice((pageCourante - 1) * PAGE, pageCourante * PAGE);

  return (
    <div className="flex min-h-[640px] gap-0">
      <aside className="hidden w-[190px] shrink-0 border-r border-[#f3f4f6] pr-2 md:block">
        <p className="px-2 pt-4 text-[11px] font-medium uppercase tracking-[0.3px] text-[#99a1af]">
          Filtres
        </p>
        <div className="mt-2 space-y-1">
          <FiltreLigne
            icone={Clock}
            label="En cours"
            compte={4}
            actif={periode === "en_cours"}
            onClick={() => setPeriode((p) => (p === "en_cours" ? "tous" : "en_cours"))}
          />
          <FiltreLigne
            icone={LogIn}
            label="À venir"
            compte={9}
            actif={periode === "a_venir"}
            onClick={() => setPeriode((p) => (p === "a_venir" ? "tous" : "a_venir"))}
          />
          <FiltreLigne
            icone={LogOut}
            label="Départs"
            compte={1}
            actif={periode === "departs"}
            onClick={() => setPeriode((p) => (p === "departs" ? "tous" : "departs"))}
          />
          <FiltreLigne
            icone={History}
            label="Passés"
            compte={6}
            actif={periode === "passes"}
            onClick={() => setPeriode((p) => (p === "passes" ? "tous" : "passes"))}
          />
        </div>
        <div className="mx-2 my-4 h-px bg-[#f3f4f6]" />
        <p className="px-2 text-[11px] font-medium uppercase tracking-[0.3px] text-[#99a1af]">
          Statuts
        </p>
        <ul className="mt-2 space-y-1 px-3 text-xs">
          <li className="flex justify-between text-[#4a5565]">
            Confirmé <span className="text-[#99a1af]">14</span>
          </li>
          <li className="flex justify-between text-[#4a5565]">
            En attente <span className="text-[#99a1af]">4</span>
          </li>
          <li className="flex justify-between text-[#4a5565]">
            Annulé <span className="text-[#99a1af]">2</span>
          </li>
        </ul>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3 px-5 py-3">
          <label className="relative flex h-[34px] min-w-[220px] flex-1 items-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-3">
            <Search className="size-3.5 text-[#99a1af]" />
            <input
              value={recherche}
              onChange={(e) => {
                setRecherche(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher par occupant ou logement…"
              className="h-full w-full bg-transparent text-xs text-[#1e2939] outline-none placeholder:text-[#99a1af]"
            />
          </label>
          <div className="flex rounded-[10px] border border-[#e5e7eb] p-1">
            {(
              [
                ["tout", "Tout"],
                ["Confirmé", "Confirmé"],
                ["En attente", "En attente"],
                ["Annulé", "Annulé"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setStatut(id);
                  setPage(1);
                }}
                className={cn(
                  "h-7 rounded-md px-3 text-xs font-medium",
                  statut === id ? "bg-[#1e2939] text-white" : "text-[#4a5565]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 pb-3">
          <button
            type="button"
            className="inline-flex h-[30px] items-center gap-1 rounded border border-[#e5e7eb] px-3 text-xs font-medium text-[#4a5565]"
          >
            <Download className="size-3" />
            Exporter
          </button>
          <button
            type="button"
            className="inline-flex h-[34px] items-center gap-1 rounded-[10px] border border-[#e5e7eb] px-3 text-xs font-medium text-[#4a5565]"
          >
            <Calendar className="size-3.5" />
            Année 2026
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left">
            <thead>
              <tr className="border-y border-[#f3f4f6] text-xs text-[#6a7282]">
                <th className="w-10 px-3 py-3 font-normal">
                  <input type="checkbox" aria-label="Tout sélectionner" className="size-3.5" />
                </th>
                <th className="px-3 py-3 font-normal">Statut</th>
                <th className="px-3 py-3 font-normal">Propriété</th>
                <th className="px-3 py-3 font-normal">Occupant</th>
                <th className="px-3 py-3 font-normal">Arrivée</th>
                <th className="px-3 py-3 font-normal">Source</th>
                <th className="px-3 py-3 font-normal">Voyageurs</th>
                <th className="px-3 py-3 font-normal">Montant</th>
                <th className="px-3 py-3 font-normal">Paiement</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {visibles.map((r) => {
                const bien = bienParId(r.bienId);
                const pct = pourcentagePaiement(r);
                return (
                  <tr
                    key={r.id}
                    className={cn(
                      "cursor-pointer border-b border-[#f3f4f6] hover:bg-[#f9fafb]",
                      detail?.id === r.id && "bg-[#f9fafb]",
                    )}
                    onClick={() => setDetail(r)}
                  >
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" aria-label={r.occupant} className="size-3.5" />
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "inline-flex h-[22px] items-center rounded px-2 text-[11px]",
                          r.statut === "Confirmé"
                            ? "bg-[#1e2939] text-white"
                            : r.statut === "En attente"
                              ? "bg-[#f3f4f6] text-[#4a5565]"
                              : "border border-[#e5e7eb] text-[#99a1af]",
                        )}
                      >
                        {r.statut}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-xs font-medium text-[#1e2939]">{bien?.nom}</p>
                      <p className="text-[11px] text-[#99a1af]">{bien?.adresse}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-[#1e2939]">{r.occupant}</td>
                    <td className="px-3 py-3">
                      <p className="text-xs text-[#1e2939]">{formatDateLongue(r.arrivee)}</p>
                      <p className="text-[11px] text-[#99a1af]">00:00</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex h-[22px] items-center rounded bg-[#1e2939] px-2 text-[11px] text-white">
                        {CODE_PLATEFORME[r.plateforme]}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-[#4a5565]">
                        <Users className="size-2.5" />
                        {r.voyageurs}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs font-medium text-[#1e2939]">
                      {formatMontant(r.montant)}
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#4a5565]">
                        <span
                          className={cn(
                            "size-2 rounded-full",
                            pct === 100 && "bg-[#6a7282]",
                            pct > 0 && pct < 100 && "border border-[#6a7282] bg-[linear-gradient(90deg,#6a7282_50%,transparent_50%)]",
                            pct === 0 && "border border-[#99a1af]",
                          )}
                        />
                        {pct}%
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <ChevronRight className="size-3.5 text-[#99a1af]" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
          <p className="text-xs text-[#99a1af]">Affichage de {filtrees.length} réservations</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pageCourante <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-[30px] rounded border border-[#e5e7eb] px-3 text-xs text-[#4a5565] disabled:opacity-40"
            >
              Précédent
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={cn(
                  "size-7 rounded text-xs",
                  n === pageCourante ? "bg-[#1e2939] text-white" : "text-[#4a5565]",
                )}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              disabled={pageCourante >= pages}
              onClick={() => setPage((p) => p + 1)}
              className="h-[30px] rounded border border-[#e5e7eb] px-3 text-xs text-[#4a5565] disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {detail && <PanneauDetail reservation={detail} onFermer={() => setDetail(null)} />}
    </div>
  );
}

function FiltreLigne({
  icone: Icone,
  label,
  compte,
  actif,
  onClick,
}: {
  icone: typeof Clock;
  label: string;
  compte: number;
  actif: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-[35px] w-full items-center gap-2 rounded-[8px] px-3 text-xs",
        actif ? "bg-[#f3f4f6] text-[#1e2939]" : "text-[#4a5565] hover:bg-[#f9fafb]",
      )}
    >
      <Icone className="size-3.5" />
      <span className="flex-1 text-left">{label}</span>
      <span className="rounded bg-white px-1.5 py-0.5 text-[11px] text-[#6a7282]">{compte}</span>
    </button>
  );
}

function PanneauDetail({
  reservation,
  onFermer,
}: {
  reservation: ReservationMo1;
  onFermer: () => void;
}) {
  const bien = bienParId(reservation.bienId);
  const pct = pourcentagePaiement(reservation);
  const nuits = nuitsEntre(reservation.arrivee, reservation.depart);

  return (
    <aside className="fixed inset-y-0 right-0 z-30 flex w-full max-w-[400px] flex-col border-l border-[#e5e7eb] bg-white shadow-xl">
      <header className="flex items-center justify-between border-b border-[#f3f4f6] px-5 py-4">
        <p className="text-sm text-[#1e2939]">Détail réservation</p>
        <button type="button" onClick={onFermer} aria-label="Fermer">
          <X className="size-4 text-[#99a1af]" />
        </button>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
        <div className="flex gap-2">
          <span
            className={cn(
              "inline-flex h-6 items-center rounded px-2.5 text-xs",
              reservation.statut === "Confirmé"
                ? "bg-[#1e2939] text-white"
                : "bg-[#f3f4f6] text-[#4a5565]",
            )}
          >
            {reservation.statut}
          </span>
          <span className="inline-flex h-[19px] items-center rounded bg-[#1e2939] px-2 text-[11px] text-white">
            {CODE_PLATEFORME[reservation.plateforme]}
          </span>
        </div>
        <div className="rounded-[10px] border border-[#f3f4f6] p-3">
          <p className="text-xs text-[#99a1af]">Logement</p>
          <p className="mt-1 text-sm text-[#1e2939]">{bien?.nom}</p>
          <p className="text-xs text-[#6a7282]">{bien?.adresse}</p>
        </div>
        <div className="rounded-[10px] border border-[#f3f4f6] p-3">
          <p className="text-xs text-[#99a1af]">Occupant</p>
          <p className="mt-1 text-sm text-[#1e2939]">{reservation.occupant}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-[10px] border border-[#f3f4f6] p-3">
            <p className="text-xs text-[#99a1af]">Check-in</p>
            <p className="mt-1 text-xs text-[#1e2939]">{formatDateLongue(reservation.arrivee)}</p>
          </div>
          <div className="rounded-[10px] border border-[#f3f4f6] p-3">
            <p className="text-xs text-[#99a1af]">Check-out</p>
            <p className="mt-1 text-xs text-[#1e2939]">{formatDateLongue(reservation.depart)}</p>
          </div>
        </div>
        <div className="flex gap-6 rounded-[10px] border border-[#f3f4f6] p-3 text-xs">
          <div>
            <p className="text-[#99a1af]">Adultes</p>
            <p className="mt-1 text-[#1e2939]">{reservation.adultes}</p>
          </div>
          <div>
            <p className="text-[#99a1af]">Enfants</p>
            <p className="mt-1 text-[#1e2939]">{reservation.enfants}</p>
          </div>
          <div>
            <p className="text-[#99a1af]">Nuits</p>
            <p className="mt-1 text-[#1e2939]">{nuits}</p>
          </div>
        </div>
        <div className="rounded-[10px] border border-[#f3f4f6] p-3">
          <p className="text-xs text-[#99a1af]">Paiement</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-sm text-[#1e2939]">{formatMontant(reservation.montant)}</span>
            <span className="text-xs text-[#6a7282]">{pct}% réglé</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f3f4f6]">
            <div className="h-full rounded-full bg-[#1e2939]" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs text-[#6a7282]">
            <span>Réglé : {formatMontant(reservation.paye)}</span>
            <span>Reste : {formatMontant(reservation.montant - reservation.paye)}</span>
          </div>
        </div>
      </div>
      <footer className="flex gap-2 border-t border-[#f3f4f6] px-5 py-4">
        <Link
          to="/reservations/nouveau"
          className="flex h-[34px] flex-1 items-center justify-center rounded-[10px] border border-[#e5e7eb] text-sm font-medium text-[#4a5565]"
        >
          Modifier
        </Link>
        <button
          type="button"
          className="h-[34px] flex-1 rounded-[10px] bg-[#1e2939] text-sm font-medium text-white"
        >
          Générer facture
        </button>
      </footer>
    </aside>
  );
}
