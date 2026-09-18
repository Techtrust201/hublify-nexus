import type { ReactNode } from "react";
import { CalendarDays, ClipboardList, Plus, Search, Tag } from "lucide-react";
import {
  PHOTO_BIEN,
  bienEnLigne,
  libellePastille,
  nomCourtBien,
  positionPhotoBien,
  stylePastille,
  type MissionMo1,
  type OngletPlanning,
} from "@/data/planning-mo1";
import { MissionsPlusPopover } from "@/components/dashboard/DashboardDialogs";
import { cn } from "@/lib/utils";

export type BienCalendrierChrome = {
  id: string;
  nom: string;
  typologie?: string | undefined;
  statut?: string | undefined;
};

export function ColonneBienCalendrier({ bien }: { bien: BienCalendrierChrome }) {
  const enLigne = bienEnLigne(bien);
  return (
    <div className="sticky left-0 z-[5] flex flex-col items-center border-b border-r border-line bg-white px-2 py-2 text-center">
      <p className="text-[10px] italic leading-4 text-ink-muted">
        {bien.typologie || "Appartement"}
      </p>
      <p className="truncate text-[13px] leading-4 text-ink-body">{nomCourtBien(bien.nom)}</p>
      <div className="mt-1.5 h-[62px] w-[94px] overflow-hidden rounded-[10px] bg-surface-soft">
        <img
          src={PHOTO_BIEN}
          alt=""
          className="size-full object-cover"
          style={{ objectPosition: positionPhotoBien(bien.id) }}
        />
      </div>
      <p className="mt-1.5 inline-flex items-center gap-1 text-[10px] italic leading-4 text-ink">
        <span
          className={cn(
            "inline-flex size-[15px] items-center justify-center rounded-full border text-[11px] font-semibold not-italic",
            enLigne ? "border-[#65cd91] text-[#65cd91]" : "border-[#ee8a79] text-[#ee8a79]",
          )}
          aria-hidden
        >
          i
        </span>
        {enLigne ? "En ligne" : "Hors ligne"}
      </p>
    </div>
  );
}

export function PastilleCalendrier({
  mission,
  onClick,
}: {
  mission: MissionMo1;
  onClick: () => void;
}) {
  const style = stylePastille(mission);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={libellePastille(mission)}
      className={cn(
        "flex h-11 w-full min-w-0 items-center gap-1 overflow-hidden rounded border border-line-strong px-1.5 text-left text-[10px] font-medium text-ink-body md:h-[21px]",
        style.barre && "opacity-70",
      )}
      style={{ backgroundColor: style.fond }}
    >
      <span className="shrink-0">{mission.emoji}</span>
      <span className={cn("min-w-0 flex-1 truncate", style.barre && "line-through")}>
        {libellePastille(mission)}
      </span>
      {style.fini && (
        <span className="shrink-0 rounded border border-line-strong bg-white px-1.5 py-px text-[10px] text-ink-body">
          Fini
        </span>
      )}
    </button>
  );
}

export function ChampRechercheCalendrier({
  valeur,
  onChange,
  placeholder = "Rechercher un logement, un occupant ou une prestation…",
}: {
  valeur: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex h-11 w-full items-center gap-2 rounded-card border border-line bg-white px-3 md:h-9">
      <Search className="size-3.5 shrink-0 text-ink-muted" />
      <input
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-full w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
      />
    </label>
  );
}

export function BandeauPlanning({
  actif,
  onChoisir,
  extra,
}: {
  actif: OngletPlanning;
  onChoisir: (v: OngletPlanning) => void;
  extra?: ReactNode;
}) {
  const items = [
    {
      id: "missions" as const,
      label: "Missions",
      hint: "Interventions par bien",
      icone: ClipboardList,
    },
    {
      id: "reservations" as const,
      label: "Réservations",
      hint: "Séjours et check-in",
      icone: CalendarDays,
    },
    {
      id: "tarifs" as const,
      label: "Tarifs",
      hint: "Prix et règles",
      icone: Tag,
    },
  ];
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-2">
      {items.map((it) => {
        const Icone = it.icone;
        const sel = actif === it.id;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onChoisir(it.id)}
            className={cn(
              "flex min-w-[148px] shrink-0 items-center gap-2.5 rounded-xl border px-3 py-2 text-left",
              sel
                ? "border-ink bg-ink text-white shadow-sm"
                : "border-line bg-white text-ink-body hover:border-ink-muted",
            )}
          >
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-lg",
                sel ? "bg-white/15" : "bg-surface-soft",
              )}
            >
              <Icone className="size-4" />
            </span>
            <span>
              <span className="block text-sm font-medium">{it.label}</span>
              <span className={cn("block text-[10px]", sel ? "text-white/70" : "text-ink-muted")}>
                {it.hint}
              </span>
            </span>
          </button>
        );
      })}
      {extra ? <div className="ml-auto shrink-0">{extra}</div> : null}
    </div>
  );
}

export function BandMissionsJour({
  bienNom,
  date,
  dateLabel,
  missions,
  onMission,
  onAjouter,
}: {
  bienNom: string;
  date: string;
  dateLabel: string;
  missions: MissionMo1[];
  onMission: (m: MissionMo1) => void;
  onAjouter?: ((date: string) => void) | undefined;
}) {
  const visible = missions[0];
  return (
    <div
      className="relative flex min-h-[56px] flex-1 flex-col gap-1 px-1.5 pb-8 pt-0.5"
      onClick={onAjouter ? () => onAjouter(date) : undefined}
    >
      {visible ? (
        <PastilleCalendrier mission={visible} onClick={() => onMission(visible)} />
      ) : null}
      {missions.length > 1 && (
        <MissionsPlusPopover
          bienNom={bienNom}
          dateLabel={dateLabel}
          missions={missions}
          onChoisir={onMission}
          {...(onAjouter ? { onAjouter: () => onAjouter(date) } : {})}
        />
      )}
      {onAjouter ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAjouter(date);
          }}
          className="absolute bottom-1 right-1 z-[2] flex size-6 items-center justify-center rounded-md border border-line bg-white text-ink-muted shadow-sm hover:border-ink hover:bg-surface hover:text-ink"
          aria-label={`Ajouter une prestation — ${bienNom}`}
        >
          <Plus className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export function EnteteJoursCalendrier({
  jours,
  aujourdHui,
  isoJour,
}: {
  jours: Date[];
  aujourdHui: string;
  isoJour: (d: Date) => string;
}) {
  return (
    <>
      <div className="sticky left-0 z-[5] border-b border-r border-line bg-white" />
      {jours.map((d) => {
        const key = isoJour(d);
        const auj = key === aujourdHui;
        return (
          <div
            key={key}
            className={cn(
              "snap-start border-b border-r border-line py-2 text-center",
              auj && "bg-[#f8f8f8]",
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
    </>
  );
}

