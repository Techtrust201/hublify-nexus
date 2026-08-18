import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Home, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { ScrollHint } from "@/components/layout/ScrollHint";
import { InfosOccupants } from "@/components/reservations/InfosOccupants";
import { FiltreOnglet } from "@/components/reservations/KpiEtAccordeons";
import {
  ANCRE_PLANNING_MO1,
  AUJOURD_HUI_MO1,
  BIENS_MO1,
  CODE_BARRE,
  ajouterJours,
  isoJour,
  paiementDe,
  reservationCouvre,
  type BienMo1,
  type PaiementMo1,
  type PlateformeMo1,
  type ReservationMo1,
} from "@/data/reservations-mo1";
import { modifierSession, useSession } from "@/data/session";
import { cn } from "@/lib/utils";

const JOURS_MOIS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

type VuePlanning = "3jours" | "5jours" | "mois";
type FiltrePlateforme = "tout" | PlateformeMo1;

export function PlanningReservations({
  onVoirListe,
}: {
  onVoirListe?: () => void;
}) {
  const navigate = useNavigate();
  const session = useSession();
  const [vue, setVue] = useState<VuePlanning>("3jours");
  const [ancre, setAncre] = useState(() => new Date(ANCRE_PLANNING_MO1));
  const [plateforme, setPlateforme] = useState<FiltrePlateforme>("tout");
  const [sectionOuverte, setSectionOuverte] = useState(false);
  const [bienLocalise, setBienLocalise] = useState<string | null>(null);
  const [selection, setSelection] = useState<ReservationMo1 | null>(null);
  const datesBloquees = session.datesBloquees;
  const setDatesBloquees = (
    next: typeof datesBloquees | ((prev: typeof datesBloquees) => typeof datesBloquees),
  ) => {
    const resolu = typeof next === "function" ? next(datesBloquees) : next;
    modifierSession((e) => ({ ...e, datesBloquees: resolu }));
  };
  const [voirBloquees, setVoirBloquees] = useState(true);

  const nbJours = vue === "3jours" ? 3 : vue === "5jours" ? 5 : 0;
  const jours = useMemo(
    () => (nbJours ? Array.from({ length: nbJours }, (_, i) => ajouterJours(ancre, i)) : []),
    [ancre, nbJours],
  );

  const joursMois = useMemo(() => {
    const debut = new Date(ancre.getFullYear(), ancre.getMonth(), 1);
    const decalage = (debut.getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, i) => ajouterJours(ajouterJours(debut, -decalage), i));
  }, [ancre]);

  const reservations = useMemo(() => {
    const source = session.reservationsDossier;
    if (plateforme === "tout") return source;
    return source.filter((r) => r.plateforme === plateforme);
  }, [plateforme, session.reservationsDossier]);

  const biens = useMemo(() => {
    if (!bienLocalise) return BIENS_MO1;
    return BIENS_MO1.filter((b) => b.id === bienLocalise);
  }, [bienLocalise]);

  const visiblePlanning = useMemo(() => {
    const cles = new Set(
      (vue === "mois" ? joursMois : jours).map((d) => isoJour(d)),
    );
    return reservations.filter((r) => [...cles].some((j) => reservationCouvre(r, j)));
  }, [reservations, jours, joursMois, vue]);

  const totalVisible = visiblePlanning.reduce((s, r) => s + r.montant, 0);

  const allerOnglet = (id: "missions" | "reservations" | "tarifs") => {
    if (id === "missions") navigate({ to: "/missions" });
    if (id === "tarifs") navigate({ to: "/tarifs" });
  };

  const bloquerJour = (bienId: string, date: string) => {
    setDatesBloquees((liste) => {
      const existe = liste.find((d) => d.bienId === bienId && d.date === date);
      if (existe) return liste.filter((d) => d.id !== existe.id);
      return [...liste, { id: `blk-${bienId}-${date}`, bienId, date, motif: "Bloqué" }];
    });
    setVoirBloquees(true);
  };

  return (
    <div className="overflow-hidden rounded-card border border-line bg-white">
      <div className="flex items-center border-b border-line px-4">
        {(
          [
            ["missions", "Missions"],
            ["reservations", "Réservations"],
            ["tarifs", "Tarifs"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => allerOnglet(id)}
            className={cn(
              "h-[46px] border-b-2 px-4 text-sm font-medium capitalize",
              id === "reservations"
                ? "border-ink text-ink-deep"
                : "border-transparent text-ink-subtle",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="border-b border-surface-soft px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            className="flex items-center gap-2 text-xs text-ink-body"
            onClick={() => setSectionOuverte((v) => !v)}
          >
            <Home className="size-3.5" />
            <span>Logements & plateformes</span>
            <span className="text-ink-muted">(4 biens)</span>
          </button>
          <div className="flex items-center gap-2">
            <Link
              to="/patrimoines"
              className="inline-flex h-[26px] items-center gap-1 rounded border border-line-strong bg-white px-2.5 text-xs font-medium text-ink-body"
            >
              <Home className="size-2.5" />
              Voir tous mes biens
            </Link>
            <button
              type="button"
              aria-label={sectionOuverte ? "Replier" : "Déplier"}
              onClick={() => setSectionOuverte((v) => !v)}
            >
              {sectionOuverte ? (
                <ChevronUp className="size-3.5 text-ink-muted" />
              ) : (
                <ChevronDown className="size-3.5 text-ink-muted" />
              )}
            </button>
          </div>
        </div>
        {sectionOuverte && <TableauLogements onLocaliser={setBienLocalise} actif={bienLocalise} />}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-surface-soft bg-surface/50 px-4 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Précédent"
            className="flex size-11 items-center justify-center rounded border border-line text-ink-body"
            onClick={() =>
              setAncre((d) =>
                vue === "mois" ? new Date(d.getFullYear(), d.getMonth() - 1, 1) : ajouterJours(d, -nbJours),
              )
            }
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <span className="min-w-24 text-center text-xs capitalize text-ink-body">
            {ancre.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
          </span>
          <button
            type="button"
            aria-label="Suivant"
            className="flex size-11 items-center justify-center rounded border border-line text-ink-body"
            onClick={() =>
              setAncre((d) =>
                vue === "mois" ? new Date(d.getFullYear(), d.getMonth() + 1, 1) : ajouterJours(d, nbJours),
              )
            }
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>

        <div className="flex overflow-hidden rounded border border-line">
          {(
            [
              ["3jours", "3 jours"],
              ["5jours", "5 jours"],
              ["mois", "Mois"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setVue(id)}
              className={cn(
                "h-11 min-h-11 border-r border-line px-3 text-xs font-medium last:border-r-0",
                vue === id ? "bg-ink text-white" : "bg-white text-ink-body",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="hidden h-4 w-px bg-line sm:block" />

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-ink-muted">Plateforme :</span>
          {(
            [
              ["tout", "Tout"],
              ["Airbnb", "Airbnb"],
              ["Booking.com", "Booking.com"],
              ["Direct", "Direct"],
              ["Autre", "Autre"],
            ] as const
          ).map(([id, label]) => (
            <FiltreOnglet key={id} actif={plateforme === id} onClick={() => setPlateforme(id)}>
              {label}
            </FiltreOnglet>
          ))}
        </div>

        <button
          type="button"
          onClick={onVoirListe}
          className="ml-auto text-xs text-ink-muted"
        >
          {visiblePlanning.length} rés. ·{" "}
          <span className="text-ink-body">{totalVisible.toLocaleString("fr-FR")} €</span>
        </button>
      </div>

      {vue === "mois" ? (
        <GrilleMois
          jours={joursMois}
          ancre={ancre}
          reservations={reservations}
          onSelect={setSelection}
        />
      ) : (
        <GrilleJours
          biens={biens}
          jours={jours}
          reservations={reservations}
          datesBloquees={voirBloquees ? datesBloquees : []}
          onSelect={setSelection}
          onBloquer={bloquerJour}
        />
      )}

      {selection && (
        <InfosOccupants
          reservation={selection}
          onFermer={() => setSelection(null)}
          onModifier={() => {
            setSelection(null);
            navigate({ to: "/reservations/nouveau" });
          }}
        />
      )}
    </div>
  );
}

function TableauLogements({
  onLocaliser,
  actif,
}: {
  onLocaliser: (id: string | null) => void;
  actif: string | null;
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-card border border-line">
      <ScrollHint>
      <div className="grid min-w-[520px] grid-cols-[1fr_80px_80px_80px_80px] border-b border-surface-soft bg-surface px-4 py-1.5 text-[11px] text-ink-muted">
        <span>Bien</span>
        <span className="text-center">Airbnb</span>
        <span className="text-center">Booking.com</span>
        <span className="text-center">Direct</span>
        <span />
      </div>
      {BIENS_MO1.map((b) => (
        <div
          key={b.id}
          className={cn(
            "grid min-w-[520px] grid-cols-[1fr_80px_80px_80px_80px] items-center border-b border-surface-soft px-4 py-2.5 last:border-b-0",
            actif === b.id && "bg-surface",
          )}
        >
          <span className="flex items-center gap-2 text-xs text-ink-body">
            <span className="flex size-6 items-center justify-center rounded border border-line bg-surface-soft">
              <Home className="size-2.5" />
            </span>
            {b.nom}
          </span>
          <StatutPlateforme etat={b.plateformes.Airbnb} />
          <StatutPlateforme etat={b.plateformes["Booking.com"]} />
          <StatutPlateforme etat={b.plateformes.Direct} />
          <button
            type="button"
            onClick={() => onLocaliser(actif === b.id ? null : b.id)}
            className="justify-self-center rounded border border-line-strong px-2 py-0.5 text-[11px] text-ink-body"
          >
            Localiser
          </button>
        </div>
      ))}
      <div className="flex flex-wrap gap-4 px-4 py-2 text-[11px] text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-ink" /> Actif sur la plateforme
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full border border-ink-muted" /> Inactif
        </span>
        <span className="flex items-center gap-1.5">— Non référencé</span>
      </div>
      </ScrollHint>
    </div>
  );
}

function StatutPlateforme({ etat }: { etat: "actif" | "inactif" | "aucun" }) {
  if (etat === "aucun") {
    return <span className="text-center text-xs text-ink-muted">—</span>;
  }
  return (
    <span
      className={cn(
        "justify-self-center rounded px-2 py-0.5 text-[11px]",
        etat === "actif" ? "bg-ink text-white" : "border border-line text-ink-muted",
      )}
    >
      {etat === "actif" ? "Actif" : "Inactif"}
    </span>
  );
}

function GrilleJours({
  biens,
  jours,
  reservations,
  datesBloquees,
  onSelect,
  onBloquer,
}: {
  biens: BienMo1[];
  jours: Date[];
  reservations: ReservationMo1[];
  datesBloquees: { id: string; bienId: string; date: string }[];
  onSelect: (r: ReservationMo1) => void;
  onBloquer: (bienId: string, date: string) => void;
}) {
  return (
    <ScrollHint snap>
      <div
        className="grid min-w-[720px]"
        style={{ gridTemplateColumns: `130px repeat(${jours.length}, minmax(180px, 1fr))` }}
      >
        <div className="sticky left-0 z-sticky border-b border-r border-line bg-white" />
        {jours.map((d) => {
          const key = isoJour(d);
          const auj = key === AUJOURD_HUI_MO1;
          return (
            <div
              key={key}
              className={cn(
                "snap-start border-b border-r border-surface-soft py-2 text-center",
                auj && "bg-surface",
              )}
            >
              <p className="text-xs uppercase text-ink-muted">
                {d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "")}
              </p>
              <p className={cn("text-sm text-ink-body", auj && "font-semibold text-ink")}>
                {d.getDate()}
              </p>
            </div>
          );
        })}

        {biens.map((bien) => (
          <LigneBien
            key={bien.id}
            bien={bien}
            jours={jours}
            sejours={reservations.filter((r) => r.bienId === bien.id)}
            bloquees={datesBloquees.filter((d) => d.bienId === bien.id)}
            onSelect={onSelect}
            onBloquer={onBloquer}
          />
        ))}
      </div>
      <LegendePlanning bloque />
    </ScrollHint>
  );
}

function LigneBien({
  bien,
  jours,
  sejours,
  bloquees,
  onSelect,
  onBloquer,
}: {
  bien: BienMo1;
  jours: Date[];
  sejours: ReservationMo1[];
  bloquees: { id: string; date: string }[];
  onSelect: (r: ReservationMo1) => void;
  onBloquer: (bienId: string, date: string) => void;
}) {
  return (
    <div className="contents">
      <div className="sticky left-0 z-sticky border-b border-r border-line bg-white px-3 py-3 text-xs text-ink-body">
        {bien.nom}
      </div>
      <div
        className="relative grid border-b border-surface-soft"
        style={{
          gridColumn: `2 / span ${jours.length}`,
          gridTemplateColumns: `repeat(${jours.length}, minmax(0, 1fr))`,
        }}
      >
        {jours.map((d) => {
          const key = isoJour(d);
          const occupe = sejours.some((r) => reservationCouvre(r, key));
          const bloquee = bloquees.some((b) => b.date === key);
          return (
            <div
              key={key}
              className={cn(
                "relative min-h-[59px] border-r border-surface-soft",
                key === AUJOURD_HUI_MO1 && "bg-surface/50",
                bloquee && "bg-[repeating-linear-gradient(-45deg,var(--surface-soft),var(--surface-soft)_4px,var(--surface-elevated)_4px,var(--surface-elevated)_8px)]",
              )}
            >
              {!occupe && !bloquee && (
                <div className="flex h-full items-center justify-center">
                  <button
                    type="button"
                    className="flex size-5 items-center justify-center rounded-full border border-line-strong text-ink-muted"
                    aria-label={`Ajouter ou bloquer — ${bien.nom}`}
                    onClick={() => onBloquer(bien.id, key)}
                  >
                    <Plus className="size-2.5" />
                  </button>
                </div>
              )}
              {bloquee && !occupe && (
                <button
                  type="button"
                  onClick={() => onBloquer(bien.id, key)}
                  className="flex h-full w-full items-center justify-center text-[10px] font-medium text-ink-muted"
                >
                  Bloqué
                </button>
              )}
            </div>
          );
        })}

        {sejours.map((r) => {
          const start = jours.findIndex((d) => reservationCouvre(r, isoJour(d)));
          if (start < 0) return null;
          let span = 0;
          for (let i = start; i < jours.length; i++) {
            if (!reservationCouvre(r, isoJour(jours[i]!))) break;
            span += 1;
          }
          const paiement = paiementDe(r);
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect(r)}
              className="absolute top-1.5 z-10 flex h-[47px] items-center gap-1.5 rounded-lg border-2 px-2.5"
              style={{
                left: `calc(${(start / jours.length) * 100}% + 2px)`,
                width: `calc(${(span / jours.length) * 100}% - 4px)`,
                backgroundColor: r.couleur,
                borderColor: paiement === "impaye" ? "var(--line-strong)" : "var(--ink-subtle)",
              }}
            >
              <span className="shrink-0 rounded border border-ink-muted bg-surface-soft px-1 py-0.5 text-[9px] font-medium text-ink-status">
                {CODE_BARRE[r.plateforme]}
              </span>
              <span className="truncate text-left text-xs font-medium text-ink-status">
                {r.occupant}
              </span>
              <PointPaiement etat={paiement} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GrilleMois({
  jours,
  ancre,
  reservations,
  onSelect,
}: {
  jours: Date[];
  ancre: Date;
  reservations: ReservationMo1[];
  onSelect: (r: ReservationMo1) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-7 border-b border-line">
        {JOURS_MOIS.map((j) => (
          <div key={j} className="px-2 py-2 text-center text-xs text-ink-muted">
            {j}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {jours.map((d) => {
          const key = isoJour(d);
          const hors = d.getMonth() !== ancre.getMonth();
          const list = reservations.filter((r) => reservationCouvre(r, key));
          return (
            <div
              key={key}
              className={cn(
                "min-h-24 border-b border-r border-line p-1.5",
                hors && "bg-surface",
                key === AUJOURD_HUI_MO1 && "bg-surface",
              )}
            >
              <p className="mb-1 text-xs text-ink-body">{d.getDate()}</p>
              <div className="space-y-0.5">
                {list.slice(0, 3).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onSelect(r)}
                    className="block w-full truncate rounded bg-line px-1.5 py-0.5 text-left text-[10px] text-ink-status"
                  >
                    {CODE_BARRE[r.plateforme]} · {r.occupant.split(" ")[0]}
                  </button>
                ))}
                {list.length > 3 && (
                  <p className="px-1 text-[10px] text-ink-muted">+{list.length - 3} autres</p>
                )}
                {list.length === 0 && !hors && (
                  <div className="flex justify-center pt-2">
                    <Link
                      to="/reservations/nouveau"
                      className="flex size-5 items-center justify-center rounded-full border border-line-strong text-ink-muted"
                      aria-label="Créer une réservation"
                    >
                      <Plus className="size-2.5" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <LegendePlanning />
    </div>
  );
}

function PointPaiement({ etat }: { etat: PaiementMo1 }) {
  return (
    <span
      className={cn(
        "ml-auto size-2 shrink-0 rounded-full",
        etat === "paye" && "bg-ink-subtle",
        etat === "partiel" && "border border-ink-subtle bg-[linear-gradient(90deg,var(--ink-subtle)_50%,transparent_50%)]",
        etat === "impaye" && "border border-ink-muted bg-white",
      )}
    />
  );
}

function LegendePlanning({ bloque }: { bloque?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-t border-surface-soft px-4 py-2 text-[11px] text-ink-muted">
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-ink-subtle" /> Payé
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full border border-ink-subtle bg-[linear-gradient(90deg,var(--ink-subtle)_50%,transparent_50%)]" />{" "}
        Partiel
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full border border-ink-muted" /> Impayé
      </span>
      {bloque && (
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded border border-line bg-[repeating-linear-gradient(-45deg,var(--surface-soft),var(--surface-soft)_2px,var(--surface-elevated)_2px,var(--surface-elevated)_4px)]" />{" "}
          Bloqué
        </span>
      )}
      <span className="ml-auto">
        {bloque
          ? "Cliquer sur une réservation ou une période bloquée"
          : "Cliquer sur une réservation pour voir le détail"}
      </span>
    </div>
  );
}
