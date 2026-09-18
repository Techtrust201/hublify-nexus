import { Link, useNavigate } from "@tanstack/react-router";
import { RetourVueGenerale } from "@/components/layout/RetourVueGenerale";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Home, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import {
  BandeauPlanning,
  ChampRechercheCalendrier,
  ColonneBienCalendrier,
  EnteteJoursCalendrier,
  type BienCalendrierChrome,
} from "@/components/dashboard/CalendrierLigne";
import { ScrollHint } from "@/components/layout/ScrollHint";
import { FiltreOnglet } from "@/components/reservations/KpiEtAccordeons";
import {
  ANCRE_PLANNING_MO1,
  AUJOURD_HUI_MO1,
  CODE_BARRE,
  ajouterJours,
  isoJour,
  paiementDe,
  reservationCouvre,
  type BienMo1,
  type PaiementMo1,
  type PlateformeMo1,
  type ReservationMo1,
} from "@/data/reservations-mo1";
import { styleBarreResa, teinteBarreCalendrier } from "@/data/planning-mo1";
import { CreateEventDialog } from "@/components/dashboard/DashboardDialogs";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  ajouterEvenement,
  ajouterNotif,
  modifierSession,
  poserOuverturesBail,
  useSession,
} from "@/data/session";
import { toastOk } from "@/lib/feedback";
import { cn } from "@/lib/utils";

const JOURS_MOIS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

type VuePlanning = "3jours" | "5jours" | "mois";
type FiltrePlateforme = "tout" | PlateformeMo1;

