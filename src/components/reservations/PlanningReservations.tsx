import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Home, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { InfosOccupants } from "@/components/reservations/InfosOccupants";
import { FiltreOnglet } from "@/components/reservations/KpiEtAccordeons";
import {
  ANCRE_PLANNING_MO1,
  AUJOURD_HUI_MO1,
  BIENS_MO1,
  CODE_BARRE,
  DATES_BLOQUEES_MO1,
  RESERVATIONS_MO1,
  ajouterJours,
  isoJour,
  paiementDe,
  reservationCouvre,
  type BienMo1,
  type PaiementMo1,
  type PlateformeMo1,
  type ReservationMo1,
} from "@/data/reservations-mo1";
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
  const [vue, setVue] = useState<VuePlanning>("3jours");
  const [ancre, setAncre] = useState(() => new Date(ANCRE_PLANNING_MO1));
  const [plateforme, setPlateforme] = useState<FiltrePlateforme>("tout");
  const [sectionOuverte, setSectionOuverte] = useState(false);
  const [bienLocalise, setBienLocalise] = useState<string | null>(null);
  const [selection, setSelection] = useState<ReservationMo1 | null>(null);
  const [datesBloquees, setDatesBloquees] = useState(DATES_BLOQUEES_MO1);
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
    if (plateforme === "tout") return RESERVATIONS_MO1;
    return RESERVATIONS_MO1.filter((r) => r.plateforme === plateforme);
  }, [plateforme]);

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
    <div className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
      <div className="flex items-center border-b border-[#e5e7eb] px-4">
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
                ? "border-[#1e2939] text-[#101828]"
                : "border-transparent text-[#6a7282]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="border-b border-[#f3f4f6] px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            className="flex items-center gap-2 text-xs text-[#4a5565]"
            onClick={() => setSectionOuverte((v) => !v)}
          >
            <Home className="size-3.5" />
            <span>Logements & plateformes</span>
            <span className="text-[#99a1af]">(4 biens)</span>
          </button>
          <div className="flex items-center gap-2">
            <Link
              to="/patrimoines"
              className="inline-flex h-[26px] items-center gap-1 rounded border border-[#d1d5dc] bg-white px-2.5 text-xs font-medium text-[#4a5565]"
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
                <ChevronUp className="size-3.5 text-[#99a1af]" />
              ) : (
                <ChevronDown className="size-3.5 text-[#99a1af]" />
              )}
            </button>
          </div>
        </div>
        {sectionOuverte && <TableauLogements onLocaliser={setBienLocalise} actif={bienLocalise} />}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-[#f3f4f6] bg-[#f9fafb]/50 px-4 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Précédent"
            className="flex size-6 items-center justify-center rounded border border-[#e5e7eb] text-[#4a5565]"
            onClick={() =>
              setAncre((d) =>
                vue === "mois" ? new Date(d.getFullYear(), d.getMonth() - 1, 1) : ajouterJours(d, -nbJours),
              )
            }
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <span className="min-w-24 text-center text-xs capitalize text-[#4a5565]">
            {ancre.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
          </span>
          <button
            type="button"
            aria-label="Suivant"
            className="flex size-6 items-center justify-center rounded border border-[#e5e7eb] text-[#4a5565]"
            onClick={() =>
              setAncre((d) =>
                vue === "mois" ? new Date(d.getFullYear(), d.getMonth() + 1, 1) : ajouterJours(d, nbJours),
              )
            }
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>

        <div className="flex overflow-hidden rounded border border-[#e5e7eb]">
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
                "border-r border-[#e5e7eb] px-3 py-1 text-xs font-medium last:border-r-0",
                vue === id ? "bg-[#1e2939] text-white" : "bg-white text-[#4a5565]",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="hidden h-4 w-px bg-[#e5e7eb] sm:block" />

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-[#99a1af]">Plateforme :</span>
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
          className="ml-auto text-xs text-[#99a1af]"
        >
          {visiblePlanning.length} rés. ·{" "}
          <span className="text-[#4a5565]">{totalVisible.toLocaleString("fr-FR")} €</span>
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
    <div className="mt-3 overflow-hidden rounded-[10px] border border-[#e5e7eb]">
      <div className="grid grid-cols-[1fr_80px_80px_80px_80px] border-b border-[#f3f4f6] bg-[#f9fafb] px-4 py-1.5 text-[11px] text-[#99a1af]">
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
            "grid grid-cols-[1fr_80px_80px_80px_80px] items-center border-b border-[#f3f4f6] px-4 py-2.5 last:border-b-0",
            actif === b.id && "bg-[#f9fafb]",
          )}
        >
          <span className="flex items-center gap-2 text-xs text-[#4a5565]">
            <span className="flex size-6 items-center justify-center rounded border border-[#e5e7eb] bg-[#f3f4f6]">
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
            className="justify-self-center rounded border border-[#d1d5dc] px-2 py-0.5 text-[11px] text-[#4a5565]"
          >
            Localiser
          </button>
        </div>
      ))}
      <div className="flex flex-wrap gap-4 px-4 py-2 text-[11px] text-[#99a1af]">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#1e2939]" /> Actif sur la plateforme
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full border border-[#99a1af]" /> Inactif
        </span>
        <span className="flex items-center gap-1.5">— Non référencé</span>
      </div>
    </div>
  );
}

