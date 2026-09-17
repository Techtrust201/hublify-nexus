// SOURCE: Maquette MO1 — grille biens × jours (Missions / Tarifs, 3 jours / 5 jours / mois)

import { Link, useRouterState } from "@tanstack/react-router";
import {
  estPagePlanningHorsAccueil,
  RetourVueGenerale,
} from "@/components/layout/RetourVueGenerale";
import {
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  Plus,
  SlidersHorizontal,
  Tag,
} from "lucide-react";
import { useMemo, useState } from "react";
import { CreatePrestationDialog } from "@/components/dashboard/CreatePrestationDialog";
import {
  CreateEventDialog,
  CreateRegleDialog,
  GererReglesPanel,
  MissionInfoDialog,
  MissionsPlusPopover,
} from "@/components/dashboard/DashboardDialogs";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ScrollHint } from "@/components/layout/ScrollHint";
import {
  ANCRE_MO1,
  AUJOURD_HUI_MO1,
  ajouterJours,
  emojiType,
  isoJour,
  prixDuJour,
  reservationCouvre,
  styleBarreResa,
  type BienMo1,
  type EnsembleRegles,
  type FiltreMission,
  type MissionMo1,
  type OngletPlanning,
  type RegleTarif,
  type ReservationMo1,
  type VuePlanning,
} from "@/data/planning-mo1";
import {
  ajouterEvenement,
  ajouterNotif,
  modifierSession,
  poserOuverturesBail,
  retirerMission,
  useSession,
} from "@/data/session";
import { confirmer, toastOk } from "@/lib/feedback";
import { idDossierPourCalendrier } from "@/data/v1-metier";
import { cn } from "@/lib/utils";

const JOURS_SEM = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];

