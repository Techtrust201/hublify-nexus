// SOURCE: Maquette MO1 — grille biens × jours (Missions / Tarifs, 3 jours / 5 jours / mois)

import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, LogIn, LogOut, Plus, SlidersHorizontal, Tag } from "lucide-react";
import { useMemo, useState } from "react";
import {
  CreateRegleDialog,
  GererReglesPanel,
  MissionInfoDialog,
  MissionsPlusPopover,
} from "@/components/dashboard/DashboardDialogs";
import {
  ANCRE_MO1,
  AUJOURD_HUI_MO1,
  BIENS_MO1,
  ENSEMBLES_MO1,
  MISSIONS_MO1,
  REGLES_MO1,
  RESERVATIONS_MO1,
  ajouterJours,
  emojiType,
  isoJour,
  prixDuJour,
  reservationCouvre,
  type BienMo1,
  type EnsembleRegles,
  type FiltreMission,
  type MissionMo1,
  type OngletPlanning,
  type RegleTarif,
  type ReservationMo1,
  type VuePlanning,
} from "@/data/planning-mo1";
import type { Bien, Mission, Reservation } from "@/data/types";
import { cn } from "@/lib/utils";

const JOURS_SEM = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];

export function PlanningGrid({
  onglet,
  onOnglet,
  vueInitiale = "3jours",
}: {
  missions?: Mission[];
  biens?: Bien[];
  reservations?: Reservation[];
  onglet: OngletPlanning;
  onOnglet: (v: OngletPlanning) => void;
  vueInitiale?: VuePlanning;
}) {
  const [vue, setVue] = useState<VuePlanning>(vueInitiale);
  const [ancre, setAncre] = useState(() => new Date(ANCRE_MO1));
  const [filtre, setFiltre] = useState<FiltreMission>("tous");
  const [missionOuverte, setMissionOuverte] = useState<MissionMo1 | null>(null);
  const [ensembles, setEnsembles] = useState<EnsembleRegles[]>(ENSEMBLES_MO1);
  const [regles, setRegles] = useState<RegleTarif[]>(REGLES_MO1);
  const [creerRegle, setCreerRegle] = useState(false);
  const [gererRegles, setGererRegles] = useState(false);
  const [ensembleCible, setEnsembleCible] = useState("en1");
  const [filtreBienTarif, setFiltreBienTarif] = useState<string>("tous");

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
    if (filtre === "checkin") return MISSIONS_MO1.filter((m) => m.type === "Check-in");
    if (filtre === "checkout") return MISSIONS_MO1.filter((m) => m.type === "Check-out");
    return MISSIONS_MO1;
  }, [filtre]);

  const biensTarif =
    filtreBienTarif === "tous" ? BIENS_MO1 : BIENS_MO1.filter((b) => b.id === filtreBienTarif);

  const reglesActives = regles.filter((r) => ensembles.find((e) => e.id === r.ensembleId)?.actif);
  const ensemblesActifs = ensembles.filter((e) => e.actif).length;

  return (
    <div className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
      <div className="flex items-center justify-between border-b border-[#e5e7eb] px-4">
        <div className="flex">
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
        {onglet === "tarifs" && (
          <button
            type="button"
            onClick={() => setGererRegles(true)}
            className="inline-flex h-[30px] items-center gap-1.5 rounded border border-[#e5e7eb] px-3 text-xs font-medium text-[#4a5565]"
          >
            <SlidersHorizontal className="size-3" />
            Gérer les ensembles de règles
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-[#f3f4f6] bg-[#f9fafb]/50 px-4 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Précédent"
            className="flex size-6 items-center justify-center rounded border border-[#e5e7eb] text-[#4a5565]"
            onClick={() =>
              setAncre((d) =>
                vue === "mois" ? new Date(d.getFullYear(), d.getMonth() - 1, 1) : ajouterJours(d, -nbJours),
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
                vue === "mois" ? new Date(d.getFullYear(), d.getMonth() + 1, 1) : ajouterJours(d, nbJours),
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

        {onglet === "tarifs" ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="flex items-center gap-2 text-xs text-[#99a1af]">
              <Tag className="size-3" />
              {reglesActives.length} règles actives sur {ensemblesActifs} ensemble
              {ensemblesActifs > 1 ? "s" : ""}
            </p>
            {vue === "mois" && (
              <label className="flex items-center gap-2 text-xs text-[#4a5565]">
                Voir les tarifs de :
                <select
                  value={filtreBienTarif}
                  onChange={(e) => setFiltreBienTarif(e.target.value)}
                  className="h-[26px] rounded border border-[#e5e7eb] bg-white px-2 text-xs outline-none"
                >
                  <option value="tous">Tous les biens</option>
                  {BIENS_MO1.map((b) => (
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
            onCreerRegle={() => setCreerRegle(true)}
          />
        ) : (
          <TarifsJours
            jours={jours}
            biens={BIENS_MO1}
            ensembles={ensembles}
            regles={regles}
            onCreerRegle={() => setCreerRegle(true)}
          />
        )
      ) : vue === "mois" ? (
        <MoisMissions
          jours={joursMois}
          ancre={ancre}
          missions={missionsFiltrees}
          onMission={setMissionOuverte}
        />
      ) : (
        <JoursMissions
          jours={jours}
          missions={missionsFiltrees}
          onMission={setMissionOuverte}
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
        bienNom={BIENS_MO1.find((b) => b.id === missionOuverte?.bienId)?.nom ?? ""}
        ouvert={Boolean(missionOuverte)}
        onFermer={() => setMissionOuverte(null)}
      />
      <CreateRegleDialog
        ouvert={creerRegle}
        onFermer={() => setCreerRegle(false)}
        ensembles={ensembles}
        onCreer={(r) => {
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
          setGererRegles(false);
          setCreerRegle(true);
        }}
      />
    </div>
  );
}

function JoursMissions({
  jours,
  missions,
  onMission,
}: {
  jours: Date[];
  missions: MissionMo1[];
  onMission: (m: MissionMo1) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[720px]"
        style={{ gridTemplateColumns: `130px repeat(${jours.length}, minmax(0, 1fr))` }}
      >
        <div className="border-b border-r border-[#e5e7eb]" />
        {jours.map((d) => {
          const key = isoJour(d);
          return (
            <div
              key={key}
              className={cn(
                "border-b border-r border-[#f3f4f6] py-2 text-center",
                key === AUJOURD_HUI_MO1 && "bg-[#f9fafb]",
              )}
            >
              <p className="text-xs uppercase text-[#99a1af]">
                {d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "")}
              </p>
              <p
                className={cn(
                  "text-sm text-[#4a5565]",
                  key === AUJOURD_HUI_MO1 && "font-semibold text-[#1e2939]",
                )}
              >
                {d.getDate()}
              </p>
            </div>
          );
        })}

        {BIENS_MO1.map((bien) => (
          <LigneBien
            key={bien.id}
            bien={bien}
            jours={jours}
            missions={missions.filter((m) => m.bienId === bien.id)}
            sejours={RESERVATIONS_MO1.filter((r) => r.bienId === bien.id)}
            onMission={onMission}
          />
        ))}
      </div>
    </div>
  );
}

function LigneBien({
  bien,
  jours,
  missions,
  sejours,
  onMission,
}: {
  bien: BienMo1;
  jours: Date[];
  missions: MissionMo1[];
  sejours: ReservationMo1[];
  onMission: (m: MissionMo1) => void;
}) {
  const aUneResa = sejours.some((r) => jours.some((d) => reservationCouvre(r, isoJour(d))));
  const aUneMission = missions.some((m) => jours.some((d) => isoJour(d) === m.date));
  const ligneHaute = aUneResa || aUneMission;

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
          const key = isoJour(d);
          const duJour = missions.filter((m) => m.date === key);
          const visible = duJour[0];
          const reserve = sejours.some((r) => reservationCouvre(r, key));
          return (
            <div
              key={key}
              className={cn(
                "relative border-r border-[#f3f4f6]",
                ligneHaute ? "min-h-[104px]" : "min-h-[52px]",
                key === AUJOURD_HUI_MO1 && "bg-[#f9fafb]/60",
              )}
            >
              {!reserve && (
                <div
                  className={cn(
                    "flex items-center justify-center",
                    ligneHaute ? "h-[52px]" : "h-full",
                  )}
                >
                  <Link
                    to="/reservations"
                    className="flex size-5 items-center justify-center rounded-full border border-[#d1d5dc] text-[#99a1af]"
                    aria-label={`Ajouter une réservation — ${bien.nom}`}
                  >
                    <Plus className="size-2.5" />
                  </Link>
                </div>
              )}
              {ligneHaute && (
                <div className="absolute inset-x-0 top-[52px] space-y-0.5 border-t border-[#e5e7eb] bg-[rgba(249,250,251,0.4)] p-1">
                  {visible && <Pastille mission={visible} onClick={() => onMission(visible)} />}
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
            </div>
          );
        })}

        {aUneResa &&
          sejours.map((r) => {
            const start = jours.findIndex((d) => reservationCouvre(r, isoJour(d)));
            if (start < 0) return null;
            let span = 0;
            for (let i = start; i < jours.length; i++) {
              if (!reservationCouvre(r, isoJour(jours[i]!))) break;
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
                <span className="truncate text-xs text-[#6a7282]">{r.voyageur}</span>
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

function Pastille({ mission, onClick }: { mission: MissionMo1; onClick: () => void }) {
  const terminee = mission.statut === "terminee";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-[21px] w-full items-center gap-1 overflow-hidden rounded border px-1 text-left text-[10px] font-medium",
        terminee
          ? "border-[#e5e7eb] bg-[#f3f4f6] text-[#99a1af] line-through opacity-70"
          : mission.pastilleAccentuee
            ? "border-[#99a1af] bg-[#e5e7eb] text-[#364153]"
            : "border-[#d1d5dc] bg-white text-[#4a5565]",
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
}: {
  jours: Date[];
  ancre: Date;
  missions: MissionMo1[];
  onMission: (m: MissionMo1) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-7 border-b border-[#e5e7eb]">
        {JOURS_SEM.map((j) => (
          <div key={j} className="px-2 py-2 text-center text-xs uppercase text-[#99a1af]">
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
                "min-h-24 border-b border-r border-[#e5e7eb] p-1.5",
                hors && "bg-[#f9fafb]",
                key === AUJOURD_HUI_MO1 && "bg-[#f9fafb]",
              )}
            >
              <p className="mb-1 text-center text-xs text-[#4a5565]">{d.getDate()}</p>
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
  onCreerRegle,
}: {
  jours: Date[];
  biens: BienMo1[];
  ensembles: EnsembleRegles[];
  regles: RegleTarif[];
  onCreerRegle: () => void;
}) {
  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[720px]"
        style={{ gridTemplateColumns: `130px repeat(${jours.length}, minmax(0, 1fr))` }}
      >
        <div className="border-b border-r border-[#e5e7eb] px-3 pb-2 pt-8 text-[10px] text-[#99a1af]">
          Bien
        </div>
        {jours.map((d) => {
          const key = isoJour(d);
          return (
            <div
              key={key}
              className={cn(
                "border-b border-r border-[#f3f4f6] py-2 text-center",
                key === AUJOURD_HUI_MO1 && "bg-[#f9fafb]",
              )}
            >
              <p className="text-xs uppercase text-[#99a1af]">
                {d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "")}
              </p>
              <p className="text-sm text-[#4a5565]">{d.getDate()}</p>
            </div>
          );
        })}
        {biens.map((bien) => (
          <div key={bien.id} className="contents">
            <div className="border-b border-r border-[#e5e7eb] px-3 py-3">
              <p className="text-xs text-[#4a5565]">{bien.nom}</p>
              <p className="text-[10px] text-[#99a1af]">Base : {bien.baseNuit} €/nuit</p>
            </div>
            {jours.map((d) => {
              const key = isoJour(d);
              const reserve = RESERVATIONS_MO1.some(
                (r) => r.bienId === bien.id && reservationCouvre(r, key),
              );
              const { prix, base, variation, regle } = prixDuJour(bien, key, ensembles, regles);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={onCreerRegle}
                  className="relative min-h-[71px] border-b border-r border-[#f3f4f6] px-1 py-2 text-center"
                >
                  <span className="absolute inset-x-0 top-0 h-2 bg-[#f3f4f6]" />
                  <span className="mt-2 block text-[10px] text-[#99a1af]">
                    {reserve ? "Réservé" : ""}
                  </span>
                  <span className="block text-xs font-medium text-[#1e2939]">{prix}€</span>
                  {variation !== 0 && (
                    <span className="block text-[9px] text-[#99a1af] line-through">{base}€</span>
                  )}
                  {regle && (
                    <span className="mt-1 flex items-center justify-between rounded bg-[#f9fafb] px-1 text-[10px] text-[#4a5565]">
                      <span>
                        {emojiType(regle.type)} {regle.nom.includes("Week") ? "Week-end" : regle.nom}
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
      <div className="flex flex-wrap items-center gap-4 border-t border-[#f3f4f6] px-4 py-2 text-[10px] text-[#99a1af]">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-sm bg-[#1e2939]" /> Règle active
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-sm border border-[#d1d5dc]" /> Sélection
        </span>
        <span className="flex items-center gap-1">
          <span className="h-0.5 w-4 bg-[#d1d5dc]" /> Réservé
        </span>
        <span className="ml-auto">Cliquez une cellule pour commencer une sélection ·</span>
      </div>
    </div>
  );
}

function TarifsMois({
  jours,
  ancre,
  biens,
  ensembles,
  regles,
  onCreerRegle,
}: {
  jours: Date[];
  ancre: Date;
  biens: BienMo1[];
  ensembles: EnsembleRegles[];
  regles: RegleTarif[];
  onCreerRegle: () => void;
}) {
  const bien = biens[0] ?? BIENS_MO1[0]!;
  return (
    <div>
      <div className="grid grid-cols-7 border-b border-[#e5e7eb]">
        {JOURS_SEM.map((j) => (
          <div key={j} className="px-2 py-2 text-center text-xs uppercase text-[#99a1af]">
            {j}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {jours.map((d) => {
          const key = isoJour(d);
          const hors = d.getMonth() !== ancre.getMonth();
          const { prix, base, variation, regle } = prixDuJour(bien, key, ensembles, regles);
          const reserve = RESERVATIONS_MO1.some((r) => reservationCouvre(r, key));
          return (
            <button
              key={key}
              type="button"
              onClick={onCreerRegle}
              className={cn(
                "min-h-[88px] border-b border-r border-[#e5e7eb] p-1.5 text-left",
                hors && "bg-[#f9fafb] text-[#99a1af]",
                key === AUJOURD_HUI_MO1 && "bg-[#f9fafb]",
              )}
            >
              <p className="text-center text-xs text-[#4a5565]">{d.getDate()}</p>
              {!hors && (
                <>
                  {reserve && <p className="text-[10px] text-[#99a1af]">Réservé</p>}
                  <p className="text-xs font-medium text-[#1e2939]">{prix}€</p>
                  {variation !== 0 && (
                    <p className="text-[9px] text-[#99a1af] line-through">{base}€</p>
                  )}
                  {regle && (
                    <p className="text-[10px] text-[#4a5565]">
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
    <div className="grid gap-3 border-t border-[#f3f4f6] p-3 md:grid-cols-3">
      {ensembles.map((e) => {
        const items = regles.filter((r) => r.ensembleId === e.id);
        return (
          <div key={e.id} className="rounded-[10px] border border-[#e5e7eb] p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-[#1e2939]">{e.nom}</p>
              <button
                type="button"
                onClick={() => onToggle(e.id)}
                className={cn(
                  "h-4 w-7 shrink-0 rounded-full border",
                  e.actif ? "border-[#1e2939] bg-[#1e2939]" : "border-[#d1d5dc] bg-[#e5e7eb]",
                )}
                aria-label={e.actif ? `Désactiver ${e.nom}` : `Activer ${e.nom}`}
              >
                <span
                  className={cn(
                    "block size-3 rounded-full bg-white",
                    e.actif ? "translate-x-3" : "translate-x-0.5",
                  )}
                />
              </button>
            </div>
            <p className="mt-1 text-[10px] text-[#99a1af]">{e.description}</p>
            <ul className="mt-2 space-y-1">
              {items.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded bg-[#f9fafb] px-2 py-1 text-[10px]"
                >
                  <span>
                    {emojiType(r.type)} {r.nom}
                  </span>
                  <span className="text-[#4a5565]">
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
