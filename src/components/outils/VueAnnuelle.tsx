import { BarChart2, CalendarDays, ChevronDown, Info, Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { BtnNavy } from "@/components/documents/ui";
import {
  DATES_BLOQUEES_INIT,
  RESERVATIONS_ANNUELLES,
} from "@/data/documents-mo1";
import { cn } from "@/lib/utils";

const LOGEMENTS = ["Tous les logements", "Suzette", "Villa Lavandrix", "Appartement Colette", "Studio Raclette"];
const MOIS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

function iso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function estReserve(date: string, logement: string) {
  return RESERVATIONS_ANNUELLES.some((r) => {
    if (logement !== "Tous les logements" && r.logement !== logement) return false;
    return date >= r.debut && date <= r.fin;
  });
}

export function VueAnnuelle() {
  const [annee] = useState(2026);
  const [logement, setLogement] = useState("Tous les logements");
  const [bloquees, setBloquees] = useState<Set<string>>(() => new Set(DATES_BLOQUEES_INIT));
  const [modeBlocage, setModeBlocage] = useState(false);
  const [reservation, setReservation] = useState<string | null>(null);

  const stats = useMemo(() => {
    const nuits = bloquees.size;
    return { periodes: 5, nuits, occupation: 9, revenus: "20 440 €" };
  }, [bloquees]);

  const toggleJour = (date: string) => {
    if (estReserve(date, logement)) {
      setReservation(date);
      return;
    }
    setBloquees((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-[#99a1af]">Outils</p>
          <h2 className="text-lg text-[#1e2939]">Vue Annuelle</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-[34px] items-center rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-sm text-[#1e2939]">
            {annee}
          </span>
          <div className="relative">
            <select
              value={logement}
              onChange={(e) => setLogement(e.target.value)}
              className="h-[34px] appearance-none rounded-[10px] border border-[#e5e7eb] bg-white py-0 pl-3 pr-8 text-xs text-[#4a5565] outline-none"
            >
              {LOGEMENTS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-[#99a1af]" />
          </div>
          <BtnNavy onClick={() => setModeBlocage((v) => !v)}>
            <Lock className="size-3" /> Bloquer des dates
          </BtnNavy>
        </div>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-6 rounded-[10px] border border-[#e5e7eb] bg-white px-4 py-2.5 text-xs text-[#6a7282]">
        <p>
          <CalendarDays className="mr-1 inline size-3" />
          Réservations : <span className="text-[#1e2939]">22 séjours · 131 nuits</span>
        </p>
        <p>
          Blocages :{" "}
          <span className="text-[#1e2939]">
            {stats.periodes} périodes · {stats.nuits} nuits
          </span>
        </p>
        <p className="inline-flex items-center gap-2">
          <BarChart2 className="size-3" />
          Taux d'occupation : <span className="text-[#1e2939]">{stats.occupation}%</span>
          <span className="h-1.5 w-24 overflow-hidden rounded-full bg-[#f3f4f6]">
            <span className="block h-full w-[9%] bg-[#1e2939]" />
          </span>
        </p>
        <p className="ml-auto">
          Revenus totaux : <span className="text-[#1e2939]">{stats.revenus}</span>
        </p>
      </div>
      <p className="mb-4 flex items-center gap-2 text-[11px] text-[#99a1af]">
        <Info className="size-2.5" />
        Cliquez sur un jour libre pour le bloquer · sur un jour bloqué pour le débloquer
        {modeBlocage ? " · mode blocage actif" : ""}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {MOIS.map((nom, mi) => (
          <MoisCalendrier
            key={nom}
            nom={`${nom} ${annee}`}
            annee={annee}
            mois={mi}
            bloquees={bloquees}
            logement={logement}
            onJour={toggleJour}
          />
        ))}
      </div>

      {reservation && (
        <div className="mt-4 rounded-[10px] border border-[#e5e7eb] bg-white p-4 text-sm">
          <p className="font-medium text-[#1e2939]">Réservation le {reservation}</p>
          <p className="mt-1 text-xs text-[#6a7282]">
            Cette date est occupée. Débloquez uniquement les jours libres.
          </p>
          <button
            type="button"
            onClick={() => setReservation(null)}
            className="mt-2 text-xs text-[#4a5565] underline"
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}

function MoisCalendrier({
  nom,
  annee,
  mois,
  bloquees,
  logement,
  onJour,
}: {
  nom: string;
  annee: number;
  mois: number;
  bloquees: Set<string>;
  logement: string;
  onJour: (d: string) => void;
}) {
  const premier = new Date(annee, mois, 1);
  const decalage = (premier.getDay() + 6) % 7;
  const nbJours = new Date(annee, mois + 1, 0).getDate();
  const cellules: (number | null)[] = [
    ...Array.from({ length: decalage }, () => null),
    ...Array.from({ length: nbJours }, (_, i) => i + 1),
  ];

  return (
    <div className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
      <p className="border-b border-[#f3f4f6] px-3 py-3 text-xs text-[#1e2939]">{nom}</p>
      <div className="grid grid-cols-7 px-1 pt-1 text-center text-[10px] text-[#99a1af]">
        {["L", "M", "M", "J", "V", "S", "D"].map((j, i) => (
          <span key={`${j}-${i}`} className="py-1">
            {j}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 p-1">
        {cellules.map((j, i) => {
          if (!j) return <span key={`e-${i}`} className="h-7" />;
          const date = iso(annee, mois, j);
          const bloquee = bloquees.has(date);
          const reserve = estReserve(date, logement);
          return (
            <button
              key={date}
              type="button"
              onClick={() => onJour(date)}
              className={cn(
                "mx-auto flex size-7 items-center justify-center rounded text-[10px]",
                bloquee && "bg-[#1e2939] text-white",
                reserve && !bloquee && "bg-[#e5e7eb] text-[#1e2939]",
                !bloquee && !reserve && "text-[#4a5565] hover:bg-[#f3f4f6]",
              )}
            >
              {j}
            </button>
          );
        })}
      </div>
    </div>
  );
}
