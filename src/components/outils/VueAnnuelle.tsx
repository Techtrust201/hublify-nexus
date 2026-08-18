import { BarChart2, CalendarDays, ChevronDown, Info, Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { BtnNavy } from "@/components/documents/ui";
import { RESERVATIONS_ANNUELLES } from "@/data/documents-mo1";
import { modifierSession, useSession } from "@/data/session";
import { toastOk } from "@/lib/feedback";
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
  const session = useSession();
  const [annee] = useState(2026);
  const [logement, setLogement] = useState("Tous les logements");
  const bloquees = useMemo(
    () => new Set(session.datesBloqueesAnnuelles),
    [session.datesBloqueesAnnuelles],
  );
  const [modeBlocage, setModeBlocage] = useState(false);
  const [reservation, setReservation] = useState<string | null>(null);

  const stats = useMemo(() => {
    const nuitsBloquees = bloquees.size;
    const sejours = [
      ...RESERVATIONS_ANNUELLES,
      ...session.reservationsDossier.map((r) => ({
        debut: r.arrivee,
        fin: r.depart,
        logement: r.bienId,
      })),
    ];
    let nuitsReservees = 0;
    for (const s of sejours) {
      const d0 = new Date(s.debut + "T12:00:00");
      const d1 = new Date(s.fin + "T12:00:00");
      const jours = Math.max(0, Math.round((d1.getTime() - d0.getTime()) / 86400000));
      nuitsReservees += jours;
    }
    const occupation = Math.min(100, Math.round((nuitsReservees / 365) * 100));
    const revenus = session.reservationsDossier
      .filter((r) => r.statut !== "Annulé")
      .reduce((n, r) => n + r.montant, 0);
    return {
      periodes: Math.max(1, Math.ceil(nuitsBloquees / 3)),
      nuits: nuitsBloquees,
      occupation,
      revenus: `${revenus.toLocaleString("fr-FR")} €`,
      sejours: sejours.length,
      nuitsReservees,
    };
  }, [bloquees, session.reservationsDossier]);

  const toggleJour = (date: string) => {
    if (estReserve(date, logement)) {
      setReservation(date);
      return;
    }
    modifierSession((e) => {
      const next = new Set(e.datesBloqueesAnnuelles);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return { ...e, datesBloqueesAnnuelles: [...next] };
    });
    toastOk("Dates de blocage mises à jour.");
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-ink-muted">Outils</p>
          <h2 className="text-lg text-ink">Vue Annuelle</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-[34px] items-center rounded-card border border-line bg-white px-3 text-sm text-ink">
            {annee}
          </span>
          <div className="relative">
            <select
              value={logement}
              onChange={(e) => setLogement(e.target.value)}
              className="h-[34px] appearance-none rounded-card border border-line bg-white py-0 pl-3 pr-8 text-xs text-ink-body outline-none"
            >
              {LOGEMENTS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-ink-muted" />
          </div>
          <BtnNavy onClick={() => setModeBlocage((v) => !v)}>
            <Lock className="size-3" /> Bloquer des dates
          </BtnNavy>
        </div>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-6 rounded-card border border-line bg-white px-4 py-2.5 text-xs text-ink-subtle">
        <p>
          <CalendarDays className="mr-1 inline size-3" />
          Réservations :{" "}
          <span className="text-ink">
            {stats.sejours} séjours · {stats.nuitsReservees} nuits
          </span>
        </p>
        <p>
          Blocages :{" "}
          <span className="text-ink">
            {stats.periodes} périodes · {stats.nuits} nuits
          </span>
        </p>
        <p className="inline-flex items-center gap-2">
          <BarChart2 className="size-3" />
          Taux d'occupation : <span className="text-ink">{stats.occupation}%</span>
          <span className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-soft">
            <span className="block h-full bg-ink" style={{ width: `${stats.occupation}%` }} />
          </span>
        </p>
        <p className="ml-auto">
          Revenus totaux : <span className="text-ink">{stats.revenus}</span>
        </p>
      </div>
      <p className="mb-4 flex items-center gap-2 text-[11px] text-ink-muted">
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
        <div className="mt-4 rounded-card border border-line bg-white p-4 text-sm">
          <p className="font-medium text-ink">Réservation le {reservation}</p>
          <p className="mt-1 text-xs text-ink-subtle">
            Cette date est occupée. Débloquez uniquement les jours libres.
          </p>
          <button
            type="button"
            onClick={() => setReservation(null)}
            className="mt-2 text-xs text-ink-body underline"
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
    <div className="overflow-hidden rounded-card border border-line bg-white">
      <p className="border-b border-surface-soft px-3 py-3 text-xs text-ink">{nom}</p>
      <div className="grid grid-cols-7 px-1 pt-1 text-center text-[10px] text-ink-muted">
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
                "mx-auto flex h-11 w-full items-center justify-center rounded text-xs md:size-7 md:text-[10px]",
                bloquee && "bg-ink text-white",
                reserve && !bloquee && "bg-line text-ink",
                !bloquee && !reserve && "text-ink-body hover:bg-surface-soft",
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
