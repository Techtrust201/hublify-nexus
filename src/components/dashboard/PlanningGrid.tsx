// SOURCE: Maquette MO1 — grille biens × jours (Missions 3 jours / 5 jours / mois)

import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, LogIn, LogOut, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { ANCRE_PLANNING, ORDRE_BIENS } from "@/data/mock";
import type { Bien, Mission, Reservation } from "@/data/types";
import { cn } from "@/lib/utils";

const JOURS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];

function iso(d: Date) {
  const c = new Date(d);
  c.setHours(12, 0, 0, 0);
  return c.toISOString().slice(0, 10);
}

function ajouter(d: Date, n: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

function iconeMission(titre: string, type: Mission["type"]) {
  if (titre.toLowerCase().includes("état des lieux") || type === "Inventaire") return "📋";
  if (type === "Check-in" || type === "Check-out") return "🔑";
  if (type === "Maintenance") return "🔧";
  return "🧹";
}

function reservationCouvre(r: Reservation, jour: string) {
  return r.arrivee <= jour && r.depart > jour;
}

export function PlanningGrid({
  missions,
  biens,
  reservations,
  onglet,
  onOnglet,
}: {
  missions: Mission[];
  biens: Bien[];
  reservations: Reservation[];
  onglet: "missions" | "reservations" | "tarifs";
  onOnglet: (v: "missions" | "reservations" | "tarifs") => void;
}) {
  const [vue, setVue] = useState<"3jours" | "5jours" | "mois">("3jours");
  const [ancre, setAncre] = useState(() => new Date(ANCRE_PLANNING));
  const [filtre, setFiltre] = useState<"tous" | "checkin" | "checkout">("tous");

  const biensOrdonnes = useMemo(() => {
    const map = new Map(biens.map((b) => [b.id, b]));
    return ORDRE_BIENS.map((id) => map.get(id)).filter((b): b is Bien => Boolean(b));
  }, [biens]);

  const nbJours = vue === "3jours" ? 3 : vue === "5jours" ? 5 : 0;
  const jours = useMemo(
    () => (nbJours ? Array.from({ length: nbJours }, (_, i) => ajouter(ancre, i)) : []),
    [ancre, nbJours],
  );

  const joursMois = useMemo(() => {
    const debut = new Date(ancre.getFullYear(), ancre.getMonth(), 1);
    const decalage = (debut.getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, i) => ajouter(ajouter(debut, -decalage), i));
  }, [ancre]);

  const missionsFiltrees = useMemo(() => {
    if (filtre === "checkin") return missions.filter((m) => m.type === "Check-in");
    if (filtre === "checkout") return missions.filter((m) => m.type === "Check-out");
    return missions;
  }, [missions, filtre]);

  const aujourdHui = iso(new Date(2026, 2, 5));

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
            onClick={() => onOnglet(id)}
            className={cn(
              "h-[46px] border-b-2 px-4 text-sm font-medium capitalize",
              onglet === id
                ? "border-[#1e2939] text-[#101828]"
                : "border-transparent text-[#6a7282]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-[#f3f4f6] bg-[#f9fafb]/50 px-4 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Précédent"
            className="flex size-6 items-center justify-center rounded border border-[#e5e7eb] text-[#4a5565]"
            onClick={() =>
              setAncre((d) =>
                vue === "mois"
                  ? new Date(d.getFullYear(), d.getMonth() - 1, 1)
                  : ajouter(d, -nbJours),
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
                vue === "mois"
                  ? new Date(d.getFullYear(), d.getMonth() + 1, 1)
                  : ajouter(d, nbJours),
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

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#99a1af]">Filtrer :</span>
          <button
            type="button"
            onClick={() => setFiltre((f) => (f === "checkin" ? "tous" : "checkin"))}
            className={cn(
              "inline-flex h-[26px] items-center gap-1 rounded border px-2.5 text-xs font-medium",
              filtre === "checkin"
                ? "border-[#1e2939] bg-[#1e2939] text-white"
                : "border-[#e5e7eb] bg-white text-[#4a5565]",
            )}
          >
            <LogIn className="size-2.5" />
            CheckIn
          </button>
          <button
            type="button"
            onClick={() => setFiltre((f) => (f === "checkout" ? "tous" : "checkout"))}
            className={cn(
              "inline-flex h-[26px] items-center gap-1 rounded border px-2.5 text-xs font-medium",
              filtre === "checkout"
                ? "border-[#1e2939] bg-[#1e2939] text-white"
                : "border-[#e5e7eb] bg-white text-[#4a5565]",
            )}
          >
            <LogOut className="size-2.5" />
            CheckOut
          </button>
        </div>
      </div>

      {vue === "mois" ? (
        <div>
          <div className="grid grid-cols-7 border-b border-[#e5e7eb]">
            {JOURS.map((j) => (
              <div key={j} className="px-2 py-2 text-center text-xs uppercase text-[#99a1af]">
                {j}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {joursMois.map((d) => {
              const key = iso(d);
              const list = missionsFiltrees.filter((m) => m.date === key);
              const hors = d.getMonth() !== ancre.getMonth();
              return (
                <div
                  key={key}
                  className={cn(
                    "min-h-24 border-b border-r border-[#e5e7eb] p-1.5",
                    hors && "bg-[#f9fafb]",
                    key === aujourdHui && "bg-[#f9fafb]",
                  )}
                >
                  <p className="mb-1 text-center text-xs text-[#4a5565]">{d.getDate()}</p>
                  <div className="space-y-1">
                    {list.slice(0, 2).map((m) => (
                      <Pastille key={m.id} mission={m} />
                    ))}
                    {list.length > 2 && (
                      <p className="text-[10px] text-[#99a1af]">+{list.length - 2} voir plus</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div
            className="grid min-w-[720px]"
            style={{ gridTemplateColumns: `130px repeat(${jours.length}, minmax(0, 1fr))` }}
          >
            <div className="border-b border-r border-[#e5e7eb]" />
            {jours.map((d) => {
              const key = iso(d);
              return (
                <div
                  key={key}
                  className={cn(
                    "border-b border-r border-[#f3f4f6] py-2 text-center",
                    key === aujourdHui && "bg-[#f9fafb]",
                  )}
                >
                  <p className="text-xs uppercase text-[#99a1af]">
                    {d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "")}
                  </p>
                  <p
                    className={cn(
                      "text-sm text-[#4a5565]",
                      key === aujourdHui && "font-semibold text-[#1e2939]",
                    )}
                  >
                    {d.getDate()}
                  </p>
                </div>
              );
            })}

            {biensOrdonnes.map((bien) => {
              const sejours = reservations.filter((r) => r.bienId === bien.id);
              const aDesMissions = missionsFiltrees.some((m) => m.bienId === bien.id);
              return (
                <LigneBien
                  key={bien.id}
                  bien={bien}
                  jours={jours}
                  missions={missionsFiltrees.filter((m) => m.bienId === bien.id)}
                  sejours={sejours}
                  aujourdHui={aujourdHui}
                  vide={!aDesMissions && sejours.every((r) => jours.every((d) => !reservationCouvre(r, iso(d))))}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function LigneBien({
  bien,
  jours,
  missions,
  sejours,
  aujourdHui,
  vide,
}: {
  bien: Bien;
  jours: Date[];
  missions: Mission[];
  sejours: Reservation[];
  aujourdHui: string;
  vide: boolean;
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
          const key = iso(d);
          const duJour = missions.filter((m) => m.date === key);
          return (
            <div
              key={key}
              className={cn(
                "relative min-h-[104px] border-r border-[#f3f4f6]",
                key === aujourdHui && "bg-[#f9fafb]/60",
              )}
            >
              {vide && (
                <div className="flex h-full items-center justify-center">
                  <Link
                    to="/reservations"
                    className="flex size-5 items-center justify-center rounded-full border border-[#d1d5dc] text-[#99a1af]"
                    aria-label={`Ajouter une réservation — ${bien.nom}`}
                  >
                    <Plus className="size-2.5" />
                  </Link>
                </div>
              )}
              {!vide && (
                <div className="absolute inset-x-0 top-[52px] space-y-0.5 border-t border-[#e5e7eb] p-1">
                  {duJour.slice(0, 1).map((m) => (
                    <Pastille key={m.id} mission={m} />
                  ))}
                  {duJour.length > 1 && (
                    <p className="px-1 text-[10px] font-medium text-[#99a1af]">+1 voir plus</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {!vide &&
          sejours.map((r) => {
            const start = jours.findIndex((d) => reservationCouvre(r, iso(d)));
            if (start < 0) return null;
            let span = 0;
            for (let i = start; i < jours.length; i++) {
              if (!reservationCouvre(r, iso(jours[i]!))) break;
              span += 1;
            }
            return (
              <div
                key={r.id}
                className="pointer-events-none absolute top-1.5 z-10 flex h-10 items-center justify-between rounded-lg border border-[#d1d5dc] bg-[#f3f4f6] px-2.5 opacity-60"
                style={{
                  left: `calc(${(start / jours.length) * 100}% + 2px)`,
                  width: `calc(${(span / jours.length) * 100}% - 4px)`,
                }}
              >
                <span className="truncate text-xs text-[#6a7282]">{r.voyageur.nom}</span>
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full border border-[#99a1af] text-[9px] font-semibold text-[#6a7282]">
                  i
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function Pastille({ mission }: { mission: Mission }) {
  const terminee = mission.statut === "terminee";
  return (
    <Link
      to="/missions/$missionId"
      params={{ missionId: mission.id }}
      className={cn(
        "flex h-[21px] items-center gap-1 overflow-hidden rounded border px-1 text-[10px] font-medium",
        terminee
          ? "border-[#e5e7eb] bg-[#f3f4f6] text-[#99a1af] line-through opacity-70"
          : "border-[#d1d5dc] bg-white text-[#4a5565]",
      )}
    >
      <span>{iconeMission(mission.titre, mission.type)}</span>
      <span className="truncate">{mission.titre}</span>
    </Link>
  );
}