export function PlanningReservations({
  onSelectReservation,
}: {
  onVoirListe?: () => void;
  onSelectReservation?: (id: string) => void;
}) {
  const navigate = useNavigate();
  const session = useSession();
  const [vue, setVue] = useState<VuePlanning>("3jours");
  const [ancre, setAncre] = useState(() => new Date(ANCRE_PLANNING_MO1));
  const [plateforme, setPlateforme] = useState<FiltrePlateforme>("tout");
  const [sectionOuverte, setSectionOuverte] = useState(false);
  const [bienLocalise, setBienLocalise] = useState<string | null>(null);
  const [selection, setSelection] = useState<ReservationMo1 | null>(null);
  const datesBloquees = session.datesBloquees;
  const setDatesBloquees = (
    next: typeof datesBloquees | ((prev: typeof datesBloquees) => typeof datesBloquees),
  ) => {
    const resolu = typeof next === "function" ? next(datesBloquees) : next;
    modifierSession((e) => ({ ...e, datesBloquees: resolu }));
  };
  const [voirBloquees, setVoirBloquees] = useState(true);
  const [periode, setPeriode] = useState<{ bienId: string; debut: string } | null>(null);
  const [finPeriode, setFinPeriode] = useState("");
  const [note, setNote] = useState<{ date: string; bienNom: string } | null>(null);
  const [rechercheCal, setRechercheCal] = useState("");

  const poserOuverture = (bienId: string, debut: string, fin: string) => {
    const n = poserOuverturesBail(bienId, debut, fin);
    setVoirBloquees(true);
    toastOk(`Période d'ouverture type bail posée (${n} jour${n > 1 ? "s" : ""}).`);
  };

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
    let source = session.reservationsDossier;
    if (plateforme !== "tout") source = source.filter((r) => r.plateforme === plateforme);
    const q = rechercheCal.trim().toLowerCase();
    if (q) {
      source = source.filter(
        (r) =>
          r.occupant.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.plateforme.toLowerCase().includes(q),
      );
    }
    return source;
  }, [plateforme, rechercheCal, session.reservationsDossier]);

  const biens = useMemo(() => {
    const source = session.biens.map(
      (b): BienMo1 & BienCalendrierChrome => ({
        id: b.id,
        nom: b.nom,
        adresse: b.adresse ?? "",
        typologie: b.typologie,
        statut: b.statut,
        plateformes: {
          Airbnb: "aucun",
          "Booking.com": "aucun",
          Direct: "actif",
          Autre: "aucun",
        },
      }),
    );
    const q = rechercheCal.trim().toLowerCase();
    const parNom = q
      ? source.filter(
          (b) =>
            b.nom.toLowerCase().includes(q) ||
            (b.typologie ?? "").toLowerCase().includes(q) ||
            reservations.some((r) => r.bienId === b.id),
        )
      : source;
    if (!bienLocalise) return parNom;
    return parNom.filter((b) => b.id === bienLocalise);
  }, [bienLocalise, rechercheCal, reservations, session.biens]);

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
    <div className="overflow-hidden rounded-card border border-line bg-white">
      <div className="flex items-center gap-2 border-b border-line bg-[#f7f6f3] px-3">
        <RetourVueGenerale className="my-auto h-9 shrink-0 border-line" />
        <BandeauPlanning
          actif="reservations"
          onChoisir={(id) => {
            if (id !== "reservations") allerOnglet(id);
          }}
        />
      </div>

      <div className="border-b border-surface-soft px-4 py-2">
        <ChampRechercheCalendrier
          valeur={rechercheCal}
          onChange={setRechercheCal}
          placeholder="Rechercher un logement ou un occupant…"
        />
      </div>

      <div className="border-b border-surface-soft px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            className="flex min-h-11 items-center gap-2 text-xs text-ink-body md:min-h-0"
            onClick={() => setSectionOuverte((v) => !v)}
          >
            <Home className="size-3.5" />
            <span>Logements & plateformes</span>
            <span className="text-ink-muted">(4 biens)</span>
          </button>
          <div className="flex items-center gap-2">
            <Link
              to="/patrimoines"
              className="inline-flex h-11 items-center gap-1 rounded border border-line-strong bg-white px-2.5 text-xs font-medium text-ink-body md:h-[26px]"
            >
              <Home className="size-2.5" />
              Voir tous mes biens
            </Link>
            <button
              type="button"
              aria-label={sectionOuverte ? "Replier" : "Déplier"}
              onClick={() => setSectionOuverte((v) => !v)}
              className="flex size-11 shrink-0 items-center justify-center md:size-3.5"
            >
              {sectionOuverte ? (
                <ChevronUp className="size-3.5 text-ink-muted" />
              ) : (
                <ChevronDown className="size-3.5 text-ink-muted" />
              )}
            </button>
          </div>
        </div>
        {sectionOuverte && <TableauLogements onLocaliser={setBienLocalise} actif={bienLocalise} />}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-surface-soft bg-surface/50 px-4 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Précédent"
            className="flex size-11 items-center justify-center rounded border border-line text-ink-body"
            onClick={() =>
              setAncre((d) =>
                vue === "mois"
                  ? new Date(d.getFullYear(), d.getMonth() - 1, 1)
                  : ajouterJours(d, -nbJours),
              )
            }
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <span className="min-w-24 text-center text-xs capitalize text-ink-body">
            {ancre.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
          </span>
          <button
            type="button"
            aria-label="Suivant"
            className="flex size-11 items-center justify-center rounded border border-line text-ink-body"
            onClick={() =>
              setAncre((d) =>
                vue === "mois"
                  ? new Date(d.getFullYear(), d.getMonth() + 1, 1)
                  : ajouterJours(d, nbJours),
              )
            }
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>

        <div className="flex overflow-hidden rounded border border-line">
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
                "h-11 min-h-11 border-r border-line px-3 text-xs font-medium last:border-r-0",
                vue === id ? "bg-ink text-white" : "bg-white text-ink-body",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="hidden h-4 w-px bg-line sm:block" />

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-ink-muted">Plateforme :</span>
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
          onClick={() => {
            const bienId = biens[0]?.id ?? "";
            const debut = isoJour(ancre);
            setPeriode({ bienId, debut });
            setFinPeriode(debut);
          }}
          className="inline-flex h-11 min-h-11 items-center rounded border border-line bg-white px-2.5 text-xs font-medium text-ink-body md:h-[26px] md:min-h-[26px]"
        >
          Période d'ouverture BAIL
        </button>
        <button
          type="button"
          onClick={() =>
            setNote({
              date: isoJour(ancre),
              bienNom: biens[0]?.nom ?? "",
            })
          }
          className="inline-flex h-11 min-h-11 items-center rounded border border-line bg-white px-2.5 text-xs font-medium text-ink-body md:h-[26px] md:min-h-[26px]"
        >
          Note
        </button>
        <Link
          to="/reservations/nouveau"
          className="inline-flex h-11 min-h-11 items-center gap-1 rounded border border-line bg-white px-2.5 text-xs font-medium text-ink-body md:h-[26px] md:min-h-[26px]"
        >
          <Plus className="size-2.5" />
          Nouvelle réservation
        </Link>
      </div>

      {vue === "mois" ? (
        <GrilleMois
          jours={joursMois}
          ancre={ancre}
          reservations={reservations}
          onSelect={(r) => {
            setSelection(r);
            onSelectReservation?.(r.id);
          }}
        />
      ) : (
        <GrilleJours
          biens={biens}
          jours={jours}
          reservations={reservations}
          datesBloquees={voirBloquees ? datesBloquees : []}
          onSelect={(r) => {
            setSelection(r);
            onSelectReservation?.(r.id);
          }}
          onBloquer={bloquerJour}
        />
      )}
      <Dialog
        open={Boolean(periode)}
        onOpenChange={(o) => {
          if (!o) setPeriode(null);
        }}
      >
        <DialogContent className="max-w-md rounded-card border border-line bg-white p-5">
          <DialogTitle className="text-sm font-medium text-ink">Période d'ouverture type bail</DialogTitle>
          <DialogDescription className="text-xs text-ink-muted">
            Fenêtre type bail : les jours sont marqués sur le calendrier et alignent les réservations.
          </DialogDescription>
          <label className="mt-3 block text-xs text-ink-muted">
            Début
            <input
              type="date"
              value={periode?.debut ?? ""}
              onChange={(e) => setPeriode((p) => (p ? { ...p, debut: e.target.value } : p))}
              className="mt-1 h-10 w-full rounded-card border border-line px-3 text-sm"
            />
          </label>
          <label className="mt-3 block text-xs text-ink-muted">
            Fin
            <input
              type="date"
              value={finPeriode}
              onChange={(e) => setFinPeriode(e.target.value)}
              className="mt-1 h-10 w-full rounded-card border border-line px-3 text-sm"
            />
          </label>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setPeriode(null)} className="h-9 rounded-card border border-line px-3 text-xs">
              Annuler
            </button>
            <button
              type="button"
              onClick={() => {
                if (!periode?.debut || !finPeriode) return;
                poserOuverture(periode.bienId, periode.debut, finPeriode);
                setPeriode(null);
              }}
              className="h-9 rounded-card bg-ink px-3 text-xs font-medium text-white"
            >
              Enregistrer
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <CreateEventDialog
        ouvert={Boolean(note)}
        onFermer={() => setNote(null)}
        debutInitial={note?.date}
        bienInitial={note?.bienNom}
        onCreer={(e) => {
          ajouterEvenement(e);
          ajouterNotif({ titre: "Note calendrier", detail: e.titre, href: "/reservations" });
          toastOk("Note enregistrée.");
        }}
      />
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
  const session = useSession();
  return (
    <div className="mt-3 overflow-hidden rounded-card border border-line">
      <ScrollHint>
        <div className="grid min-w-[520px] grid-cols-[1fr_80px_80px_80px_80px] border-b border-surface-soft bg-surface px-4 py-1.5 text-[11px] text-ink-muted">
          <span>Bien</span>
          <span className="text-center">Airbnb</span>
          <span className="text-center">Booking.com</span>
          <span className="text-center">Direct</span>
          <span />
        </div>
        {session.biens.map((b) => (
          <div
            key={b.id}
            className={cn(
              "grid min-w-[520px] grid-cols-[1fr_80px_80px_80px_80px] items-center border-b border-surface-soft px-4 py-2.5 last:border-b-0",
              actif === b.id && "bg-surface",
            )}
          >
            <span className="flex items-center gap-2 text-xs text-ink-body">
              <span className="flex size-6 items-center justify-center rounded border border-line bg-surface-soft">
                <Home className="size-2.5" />
              </span>
              {b.nom}
            </span>
            <StatutPlateforme etat="aucun" />
            <StatutPlateforme etat="aucun" />
            <StatutPlateforme etat="actif" />
            <button
              type="button"
              onClick={() => onLocaliser(actif === b.id ? null : b.id)}
              className="inline-flex h-11 min-h-11 items-center justify-self-center rounded border border-line-strong px-2 text-[11px] text-ink-body md:h-auto md:min-h-0 md:py-0.5"
            >
              Localiser
            </button>
          </div>
        ))}
        <div className="flex flex-wrap gap-4 px-4 py-2 text-[11px] text-ink-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-ink" /> Actif sur la plateforme
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full border border-ink-muted" /> Inactif
          </span>
          <span className="flex items-center gap-1.5">— Non référencé</span>
        </div>
      </ScrollHint>
    </div>
  );
}

