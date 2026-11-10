// SOURCE: Maquette MO1 — grille biens × jours (Missions / Tarifs, 3 jours / 5 jours / mois)

import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Plus, SlidersHorizontal, Tag } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth, useDroit } from "@/auth/auth-context";
import {
  BandMissionsJour,
  BandeauPlanning,
  CadreGrilleCalendrier,
  ChampRechercheCalendrier,
  ColonneBienCalendrier,
  EnteteJoursCalendrier,
  grilleJours,
  PastilleCalendrier,
  type BienCalendrierChrome,
} from "@/components/dashboard/CalendrierLigne";
import { CreatePrestationDialog } from "@/components/dashboard/CreatePrestationDialog";
import { DialogueActionDate } from "@/components/dashboard/DialogueActionDate";
import {
  CreateEventDialog,
  CreateRegleDialog,
  GererReglesPanel,
  MissionInfoDialog,
  MissionsPlusPopover,
} from "@/components/dashboard/DashboardDialogs";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  ANCRE_MO1,
  AUJOURD_HUI_MO1,
  ajouterJours,
  dateCourtIso,
  emojiType,
  isoJour,
  prixDuJour,
  reservationCouvre,
  couloirsSejours,
  styleBarreResa,
  teinteBarreCalendrier,
  type BienMo1,
  type EnsembleRegles,
  type MissionMo1,
  type OngletPlanning,
  type RegleTarif,
  type EvenementMo1,
  type ReservationMo1,
  type VueAffichagePlanning,
  type VuePlanning,
} from "@/data/planning-mo1";
import type { DateBloqueeMo1 } from "@/data/reservations-mo1";
import {
  ajouterEvenement,
  ajouterNotif,
  modifierSession,
  poserOuverturesBail,
  retirerMission,
  useSession,
} from "@/data/session";
import { actionsDateAutorisees, type ActionDate } from "@/lib/gestionnaire-planning";
import { confirmer, toastOk } from "@/lib/feedback";
import { evenementCouvreJour } from "@/lib/periode-demo";
import { idDossierPourCalendrier } from "@/data/v1-metier";
import { cn } from "@/lib/utils";

const JOURS_SEM = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
const EMPTY_FILTRES = new Set<FiltreMaquette>();
const MOIS_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

export type FiltreMaquette = "checkin" | "checkout" | "taches";