export function PlanningGrid({
  onglet,
  onOnglet,
  vueInitiale = "3jours",
  onReservation,
}: {
  onglet: OngletPlanning;
  onOnglet: (v: OngletPlanning) => void;
  vueInitiale?: VuePlanning;
  onReservation?: (id: string) => void;
}) {
  const session = useSession();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const retourAccueil = estPagePlanningHorsAccueil(pathname);
  const missions = session.missions;
  const sejoursCal = session.reservationsCalendrier;
  const biens: BienMo1[] = session.biens.map((b) => ({
    id: b.id,
    nom: b.nom,
    baseNuit: b.baseNuit,
  }));
  const [vue, setVue] = useState<VuePlanning>(vueInitiale);
  const [ancre, setAncre] = useState(() => new Date(ANCRE_MO1));
  const [filtre, setFiltre] = useState<FiltreMission>("tous");
  const [missionOuverte, setMissionOuverte] = useState<MissionMo1 | null>(null);
  const [prestation, setPrestation] = useState<{
    bienId: string;
    date: string;
    mission?: MissionMo1;
  } | null>(null);
  const [note, setNote] = useState<{ date: string; bienNom: string } | null>(null);
  const ensembles = session.ensembles;
  const regles = session.regles;
  const setEnsembles = (
    next: EnsembleRegles[] | ((prev: EnsembleRegles[]) => EnsembleRegles[]),
  ) => {
    const resolu = typeof next === "function" ? next(ensembles) : next;
    modifierSession((e) => ({ ...e, ensembles: resolu }));
  };
  const setRegles = (next: RegleTarif[] | ((prev: RegleTarif[]) => RegleTarif[])) => {
    const resolu = typeof next === "function" ? next(regles) : next;
    modifierSession((e) => ({ ...e, regles: resolu }));
  };
  const [creerRegle, setCreerRegle] = useState(false);
  const [cibleRegle, setCibleRegle] = useState<{ bienId?: string; date?: string }>({});
  const [gererRegles, setGererRegles] = useState(false);
  const [ensembleCible, setEnsembleCible] = useState("en1");
  const [filtreBienTarif, setFiltreBienTarif] = useState<string>("tous");
  const [periode, setPeriode] = useState<{ bienId: string; debut: string } | null>(null);
  const [finPeriode, setFinPeriode] = useState("");

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

  const missionsFiltrees = useMemo(() => {
    if (filtre === "checkin") return missions.filter((m) => m.type === "Check-in");
    if (filtre === "checkout") return missions.filter((m) => m.type === "Check-out");
    return missions;
  }, [filtre, missions]);

  const biensTarif =
    filtreBienTarif === "tous" ? biens : biens.filter((b) => b.id === filtreBienTarif);

  const reglesActives = regles.filter((r) => ensembles.find((e) => e.id === r.ensembleId)?.actif);
  const ensemblesActifs = ensembles.filter((e) => e.actif).length;

  return (
    <div className="overflow-hidden rounded-card border border-line bg-white">
      <div className="flex min-w-0 items-center justify-between border-b border-line px-4">
        <div className="min-w-0 flex-1 overflow-x-auto">
          {retourAccueil && (
            <RetourVueGenerale className="mr-3 mt-2 h-9 border-line md:mt-0" />
          )}
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
                "h-[46px] shrink-0 whitespace-nowrap border-b-2 px-4 text-sm font-medium capitalize",
                onglet === id
                  ? "rounded-t-[8px] border-ink bg-tab-active text-ink-deep"
                  : "border-transparent text-ink-subtle",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {onglet === "tarifs" && (
          <button
            type="button"
            onClick={() => setGererRegles(true)}
            aria-label="Gérer les ensembles de règles"
            className="inline-flex size-11 shrink-0 items-center justify-center gap-1.5 rounded border border-line text-xs font-medium text-ink-body md:h-[30px] md:w-auto md:px-3"
          >
            <SlidersHorizontal className="size-3" />
            <span className="hidden md:inline">Gérer les ensembles de règles</span>
          </button>
        )}
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
                vue === id ? "bg-tab-active text-ink-body" : "bg-white text-ink-body",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="hidden h-4 w-px bg-line sm:block" />

        {onglet === "tarifs" ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="flex items-center gap-2 text-xs text-ink-muted">
              <Tag className="size-3" />
              {reglesActives.length} règles actives sur {ensemblesActifs} ensemble
              {ensemblesActifs > 1 ? "s" : ""}
            </p>
            {vue === "mois" && (
              <label className="flex items-center gap-2 text-xs text-ink-body">
                Voir les tarifs de :
                <select
                  value={filtreBienTarif}
                  onChange={(e) => setFiltreBienTarif(e.target.value)}
                  className="h-11 rounded border border-line bg-white px-2 text-xs outline-none md:h-[26px]"
                >
                  <option value="tous">Tous les biens</option>
                  {biens.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nom}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-muted">Filtrer :</span>
            <button
              type="button"
              onClick={() => setFiltre((f) => (f === "checkin" ? "tous" : "checkin"))}
              className={cn(
                "inline-flex h-11 min-h-11 items-center gap-1 rounded border px-2.5 text-xs font-medium md:h-[26px] md:min-h-[26px]",
                filtre === "checkin"
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-white text-ink-body",
              )}
            >
              <LogIn className="size-2.5" />
              Taches
            </button>
            <button
              type="button"
              onClick={() => setFiltre((f) => (f === "checkout" ? "tous" : "checkout"))}
              className={cn(
                "inline-flex h-11 min-h-11 items-center gap-1 rounded border px-2.5 text-xs font-medium md:h-[26px] md:min-h-[26px]",
                filtre === "checkout"
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-white text-ink-body",
              )}
            >
              <LogOut className="size-2.5" />
              CheckOut
            </button>
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
          </div>
        )}
      </div>

      {onglet === "tarifs" ? (
        vue === "mois" ? (
          <TarifsMois
            jours={joursMois}
            ancre={ancre}
            biens={biensTarif}
            ensembles={ensembles}
            regles={regles}
            sejours={sejoursCal}
            onCreerRegle={(bienId, date) => {
              setCibleRegle({ bienId, date });
              setCreerRegle(true);
            }}
          />
        ) : (
          <TarifsJours
            jours={jours}
            biens={biens}
            ensembles={ensembles}
            regles={regles}
            sejours={sejoursCal}
            onCreerRegle={(bienId, date) => {
              setCibleRegle({ bienId, date });
              setCreerRegle(true);
            }}
          />
        )
      ) : vue === "mois" ? (
        <MoisMissions
          jours={joursMois}
          ancre={ancre}
          missions={missionsFiltrees}
          onMission={setMissionOuverte}
          onAjouter={(date) =>
            setPrestation({ bienId: biens[0]?.id ?? "", date })
          }
        />
      ) : (
        <JoursMissions
          jours={jours}
          biens={biens}
          missions={missionsFiltrees}
          sejours={sejoursCal}
          onMission={setMissionOuverte}
          onReservation={(sejour) => {
            const id = idDossierPourCalendrier(sejour, session.reservationsDossier);
            if (id) onReservation?.(id);
          }}
          onAjouterPrestation={(bienId, date) => setPrestation({ bienId, date })}
          onAjouterNote={(bienId, date) =>
            setNote({ date, bienNom: biens.find((b) => b.id === bienId)?.nom ?? "" })
          }
        />
      )}

      {onglet === "tarifs" && (
        <CartesEnsembles
          ensembles={ensembles}
          regles={regles}
          onToggle={(id) =>
            setEnsembles((list) => list.map((e) => (e.id === id ? { ...e, actif: !e.actif } : e)))
          }
        />
      )}

      <MissionInfoDialog
        mission={missionOuverte}
        bienNom={biens.find((b) => b.id === missionOuverte?.bienId)?.nom ?? ""}
        ouvert={Boolean(missionOuverte)}
        onFermer={() => setMissionOuverte(null)}
        onStatut={(id, statut) => {
          modifierSession((e) => ({
            ...e,
            missions: e.missions.map((m) => (m.id === id ? { ...m, statut } : m)),
          }));
          setMissionOuverte((m) => (m && m.id === id ? { ...m, statut } : m));
        }}
        onModifier={(m) => {
          setMissionOuverte(null);
          setPrestation({ bienId: m.bienId, date: m.date, mission: m });
        }}
        onSupprimer={async (m) => {
          const ok = await confirmer({
            titre: "Supprimer cette prestation ?",
            description: `${m.titre} disparaît du calendrier.`,
            libelleConfirmer: "Supprimer",
            danger: true,
          });
          if (!ok) return;
          retirerMission(m.id);
          setMissionOuverte(null);
          toastOk("Prestation supprimée.");
        }}
      />
      <CreatePrestationDialog
        ouvert={Boolean(prestation)}
        onFermer={() => setPrestation(null)}
        bienId={prestation?.bienId}
        date={prestation?.date}
        mission={prestation?.mission}
      />
      <Dialog
        open={Boolean(periode)}
        onOpenChange={(o) => {
          if (!o) setPeriode(null);
        }}
      >
        <DialogContent className="max-w-md rounded-card border border-line bg-white p-5">
          <DialogTitle className="text-sm font-medium text-ink">
            Période d'ouverture type bail
          </DialogTitle>
          <DialogDescription className="text-xs text-ink-muted">
            Depuis le calendrier général : les jours s'alignent sur les deux plannings.
          </DialogDescription>
          <label className="mt-3 block text-xs text-ink-muted">
            Logement
            <select
              value={periode?.bienId ?? ""}
              onChange={(e) => setPeriode((p) => (p ? { ...p, bienId: e.target.value } : p))}
              className="mt-1 h-10 w-full rounded-card border border-line px-3 text-sm"
            >
              {biens.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nom}
                </option>
              ))}
            </select>
          </label>
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
            <button
              type="button"
              onClick={() => setPeriode(null)}
              className="h-9 rounded-card border border-line px-3 text-xs"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => {
                if (!periode?.bienId || !periode.debut || !finPeriode) return;
                const n = poserOuverturesBail(periode.bienId, periode.debut, finPeriode);
                setPeriode(null);
                toastOk(`Période d'ouverture type bail posée (${n} jour${n > 1 ? "s" : ""}).`);
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
          ajouterNotif({ titre: "Note calendrier", detail: e.titre, href: "/" });
          toastOk("Note enregistrée.");
        }}
      />
      <CreateRegleDialog
        ouvert={creerRegle}
        onFermer={() => {
          setCreerRegle(false);
          setCibleRegle({});
        }}
        ensembles={ensembles}
        {...(cibleRegle.bienId ? { bienIdInitial: cibleRegle.bienId } : {})}
        {...(cibleRegle.date ? { dateInitiale: cibleRegle.date } : {})}
        onCreer={(r, nouvelEnsemble) => {
          if (nouvelEnsemble) {
            const id = `en-${Date.now()}`;
            setEnsembles((list) => [
              ...list,
              { id, nom: nouvelEnsemble, description: "Ensemble créé", actif: true },
            ]);
            setRegles((list) => [...list, { ...r, ensembleId: id }]);
            return;
          }
          setRegles((list) => [...list, { ...r, ensembleId: ensembleCible || r.ensembleId }]);
        }}
      />
      <GererReglesPanel
        ouvert={gererRegles}
        onFermer={() => setGererRegles(false)}
        ensembles={ensembles}
        regles={regles}
        onToggleEnsemble={(id) =>
          setEnsembles((list) => list.map((e) => (e.id === id ? { ...e, actif: !e.actif } : e)))
        }
        onSupprimerEnsemble={(id) => {
          setEnsembles((list) => list.filter((e) => e.id !== id));
          setRegles((list) => list.filter((r) => r.ensembleId !== id));
        }}
        onSupprimerRegle={(id) => setRegles((list) => list.filter((r) => r.id !== id))}
        onAjouterRegle={(id) => {
          setEnsembleCible(id);
          setCibleRegle({});
          setGererRegles(false);
          setCreerRegle(true);
        }}
      />
    </div>
  );
}

