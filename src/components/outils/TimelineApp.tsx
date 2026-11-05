import { Check, Search } from "lucide-react";
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
        projeterDemo: true,
        maintenant,
      }),
    [session.documents, session.reservationsDossier, session.biens, maintenant],
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
    <div>
      <div className="mb-8 text-center">
        <h2 className="font-sans text-[28px] font-medium text-ink">Time line des événements</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-5 text-ink-subtle">
          Trouver par ordre chronologique la gestion des réservations et autres événements sur la
          plateforme
        </p>
      </div>

      <div className="mx-auto max-w-5xl space-y-5">
        <label className="flex h-[46px] items-center gap-3 rounded-card border border-line bg-white px-4">
          <Search className="size-4 text-ink-muted" aria-hidden />
          <span className="sr-only">Rechercher</span>
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher"
            className="h-full w-full bg-transparent text-sm outline-none placeholder:text-ink-muted"
          />
        </label>

        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-ink-body">
          <span>Tri par TYPE</span>
          {types
            .filter((t) => t !== "tous")
            .map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={type === t}
                onClick={() => setType(type === t ? "tous" : t)}
                className={cn(
                  "underline-offset-2 hover:underline",
                  type === t && "font-medium text-ink",
                )}
              >
                {t}
              </button>
            ))}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-ink-body">
          {PERIODES.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={periode === p.id}
              onClick={() => setPeriode(p.id)}
              className={cn(periode === p.id ? "font-medium text-ink" : "text-ink-muted")}
            >
              {p.label}
            </button>
          ))}
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={masquerAnnulees}
              onChange={(e) => setMasquerAnnulees(e.target.checked)}
              className="size-3.5 accent-ink"
            />
            filtre resa annulé
          </label>
        </div>

        {groupes.length === 0 ? (
          <p className="rounded-card border border-line bg-white px-4 py-8 text-center text-sm text-ink-muted">
            Aucun événement sur cette période.
            {dernier ? ` Le dernier mouvement date du ${formaterQuand(dernier.date)}.` : ""}
          </p>
        ) : (
          groupes.map((groupe) => (
            <section key={groupe.id} className="space-y-2">
              <h3 className="text-sm font-medium text-ink">{groupe.libelle}</h3>
              <ul className="space-y-2">
                {groupe.items.map((ev) => (
                  <li key={ev.id} className="rounded-[10px] bg-[#f4f5f7] px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-ink">{ev.titre}</p>
                      <p className="flex shrink-0 items-center gap-2 text-xs text-ink-muted">
                        Le {formaterQuand(ev.date)}
                        <span className="flex size-5 items-center justify-center rounded-full border border-ink/30 text-ink">
                          <Check className="size-3" aria-hidden />
                        </span>
                      </p>
                    </div>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-body">
                      <span>
                        Gestionnaire :{" "}
                        <span className="rounded-full bg-[#f6e4ea] px-2 py-0.5 text-[11px] text-ink">
                          {ev.acteur}
                        </span>
                      </span>
                      <span>TYPE : {ev.type}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
