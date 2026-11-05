import { Link } from "@tanstack/react-router";
import { useDroit } from "@/auth/auth-context";
import { ScrollHint } from "@/components/layout/ScrollHint";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  ChevronRight,
  Clock,
  Download,
  History,
  Home,
  KeyRound,
  LogIn,
  LogOut,
  Search,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  AUJOURD_HUI_MO1,
  CODE_PLATEFORME,
  formatDateLongue,
  formatMontant,
  libelleStatutReservation,
  nuitsEntre,
  pourcentagePaiement,
  type ReservationMo1,
  type StatutReservationMo1,
} from "@/data/reservations-mo1";
import {
  annulerReservation,
  enregistrerEncaissement,
  useSession,
  useStatutSync,
} from "@/data/session";
import { methodeParDefaut } from "@/data/v1-metier";
import {
  comptesReservations,
  filtrerReservations,
  paginerReservations,
  sejourAvecCle,
  TAILLE_PAGE_RESERVATIONS,
  trierReservations,
  type ColonneTri,
  type FiltrePeriode,
  type SensTri,
} from "@/components/reservations/tableau-vue";
import { confirmer, telechargerDemo, toastErreur, toastOk } from "@/lib/feedback";
import { telechargerFactureReservation } from "@/lib/exports-docs";
import { cn } from "@/lib/utils";

const MOIS_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

function libelleMois(mois: string) {
  const [annee, m] = mois.split("-");
  const nom = MOIS_FR[Number(m) - 1] ?? mois;
  return `${nom.charAt(0).toUpperCase()}${nom.slice(1)} ${annee}`;
}

function moisDisponibles(reservations: { arrivee: string }[]) {
  return [...new Set(reservations.map((r) => r.arrivee.slice(0, 7)))].sort();
}