function StatutPlateforme({ etat }: { etat: "actif" | "inactif" | "aucun" }) {
  if (etat === "aucun") {
    return <span className="text-center text-xs text-[#99a1af]">—</span>;
  }
  return (
    <span
      className={cn(
        "justify-self-center rounded px-2 py-0.5 text-[11px]",
        etat === "actif" ? "bg-[#1e2939] text-white" : "border border-[#e5e7eb] text-[#99a1af]",
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
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[720px]"
        style={{ gridTemplateColumns: `130px repeat(${jours.length}, minmax(0, 1fr))` }}
      >
        <div className="border-b border-r border-[#e5e7eb]" />
        {jours.map((d) => {
          const key = isoJour(d);
          const auj = key === AUJOURD_HUI_MO1;
          return (
            <div
              key={key}
              className={cn(
                "border-b border-r border-[#f3f4f6] py-2 text-center",
                auj && "bg-[#f9fafb]",
              )}
            >
              <p className="text-xs uppercase text-[#99a1af]">
                {d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "")}
              </p>
              <p className={cn("text-sm text-[#4a5565]", auj && "font-semibold text-[#1e2939]")}>
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
    </div>
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
      <div className="border-b border-r border-[#e5e7eb] px-3 py-3 text-xs text-[#4a5565]">
        {bien.nom}
      </div>
      <div
        className="relative grid border-b border-[#f3f4f6]"
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
                "relative min-h-[59px] border-r border-[#f3f4f6]",
                key === AUJOURD_HUI_MO1 && "bg-[#f9fafb]/50",
                bloquee && "bg-[repeating-linear-gradient(-45deg,#f3f4f6,#f3f4f6_4px,#fff_4px,#fff_8px)]",
              )}
            >
              {!occupe && !bloquee && (
                <div className="flex h-full items-center justify-center">
                  <button
                    type="button"
                    className="flex size-5 items-center justify-center rounded-full border border-[#d1d5dc] text-[#99a1af]"
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
                  className="flex h-full w-full items-center justify-center text-[10px] font-medium text-[#99a1af]"
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
                borderColor: paiement === "impaye" ? "#d1d5dc" : "#6a7282",
              }}
            >
              <span className="shrink-0 rounded border border-[#99a1af] bg-[#f3f4f6] px-1 py-0.5 text-[9px] font-medium text-[#364153]">
                {CODE_BARRE[r.plateforme]}
              </span>
              <span className="truncate text-left text-xs font-medium text-[#364153]">
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
      <div className="grid grid-cols-7 border-b border-[#e5e7eb]">
        {JOURS_MOIS.map((j) => (
          <div key={j} className="px-2 py-2 text-center text-xs text-[#99a1af]">
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
                "min-h-24 border-b border-r border-[#e5e7eb] p-1.5",
                hors && "bg-[#f9fafb]",
                key === AUJOURD_HUI_MO1 && "bg-[#f9fafb]",
              )}
            >
              <p className="mb-1 text-xs text-[#4a5565]">{d.getDate()}</p>
              <div className="space-y-0.5">
                {list.slice(0, 3).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onSelect(r)}
                    className="block w-full truncate rounded bg-[#e5e7eb] px-1.5 py-0.5 text-left text-[10px] text-[#364153]"
                  >
                    {CODE_BARRE[r.plateforme]} · {r.occupant.split(" ")[0]}
                  </button>
                ))}
                {list.length > 3 && (
                  <p className="px-1 text-[10px] text-[#99a1af]">+{list.length - 3} autres</p>
                )}
                {list.length === 0 && !hors && (
                  <div className="flex justify-center pt-2">
                    <Link
                      to="/reservations/nouveau"
                      className="flex size-5 items-center justify-center rounded-full border border-[#d1d5dc] text-[#99a1af]"
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
        etat === "paye" && "bg-[#6a7282]",
        etat === "partiel" && "border border-[#6a7282] bg-[linear-gradient(90deg,#6a7282_50%,transparent_50%)]",
        etat === "impaye" && "border border-[#99a1af] bg-white",
      )}
    />
  );
}

function LegendePlanning({ bloque }: { bloque?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-t border-[#f3f4f6] px-4 py-2 text-[11px] text-[#99a1af]">
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-[#6a7282]" /> Payé
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full border border-[#6a7282] bg-[linear-gradient(90deg,#6a7282_50%,transparent_50%)]" />{" "}
        Partiel
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full border border-[#99a1af]" /> Impayé
      </span>
      {bloque && (
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded border border-[#e5e7eb] bg-[repeating-linear-gradient(-45deg,#f3f4f6,#f3f4f6_2px,#fff_2px,#fff_4px)]" />{" "}
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
