// SOURCE: V2 Redris — « Vision Missions Calendar sur 3 jours » et « … mois complet »
// Adapté : 2 vues retenues sur les 12 variantes observées.

import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLASSE_STATUT } from "@/data/statuts";
import type { Bien, Mission } from "@/data/types";

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

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

function Pastille({ mission, bien }: { mission: Mission; bien?: Bien }) {
  return (
    <Link
      to="/missions/$missionId"
      params={{ missionId: mission.id }}
      className={cn(
        "block rounded-md border px-2 py-1 text-left text-xs transition-opacity hover:opacity-80",
        CLASSE_STATUT[mission.statut],
      )}
    >
      <span className="block font-medium">
        {mission.heureDebut} · {mission.titre}
      </span>
      {bien && <span className="block truncate opacity-80">{bien.nom}</span>}
    </Link>
  );
}

export function MissionsCalendar({
  missions,
  biens,
}: {
  missions: Mission[];
  biens: Bien[];
}) {
  const [vue, setVue] = useState<"3jours" | "mois">("3jours");
  const [ancre, setAncre] = useState(() => new Date());
  const [bienFiltre, setBienFiltre] = useState<string>("tous");

  const filtrees = useMemo(
    () => (bienFiltre === "tous" ? missions : missions.filter((m) => m.bienId === bienFiltre)),
    [missions, bienFiltre],
  );

  const parJour = useMemo(() => {
    const map = new Map<string, Mission[]>();
    for (const m of filtrees) {
      const list = map.get(m.date) ?? [];
      list.push(m);
      map.set(
        m.date,
        list.sort((a, b) => a.heureDebut.localeCompare(b.heureDebut)),
      );
    }
    return map;
  }, [filtrees]);

  const jours3 = [0, 1, 2].map((i) => ajouter(ancre, i));

  const joursMois = useMemo(() => {
    const debut = new Date(ancre.getFullYear(), ancre.getMonth(), 1);
    const decalage = (debut.getDay() + 6) % 7;
    const premier = ajouter(debut, -decalage);
    return Array.from({ length: 42 }, (_, i) => ajouter(premier, i));
  }, [ancre]);

  const pas = vue === "3jours" ? 3 : 0;

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
        <div className="flex items-center gap-1">
          <button
            aria-label="Précédent"
            className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-accent"
            onClick={() =>
              setAncre((d) =>
                vue === "3jours"
                  ? ajouter(d, -pas)
                  : new Date(d.getFullYear(), d.getMonth() - 1, 1),
              )
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            aria-label="Suivant"
            className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-accent"
            onClick={() =>
              setAncre((d) =>
                vue === "3jours" ? ajouter(d, pas) : new Date(d.getFullYear(), d.getMonth() + 1, 1),
              )
            }
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            className="ml-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
            onClick={() => setAncre(new Date())}
          >
            Aujourd'hui
          </button>
        </div>

        <p className="text-sm font-medium capitalize text-foreground">
          {ancre.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </p>

        <div className="ml-auto flex items-center gap-2">
          <select
            value={bienFiltre}
            onChange={(e) => setBienFiltre(e.target.value)}
            className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs"
            aria-label="Filtrer par bien"
          >
            <option value="tous">Tous les biens</option>
            {biens.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nom}
              </option>
            ))}
          </select>
          <div className="flex rounded-md border border-border p-0.5">
            {(["3jours", "mois"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVue(v)}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium",
                  vue === v ? "bg-brand text-brand-foreground" : "text-muted-foreground",
                )}
              >
                {v === "3jours" ? "3 jours" : "Mois"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {vue === "3jours" ? (
        <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
          {jours3.map((d) => {
            const key = iso(d);
            const list = parJour.get(key) ?? [];
            return (
              <div key={key} className="min-h-64 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                <div className="space-y-2">
                  {list.length === 0 && (
                    <p className="text-xs text-muted-foreground">Aucune mission</p>
                  )}
                  {list.map((m) => (
                    <Pastille key={m.id} mission={m} bien={biens.find((b) => b.id === m.bienId)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-7 border-b border-border">
            {JOURS.map((j) => (
              <div
                key={j}
                className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground"
              >
                {j}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {joursMois.map((d) => {
              const key = iso(d);
              const list = parJour.get(key) ?? [];
              const horsMois = d.getMonth() !== ancre.getMonth();
              return (
                <div
                  key={key}
                  className={cn(
                    "min-h-24 border-b border-r border-border p-1.5",
                    horsMois && "bg-muted/40",
                  )}
                >
                  <p className="mb-1 text-xs text-muted-foreground">{d.getDate()}</p>
                  <div className="space-y-1">
                    {list.slice(0, 2).map((m) => (
                      <Pastille key={m.id} mission={m} />
                    ))}
                    {list.length > 2 && (
                      <p className="text-[11px] text-muted-foreground">+{list.length - 2}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
