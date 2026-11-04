import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useSession } from "@/data/session";
import {
  construireTimeline,
  filtrerTimeline,
  formaterQuand,
  grouperTimeline,
  type PeriodeTimeline,
} from "@/lib/timeline-evenements";
import { cn } from "@/lib/utils";

const PERIODES: { id: PeriodeTimeline; label: string }[] = [
  { id: "tous", label: "Tous" },
  { id: "aujourdhui", label: "Aujourd'hui" },
  { id: "hier", label: "Hier" },
  { id: "semaine", label: "Cette semaine" },
];

export function TimelineApp() {
  const session = useSession();
  const [recherche, setRecherche] = useState("");
  const [type, setType] = useState("tous");
  const [periode, setPeriode] = useState<PeriodeTimeline>("tous");
  const [masquerAnnulees, setMasquerAnnulees] = useState(false);
  const maintenant = useMemo(() => new Date(), []);

  const tous = useMemo(
    () =>
      construireTimeline({
        documents: session.documents,
        reservations: session.reservationsDossier,
        biens: session.biens,
      }),
    [session.documents, session.reservationsDossier, session.biens],
  );
  const types = useMemo(() => ["tous", ...new Set(tous.map((e) => e.type))], [tous]);
  const filtres = filtrerTimeline(tous, {
    recherche,
    type,
    periode,
    masquerAnnulees,
    maintenant,
  });
  const groupes = grouperTimeline(filtres, maintenant);
  const dernier = tous[0];

  return (
    <div className="space-y-4">
      <section className="rounded-card border border-line bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-ink">Timeline des événements</h2>
            <p className="mt-1 max-w-xl text-xs text-ink-muted">
              Documents envoyés ou reçus, nouvelles réservations et annulations. Le tri suit la date
              du mouvement.
            </p>
          </div>
          <p className="text-xs text-ink-muted">
            {filtres.length} mouvement{filtres.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {PERIODES.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={periode === p.id}
              onClick={() => setPeriode(p.id)}
              className={cn(
                "h-11 rounded-full border px-3 text-sm md:h-9",
                periode === p.id
                  ? "border-ink bg-surface-soft text-ink"
                  : "border-line text-ink-body",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <label className="flex h-11 items-center gap-2 rounded-card border border-line px-3 text-sm md:h-9">
            <Search className="size-4 text-ink-muted" aria-hidden />
            <span className="sr-only">Rechercher</span>
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un logement, un type, un nom"
              className="w-full bg-transparent text-ink outline-none"
            />
          </label>
          <label className="block text-xs text-ink-muted">
            Tri par type
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 h-11 w-full rounded-card border border-line bg-white px-3 text-sm text-ink md:h-9"
            >
              {types.map((t) => (
                <option key={t} value={t}>
                  {t === "tous" ? "Tous les types" : t}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-ink-body">
          <input
            type="checkbox"
            checked={masquerAnnulees}
            onChange={(e) => setMasquerAnnulees(e.target.checked)}
            className="size-4 accent-accent-teal"
          />
          Masquer les réservations annulées
        </label>
      </section>

      {groupes.length === 0 ? (
        <p className="rounded-card border border-line bg-white px-4 py-8 text-sm text-ink-muted">
          Aucun événement sur cette période.
          {dernier ? ` Le dernier mouvement date du ${formaterQuand(dernier.date)}.` : ""}
        </p>
      ) : (
        groupes.map((groupe) => (
          <section key={groupe.id} className="space-y-2">
            <h3 className="px-1 text-xs font-medium uppercase tracking-[0.3px] text-ink-muted">
              {groupe.libelle}
            </h3>
            <ul className="space-y-2">
              {groupe.items.map((ev) => (
                <li key={ev.id} className="rounded-card border border-line bg-white px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-medium text-ink">{ev.titre}</p>
                    <p className="text-xs text-ink-muted">Le {formaterQuand(ev.date)}</p>
                  </div>
                  <p className="mt-2 text-xs text-ink-body">
                    Gestionnaire : {ev.acteur}
                    <span className="mx-2 text-ink-muted">·</span>
                    Type : {ev.type}
                    {ev.logement ? (
                      <>
                        <span className="mx-2 text-ink-muted">·</span>
                        {ev.logement}
                      </>
                    ) : null}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
