// SOURCE: maquette « Créer une Mission » (chantier facturation, PR 4/6).
// Ordre des champs : type, titre, date et heure, réservation, période, assigné à,
// description, attribution, tarif. La méta JSON de `description` reste le format
// d'échange ; le serveur (PR 3) en dérive les colonnes et la valide.

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useAuth, useDroit } from "@/auth/auth-context";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { MissionMo1 } from "@/data/planning-mo1";
import { ajouterMission, idNouveau, modifierMission, useSession } from "@/data/session";
import { apercuTarifMissionDistant } from "@/data/session-remote";
import { emojiMission } from "@/data/v1-metier";
import { BAREME_FRAIS_GESTION_CENTIMES } from "@/lib/analyse-finance";
import { listerEquipe } from "@/lib/auth.functions";
import { toastErreur, toastOk } from "@/lib/feedback";
import {
  TYPES_PRESTATION,
  descriptionVisible,
  ecrireDescription,
  heureAffichee,
  horaireDansPlage,
  joursPrestation,
  lireMetaPrestation,
  plageValide,
  type AttributionPrestation,
  type MetaPrestation,
  type PorteurPrestation,
} from "@/lib/gestionnaire-planning";
import {
  choixAssigne,
  decoderChoixAssigne,
  fusionnerMetaFenetre,
  libelleOrigineTarif,
} from "@/lib/fenetre-mission";
import { tarifAffiche } from "@/lib/mission-facturation-serveur";

const champ =
  "mt-1 h-11 w-full min-w-0 rounded-card border border-line bg-white px-3 text-sm text-ink outline-none md:h-9";
const etiquette = "block min-w-0 text-xs text-ink-muted";
// Champs date et heure : moins de marge interne pour tenir à 320 px.
const champSerre = champ.replace("px-3", "px-2");