function JoursMissions({
  jours,
  biens,
  missions,
  sejours,
  onMission,
  onReservation,
  onAjouterPrestation,
  onAjouterNote,
}: {
  jours: Date[];
  biens: BienMo1[];
  missions: MissionMo1[];
  sejours: ReservationMo1[];
  onMission: (m: MissionMo1) => void;
  onReservation?: (r: ReservationMo1) => void;
  onAjouterPrestation?: (bienId: string, date: string) => void;
  onAjouterNote?: (bienId: string, date: string) => void;
}) {
  return (
    <ScrollHint snap>
      <div
        className="grid min-w-[720px]"
        style={{ gridTemplateColumns: `130px repeat(${jours.length}, minmax(180px, 1fr))` }}
      >
        <div className="sticky left-0 z-[5] border-b border-r border-line bg-white" />
        {jours.map((d) => {
          const key = isoJour(d);
          return (
            <div
              key={key}
              className={cn(
                "snap-start border-b border-r border-surface-soft py-2 text-center",
                key === AUJOURD_HUI_MO1 && "bg-surface",
              )}
            >
              <p className="text-xs uppercase text-ink-muted">
                {d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "")}
              </p>
              <p
                className={cn(
                  "text-sm text-ink-body",
                  key === AUJOURD_HUI_MO1 && "font-semibold text-ink",
                )}
              >
                {d.getDate()}
              </p>
            </div>
          );
        })}

        {biens.map((bien) => (
          <LigneBien
            key={bien.id}
            bien={bien}
            jours={jours}
            missions={missions.filter((m) => m.bienId === bien.id)}
            sejours={sejours.filter((r) => r.bienId === bien.id)}
            onMission={onMission}
            {...(onReservation ? { onReservation } : {})}
            {...(onAjouterPrestation ? { onAjouterPrestation } : {})}
            {...(onAjouterNote ? { onAjouterNote } : {})}
          />
        ))}
      </div>
    </ScrollHint>
  );
}