export function TableauReservations({
  focusId,
  onSelectReservation,
}: {
  focusId?: string;
  onSelectReservation?: (id: string | null) => void;
}) {
  const session = useSession();
  const sync = useStatutSync();
  const reservations = session.reservationsDossier;
  const attendHydrate =
    reservations.length === 0 && sync.etat !== "enregistre" && sync.etat !== "echec";
  const bienParId = (id: string) => session.biens.find((b) => b.id === id);
  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState<"tout" | StatutReservationMo1>("tout");
  const [periode, setPeriode] = useState<FiltrePeriode>("tous");
  const [mois, setMois] = useState("tous");
  const [tri, setTri] = useState<{ colonne: ColonneTri; sens: SensTri } | null>(null);
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<ReservationMo1 | null>(null);
  const [selection, setSelection] = useState<string[]>([]);
  const detailLive = useMemo(
    () => (detail ? (reservations.find((r) => r.id === detail.id) ?? null) : null),
    [detail, reservations],
  );

  useEffect(() => {
    if (!focusId) return;
    setRecherche("");
    const cible = reservations.find((x) => x.id === focusId);
    setStatut(cible?.statut === "Annulé" ? "Annulé" : "tout");
    setPeriode("tous");
  }, [focusId]);

  useEffect(() => {
    if (!focusId) return;
    const index = reservations.findIndex((x) => x.id === focusId);
    if (index < 0) return;
    const r = reservations[index]!;
    setDetail((actuel) => (actuel?.id === r.id ? actuel : r));
    setPage(Math.floor(index / TAILLE_PAGE_RESERVATIONS) + 1);
    onSelectReservation?.(r.id);
  }, [focusId, reservations, onSelectReservation]);

  const ouvrir = (r: ReservationMo1) => {
    setDetail(r);
    onSelectReservation?.(r.id);
  };

  const biens = session.biens;
  const filtrees = useMemo(() => {
    const nomBien = (id: string) => biens.find((b) => b.id === id)?.nom ?? "";
    return filtrerReservations(reservations, {
      recherche,
      statut,
      periode,
      mois,
      aujourdHui: AUJOURD_HUI_MO1,
      nomBien,
    });
  }, [recherche, statut, periode, mois, reservations, biens]);
  const triees = useMemo(() => {
    const nomBien = (id: string) => biens.find((b) => b.id === id)?.nom ?? "";
    return trierReservations(filtrees, tri, nomBien);
  }, [filtrees, tri, biens]);
  const comptes = useMemo(() => comptesReservations(reservations, AUJOURD_HUI_MO1), [reservations]);

  const { page: pageCourante, pages, visibles } = paginerReservations(triees, page);

  const basculerTri = (colonne: ColonneTri) => {
    setTri((actuel) => {
      if (actuel?.colonne !== colonne) return { colonne, sens: "asc" };
      if (actuel.sens === "asc") return { colonne, sens: "desc" };
      return null;
    });
    setPage(1);
  };
  const idsVisibles = visibles.map((r) => r.id);
  const toutSelectionne =
    idsVisibles.length > 0 && idsVisibles.every((id) => selection.includes(id));
  const aExporter =
    selection.length > 0 ? filtrees.filter((r) => selection.includes(r.id)) : filtrees;

  const basculerSelection = (id: string) => {
    setSelection((liste) => (liste.includes(id) ? liste.filter((x) => x !== id) : [...liste, id]));
  };

  return (
    <div className="flex min-h-0 flex-col gap-0 md:min-h-[640px] md:flex-row">
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

      <div className="@container min-w-0 flex-1">
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
          <div role="group" aria-label="Tri" className="flex gap-1">
            <button
              type="button"
              aria-pressed={tri?.colonne === "propriete"}
              onClick={() => basculerTri("propriete")}
              className="inline-flex h-11 items-center rounded-card border border-line px-3 text-xs text-ink md:h-[34px]"
            >
              Propriété
            </button>
            <button
              type="button"
              aria-pressed={tri?.colonne === "arrivee"}
              onClick={() => basculerTri("arrivee")}
              className="inline-flex h-11 items-center rounded-card border border-line px-3 text-xs text-ink md:h-[34px]"
            >
              Arrivée
            </button>
          </div>
          <div className="grid w-full grid-cols-2 gap-1 rounded-full border border-line p-1 md:flex md:w-auto md:gap-0">
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
                aria-pressed={statut === id}
                className={cn(
                  "h-11 min-h-11 rounded-full px-3 text-sm font-medium md:h-7 md:min-h-7 md:text-xs",
                  statut === id ? "bg-ink text-white" : "text-ink-body",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
          <label className="inline-flex h-11 items-center gap-1 rounded-card border border-line px-2 text-xs font-medium text-ink-body md:h-[34px]">
            <Calendar className="size-3.5" />
            <select
              aria-label="Mois"
              value={mois}
              onChange={(e) => {
                setMois(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs outline-none"
            >
              <option value="tous">Tous les mois</option>
              {moisDisponibles(reservations).map((m) => (
                <option key={m} value={m}>
                  {libelleMois(m)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              const lignes = [
                "Occupant;Bien;Arrivee;Depart;Statut;Montant",
                ...aExporter.map((r) => {
                  const bien = bienParId(r.bienId);
                  return `${r.occupant};${bien?.nom ?? r.bienId};${r.arrivee};${r.depart};${r.statut};${r.montant}`;
                }),
              ];
              telechargerDemo("reservations-hublify.csv", lignes.join("\n"));
            }}
            className="inline-flex h-11 items-center gap-1 rounded border border-line px-3 text-xs font-medium text-ink-body md:h-[30px]"
          >
            <Download className="size-3" />
            {selection.length > 0 ? `Exporter (${selection.length})` : "Exporter"}
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

        <div className="divide-y divide-surface-soft @min-[900px]:hidden">
          {visibles.map((r) => {
            const bien = bienParId(r.bienId);
            const pct = pourcentagePaiement(r);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => ouvrir(r)}
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
                    {libelleStatutReservation(r.statut)}
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

        <ScrollHint className="hidden @min-[900px]:block">
          <table className="w-full min-w-[880px] text-left">
            <thead>
              <tr className="border-y border-surface-soft text-xs text-ink-subtle">
                <th className="w-10 px-3 py-3 font-normal">
                  <label className="flex min-h-11 items-center md:min-h-0">
                    <input
                      type="checkbox"
                      aria-label="Tout sélectionner"
                      className="size-3.5"
                      checked={toutSelectionne}
                      onChange={() => {
                        setSelection((liste) =>
                          toutSelectionne
                            ? liste.filter((id) => !idsVisibles.includes(id))
                            : [...new Set([...liste, ...idsVisibles])],
                        );
                      }}
                    />
                  </label>
                </th>
                <EnteteTri label="Statut" colonne="statut" tri={tri} onTri={basculerTri} />
                <EnteteTri label="Propriété" colonne="propriete" tri={tri} onTri={basculerTri} />
                <th className="px-3 py-3 font-normal">Occupant</th>
                <EnteteTri label="Arrivée" colonne="arrivee" tri={tri} onTri={basculerTri} />
                <th className="px-3 py-3 font-normal tracking-[0.3px]">TYPE</th>
                <th className="px-3 py-3 font-normal">Voyageurs</th>
                <th className="px-3 py-3 font-normal">Montant</th>
                <EnteteTri label="Paiement" colonne="paiement" tri={tri} onTri={basculerTri} />
                <th className="w-10 px-3 py-3 font-normal">
                  <span className="sr-only">Ouvrir</span>
                </th>
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
                    onClick={() => ouvrir(r)}
                  >
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <label className="flex min-h-11 items-center md:min-h-0">
                        <input
                          type="checkbox"
                          aria-label={r.occupant}
                          className="size-3.5"
                          checked={selection.includes(r.id)}
                          onChange={() => basculerSelection(r.id)}
                        />
                      </label>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-2">
                        {sejourAvecCle(r.type) ? (
                          <KeyRound className="size-3.5 shrink-0 text-ink" aria-hidden />
                        ) : (
                          <Home className="size-3.5 shrink-0 text-ink" aria-hidden />
                        )}
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
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-xs font-medium text-ink">{bien?.nom}</p>
                      <p className="text-[11px] text-ink-muted">{bien?.adresse}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-ink">{r.occupant}</td>
                    <td className="px-3 py-3">
                      <p className="text-xs text-ink">{formatDateLongue(r.arrivee)}</p>
                      <p className="text-[11px] text-ink-muted">{r.heureArrivee || "00:00"}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "inline-flex h-[22px] items-center rounded px-2 text-[11px] font-medium",
                          r.plateforme === "Airbnb"
                            ? "bg-ink text-white"
                            : "bg-surface-soft text-ink-body",
                        )}
                      >
                        {CODE_PLATEFORME[r.plateforme] ?? r.plateforme}
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
                            pct > 0 &&
                              pct < 100 &&
                              "border border-ink-subtle bg-[linear-gradient(90deg,var(--ink-subtle)_50%,transparent_50%)]",
                            pct === 0 && "border border-ink-muted",
                          )}
                        />
                        {pct}%
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <ChevronRight className="size-3.5 text-ink-muted" aria-hidden />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollHint>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
          <p role="status" className="text-xs text-ink-muted">
            {tri
              ? `Tri ${tri.colonne === "propriete" ? "Propriété" : tri.colonne === "arrivee" ? "Arrivée" : tri.colonne} ${tri.sens === "asc" ? "croissant" : "décroissant"}`
              : "Sans tri"}
            {" · "}
            Page {pageCourante} sur {pages}
          </p>
          <p className="text-xs text-ink-muted">
            {attendHydrate
              ? "Chargement des réservations…"
              : `Affichage de ${filtrees.length} réservation${filtrees.length > 1 ? "s" : ""}`}
          </p>
          <nav aria-label="Pagination" className="flex items-center gap-1">
            <button
              type="button"
              disabled={pageCourante <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-11 rounded border border-line px-3 text-xs text-ink-body disabled:opacity-40 md:h-[30px]"
            >
              Précédent
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                aria-current={n === pageCourante ? "page" : undefined}
                aria-label={`Page ${n}`}
                onClick={() => setPage(n)}
                className={cn(
                  "size-11 rounded text-xs md:size-7",
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
              className="h-11 rounded border border-line px-3 text-xs text-ink-body disabled:opacity-40 md:h-[30px]"
            >
              Suivant
            </button>
          </nav>
        </div>
      </div>

      {detailLive && !onSelectReservation && (
        <PanneauDetail reservation={detailLive} onFermer={() => setDetail(null)} />
      )}
    </div>
  );
}

function EnteteTri({
  label,
  colonne,
  tri,
  onTri,
}: {
  label: string;
  colonne: ColonneTri;
  tri: { colonne: ColonneTri; sens: SensTri } | null;
  onTri: (colonne: ColonneTri) => void;
}) {
  const actif = tri?.colonne === colonne;
  return (
    <th
      className="px-3 py-3 font-normal"
      aria-sort={actif ? (tri.sens === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onTri(colonne)}
        className="inline-flex items-center gap-1 text-xs text-ink-subtle"
      >
        {label}
        <span className="inline-flex flex-col leading-none" aria-hidden>
          <ArrowUp
            className={cn("size-2.5", actif && tri.sens === "asc" ? "text-ink" : "text-ink-muted")}
          />
          <ArrowDown
            className={cn(
              "-mt-1 size-2.5",
              actif && tri.sens === "desc" ? "text-ink" : "text-ink-muted",
            )}
          />
        </span>
      </button>
    </th>
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
      aria-pressed={actif}
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

function enregistrerPaiement(reservation: ReservationMo1, brut: number) {
  const paye = Math.max(0, Math.min(reservation.montant, Math.round(brut)));
  enregistrerEncaissement(reservation.id, paye, {
    methode: methodeParDefaut(reservation.plateforme),
    ajoutePar: "Gestionnaire",
  });
  toastOk(
    paye >= reservation.montant
      ? "Réservation soldée."
      : `Paiement enregistré : ${formatMontant(paye)}.`,
  );
}

function PanneauDetail({
  reservation,
  onFermer,
}: {
  reservation: ReservationMo1;
  onFermer: () => void;
}) {
  const session = useSession();
  const peutMod = useDroit("mod-reservations");
  const bien = session.biens.find((b) => b.id === reservation.bienId);
  const pct = pourcentagePaiement(reservation);
  const nuits = nuitsEntre(reservation.arrivee, reservation.depart);
  const [saisiePaye, setSaisiePaye] = useState(String(reservation.paye));
  const [confirmer, setConfirmer] = useState(false);

  useEffect(() => {
    setSaisiePaye(String(reservation.paye));
  }, [reservation.id, reservation.paye]);

  return (
    <aside className="fixed inset-y-0 right-0 z-30 flex w-full max-w-[400px] flex-col border-l border-line bg-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] shadow-xl">
      <header className="flex items-center justify-between border-b border-surface-soft px-5 py-4">
        <p className="text-sm text-ink">Détail réservation</p>
        <button
          type="button"
          onClick={onFermer}
          aria-label="Fermer"
          className="flex size-11 items-center justify-center md:size-8"
        >
          <X className="size-4 text-ink-muted" />
        </button>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
        <div className="flex flex-wrap gap-2">
          <span
            className={cn(
              "inline-flex h-6 items-center rounded px-2.5 text-xs",
              reservation.statut === "Confirmé"
                ? "bg-ink text-white"
                : reservation.statut === "Annulé"
                  ? "border border-line text-ink-muted"
                  : "bg-surface-soft text-ink-body",
            )}
          >
            {libelleStatutReservation(reservation.statut)}
          </span>
          {reservation.type && (
            <span className="inline-flex h-6 items-center rounded border border-line px-2 text-[11px] text-ink-body">
              {reservation.type}
            </span>
          )}
          <span className="inline-flex h-6 items-center rounded bg-ink px-2 text-[11px] text-white">
            {CODE_PLATEFORME[reservation.plateforme] ?? reservation.plateforme}
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
          <a
            href={`mailto:${reservation.email}`}
            className="mt-1 block text-xs text-accent-teal underline-offset-2 hover:underline"
          >
            {reservation.email}
          </a>
          <a
            href={`tel:${reservation.telephone.replace(/\s+/g, "")}`}
            className="mt-0.5 block text-xs text-accent-teal underline-offset-2 hover:underline"
          >
            {reservation.telephone}
          </a>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-card border border-surface-soft p-3">
            <p className="text-xs text-ink-muted">Check-in</p>
            <p className="mt-1 text-xs text-ink">{formatDateLongue(reservation.arrivee)}</p>
            <p className="text-[11px] text-ink-muted">{reservation.heureArrivee}</p>
          </div>
          <div className="rounded-card border border-surface-soft p-3">
            <p className="text-xs text-ink-muted">Check-out</p>
            <p className="mt-1 text-xs text-ink">{formatDateLongue(reservation.depart)}</p>
            <p className="text-[11px] text-ink-muted">{reservation.heureDepart}</p>
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
          {peutMod && reservation.statut !== "Annulé" && (
            <div className="mt-3 space-y-2">
              <label className="block text-xs text-ink-muted">
                Montant encaissé
                <input
                  value={saisiePaye}
                  onChange={(e) => setSaisiePaye(e.target.value)}
                  inputMode="decimal"
                  className="mt-1 h-11 w-full rounded-card border border-line px-3 text-sm text-ink outline-none md:h-9"
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
                    enregistrerPaiement(reservation, n);
                  }}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-card border border-line px-3 text-xs font-medium text-ink-body md:h-9"
                >
                  Enregistrer
                </button>
                {pct < 100 && (
                  <button
                    type="button"
                    onClick={() => enregistrerPaiement(reservation, reservation.montant)}
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-card bg-ink px-3 text-xs font-medium text-white md:h-9"
                  >
                    Marquer soldé
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <footer className="flex flex-col gap-2 border-t border-surface-soft px-5 py-4 sm:flex-row sm:flex-wrap">
        {peutMod && (
          <Link
            to="/reservations/nouveau"
            search={{ id: reservation.id }}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-card border border-ink bg-accent-teal px-3 text-sm font-medium text-white md:h-[34px]"
          >
            Modifier
          </Link>
        )}
        <button
          type="button"
          onClick={() => void telechargerFactureReservation(reservation, bien?.nom)}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-card bg-accent-teal px-3 text-sm font-medium text-white md:h-[34px]"
        >
          Télécharger la facture
        </button>
        {session.parametrage.afficherEdl && (
          <Link
            to="/outils/etats-des-lieux"
            className="inline-flex h-11 flex-1 items-center justify-center rounded-card border border-line px-3 text-sm font-medium text-ink-body md:h-[34px]"
          >
            État des lieux
          </Link>
        )}
        {session.parametrage.afficherFichesAcces && (
          <Link
            to="/documents"
            search={{ vue: "fiches" }}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-card border border-line px-3 text-sm font-medium text-ink-body md:h-[34px]"
          >
            Fiche d'accès
          </Link>
        )}
        {peutMod && reservation.statut !== "Annulé" && (
          <button
            type="button"
            onClick={() => setConfirmer(true)}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-card border border-line px-3 text-sm font-medium text-ink-body md:h-[34px]"
          >
            Supprimer
          </button>
        )}
      </footer>
      <Dialog open={confirmer} onOpenChange={(o) => !o && setConfirmer(false)}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Supprimer cette réservation ?</DialogTitle>
          <DialogDescription>
            {reservation.occupant} disparaît du planning et de la liste. Vous la retrouverez
            uniquement dans Annulé.
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
                onFermer();
                toastOk("Réservation supprimée.");
              }}
              className="h-9 rounded-card bg-accent-teal px-3 text-xs font-medium text-white"
            >
              Supprimer
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