function euros(centimes: number) {
  return (centimes / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export function CreatePrestationDialog({
  ouvert,
  onFermer,
  bienId,
  date,
  mission,
}: {
  ouvert: boolean;
  onFermer: () => void;
  bienId?: string | undefined;
  date?: string | undefined;
  mission?: MissionMo1 | null | undefined;
}) {
  const session = useSession();
  const auth = useAuth();
  // La liste d'équipe est réservée au droit « gérer l'équipe » : sans lui, le
  // serveur refuse (à raison) et l'appel ne ferait que remonter une erreur.
  // Sans liste, le champ « assigné » retombe sur la saisie libre.
  const peutListerEquipe = useDroit("gerer-equipe");
  const edition = Boolean(mission);
  const { data: equipe } = useQuery({
    queryKey: ["equipe-prestation", auth?.orgId],
    queryFn: () => listerEquipe(),
    enabled: ouvert && peutListerEquipe && Boolean(auth?.orgId),
    staleTime: 60_000,
  });
  const [type, setType] = useState<MissionMo1["type"]>("Menage");
  const [typeLibre, setTypeLibre] = useState("");
  const [creerType, setCreerType] = useState(false);
  const [titre, setTitre] = useState("");
  const [logement, setLogement] = useState(bienId ?? "");
  const [jour, setJour] = useState(date ?? "");
  const [heure, setHeure] = useState("10:00");
  const [lierResa, setLierResa] = useState(false);
  const [reservationId, setReservationId] = useState("");
  const [periode, setPeriode] = useState(false);
  const [jourFin, setJourFin] = useState(date ?? "");
  const [plageDebut, setPlageDebut] = useState("10:00");
  const [plageFin, setPlageFin] = useState("14:00");
  const [precise, setPrecise] = useState("");
  const [choix, setChoix] = useState("");
  const [choixInitial, setChoixInitial] = useState("");
  const [description, setDescription] = useState("");
  const [attribution, setAttribution] = useState<AttributionPrestation | "">("");
  const [tarif, setTarif] = useState("");

  useEffect(() => {
    if (!ouvert) return;
    const meta = mission ? lireMetaPrestation(mission.description) : {};
    const avecPlage = Boolean(meta.plageDebut && meta.plageFin);
    setType(mission?.type ?? "Menage");
    setTypeLibre(meta.typeLibre ?? "");
    setCreerType(Boolean(meta.typeLibre));
    setTitre(mission ? descriptionVisible(mission.titre) : "");
    setLogement(mission?.bienId ?? bienId ?? session.biens[0]?.id ?? "");
    setJour(mission?.date ?? date ?? "");
    setJourFin(mission?.date ?? date ?? "");
    setHeure(avecPlage ? (meta.plageDebut ?? "10:00") : mission?.heure?.slice(0, 5) || "10:00");
    setLierResa(Boolean(meta.reservationId));
    setReservationId(meta.reservationId ?? "");
    setPeriode(avecPlage);
    setPlageDebut(meta.plageDebut ?? "10:00");
    setPlageFin(meta.plageFin ?? "14:00");
    setPrecise(meta.horairePrecise ?? "");
    const initial = mission ? choixAssigne(meta, mission.assigne) : "";
    setChoix(initial);
    setChoixInitial(initial);
    setDescription(mission ? descriptionVisible(mission.description) : "");
    setAttribution(meta.attribution ?? "");
    setTarif(meta.tarif != null ? String(meta.tarif) : "");
  }, [ouvert, mission, bienId, date, session.biens]);

  const membres = useMemo(
    () =>
      (equipe ?? [])
        .filter((m) => m.statut === "actif")
        .map((m) => `${m.prenom} ${m.nom}`.trim())
        .filter(Boolean),
    [equipe],
  );
  const decode = decoderChoixAssigne(choix);
  // Valeur enregistrée qui n'est plus dans les listes : on la garde visible.
  const horsListe =
    decode.porteur === "prestataire" &&
    decode.nom &&
    !session.prestataires.some((p) => p.nom === decode.nom)
      ? choix
      : decode.porteur === "teammate" && decode.nom && !membres.includes(decode.nom)
        ? choix
        : "";

  const sejours = session.reservationsDossier.filter(
    (r) =>
      r.bienId === logement &&
      r.statut !== "Annulé" &&
      (edition || (r.arrivee <= ((periode && jourFin) || jour) && r.depart >= jour)),
  );
  const sejourCourant =
    reservationId && !sejours.some((r) => r.id === reservationId)
      ? session.reservationsDossier.find((r) => r.id === reservationId)
      : undefined;

  const typeStocke: MissionMo1["type"] = creerType && typeLibre.trim() ? "Maintenance" : type;
  const { data: apercu } = useQuery({
    queryKey: [
      "apercu-tarif-mission",
      auth?.orgId,
      typeStocke,
      decode.porteur,
      decode.nom,
      attribution,
    ],
    queryFn: () =>
      apercuTarifMissionDistant({
        data: {
          type: typeStocke,
          assigne: decode.nom,
          porteur: decode.porteur,
          attribution: attribution || null,
        },
      }),
    enabled: ouvert && Boolean(auth?.orgId),
    staleTime: 30_000,
  });
  const manuel = tarif.trim() ? Math.max(0, Number(tarif.replace(",", ".")) || 0) : null;
  const affiche = tarifAffiche({
    manuelEuros: manuel,
    auto: apercu?.ok ? apercu.tarif : null,
    type: typeStocke,
    porteur: decode.porteur,
    bareme: BAREME_FRAIS_GESTION_CENTIMES,
  });

  const enregistrer = () => {
    const bien = logement || bienId;
    const debut = mission?.date ?? jour;
    if (!bien || !debut) {
      toastErreur("Indiquez le logement et la date.");
      return;
    }
    if (periode && !plageValide(plageDebut, plageFin)) {
      toastErreur("Dans la période, l'heure de fin doit suivre l'heure de début.");
      return;
    }
    if (periode && !edition && jourFin && jourFin < debut) {
      toastErreur("La période doit finir après son début.");
      return;
    }
    if (!periode && !/^\d{2}:\d{2}$/.test(heure)) {
      toastErreur("Indiquez l'heure de la mission.");
      return;
    }
    if (edition && periode && !horaireDansPlage(precise, plageDebut, plageFin)) {
      toastErreur("L'horaire précis doit rester dans la période indiquée au prestataire.");
      return;
    }
    const typeLibrePropre = creerType ? typeLibre.trim() : "";
    if (creerType && !typeLibrePropre) {
      toastErreur("Indiquez le nom du type de mission.");
      return;
    }
    const resa = lierResa ? reservationId : "";
    if (decode.porteur !== "proprietaire" && attribution === "locataire" && !resa) {
      toastErreur("Une mission facturée au locataire doit être associée à une réservation.");
      return;
    }
    const precedente: MetaPrestation = mission
      ? lireMetaPrestation(
          session.missions.find((item) => item.id === mission.id)?.description ??
            mission.description,
        )
      : {};
    const meta = fusionnerMetaFenetre(precedente, {
      periode,
      plageDebut,
      plageFin,
      horairePrecise: edition && periode ? precise : "",
      attribution: decode.porteur === "proprietaire" ? "" : attribution,
      tarif: manuel,
      reservationId: resa,
      typeLibre: typeLibrePropre,
      porteur: decode.porteur,
      ouvert: choix === "ouvert",
      choixInchange: choix === choixInitial,
    });
    const libelle =
      typeLibrePropre || titre.trim() || TYPES_PRESTATION.find((t) => t.id === type)?.label || type;
    const commun = {
      type: typeStocke,
      titre: libelle,
      emoji: emojiMission(typeStocke),
      heure: heureAffichee(periode ? "" : heure, meta),
      assigne: decode.assigne,
      description: ecrireDescription(description.trim() || `${libelle} planifié.`, meta),
      bienId: bien,
    };
    if (edition && mission) {
      modifierMission(mission.id, commun);
      toastOk("Mission mise à jour.");
      onFermer();
      return;
    }
    const jours = periode ? joursPrestation(debut, jourFin || debut) : [debut];
    const baseId = idNouveau("ms");
    jours.forEach((jourPose, index) => {
      ajouterMission({
        id: index === 0 ? baseId : `${baseId}-${index}`,
        date: jourPose,
        statut: "a_faire",
        ...commun,
      });
    });
    toastOk(
      jours.length > 1
        ? `Mission posée sur ${jours.length} jours. Le prestataire choisira son horaire dans la période.`
        : "Mission ajoutée.",
    );
    onFermer();
  };

  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onFermer()}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] max-w-lg overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <DialogTitle>{edition ? "Modifier la mission" : "Créer une Mission"}</DialogTitle>
        <DialogDescription>
          La mission se pose sur la case du calendrier : logement, jour, horaire et assigné.
        </DialogDescription>
        <div className="mt-3 min-w-0 space-y-3">
          <label className={etiquette}>
            Type
            <select
              value={creerType ? "__creer__" : type}
              onChange={(e) => {
                if (e.target.value === "__creer__") {
                  setCreerType(true);
                  return;
                }
                setCreerType(false);
                setType(e.target.value as MissionMo1["type"]);
              }}
              className={champ}
            >
              {TYPES_PRESTATION.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
              <option value="__creer__">Créer un type…</option>
            </select>
          </label>
          {creerType && (
            <label className={etiquette}>
              Nouveau type
              <input
                value={typeLibre}
                onChange={(e) => setTypeLibre(e.target.value)}
                placeholder="Ex. Pressing, lit bébé"
                className={champ}
              />
            </label>
          )}
          <label className={etiquette}>
            Titre
            <input
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder={TYPES_PRESTATION.find((t) => t.id === type)?.label ?? ""}
              className={champ}
            />
          </label>
          {!mission && (
            <label className={etiquette}>
              Logement
              <select
                value={logement}
                onChange={(e) => {
                  setLogement(e.target.value);
                  setReservationId("");
                }}
                className={champ}
              >
                {session.biens.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nom}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,7rem)] gap-2">
            <label className={etiquette}>
              Date
              <input
                type="date"
                value={jour}
                onChange={(e) => {
                  setJour(e.target.value);
                  if (!jourFin || jourFin < e.target.value) setJourFin(e.target.value);
                }}
                className={champ}
                disabled={edition}
              />
            </label>
            <label className={etiquette}>
              Heure
              <input
                type="time"
                value={periode ? plageDebut : heure}
                onChange={(e) =>
                  periode ? setPlageDebut(e.target.value) : setHeure(e.target.value)
                }
                className={champSerre}
              />
            </label>
          </div>

          <div className="min-w-0 space-y-1">
            <label className="flex items-center gap-2 text-xs text-ink-muted">
              <input
                type="checkbox"
                checked={lierResa}
                onChange={(e) => setLierResa(e.target.checked)}
                className="h-4 w-4"
              />
              Associer la mission à la réservation
            </label>
            {lierResa && (
              <label className={etiquette}>
                <span className="sr-only">Réservation</span>
                <select
                  aria-label="Réservation"
                  value={reservationId}
                  onChange={(e) => setReservationId(e.target.value)}
                  className={champ}
                >
                  <option value="">Choisir une réservation</option>
                  {sejourCourant && (
                    <option value={sejourCourant.id}>{sejourCourant.occupant}</option>
                  )}
                  {sejours.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.occupant} · {r.arrivee} → {r.depart}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className="min-w-0 space-y-2">
            <label className="flex items-center justify-between gap-2 text-xs text-ink-muted">
              Ouverture d'une période de réalisation
              <input
                type="checkbox"
                role="switch"
                aria-checked={periode}
                checked={periode}
                onChange={(e) => {
                  setPeriode(e.target.checked);
                  if (e.target.checked) setPlageDebut(heure);
                  else setHeure(plageDebut);
                }}
                className="h-4 w-4"
              />
            </label>
            {periode && (
              <>
                <div className="grid min-w-0 grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,7rem)] items-end gap-2">
                  <span className="pb-3 text-xs text-ink-muted md:pb-2">Du</span>
                  <label className={etiquette}>
                    <span className="sr-only">Début de la période</span>
                    <input
                      type="date"
                      aria-label="Début de la période"
                      value={jour}
                      onChange={(e) => setJour(e.target.value)}
                      className={champSerre}
                      disabled={edition}
                    />
                  </label>
                  <label className={etiquette}>
                    <span className="sr-only">Heure de début</span>
                    <input
                      type="time"
                      aria-label="Heure de début"
                      value={plageDebut}
                      onChange={(e) => setPlageDebut(e.target.value)}
                      className={champSerre}
                    />
                  </label>
                </div>
                <div className="grid min-w-0 grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,7rem)] items-end gap-2">
                  <span className="pb-3 text-xs text-ink-muted md:pb-2">Au</span>
                  <label className={etiquette}>
                    <span className="sr-only">Fin de la période</span>
                    <input
                      type="date"
                      aria-label="Fin de la période"
                      value={jourFin}
                      onChange={(e) => setJourFin(e.target.value)}
                      className={champSerre}
                      disabled={edition}
                    />
                  </label>
                  <label className={etiquette}>
                    <span className="sr-only">Heure de fin</span>
                    <input
                      type="time"
                      aria-label="Heure de fin"
                      value={plageFin}
                      onChange={(e) => setPlageFin(e.target.value)}
                      className={champSerre}
                    />
                  </label>
                </div>
                <p className="text-[11px] text-ink-muted">
                  Une mission par jour de la période. Le prestataire choisit son horaire dans ce
                  créneau.
                </p>
                {edition && (
                  <label className={etiquette}>
                    Horaire précis (choisi par le prestataire)
                    <input
                      type="time"
                      value={precise}
                      onChange={(e) => setPrecise(e.target.value)}
                      className={champ}
                    />
                  </label>
                )}
              </>
            )}
          </div>

          <label className={etiquette}>
            Assigné à
            <select value={choix} onChange={(e) => setChoix(e.target.value)} className={champ}>
              <option value="">Non assigné</option>
              <option value="proprio">Propriétaire (pas de facturation)</option>
              {horsListe && <option value={horsListe}>{decode.nom}</option>}
              {session.prestataires.length > 0 && (
                <optgroup label="Prestataires">
                  {session.prestataires.map((p) => (
                    <option key={p.id} value={`presta:${p.nom}`}>
                      {p.nom}
                    </option>
                  ))}
                </optgroup>
              )}
              {membres.length > 0 && (
                <optgroup label="Membres de l'équipe">
                  {membres.map((nom) => (
                    <option key={nom} value={`team:${nom}`}>
                      {nom}
                    </option>
                  ))}
                </optgroup>
              )}
              <option value="ouvert">Ouvert (marketplace)</option>
            </select>
          </label>

          <label className={etiquette}>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Ex. Installer le lit bébé dans la chambre 1"
              className="mt-1 w-full min-w-0 rounded-card border border-line px-3 py-2 text-sm text-ink outline-none"
            />
          </label>

          {decode.porteur !== "proprietaire" && (
            <label className={etiquette}>
              Prestation attribuée au
              <select
                value={attribution}
                onChange={(e) => setAttribution(e.target.value as AttributionPrestation | "")}
                className={champ}
              >
                <option value="">Choisir</option>
                <option value="mandataire">Mandataire</option>
                <option value="proprietaire">Propriétaire</option>
                <option value="locataire">Locataire</option>
              </select>
            </label>
          )}
          {decode.porteur !== "proprietaire" &&
            attribution === "locataire" &&
            !(lierResa && reservationId) && (
              <p className="text-[11px] text-red-700">
                Facturée au locataire : associez la mission à une réservation.
              </p>
            )}

          {decode.porteur === "proprietaire" ? (
            <p className="rounded-card border border-line bg-surface px-3 py-2 text-xs text-ink-body">
              Le propriétaire réalise la mission : pas de facturation.
            </p>
          ) : (
            <div className="min-w-0 rounded-card border border-line bg-surface px-3 py-2">
              <p className="text-sm text-ink" data-testid="tarif-facture">
                Tarif facturé de la prestation :{" "}
                <strong>{affiche.centimes == null ? "à définir" : euros(affiche.centimes)}</strong>{" "}
                <span className="text-xs text-ink-muted">
                  ({libelleOrigineTarif(affiche.origine)})
                </span>
              </p>
              <label className="mt-2 block text-xs text-ink-muted">
                Modifier le tarif (€)
                <input
                  inputMode="decimal"
                  value={tarif}
                  onChange={(e) => setTarif(e.target.value)}
                  placeholder="Laisser vide pour le tarif automatique"
                  className={champ}
                />
              </label>
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onFermer}
            className="h-11 rounded-card border border-line px-3 text-xs text-ink-body md:h-9"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={enregistrer}
            className="h-11 rounded-card bg-ink px-4 text-xs font-medium text-white md:h-9"
          >
            Enregistrer
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
