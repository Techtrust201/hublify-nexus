import { Link } from "@tanstack/react-router";
import { BarChart2, CalendarDays, ChevronDown, Info, Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { BtnNavy } from "@/components/documents/ui";
import { modifierSession, useSession } from "@/data/session";
import { toastInfo, toastOk } from "@/lib/feedback";
import { cn } from "@/lib/utils";

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

function sejoursAnnuels(logement: string, session: ReturnType<typeof useSession>) {
  const vus = new Set<string>();
  const liste: { debut: string; fin: string; logement: string }[] = [];
  const ajouter = (debut: string, fin: string, nom: string) => {
    if (logement !== "Tous les logements" && nom !== logement) return;
    const cle = `${nom}|${debut}|${fin}`;
    if (vus.has(cle)) return;
    vus.add(cle);
    liste.push({ debut, fin, logement: nom });
  };
  for (const r of session.reservationsDossier) {
    if (r.statut === "Annulé") continue;
    const bien = session.biens.find((b) => b.id === r.bienId);
    ajouter(r.arrivee, r.depart, bien?.nom ?? r.bienId);
  }
  return liste;
}

function datesReserveesDe(sejours: { debut: string; fin: string }[]) {
  const set = new Set<string>();
  for (const s of sejours) {
    const d0 = new Date(`${s.debut}T12:00:00`);
    const d1 = new Date(`${s.fin}T12:00:00`);
    for (let t = d0.getTime(); t <= d1.getTime(); t += 86_400_000) {
      const d = new Date(t);
      set.add(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      );
    }
  }
  return set;
}

export function VueAnnuelle() {
  const session = useSession();
  const [annee, setAnnee] = useState(2026);
  const logements = useMemo(
    () => ["Tous les logements", ...session.biens.map((b) => b.nom)],
    [session.biens],
  );
  const [logement, setLogement] = useState("Tous les logements");
  const bloquees = useMemo(
    () => new Set(session.datesBloqueesAnnuelles),
    [session.datesBloqueesAnnuelles],
  );
  const [modeBlocage, setModeBlocage] = useState(false);
  const [reservation, setReservation] = useState<string | null>(null);
  const sejours = useMemo(() => sejoursAnnuels(logement, session), [logement, session]);
  const datesReservees = useMemo(() => datesReserveesDe(sejours), [sejours]);

  const stats = useMemo(() => {
    const nuitsBloquees = bloquees.size;
    let nuitsReservees = 0;
    for (const s of sejours) {
      const d0 = new Date(s.debut + "T12:00:00");
      const d1 = new Date(s.fin + "T12:00:00");
      const jours = Math.max(0, Math.round((d1.getTime() - d0.getTime()) / 86400000));
      nuitsReservees += jours;
    }
    const nbLogements = logement === "Tous les logements" ? Math.max(1, session.biens.length) : 1;
    const occupation = Math.min(100, Math.round((nuitsReservees / (365 * nbLogements)) * 100));
    const revenus = session.reservationsDossier
      .filter((r) => r.statut !== "Annulé")
      .filter((r) => {
        if (logement === "Tous les logements") return true;
        return session.biens.find((b) => b.id === r.bienId)?.nom === logement;
      })
      .reduce((n, r) => n + r.montant, 0);
    return {
      periodes: Math.max(1, Math.ceil(nuitsBloquees / 3)),
      nuits: nuitsBloquees,
      occupation,
      revenus: `${revenus.toLocaleString("fr-FR")} €`,
      sejours: sejours.length,
      nuitsReservees,
    };
  }, [bloquees, logement, sejours, session.biens, session.reservationsDossier]);

  const toggleJour = (date: string) => {
    if (datesReservees.has(date)) {
      setReservation(date);
      return;
    }
    if (!modeBlocage) {
      toastInfo("Activez « Bloquer des dates » pour bloquer ou débloquer un jour libre.");
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
          <select
            value={annee}
            onChange={(e) => setAnnee(Number(e.target.value))}
            className="h-11 rounded-card border border-line bg-white px-3 text-sm text-ink outline-none md:h-[34px]"
            aria-label="Année"
          >
            {[2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <div className="relative">
            <select
              value={logement}
              onChange={(e) => setLogement(e.target.value)}
              className="h-11 appearance-none rounded-card border border-line bg-white py-0 pl-3 pr-8 text-xs text-ink-body outline-none md:h-[34px]"
            >
              {logements.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-ink-muted" />
          </div>
          <BtnNavy onClick={() => setModeBlocage((v) => !v)}>
            <Lock className="size-3" />{" "}
            {modeBlocage ? "Terminer les blocages" : "Bloquer des dates"}
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
        {modeBlocage
          ? "Mode blocage actif : cliquez un jour libre pour bloquer ou débloquer."
          : "Cliquez un jour occupé pour voir le séjour. Activez « Bloquer des dates » pour modifier les blocages."}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {MOIS.map((nom, mi) => (
          <MoisCalendrier
            key={nom}
            nom={`${nom} ${annee}`}
            annee={annee}
            mois={mi}
            bloquees={bloquees}
            reserves={datesReservees}
            onJour={toggleJour}
          />
        ))}
      </div>

      {reservation && (
        <PanneauJourOccupe
          date={reservation}
          logement={logement}
          onFermer={() => setReservation(null)}
        />
      )}
    </div>
  );
}

function PanneauJourOccupe({
  date,
  logement,
  onFermer,
}: {
  date: string;
  logement: string;
  onFermer: () => void;
}) {
  const session = useSession();
  const dossier = session.reservationsDossier.find((r) => {
    if (r.statut === "Annulé") return false;
    if (date < r.arrivee || date > r.depart) return false;
    const bien = session.biens.find((b) => b.id === r.bienId);
    if (logement === "Tous les logements") return true;
    return bien?.nom === logement;
  });
  const bienDossier = dossier ? session.biens.find((b) => b.id === dossier.bienId) : undefined;
  const detail = dossier
    ? `${dossier.occupant} · ${bienDossier?.nom ?? dossier.bienId} · ${dossier.arrivee} → ${dossier.depart}`
    : "Cette date est occupée. Les blocages ne s'appliquent qu'aux jours libres.";

  return (
    <div className="mt-4 rounded-card border border-line bg-white p-4 text-sm">
      <p className="font-medium text-ink">Occupé le {date}</p>
      <p className="mt-1 text-xs text-ink-subtle">{detail}</p>
      <div className="mt-2 flex flex-wrap gap-3">
        {dossier ? (
          <Link
            to="/reservations"
            search={{ vue: "liste", resa: dossier.id }}
            className="text-xs font-medium text-accent-teal"
          >
            Ouvrir la réservation
          </Link>
        ) : (
          <Link to="/reservations" className="text-xs font-medium text-accent-teal">
            Voir le planning
          </Link>
        )}
        <button type="button" onClick={onFermer} className="text-xs text-ink-body underline">
          Fermer
        </button>
      </div>
    </div>
  );
}

function MoisCalendrier({
  nom,
  annee,
  mois,
  bloquees,
  reserves,
  onJour,
}: {
  nom: string;
  annee: number;
  mois: number;
  bloquees: Set<string>;
  reserves: Set<string>;
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
          const reserve = reserves.has(date);
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