function StatutPlateforme({ etat }: { etat: "actif" | "inactif" | "aucun" }) {
  if (etat === "aucun") {
    return <span className="text-center text-xs text-ink-muted">—</span>;
  }
  return (
    <span
      className={cn(
        "justify-self-center rounded px-2 py-0.5 text-[11px]",
        etat === "actif" ? "bg-ink text-white" : "border border-line text-ink-muted",
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
  biens: (BienMo1 & BienCalendrierChrome)[];
  jours: Date[];
  reservations: ReservationMo1[];
  datesBloquees: { id: string; bienId: string; date: string; motif?: string }[];
  onSelect: (r: ReservationMo1) => void;
  onBloquer: (bienId: string, date: string) => void;
}) {
  return (
    <ScrollHint snap>
      <div
        className="grid min-w-[860px]"
        style={{ gridTemplateColumns: `136px repeat(${jours.length}, minmax(200px, 1fr))` }}
      >
        <EnteteJoursCalendrier jours={jours} aujourdHui={AUJOURD_HUI_MO1} isoJour={isoJour} />
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
    </ScrollHint>
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
  bien: BienMo1 & BienCalendrierChrome;
  jours: Date[];
  sejours: ReservationMo1[];
  bloquees: { id: string; date: string; motif?: string }[];
  onSelect: (r: ReservationMo1) => void;
  onBloquer: (bienId: string, date: string) => void;
}) {
  return (
    <div className="contents">
      <ColonneBienCalendrier bien={bien} />
      <div
        className="relative min-h-[148px] border-b border-line"
        style={{ gridColumn: `2 / span ${jours.length}` }}
      >
        <div
          className="absolute inset-0 grid"
          style={{ gridTemplateColumns: `repeat(${jours.length}, minmax(0, 1fr))` }}
        >
          {jours.map((d) => {
            const key = isoJour(d);
            const occupe = sejours.some((r) => reservationCouvre(r, key));
            const bloc = bloquees.find((b) => b.date === key);
            const bloquee = Boolean(bloc);
            const ouverture = bloc?.motif === "Ouverture" || bloc?.motif === "Ouverture BAIL";
            return (
              <div
                key={key}
                className={cn(
                  "group/case relative border-r border-line",
                  key === AUJOURD_HUI_MO1 && "bg-[#f8f8f8]",
                  bloquee &&
                    (ouverture
                      ? "bg-[color-mix(in_srgb,var(--accent-teal)_12%,white)]"
                      : "bg-[repeating-linear-gradient(-45deg,var(--surface-soft),var(--surface-soft)_4px,var(--surface-elevated)_4px,var(--surface-elevated)_8px)]"),
                )}
              >
                <Link
                  to="/reservations/nouveau"
                  search={{ bien: bien.id, arrivee: key }}
                  className="absolute bottom-1.5 left-1/2 z-[2] flex size-7 -translate-x-1/2 items-center justify-center rounded-full border border-dashed border-line bg-white text-ink-muted"
                  aria-label={`Nouvelle réservation — ${bien.nom}`}
                >
                  <Plus className="size-3" />
                </Link>
                {bloquee && !occupe && (
                  <button
                    type="button"
                    onClick={() => onBloquer(bien.id, key)}
                    className="flex h-full w-full items-center justify-center text-[10px] font-medium text-ink-muted"
                  >
                    {ouverture ? "Ouverture" : "Bloqué"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {sejours.map((r) => {
          const barre = styleBarreResa(r, jours);
          if (!barre) return null;
          const paiement = paiementDe(r);
          const teinte = teinteBarreCalendrier(r, jours);
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect(r)}
              className="absolute top-[54px] z-[1] flex h-10 items-center gap-1.5 rounded-lg border px-2.5"
              style={{
                ...barre,
                backgroundColor: teinte.fond,
                borderColor: teinte.bord,
              }}
            >
              <span className="shrink-0 rounded border border-line-strong bg-white/80 px-1 py-0.5 text-[9px] font-medium text-ink-status">
                {CODE_BARRE[r.plateforme]}
              </span>
              <span className="truncate text-left text-xs font-medium text-ink-subtle">
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
      <div className="grid grid-cols-7 border-b border-line">
        {JOURS_MOIS.map((j) => (
          <div
            key={j}
            className="whitespace-nowrap px-0.5 py-2 text-center text-[10px] text-ink-muted sm:px-2 sm:text-xs"
          >
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
                "group min-h-24 border-b border-r border-line p-1.5",
                hors && "bg-surface",
                key === AUJOURD_HUI_MO1 && "bg-surface",
              )}
            >
              <p className="mb-1 text-xs text-ink-body">{d.getDate()}</p>
              <div className="space-y-0.5">
                {list.slice(0, 3).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onSelect(r)}
                    className="block w-full truncate rounded bg-line px-1.5 py-0.5 text-left text-[10px] text-ink-status"
                  >
                    {CODE_BARRE[r.plateforme]} · {r.occupant.split(" ")[0]}
                  </button>
                ))}
                {list.length > 3 && (
                  <p className="px-1 text-[10px] text-ink-muted">+{list.length - 3} autres</p>
                )}
                {!hors && (
                  <div className="flex justify-center pt-2">
                    <Link
                      to="/reservations/nouveau"
                      search={{ arrivee: key }}
                      className="flex size-6 items-center justify-center rounded border border-dashed border-line text-ink-muted"
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
        etat === "paye" && "bg-ink-subtle",
        etat === "partiel" &&
          "border border-ink-subtle bg-[linear-gradient(90deg,var(--ink-subtle)_50%,transparent_50%)]",
        etat === "impaye" && "border border-ink-muted bg-white",
      )}
    />
  );
}

function LegendePlanning({ bloque }: { bloque?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-t border-surface-soft px-4 py-2 text-[11px] text-ink-muted">
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-ink-subtle" /> Payé
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full border border-ink-subtle bg-[linear-gradient(90deg,var(--ink-subtle)_50%,transparent_50%)]" />{" "}
        Partiel
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full border border-ink-muted" /> Impayé
      </span>
      {bloque && (
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded border border-line bg-[repeating-linear-gradient(-45deg,var(--surface-soft),var(--surface-soft)_2px,var(--surface-elevated)_2px,var(--surface-elevated)_4px)]" />{" "}
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
