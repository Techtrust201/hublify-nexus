import { Plus } from "lucide-react";
import {
  PHOTO_BIEN,
  bienEnLigne,
  libellePastille,
  nomCourtBien,
  positionPhotoBien,
  stylePastille,
  type MissionMo1,
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
      onClick={onClick}
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
    <div className="group/missions relative flex min-h-[44px] flex-col gap-0.5 px-1.5 pt-0.5">
      {visible ? (
        <PastilleCalendrier mission={visible} onClick={() => onMission(visible)} />
      ) : onAjouter ? (
        <button
          type="button"
          onClick={() => onAjouter(date)}
          className="flex h-11 w-full items-center justify-center rounded text-ink-muted opacity-0 transition-opacity group-hover/missions:opacity-100 focus-visible:opacity-100 md:h-[21px]"
          aria-label={`Ajouter une prestation — ${bienNom}`}
        >
          <Plus className="size-3" />
        </button>
      ) : null}
      {missions.length > 1 && (
        <MissionsPlusPopover
          bienNom={bienNom}
          dateLabel={dateLabel}
          missions={missions}
          onChoisir={onMission}
        />
      )}
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

