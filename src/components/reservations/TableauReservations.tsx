import { Link } from "@tanstack/react-router";
import { ScrollHint } from "@/components/layout/ScrollHint";
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
  bienParId,
  formatDateLongue,
  formatMontant,
  nuitsEntre,
  pourcentagePaiement,
  type ReservationMo1,
  type StatutReservationMo1,
} from "@/data/reservations-mo1";
import { useSession } from "@/data/session";
import { telechargerDemo } from "@/lib/feedback";
import { cn } from "@/lib/utils";

type FiltrePeriode = "tous" | "en_cours" | "a_venir" | "departs" | "passes";

const PAGE = 8;

export function TableauReservations() {
  const session = useSession();
  const reservations = session.reservationsDossier;
  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState<"tout" | StatutReservationMo1>("tout");
  const [periode, setPeriode] = useState<FiltrePeriode>("tous");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<ReservationMo1 | null>(null);

  const filtrees = useMemo(() => {
    return reservations.filter((r) => {
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
  }, [recherche, statut, periode, reservations]);

  const comptes = useMemo(() => {
    const base = reservations.filter((r) => r.statut !== "Annulé");
    return {
      en_cours: base.filter((r) => r.arrivee <= AUJOURD_HUI_MO1 && r.depart > AUJOURD_HUI_MO1).length,
      a_venir: base.filter((r) => r.arrivee > AUJOURD_HUI_MO1).length,
      departs: base.filter((r) => r.depart === AUJOURD_HUI_MO1).length,
      passes: base.filter((r) => r.depart < AUJOURD_HUI_MO1).length,
      confirme: reservations.filter((r) => r.statut === "Confirmé").length,
      attente: reservations.filter((r) => r.statut === "En attente").length,
      annule: reservations.filter((r) => r.statut === "Annulé").length,
    };
  }, [reservations]);

  const pages = Math.max(1, Math.ceil(filtrees.length / PAGE));
  const pageCourante = Math.min(page, pages);
  const visibles = filtrees.slice((pageCourante - 1) * PAGE, pageCourante * PAGE);

  return (
    <div className="flex min-h-[640px] gap-0">
      <aside className="hidden w-[190px] shrink-0 border-r border-surface-soft pr-2 md:block">
        <p className="px-2 pt-4 text-[11px] font-medium uppercase tracking-[0.3px] text-ink-muted">
          Filtres
        </p>
        <div className="mt-2 space-y-1">
          <FiltreLigne
            icone={Clock}
            label="En cours"
            compte={comptes.en_cours}
            actif={periode === "en_cours"}
            onClick={() => setPeriode((p) => (p === "en_cours" ? "tous" : "en_cours"))}
          />
          <FiltreLigne
            icone={LogIn}
            label="À venir"
            compte={comptes.a_venir}
            actif={periode === "a_venir"}
            onClick={() => setPeriode((p) => (p === "a_venir" ? "tous" : "a_venir"))}
          />
          <FiltreLigne
            icone={LogOut}
            label="Départs"
            compte={comptes.departs}
            actif={periode === "departs"}
            onClick={() => setPeriode((p) => (p === "departs" ? "tous" : "departs"))}
          />
          <FiltreLigne
            icone={History}
            label="Passés"
            compte={comptes.passes}
            actif={periode === "passes"}
            onClick={() => setPeriode((p) => (p === "passes" ? "tous" : "passes"))}
          />
        </div>
        <div className="mx-2 my-4 h-px bg-surface-soft" />
        <p className="px-2 text-[11px] font-medium uppercase tracking-[0.3px] text-ink-muted">
          Statuts
        </p>
        <ul className="mt-2 space-y-1 px-3 text-xs">
          <li className="flex justify-between text-ink-body">
            Confirmé <span className="text-ink-muted">{comptes.confirme}</span>
          </li>
          <li className="flex justify-between text-ink-body">
            En attente <span className="text-ink-muted">{comptes.attente}</span>
          </li>
          <li className="flex justify-between text-ink-body">
            Annulé <span className="text-ink-muted">{comptes.annule}</span>
          </li>
        </ul>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3 px-5 py-3">
          <label className="relative flex h-11 min-w-[220px] flex-1 items-center gap-2 rounded-card border border-line bg-white px-3 md:h-[34px]">
            <Search className="size-3.5 text-ink-muted" />
            <input
              value={recherche}
              onChange={(e) => {
                setRecherche(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher par occupant ou logement…"
              className="h-full w-full bg-transparent text-base text-ink outline-none placeholder:text-ink-muted md:text-xs"
            />
          </label>
          <div className="flex rounded-card border border-line p-1">
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
                  "h-11 min-h-11 rounded-md px-3 text-sm font-medium md:h-7 md:min-h-7 md:text-xs",
                  statut === id ? "bg-ink text-white" : "text-ink-body",
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
            onClick={() =>
              telechargerDemo(
                "reservations-hublify.csv",
                ["Occupant;Bien;Arrivee;Depart;Statut;Montant", ...filtrees.map((r) => {
                  const bien = bienParId(r.bienId);
                  return `${r.occupant};${bien?.nom ?? r.bienId};${r.arrivee};${r.depart};${r.statut};${r.montant}`;
                })].join("\n"),
              )
            }
            className="inline-flex h-[30px] items-center gap-1 rounded border border-line px-3 text-xs font-medium text-ink-body"
          >
            <Download className="size-3" />
            Exporter
          </button>
          <button
            type="button"
            className="inline-flex h-[34px] items-center gap-1 rounded-card border border-line px-3 text-xs font-medium text-ink-body"
          >
            <Calendar className="size-3.5" />
            Année 2026
          </button>
        </div>

        <div className="flex flex-wrap gap-2 px-4 py-3 md:hidden">
          <FiltreLigne
            className="w-auto shrink-0"
            icone={Clock}
            label="En cours"
            compte={comptes.en_cours}
            actif={periode === "en_cours"}
            onClick={() => setPeriode((p) => (p === "en_cours" ? "tous" : "en_cours"))}
          />
          <FiltreLigne
            icone={LogIn}
            label="À venir"
            compte={comptes.a_venir}
            actif={periode === "a_venir"}
            onClick={() => setPeriode((p) => (p === "a_venir" ? "tous" : "a_venir"))}
          />
          <FiltreLigne
            icone={LogOut}
            label="Départs"
            compte={comptes.departs}
            actif={periode === "departs"}
            onClick={() => setPeriode((p) => (p === "departs" ? "tous" : "departs"))}
          />
          <FiltreLigne
            icone={History}
            label="Passés"
            compte={comptes.passes}
            actif={periode === "passes"}
            onClick={() => setPeriode((p) => (p === "passes" ? "tous" : "passes"))}
          />
        </div>

        <div className="divide-y divide-surface-soft md:hidden">
          {visibles.map((r) => {
            const bien = bienParId(r.bienId);
            const pct = pourcentagePaiement(r);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setDetail(r)}
                className="flex w-full flex-col gap-1 px-4 py-4 text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink">{r.occupant}</p>
                  <span
                    className={cn(
                      "inline-flex h-7 items-center rounded px-2 text-[11px]",
                      r.statut === "Confirmé"
                        ? "bg-ink text-white"
                        : r.statut === "En attente"
                          ? "bg-surface-soft text-ink-body"
                          : "border border-line text-ink-muted",
                    )}
                  >
                    {r.statut}
                  </span>
                </div>
                <p className="text-xs text-ink-muted">
                  {bien?.nom} · {formatDateLongue(r.arrivee)}
                </p>
                <p className="text-sm text-ink">
                  {formatMontant(r.montant)} · {pct}% réglé
                </p>
              </button>
            );
          })}
        </div>

        <ScrollHint className="hidden md:block">
          <table className="w-full min-w-[880px] text-left">
            <thead>
              <tr className="border-y border-surface-soft text-xs text-ink-subtle">
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
                      "cursor-pointer border-b border-surface-soft hover:bg-surface",
                      detail?.id === r.id && "bg-surface",
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
                            ? "bg-ink text-white"
                            : r.statut === "En attente"
                              ? "bg-surface-soft text-ink-body"
                              : "border border-line text-ink-muted",
                        )}
                      >
                        {r.statut}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-xs font-medium text-ink">{bien?.nom}</p>
                      <p className="text-[11px] text-ink-muted">{bien?.adresse}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-ink">{r.occupant}</td>
                    <td className="px-3 py-3">
                      <p className="text-xs text-ink">{formatDateLongue(r.arrivee)}</p>
                      <p className="text-[11px] text-ink-muted">00:00</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex h-[22px] items-center rounded bg-ink px-2 text-[11px] text-white">
                        {CODE_PLATEFORME[r.plateforme]}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-ink-body">
                        <Users className="size-2.5" />
                        {r.voyageurs}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs font-medium text-ink">
                      {formatMontant(r.montant)}
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-ink-body">
                        <span
                          className={cn(
                            "size-2 rounded-full",
                            pct === 100 && "bg-ink-subtle",
                            pct > 0 && pct < 100 && "border border-ink-subtle bg-[linear-gradient(90deg,var(--ink-subtle)_50%,transparent_50%)]",
                            pct === 0 && "border border-ink-muted",
                          )}
                        />
                        {pct}%
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <ChevronRight className="size-3.5 text-ink-muted" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollHint>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
          <p className="text-xs text-ink-muted">Affichage de {filtrees.length} réservations</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pageCourante <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-[30px] rounded border border-line px-3 text-xs text-ink-body disabled:opacity-40"
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
                  n === pageCourante ? "bg-ink text-white" : "text-ink-body",
                )}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              disabled={pageCourante >= pages}
              onClick={() => setPage((p) => p + 1)}
              className="h-[30px] rounded border border-line px-3 text-xs text-ink-body disabled:opacity-40"
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
  className,
}: {
  icone: typeof Clock;
  label: string;
  compte: number;
  actif: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-11 min-h-11 w-full items-center gap-2 rounded-[8px] px-3 text-sm md:h-[35px] md:min-h-[35px] md:text-xs",
        actif ? "bg-surface-soft text-ink" : "text-ink-body hover:bg-surface",
        className,
      )}
    >
      <Icone className="size-3.5" />
      <span className="flex-1 text-left">{label}</span>
      <span className="rounded bg-white px-1.5 py-0.5 text-[11px] text-ink-subtle">{compte}</span>
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
    <aside className="fixed inset-y-0 right-0 z-30 flex w-full max-w-[400px] flex-col border-l border-line bg-white shadow-xl">
      <header className="flex items-center justify-between border-b border-surface-soft px-5 py-4">
        <p className="text-sm text-ink">Détail réservation</p>
        <button type="button" onClick={onFermer} aria-label="Fermer">
          <X className="size-4 text-ink-muted" />
        </button>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
        <div className="flex gap-2">
          <span
            className={cn(
              "inline-flex h-6 items-center rounded px-2.5 text-xs",
              reservation.statut === "Confirmé"
                ? "bg-ink text-white"
                : "bg-surface-soft text-ink-body",
            )}
          >
            {reservation.statut}
          </span>
          <span className="inline-flex h-[19px] items-center rounded bg-ink px-2 text-[11px] text-white">
            {CODE_PLATEFORME[reservation.plateforme]}
          </span>
        </div>
        <div className="rounded-card border border-surface-soft p-3">
          <p className="text-xs text-ink-muted">Logement</p>
          <p className="mt-1 text-sm text-ink">{bien?.nom}</p>
          <p className="text-xs text-ink-subtle">{bien?.adresse}</p>
        </div>
        <div className="rounded-card border border-surface-soft p-3">
          <p className="text-xs text-ink-muted">Occupant</p>
          <p className="mt-1 text-sm text-ink">{reservation.occupant}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-card border border-surface-soft p-3">
            <p className="text-xs text-ink-muted">Check-in</p>
            <p className="mt-1 text-xs text-ink">{formatDateLongue(reservation.arrivee)}</p>
          </div>
          <div className="rounded-card border border-surface-soft p-3">
            <p className="text-xs text-ink-muted">Check-out</p>
            <p className="mt-1 text-xs text-ink">{formatDateLongue(reservation.depart)}</p>
          </div>
        </div>
        <div className="flex gap-6 rounded-card border border-surface-soft p-3 text-xs">
          <div>
            <p className="text-ink-muted">Adultes</p>
            <p className="mt-1 text-ink">{reservation.adultes}</p>
          </div>
          <div>
            <p className="text-ink-muted">Enfants</p>
            <p className="mt-1 text-ink">{reservation.enfants}</p>
          </div>
          <div>
            <p className="text-ink-muted">Nuits</p>
            <p className="mt-1 text-ink">{nuits}</p>
          </div>
        </div>
        <div className="rounded-card border border-surface-soft p-3">
          <p className="text-xs text-ink-muted">Paiement</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-sm text-ink">{formatMontant(reservation.montant)}</span>
            <span className="text-xs text-ink-subtle">{pct}% réglé</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-soft">
            <div className="h-full rounded-full bg-ink" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs text-ink-subtle">
            <span>Réglé : {formatMontant(reservation.paye)}</span>
            <span>Reste : {formatMontant(reservation.montant - reservation.paye)}</span>
          </div>
        </div>
      </div>
      <footer className="flex gap-2 border-t border-surface-soft px-5 py-4">
        <Link
          to="/reservations/nouveau"
          className="flex h-[34px] flex-1 items-center justify-center rounded-card border border-line text-sm font-medium text-ink-body"
        >
          Modifier
        </Link>
        <button
          type="button"
          className="h-[34px] flex-1 rounded-card bg-ink text-sm font-medium text-white"
        >
          Générer facture
        </button>
      </footer>
    </aside>
  );
}