function LigneBien({
  bien,
  jours,
  missions,
  sejours,
  onMission,
  onReservation,
  onAjouterPrestation,
  onAjouterNote,
}: {
  bien: BienMo1;
  jours: Date[];
  missions: MissionMo1[];
  sejours: ReservationMo1[];
  onMission: (m: MissionMo1) => void;
  onReservation?: (r: ReservationMo1) => void;
  onAjouterPrestation?: (bienId: string, date: string) => void;
  onAjouterNote?: (bienId: string, date: string) => void;
}) {
  const aUneResa = sejours.some((r) => jours.some((d) => reservationCouvre(r, isoJour(d))));
  const aUneMission = missions.some((m) => jours.some((d) => isoJour(d) === m.date));
  const ligneHaute = aUneResa || aUneMission;

  return (
    <div className="contents">
      <div className="sticky left-0 z-[5] border-b border-r border-line bg-white px-3 py-3 text-xs text-ink-body">
        {bien.nom}
      </div>
      <div
        className="relative grid border-b border-surface-soft"
        style={{
          gridColumn: `2 / span ${jours.length}`,
          gridTemplateColumns: `repeat(${jours.length}, minmax(0, 1fr))`,
        }}
      >
        {jours.map((d) => {
          const key = isoJour(d);
          const duJour = missions.filter((m) => m.date === key);
          const visible = duJour[0];
          const reserve = sejours.some((r) => reservationCouvre(r, key));
          return (
            <div
              key={key}
              className={cn(
                "relative border-r border-surface-soft",
                ligneHaute ? "min-h-[104px]" : "min-h-[52px]",
                key === AUJOURD_HUI_MO1 && "bg-surface/60",
                onAjouterPrestation && "cursor-pointer",
              )}
              onClick={() => onAjouterPrestation?.(bien.id, key)}
            >
              <div
                className={cn(
                  "flex items-center justify-center",
                  ligneHaute ? "h-[52px]" : "h-full",
                )}
              >
                <Link
                  to="/reservations/nouveau"
                  search={{ bien: bien.id, arrivee: key }}
                  className="flex size-11 items-center justify-center md:size-5"
                  aria-label={`Ajouter une réservation — ${bien.nom}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full border text-ink-muted",
                      reserve ? "border-dashed border-line bg-white/80" : "border-line-strong",
                    )}
                  >
                    <Plus className="size-2.5" />
                  </span>
                </Link>
              </div>
              {ligneHaute && (
                <div className="absolute inset-x-0 top-[52px] z-[2] space-y-0.5 border-t border-line bg-[color-mix(in srgb, var(--surface) 40%, transparent)] p-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAjouterPrestation?.(bien.id, key);
                    }}
                    className="flex h-6 w-full items-center justify-center rounded border border-dashed border-line text-[10px] text-ink-muted hover:bg-white"
                    aria-label={`Ajouter une prestation — ${bien.nom}`}
                  >
                    <Plus className="size-2.5" />
                  </button>
                  {onAjouterNote && (
                    <button
                      type="button"
                      onClick={() => onAjouterNote(bien.id, key)}
                      className="flex h-5 w-full items-center justify-center rounded text-[10px] text-ink-muted hover:bg-white"
                    >
                      Note
                    </button>
                  )}
                  {visible && (
                    <div onClick={(e) => e.stopPropagation()}>
                    <Pastille
                      mission={visible}
                      onClick={() => onMission(visible)}
                    />
                    </div>
                  )}
                  {duJour.length > 1 && (
                    <MissionsPlusPopover
                      bienNom={bien.nom}
                      dateLabel={d.toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                      missions={duJour}
                      onChoisir={onMission}
                    />
                  )}
                </div>
              )}
              {!ligneHaute && onAjouterPrestation && (
                <div className="absolute bottom-1 right-1 flex gap-1">
                  <button
                    type="button"
                    onClick={() => onAjouterPrestation(bien.id, key)}
                    className="flex size-6 items-center justify-center rounded-full border border-line bg-white text-ink-muted"
                    aria-label={`Ajouter une prestation — ${bien.nom}`}
                  >
                    <Plus className="size-2.5" />
                  </button>
                  {onAjouterNote && (
                    <button
                      type="button"
                      onClick={() => onAjouterNote(bien.id, key)}
                      className="flex h-6 items-center rounded-full border border-line bg-white px-1.5 text-[9px] text-ink-muted"
                    >
                      Note
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {aUneResa &&
          sejours.map((r) => {
            const barre = styleBarreResa(r, jours);
            if (!barre) return null;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onReservation?.(r)}
                className="absolute top-1.5 z-[1] flex h-10 items-center justify-between rounded-lg border border-line-strong bg-surface-soft px-2.5 text-left hover:bg-white"
                style={barre}
              >
                <span className="truncate text-xs text-ink-subtle">{r.voyageur}</span>
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full border border-ink-muted text-[9px] font-semibold text-ink-subtle">
                  i
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );
}

function Pastille({ mission, onClick }: { mission: MissionMo1; onClick: () => void }) {
  const terminee = mission.statut === "terminee";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        // 24px sur mobile : minimum WCAG 2.5.8 ; 21px sur desktop pour rester fidèle à MO1
        "flex h-11 w-full items-center gap-1 overflow-hidden rounded border px-1 text-left text-[10px] font-medium md:h-[21px]",
        terminee
          ? "border-line bg-surface-soft text-ink-muted line-through opacity-70"
          : mission.pastilleAccentuee
            ? "border-ink-muted bg-line text-ink-status"
            : "border-line-strong bg-white text-ink-body",
      )}
    >
      <span>{mission.emoji}</span>
      <span className="truncate">{mission.titre}</span>
    </button>
  );
}

function MoisMissions({
  jours,
  ancre,
  missions,
  onMission,
  onAjouter,
}: {
  jours: Date[];
  ancre: Date;
  missions: MissionMo1[];
  onMission: (m: MissionMo1) => void;
  onAjouter?: (date: string) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-7 border-b border-line">
        {JOURS_SEM.map((j) => (
          <div
            key={j}
            className="whitespace-nowrap px-0.5 py-2 text-center text-[10px] uppercase text-ink-muted sm:px-2 sm:text-xs"
          >
            {j}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {jours.map((d) => {
          const key = isoJour(d);
          const list = missions.filter((m) => m.date === key);
          const hors = d.getMonth() !== ancre.getMonth();
          return (
            <div
              key={key}
              className={cn(
                "min-h-24 border-b border-r border-line p-1.5",
                hors && "bg-surface",
                key === AUJOURD_HUI_MO1 && "bg-surface",
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                <p className="text-center text-xs text-ink-body">{d.getDate()}</p>
                {onAjouter && (
                  <button
                    type="button"
                    onClick={() => onAjouter(key)}
                    className="flex size-6 items-center justify-center rounded-full text-ink-muted hover:bg-white"
                    aria-label={`Ajouter une prestation le ${key}`}
                  >
                    <Plus className="size-2.5" />
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {list.slice(0, 2).map((m) => (
                  <Pastille key={m.id} mission={m} onClick={() => onMission(m)} />
                ))}
                {list.length > 2 && (
                  <MissionsPlusPopover
                    bienNom="Toutes propriétés"
                    dateLabel={d.toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                    missions={list}
                    onChoisir={onMission}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TarifsJours({
  jours,
  biens,
  ensembles,
  regles,
  sejours,
  onCreerRegle,
}: {
  jours: Date[];
  biens: BienMo1[];
  ensembles: EnsembleRegles[];
  regles: RegleTarif[];
  sejours: ReservationMo1[];
  onCreerRegle: (bienId: string, date: string) => void;
}) {
  return (
    <ScrollHint snap>
      <div
        className="grid min-w-[720px]"
        style={{ gridTemplateColumns: `130px repeat(${jours.length}, minmax(180px, 1fr))` }}
      >
        <div className="sticky left-0 z-[5] border-b border-r border-line bg-white px-3 pb-2 pt-8 text-[10px] text-ink-muted">
          Bien
        </div>
        {jours.map((d) => {
          const key = isoJour(d);
          return (
            <div
              key={key}
              className={cn(
                "border-b border-r border-surface-soft py-2 text-center",
                key === AUJOURD_HUI_MO1 && "bg-surface",
              )}
            >
              <p className="text-xs uppercase text-ink-muted">
                {d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "")}
              </p>
              <p className="text-sm text-ink-body">{d.getDate()}</p>
            </div>
          );
        })}
        {biens.map((bien) => (
          <div key={bien.id} className="contents">
            <div className="sticky left-0 z-[5] border-b border-r border-line bg-white px-3 py-3">
              <p className="text-xs text-ink-body">{bien.nom}</p>
              <p className="text-[10px] text-ink-muted">Base : {bien.baseNuit} €/nuit</p>
            </div>
            {jours.map((d) => {
              const key = isoJour(d);
              const reserve = sejours.some(
                (r) => r.bienId === bien.id && reservationCouvre(r, key),
              );
              const { prix, base, variation, regle } = prixDuJour(bien, key, ensembles, regles);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onCreerRegle(bien.id, key)}
                  className="relative min-h-[71px] border-b border-r border-surface-soft px-1 py-2 text-center"
                >
                  <span className="absolute inset-x-0 top-0 h-2 bg-surface-soft" />
                  <span className="mt-2 block text-[10px] text-ink-muted">
                    {reserve ? "Réservé" : ""}
                  </span>
                  <span className="block text-xs font-medium text-ink">{prix}€</span>
                  {variation !== 0 && (
                    <span className="block text-[9px] text-ink-muted line-through">{base}€</span>
                  )}
                  {regle && (
                    <span className="mt-1 flex items-center justify-between rounded bg-surface px-1 text-[10px] text-ink-body">
                      <span>
                        {emojiType(regle.type)}{" "}
                        {regle.nom.includes("Week") ? "Week-end" : regle.nom}
                      </span>
                      <span>
                        {variation > 0 ? "+" : ""}
                        {variation}%
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4 border-t border-surface-soft px-4 py-2 text-[10px] text-ink-muted">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-sm bg-ink" /> Règle active
        </span>
        <span className="flex items-center gap-1">
          <span className="h-0.5 w-4 bg-line-strong" /> Réservé
        </span>
        <span className="ml-auto">
          Cliquez une cellule pour créer une règle sur ce bien et ce jour
        </span>
      </div>
    </ScrollHint>
  );
}

function TarifsMois({
  jours,
  ancre,
  biens,
  ensembles,
  regles,
  sejours,
  onCreerRegle,
}: {
  jours: Date[];
  ancre: Date;
  biens: BienMo1[];
  ensembles: EnsembleRegles[];
  regles: RegleTarif[];
  sejours: ReservationMo1[];
  onCreerRegle: (bienId: string, date: string) => void;
}) {
  const bien = biens[0];
  if (!bien) {
    return <p className="p-4 text-sm text-ink-muted">Aucun bien pour afficher les tarifs.</p>;
  }
  return (
    <div>
      <p className="border-b border-surface-soft px-4 py-2 text-xs text-ink-muted">
        Tarifs affichés : {bien.nom}. Cliquez un jour pour créer une règle.
      </p>
      <div className="grid grid-cols-7 border-b border-line">
        {JOURS_SEM.map((j) => (
          <div
            key={j}
            className="whitespace-nowrap px-0.5 py-2 text-center text-[10px] uppercase text-ink-muted sm:px-2 sm:text-xs"
          >
            {j}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {jours.map((d) => {
          const key = isoJour(d);
          const hors = d.getMonth() !== ancre.getMonth();
          const { prix, base, variation, regle } = prixDuJour(bien, key, ensembles, regles);
          const reserve = sejours.some((r) => reservationCouvre(r, key));
          return (
            <button
              key={key}
              type="button"
              disabled={hors}
              onClick={() => {
                if (hors) return;
                onCreerRegle(bien.id, key);
              }}
              className={cn(
                "min-h-[88px] border-b border-r border-line p-1.5 text-left",
                hors && "bg-surface text-ink-muted",
                key === AUJOURD_HUI_MO1 && "bg-surface",
              )}
            >
              <p className="text-center text-xs text-ink-body">{d.getDate()}</p>
              {!hors && (
                <>
                  {reserve && <p className="text-[10px] text-ink-muted">Réservé</p>}
                  <p className="text-xs font-medium text-ink">{prix}€</p>
                  {variation !== 0 && (
                    <p className="text-[9px] text-ink-muted line-through">{base}€</p>
                  )}
                  {regle && (
                    <p className="text-[10px] text-ink-body">
                      {emojiType(regle.type)} {variation > 0 ? "+" : ""}
                      {variation}%
                    </p>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CartesEnsembles({
  ensembles,
  regles,
  onToggle,
}: {
  ensembles: EnsembleRegles[];
  regles: RegleTarif[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="grid gap-3 border-t border-surface-soft p-3 md:grid-cols-3">
      {ensembles.map((e) => {
        const items = regles.filter((r) => r.ensembleId === e.id);
        return (
          <div key={e.id} className="rounded-card border border-line p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-ink">{e.nom}</p>
              <button
                type="button"
                onClick={() => onToggle(e.id)}
                className="-mx-2 -my-3.5 flex size-11 shrink-0 items-center justify-center md:m-0 md:h-4 md:w-7"
                aria-label={e.actif ? `Désactiver ${e.nom}` : `Activer ${e.nom}`}
              >
                <span
                  className={cn(
                    "h-4 w-7 rounded-full border",
                    e.actif ? "border-ink bg-ink" : "border-line-strong bg-line",
                  )}
                >
                  <span
                    className={cn(
                      "block size-3 rounded-full bg-white",
                      e.actif ? "translate-x-3" : "translate-x-0.5",
                    )}
                  />
                </span>
              </button>
            </div>
            <p className="mt-1 text-[10px] text-ink-muted">{e.description}</p>
            <ul className="mt-2 space-y-1">
              {items.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded bg-surface px-2 py-1 text-[10px]"
                >
                  <span>
                    {emojiType(r.type)} {r.nom}
                  </span>
                  <span className="text-ink-body">
                    {r.variation > 0 ? "+" : ""}
                    {r.variation}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