export function PlanningGrid({
  onglet,
  onOnglet,
  vueInitiale = "3jours",
  onReservation,
  onMission,
  selectedResaId = null,
  selectedMissionId = null,
  maquetteAccueil = false,
  filtres = EMPTY_FILTRES,
  onFiltres,
}: {
  onglet: OngletPlanning;
  onOnglet: (v: OngletPlanning) => void;
  vueInitiale?: VuePlanning;
  onReservation?: (id: string) => void;
  onMission?: (m: MissionMo1) => void;
  selectedResaId?: string | null | undefined;
  selectedMissionId?: string | null | undefined;
  /** Chrome de la Vue générale (pilules, recherche, créer une mission). */
  maquetteAccueil?: boolean;
  filtres?: ReadonlySet<FiltreMaquette>;
  onFiltres?: (next: Set<FiltreMaquette>) => void;
}) {
  const session = useSession();
  const navigate = useNavigate();
  const auth = useAuth();
  const peutReserver = useDroit("mod-reservations");
  const peutMissions = useDroit("mod-missions") && auth?.roleId !== "prestataire";
  const peutFinances = useDroit("mod-finances");
  const droitsDate = {
    reservations: peutReserver,
    missions: peutMissions,
    finances: peutFinances,
  };
  const peutAgirDate = actionsDateAutorisees(false, droitsDate).length > 0;
  const missions = session.missions;
  const sejoursCal = useMemo(() => {
    const dossiers = session.reservationsDossier;
    const couverts = new Set<string>();
    const visibles = session.reservationsCalendrier.filter((sejour) => {
      const id = idDossierPourCalendrier(sejour, dossiers);
      if (id) couverts.add(id);
      return dossiers.find((d) => d.id === id)?.statut !== "Annulé";
    });
    // Une réservation créée hors calendrier (import, ancienne saisie) doit rester visible.
    const manquants = dossiers
      .filter((d) => d.statut !== "Annulé" && !couverts.has(d.id))
      .map((d) => ({
        id: `cal-${d.id}`,
        bienId: d.bienId,
        voyageur: d.occupant,
        arrivee: d.arrivee,
        depart: d.depart,
      }));
    return [...visibles, ...manquants];
  }, [session.reservationsCalendrier, session.reservationsDossier]);
  const biens: (BienMo1 & BienCalendrierChrome)[] = session.biens.map((b) => ({
    id: b.id,
    nom: b.nom,
    baseNuit: b.baseNuit,
    typologie: b.typologie,
    statut: b.statut,
  }));
  const [vue, setVue] = useState<VuePlanning>(vueInitiale);
  const [ancre, setAncre] = useState(() => new Date(ANCRE_MO1));
  const [affichage, setAffichage] = useState<VueAffichagePlanning>("missions");
  const [rechercheCal, setRechercheCal] = useState("");
  const [missionOuverte, setMissionOuverte] = useState<MissionMo1 | null>(null);
  const [prestation, setPrestation] = useState<{
    bienId: string;
    date: string;
    mission?: MissionMo1;
  } | null>(null);
  const [actionDate, setActionDate] = useState<{ bienId: string; date: string } | null>(null);
  const [creerEvent, setCreerEvent] = useState(false);
  const [eventContexte, setEventContexte] = useState<{
    debut: string;
    bienId: string;
  } | null>(null);
  const [prestationsSeules, setPrestationsSeules] = useState(false);
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

  const biensFiltres = useMemo(() => {
    const q = rechercheCal.trim().toLowerCase();
    if (!q) return biens;
    return biens.filter(
      (b) => b.nom.toLowerCase().includes(q) || (b.typologie ?? "").toLowerCase().includes(q),
    );
  }, [biens, rechercheCal]);

  const missionsFiltrees = useMemo(() => {
    if (affichage === "ouverture") return [] as MissionMo1[];
    let list = missions;
    if (maquetteAccueil && filtres.size > 0) {
      list = list.filter((m) => {
        if (filtres.has("checkin") && m.type === "Check-in") return true;
        if (filtres.has("checkout") && m.type === "Check-out") return true;
        if (
          filtres.has("taches") &&
          (m.type === "Menage" || m.type === "Inventaire" || m.type === "Maintenance")
        ) {
          return true;
        }
        return false;
      });
    } else {
      if (affichage === "checkin") list = list.filter((m) => m.type === "Check-in");
      if (affichage === "checkout") list = list.filter((m) => m.type === "Check-out");
    }
    // « Prestations seules » masque les séjours (voir montrerResas), pas les
    // missions — y compris les types custom stockés sous Maintenance + typeLibre.
    const q = rechercheCal.trim().toLowerCase();
    if (q) {
      const ids = new Set(biensFiltres.map((b) => b.id));
      list = list.filter(
        (m) =>
          ids.has(m.bienId) ||
          m.titre.toLowerCase().includes(q) ||
          m.assigne.toLowerCase().includes(q),
      );
    }
    return list;
  }, [affichage, missions, rechercheCal, biensFiltres, maquetteAccueil, filtres]);
  const montrerResas =
    !prestationsSeules && (affichage === "missions" || affichage === "ouverture");
  const montrerMissions = affichage !== "ouverture";
  const montrerOuverture = affichage === "ouverture";
  const selectionActive = Boolean(selectedResaId || selectedMissionId);
  const sejoursAffiches = montrerResas ? sejoursCal : [];
  const datesBloquees = session.datesBloquees;

  const choisirMission = (m: MissionMo1) => {
    if (onMission) onMission(m);
    else setMissionOuverte(m);
  };

  const choisirActionDate = (action: ActionDate, bienChoisi: string, jour: string) => {
    if (action === "prestation") {
      setPrestation({ bienId: bienChoisi, date: jour });
      return;
    }
    if (action === "reservation") {
      void navigate({ to: "/reservations/nouveau", search: { bien: bienChoisi, arrivee: jour } });
      return;
    }
    if (action === "evenement") {
      setEventContexte({ debut: jour, bienId: bienChoisi });
      setCreerEvent(true);
      return;
    }
    const blocage = session.datesBloquees.find(
      (d) =>
        d.bienId === bienChoisi &&
        d.date === jour &&
        d.motif !== "Ouverture" &&
        d.motif !== "Ouverture BAIL",
    );
    modifierSession((e) => ({
      ...e,
      datesBloquees:
        action === "debloquer" || blocage
          ? e.datesBloquees.filter((d) => d.id !== blocage?.id)
          : [
              ...e.datesBloquees,
              { id: `blk-${bienChoisi}-${jour}`, bienId: bienChoisi, date: jour, motif: "Bloqué" },
            ],
    }));
    toastOk(action === "debloquer" || blocage ? "Date rouverte." : "Date bloquée.");
  };

  const biensTarif =
    filtreBienTarif === "tous"
      ? biensFiltres
      : biensFiltres.filter((b) => b.id === filtreBienTarif);

  const reglesActives = regles.filter((r) => ensembles.find((e) => e.id === r.ensembleId)?.actif);
  const ensemblesActifs = ensembles.filter((e) => e.actif).length;

  const decaler = (sens: -1 | 1) =>
    setAncre((d) =>
      vue === "mois"
        ? new Date(d.getFullYear(), d.getMonth() + sens, 1)
        : ajouterJours(d, sens * (nbJours || 1)),
    );
  const basculerFiltre = (id: FiltreMaquette) => {
    const next = new Set(filtres);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onFiltres?.(next);
  };
  const annees = [ancre.getFullYear() - 1, ancre.getFullYear(), ancre.getFullYear() + 1];

  return (
    <>
      {maquetteAccueil ? (
        <div className="space-y-3">
          <BandeauPlanning apparence="pilules" actif={onglet} onChoisir={onOnglet} />
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <ChampRechercheCalendrier
                valeur={rechercheCal}
                onChange={setRechercheCal}
                placeholder="Rechercher par prestataire ou appartement..."
              />
            </div>
            {peutMissions ? (
              <button
                type="button"
                onClick={() => setPrestation({ bienId: biens[0]?.id ?? "", date: isoJour(ancre) })}
                className="inline-flex h-[38px] w-[200px] shrink-0 items-center justify-center gap-2 rounded-gest-primaire bg-gest-primaire font-sans text-sm font-medium leading-5 text-white"
              >
                <Plus className="size-4" />
                Créer une Mission
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-line bg-white",
          maquetteAccueil && "mt-3",
        )}
      >
        {biens.length === 0 && (
          <p className="px-4 py-6 text-sm text-ink-muted">
            Aucun logement pour le moment. Le calendrier se remplira dès qu'un bien sera enregistré.
          </p>
        )}
        {!maquetteAccueil && (
          <div className="flex items-center gap-2 border-b border-line bg-[#f7f6f3] px-3">
            <BandeauPlanning
              actif={onglet}
              onChoisir={onOnglet}
              extra={
                <div className="flex items-center gap-2">
                  {onglet === "tarifs" && peutFinances ? (
                    <button
                      type="button"
                      onClick={() => setGererRegles(true)}
                      aria-label="Gérer les ensembles de règles"
                      className="inline-flex size-11 shrink-0 items-center justify-center gap-1.5 rounded border border-line bg-white text-xs font-medium text-ink-body md:h-[30px] md:w-auto md:px-3"
                    >
                      <SlidersHorizontal className="size-3" />
                      <span className="hidden md:inline">Gérer les ensembles de règles</span>
                    </button>
                  ) : null}
                  {peutReserver ? (
                    <Link
                      to="/reservations/nouveau"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-accent-teal px-3 text-xs font-medium text-white md:h-[30px]"
                    >
                      <Plus className="size-3.5" />
                      <span className="sm:hidden">Créer</span>
                      <span className="hidden sm:inline">Créer une réservation</span>
                    </Link>
                  ) : null}
                </div>
              }
            />
          </div>
        )}

        {!maquetteAccueil && (
          <div className="border-b border-surface-soft px-4 py-2">
            <ChampRechercheCalendrier
              valeur={rechercheCal}
              onChange={setRechercheCal}
              {...(onglet === "tarifs"
                ? { placeholder: "Rechercher par prestataire ou appartement…" }
                : {})}
            />
          </div>
        )}

        {maquetteAccueil ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-surface-soft px-3 py-2">
            <button
              type="button"
              aria-label="Précédent"
              className="flex size-8 items-center justify-center rounded-full text-ink-body hover:bg-surface"
              onClick={() => decaler(-1)}
            >
              <ChevronLeft className="size-4" />
            </button>
            <select
              aria-label="Mois"
              value={ancre.getMonth()}
              onChange={(e) =>
                setAncre((d) => new Date(d.getFullYear(), Number(e.target.value), d.getDate()))
              }
              className="h-8 rounded-full border border-line bg-white px-3 text-xs uppercase text-ink"
            >
              {MOIS_FR.map((nom, i) => (
                <option key={nom} value={i}>
                  {nom}
                </option>
              ))}
            </select>
            <select
              aria-label="Année"
              value={ancre.getFullYear()}
              onChange={(e) =>
                setAncre((d) => new Date(Number(e.target.value), d.getMonth(), d.getDate()))
              }
              className="h-8 rounded-full border border-line bg-white px-3 text-xs text-ink"
            >
              {annees.map((annee) => (
                <option key={annee} value={annee}>
                  {annee}
                </option>
              ))}
            </select>
            <button
              type="button"
              aria-label="Suivant"
              className="flex size-8 items-center justify-center rounded-full text-ink-body hover:bg-surface"
              onClick={() => decaler(1)}
            >
              <ChevronRight className="size-4" />
            </button>
            <span className="ml-1 text-xs text-ink-muted">Filtrer :</span>
            {filtres.has("taches") && (
              <span role="status" className="text-xs font-medium text-ink">
                Interventions affichées
              </span>
            )}
            {(
              [
                ["checkin", "CheckIn"],
                ["checkout", "CheckOut"],
                ["taches", "Taches"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={filtres.has(id)}
                onClick={() => basculerFiltre(id)}
                className={cn(
                  "inline-flex h-8 items-center rounded-full border px-3 text-xs",
                  filtres.has(id)
                    ? "border-ink bg-surface-soft text-ink"
                    : "border-line bg-white text-ink-body",
                )}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAncre(new Date())}
              className="inline-flex h-8 items-center rounded-full border border-line bg-white px-3 text-xs text-ink"
            >
              Aujourd'hui
            </button>
            <button
              type="button"
              aria-pressed={affichage === "ouverture"}
              onClick={() => setAffichage((v) => (v === "ouverture" ? "missions" : "ouverture"))}
              className="inline-flex h-8 items-center rounded-full border border-line bg-white px-3 text-xs text-ink-muted"
            >
              Ouverture
            </button>
            <div className="ml-auto flex items-center gap-1">
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
                    "h-8 rounded-full px-3 text-xs",
                    vue === id ? "bg-surface-soft font-medium text-ink" : "text-ink-muted",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : (
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
                  aria-pressed={vue === id}
                  className={cn(
                    "h-11 min-h-11 border-r border-line px-3 text-xs font-medium last:border-r-0",
                    id === "5jours" && "hidden sm:block",
                    vue === id && onglet === "tarifs" && "bg-ink text-white",
                    vue === id && onglet !== "tarifs" && "bg-tab-active text-ink-body",
                    vue !== id && "bg-white text-ink-body",
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
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-ink-muted">
                  Afficher :
                  <select
                    value={affichage}
                    onChange={(e) => setAffichage(e.target.value as VueAffichagePlanning)}
                    className="h-11 rounded border border-line bg-white px-2 text-xs text-ink-body outline-none md:h-[26px]"
                  >
                    <option value="missions">Missions</option>
                    <option value="taches">Tâches</option>
                    <option value="checkout">Check-out</option>
                    <option value="checkin">Check-in</option>
                    <option value="ouverture">Période d'ouverture du bail</option>
                  </select>
                </label>
                {onglet === "missions" ? (
                  <button
                    type="button"
                    aria-pressed={prestationsSeules}
                    onClick={() => setPrestationsSeules((v) => !v)}
                    className={cn(
                      "inline-flex h-11 min-h-11 items-center rounded border px-2.5 text-xs font-medium md:h-[26px] md:min-h-[26px]",
                      prestationsSeules
                        ? "border-ink bg-ink text-white"
                        : "border-line bg-white text-ink-body",
                    )}
                  >
                    Prestations seules
                  </button>
                ) : null}
                {montrerOuverture && peutReserver ? (
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
                    Poser une période
                  </button>
                ) : null}
              </div>
            )}
          </div>
        )}

        {onglet === "tarifs" ? (
          vue === "mois" ? (
            <TarifsMois
              jours={joursMois}
              ancre={ancre}
              biens={biensTarif}
              ensembles={ensembles}
              regles={regles}
              sejours={sejoursCal}
              edition={peutFinances}
              onCreerRegle={(bienId, date) => {
                if (!peutFinances) return;
                setCibleRegle({ bienId, date });
                setCreerRegle(true);
              }}
            />
          ) : (
            <TarifsJours
              jours={jours}
              biens={biensFiltres}
              ensembles={ensembles}
              regles={regles}
              sejours={sejoursCal}
              evenements={session.evenements}
              edition={peutFinances}
              onCreerRegle={(bienId, date) => {
                if (!peutFinances) return;
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
            sejours={sejoursAffiches}
            datesBloquees={datesBloquees}
            onMission={choisirMission}
            selectedMissionId={selectedMissionId}
            selectedResaId={selectedResaId}
            selectionActive={selectionActive}
            {...(montrerMissions && peutAgirDate
              ? {
                  onAjouter: (date: string) =>
                    setActionDate({
                      bienId: biensFiltres[0]?.id ?? biens[0]?.id ?? "",
                      date,
                    }),
                }
              : {})}
          />
        ) : (
          <JoursMissions
            jours={jours}
            evenements={session.evenements}
            biens={biensFiltres}
            missions={missionsFiltrees}
            sejours={sejoursAffiches}
            datesBloquees={datesBloquees}
            onMission={choisirMission}
            selectedMissionId={selectedMissionId}
            selectedResaId={selectedResaId}
            selectionActive={selectionActive}
            onReservation={(sejour) => {
              const id = idDossierPourCalendrier(sejour, session.reservationsDossier);
              if (id) onReservation?.(id);
            }}
            {...(montrerMissions && peutAgirDate
              ? {
                  onAjouterPrestation: (bienId: string, date: string) =>
                    setActionDate({ bienId, date }),
                }
              : {})}
          />
        )}

        {onglet === "tarifs" && (
          <CartesEnsembles
            ensembles={ensembles}
            regles={regles}
            edition={peutFinances}
            onToggle={(id) => {
              if (!peutFinances) return;
              setEnsembles((list) =>
                list.map((e) => (e.id === id ? { ...e, actif: !e.actif } : e)),
              );
            }}
          />
        )}

        <MissionInfoDialog
          mission={onMission ? null : missionOuverte}
          bienNom={biens.find((b) => b.id === missionOuverte?.bienId)?.nom ?? ""}
          ouvert={!onMission && Boolean(missionOuverte)}
          onFermer={() => setMissionOuverte(null)}
          {...(peutMissions
            ? {
                onStatut: (id: string, statut: MissionMo1["statut"]) => {
                  modifierSession((e) => ({
                    ...e,
                    missions: e.missions.map((m) => (m.id === id ? { ...m, statut } : m)),
                  }));
                  setMissionOuverte((m) => (m && m.id === id ? { ...m, statut } : m));
                },
                onModifier: (m: MissionMo1) => {
                  setMissionOuverte(null);
                  setPrestation({ bienId: m.bienId, date: m.date, mission: m });
                },
              }
            : {})}
          {...(peutMissions
            ? {
                onSupprimer: async (m: MissionMo1) => {
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
                },
              }
            : {})}
        />
        <CreatePrestationDialog
          ouvert={Boolean(prestation)}
          onFermer={() => setPrestation(null)}
          bienId={prestation?.bienId}
          date={prestation?.date}
          mission={prestation?.mission}
        />
        <DialogueActionDate
          ouvert={Boolean(actionDate)}
          bienNom={biens.find((b) => b.id === actionDate?.bienId)?.nom ?? ""}
          dateLabel={
            actionDate
              ? new Date(`${actionDate.date}T12:00:00`).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })
              : ""
          }
          bloque={Boolean(
            actionDate &&
            session.datesBloquees.some(
              (d) =>
                d.bienId === actionDate.bienId &&
                d.date === actionDate.date &&
                d.motif !== "Ouverture" &&
                d.motif !== "Ouverture BAIL",
            ),
          )}
          actions={actionsDateAutorisees(
            Boolean(
              actionDate &&
              session.datesBloquees.some(
                (d) =>
                  d.bienId === actionDate.bienId &&
                  d.date === actionDate.date &&
                  d.motif !== "Ouverture" &&
                  d.motif !== "Ouverture BAIL",
              ),
            ),
            droitsDate,
          )}
          onFermer={() => setActionDate(null)}
          onChoisir={(action) => {
            if (!actionDate) return;
            choisirActionDate(action, actionDate.bienId, actionDate.date);
            setActionDate(null);
          }}
        />
        <CreateEventDialog
          ouvert={creerEvent}
          debutInitial={eventContexte?.debut}
          bienInitial={biens.find((b) => b.id === eventContexte?.bienId)?.nom}
          onFermer={() => {
            setCreerEvent(false);
            setEventContexte(null);
          }}
          onCreer={(e) => {
            ajouterEvenement(e);
            ajouterNotif({ titre: "Événement ajouté", detail: e.titre, href: "/" });
            toastOk("Note ou événement ajouté au calendrier.");
            setCreerEvent(false);
            setEventContexte(null);
          }}
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
    </>
  );
}

function evenementsDuBien(evenements: EvenementMo1[], bienNom: string, jour: string) {
  const cible = bienNom.toLowerCase();
  const court = cible.split(" ").pop() ?? cible;
  return evenements.filter(
    (e) =>
      evenementCouvreJour(e.id, jour) &&
      (e.lieu.toLowerCase().includes(court) || e.lieu.toLowerCase().includes(cible)),
  );
}

function BarreEvenement({ evenement }: { evenement: EvenementMo1 }) {
  const vert = evenement.impact === "Fort impact";
  return (
    <span
      className={cn(
        "mt-1 flex h-[21px] min-w-0 items-center gap-1 truncate rounded-gest-barre border border-gest-barre-bord px-1 text-[10px] text-gest-item",
        vert ? "bg-gest-barre-verte" : "bg-gest-barre-jaune",
      )}
    >
      <span aria-hidden>🔑</span>
      <span className="truncate">{evenement.titre}</span>
    </span>
  );
}

function JoursMissions({
  jours,
  biens,
  missions,
  sejours,
  datesBloquees,
  onMission,
  onReservation,
  onAjouterPrestation,
  selectedResaId,
  selectedMissionId,
  selectionActive,
  evenements = [],
}: {
  jours: Date[];
  biens: (BienMo1 & BienCalendrierChrome)[];
  missions: MissionMo1[];
  sejours: ReservationMo1[];
  datesBloquees: DateBloqueeMo1[];
  evenements?: EvenementMo1[];
  onMission: (m: MissionMo1) => void;
  onReservation?: (r: ReservationMo1) => void;
  onAjouterPrestation?: (bienId: string, date: string) => void;
  selectedResaId?: string | null | undefined;
  selectedMissionId?: string | null | undefined;
  selectionActive?: boolean | undefined;
}) {
  return (
    <CadreGrilleCalendrier>
      <div {...grilleJours(jours.length)}>
        <EnteteJoursCalendrier jours={jours} aujourdHui={AUJOURD_HUI_MO1} isoJour={isoJour} />
        {biens.map((bien) => (
          <LigneBien
            key={bien.id}
            bien={bien}
            jours={jours}
            missions={missions.filter((m) => m.bienId === bien.id)}
            sejours={sejours.filter((r) => r.bienId === bien.id)}
            datesBloquees={datesBloquees.filter((d) => d.bienId === bien.id)}
            evenements={evenements}
            onMission={onMission}
            selectedResaId={selectedResaId}
            selectedMissionId={selectedMissionId}
            selectionActive={selectionActive}
            {...(onReservation ? { onReservation } : {})}
            {...(onAjouterPrestation ? { onAjouterPrestation } : {})}
          />
        ))}
      </div>
    </CadreGrilleCalendrier>
  );
}

function LigneBien({
  bien,
  jours,
  missions,
  sejours,
  datesBloquees,
  onMission,
  onReservation,
  onAjouterPrestation,
  selectedResaId,
  selectedMissionId,
  selectionActive = false,
  evenements = [],
}: {
  bien: BienMo1 & BienCalendrierChrome;
  jours: Date[];
  missions: MissionMo1[];
  sejours: ReservationMo1[];
  datesBloquees: DateBloqueeMo1[];
  evenements?: EvenementMo1[];
  onMission: (m: MissionMo1) => void;
  onReservation?: (r: ReservationMo1) => void;
  onAjouterPrestation?: (bienId: string, date: string) => void;
  selectedResaId?: string | null | undefined;
  selectedMissionId?: string | null | undefined;
  selectionActive?: boolean | undefined;
}) {
  const visibles = sejours.filter((r) => styleBarreResa(r, jours));
  const { couloirs, nombre } = couloirsSejours(visibles);
  const bandeau = 6 + nombre * 44 + 2;
  return (
    <div className="contents">
      <ColonneBienCalendrier bien={bien} />
      <div
        className="relative flex flex-col border-b border-line"
        style={{
          gridColumn: `2 / span ${jours.length}`,
          minHeight: Math.max(148, bandeau + 96),
        }}
      >
        <div
          className="grid flex-1"
          style={{ gridTemplateColumns: `repeat(${jours.length}, minmax(0, 1fr))` }}
        >
          {jours.map((d) => {
            const key = isoJour(d);
            const duJour = missions.filter((m) => m.date === key);
            const bloc = datesBloquees.find((b) => b.date === key);
            const ouverture = bloc?.motif === "Ouverture" || bloc?.motif === "Ouverture BAIL";
            return (
              <div
                key={key}
                className={cn(
                  "flex flex-col border-r border-line",
                  onAjouterPrestation && "cursor-pointer",
                  key === AUJOURD_HUI_MO1 && "bg-[#f8f8f8]",
                  bloc &&
                    (ouverture
                      ? "bg-[color-mix(in_srgb,var(--accent-teal)_12%,white)]"
                      : "bg-[repeating-linear-gradient(-45deg,var(--surface-soft),var(--surface-soft)_4px,var(--surface-elevated)_4px,var(--surface-elevated)_8px)]"),
                )}
                onClick={onAjouterPrestation ? () => onAjouterPrestation(bien.id, key) : undefined}
              >
                <div className="shrink-0" style={{ height: bandeau }} />
                {bloc ? (
                  <p className="px-1.5 text-[10px] font-medium text-ink-muted">
                    {ouverture ? "Ouverture" : "Bloqué"}
                  </p>
                ) : null}
                {evenementsDuBien(evenements, bien.nom, key).map((e) => (
                  <BarreEvenement key={e.id} evenement={e} />
                ))}
                <BandMissionsJour
                  bienNom={bien.nom}
                  date={key}
                  dateLabel={d.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                  missions={duJour}
                  onMission={onMission}
                  selectedMissionId={selectedMissionId}
                  selectionActive={selectionActive}
                  {...(onAjouterPrestation
                    ? { onAjouter: (date: string) => onAjouterPrestation(bien.id, date) }
                    : {})}
                />
              </div>
            );
          })}
        </div>

        {visibles.map((r) => {
          const barre = styleBarreResa(r, jours);
          if (!barre) return null;
          const teinte = teinteBarreCalendrier(r, jours);
          const large = jours.filter((d) => reservationCouvre(r, isoJour(d))).length >= 2;
          const sel = r.id === selectedResaId;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onReservation?.(r)}
              className={cn(
                "absolute z-[1] flex h-10 items-center gap-2 overflow-hidden rounded-lg border px-2.5 text-left",
                sel && "shadow-[0_0_0_2px_rgba(17,17,17,0.4)]",
                selectionActive && !sel && "opacity-45",
              )}
              style={{
                ...barre,
                top: 6 + (couloirs.get(r.id) ?? 0) * 44,
                backgroundColor: teinte.fond,
                borderColor: sel ? "#111111" : teinte.bord,
                opacity: sel ? 1 : teinte.fade ? 0.6 : undefined,
              }}
            >
              <span className="truncate text-xs text-ink-subtle">
                {large
                  ? `${r.voyageur} — ${dateCourtIso(r.arrivee)}>${dateCourtIso(r.depart)}`
                  : r.voyageur}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MoisMissions({
  jours,
  ancre,
  missions,
  sejours,
  datesBloquees,
  onMission,
  onAjouter,
  selectedMissionId,
  selectedResaId,
  selectionActive = false,
}: {
  jours: Date[];
  ancre: Date;
  missions: MissionMo1[];
  sejours: ReservationMo1[];
  datesBloquees: DateBloqueeMo1[];
  onMission: (m: MissionMo1) => void;
  onAjouter?: (date: string) => void;
  selectedMissionId?: string | null | undefined;
  selectedResaId?: string | null | undefined;
  selectionActive?: boolean | undefined;
}) {
  return (
    <CadreGrilleCalendrier>
      <div className="sticky top-0 z-[10] grid grid-cols-7 border-b border-line bg-white">
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
          const bloc = datesBloquees.find((b) => b.date === key);
          const ouverture = bloc?.motif === "Ouverture" || bloc?.motif === "Ouverture BAIL";
          const sejoursJour = sejours.filter((r) => reservationCouvre(r, key));
          return (
            <div
              key={key}
              className={cn(
                "group relative min-h-28 border-b border-r border-line p-1.5 pb-14 lg:min-h-24 lg:pb-8",
                onAjouter && "cursor-pointer",
                hors && "bg-surface",
                key === AUJOURD_HUI_MO1 && "bg-surface",
                bloc &&
                  (ouverture
                    ? "bg-[color-mix(in_srgb,var(--accent-teal)_12%,white)]"
                    : "bg-[repeating-linear-gradient(-45deg,var(--surface-soft),var(--surface-soft)_4px,var(--surface-elevated)_4px,var(--surface-elevated)_8px)]"),
              )}
              onClick={onAjouter ? () => onAjouter(key) : undefined}
            >
              <div className="mb-1 flex items-center justify-between">
                <p className="text-center text-xs text-ink-body">{d.getDate()}</p>
                {bloc ? (
                  <span className="text-[9px] text-ink-muted">
                    {ouverture ? "Ouverture" : "Bloqué"}
                  </span>
                ) : null}
              </div>
              <div className="space-y-1">
                {sejoursJour.slice(0, 1).map((r) => (
                  <p
                    key={r.id}
                    className={cn(
                      "truncate rounded border px-1 py-0.5 text-[10px] text-ink-subtle",
                      r.id === selectedResaId
                        ? "border-ink bg-[#cce8f3]"
                        : "border-gest-barre-bord bg-[#cce8f3]",
                      selectionActive && r.id !== selectedResaId && "opacity-45",
                    )}
                  >
                    {r.voyageur}
                  </p>
                ))}
                {list.slice(0, 2).map((m) => (
                  <PastilleCalendrier
                    key={m.id}
                    mission={m}
                    onClick={() => onMission(m)}
                    selectionnee={m.id === selectedMissionId}
                    attenuee={selectionActive}
                  />
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
                    {...(onAjouter ? { onAjouter: () => onAjouter(key) } : {})}
                  />
                )}
              </div>
              {onAjouter ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAjouter(key);
                  }}
                  className="absolute bottom-1.5 right-1.5 z-[2] flex size-11 items-center justify-center rounded-md border border-line bg-white text-ink-muted shadow-sm hover:border-ink hover:bg-white hover:text-ink lg:size-6"
                  aria-label={`Ajouter une prestation le ${key}`}
                >
                  <Plus className="size-3.5" />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </CadreGrilleCalendrier>
  );
}

function TarifsJours({
  jours,
  biens,
  ensembles,
  regles,
  sejours,
  onCreerRegle,
  evenements = [],
  edition = true,
}: {
  jours: Date[];
  biens: BienMo1[];
  ensembles: EnsembleRegles[];
  regles: RegleTarif[];
  sejours: ReservationMo1[];
  evenements?: EvenementMo1[];
  edition?: boolean;
  onCreerRegle: (bienId: string, date: string) => void;
}) {
  return (
    <CadreGrilleCalendrier>
      <div {...grilleJours(jours.length)}>
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
                  disabled={!edition}
                  onClick={() => edition && onCreerRegle(bien.id, key)}
                  aria-label={`${bien.nom} le ${key}, ${prix} euros${reserve ? ", réservé" : ""}`}
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
                  {evenementsDuBien(evenements, bien.nom, key).map((e) => (
                    <BarreEvenement key={e.id} evenement={e} />
                  ))}
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
          {edition
            ? "Cliquez une cellule pour créer une règle sur ce bien et ce jour"
            : "Consultation des prix. La modification des règles demande le droit finances."}
        </span>
      </div>
    </CadreGrilleCalendrier>
  );
}

function TarifsMois({
  jours,
  ancre,
  biens,
  ensembles,
  regles,
  sejours,
  edition = true,
  onCreerRegle,
}: {
  jours: Date[];
  ancre: Date;
  biens: BienMo1[];
  ensembles: EnsembleRegles[];
  regles: RegleTarif[];
  sejours: ReservationMo1[];
  edition?: boolean;
  onCreerRegle: (bienId: string, date: string) => void;
}) {
  const bien = biens[0];
  if (!bien) {
    return <p className="p-4 text-sm text-ink-muted">Aucun bien pour afficher les tarifs.</p>;
  }
  return (
    <CadreGrilleCalendrier>
      <p className="border-b border-surface-soft px-4 py-2 text-xs text-ink-muted">
        Tarifs affichés : {bien.nom}.
        {edition ? " Cliquez un jour pour créer une règle." : " Consultation seule."}
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
              disabled={hors || !edition}
              onClick={() => {
                if (hors || !edition) return;
                onCreerRegle(bien.id, key);
              }}
              className={cn(
                "min-h-[88px] min-w-0 border-b border-r border-line p-1 text-left sm:p-1.5",
                hors && "bg-surface text-ink-muted",
                key === AUJOURD_HUI_MO1 && "bg-surface",
              )}
            >
              <p className="text-center text-xs text-ink-body">{d.getDate()}</p>
              {!hors && (
                <>
                  {reserve && (
                    <p className="text-[10px] text-ink-muted" title="Réservé">
                      <span aria-hidden className="sm:hidden">
                        ●
                      </span>
                      <span className="sr-only sm:not-sr-only">Réservé</span>
                    </p>
                  )}
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
    </CadreGrilleCalendrier>
  );
}

function CartesEnsembles({
  ensembles,
  regles,
  edition = true,
  onToggle,
}: {
  ensembles: EnsembleRegles[];
  regles: RegleTarif[];
  edition?: boolean;
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
                disabled={!edition}
                onClick={() => edition && onToggle(e.id)}
                className="-mx-2 -my-3.5 flex size-11 shrink-0 items-center justify-center disabled:cursor-default md:m-0 md:h-4 md:w-7"
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
