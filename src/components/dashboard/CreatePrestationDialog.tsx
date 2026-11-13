// SOURCE: Hublify V1.0 — création de mission (notes dashboard)
// Type au choix ou créé, plage horaire, attribution, association à la réservation.

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "@/auth/auth-context";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { MissionMo1 } from "@/data/planning-mo1";
import { ajouterMission, idNouveau, modifierMission, useSession } from "@/data/session";
import { emojiMission } from "@/data/v1-metier";
import { listerEquipe } from "@/lib/auth.functions";
import { toastErreur, toastOk } from "@/lib/feedback";
import {
  TYPES_PRESTATION,
  descriptionVisible,
  conserverReglementPrestation,
  ecrireDescription,
  facturationPrestation,
  heureAffichee,
  horaireDansPlage,
  joursPrestation,
  lireMetaPrestation,
  plageValide,
  type AttributionPrestation,
  type MetaPrestation,
  type PorteurPrestation,
} from "@/lib/gestionnaire-planning";

const champ =
  "mt-1 h-11 w-full rounded-card border border-line bg-white px-3 text-sm text-ink outline-none md:h-9";

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
  const edition = Boolean(mission);
  const { data: equipe } = useQuery({
    queryKey: ["equipe-prestation", auth?.orgId],
    queryFn: () => listerEquipe(),
    enabled: ouvert && Boolean(auth?.orgId),
    staleTime: 60_000,
  });
  const [type, setType] = useState<MissionMo1["type"]>("Menage");
  const [typeLibre, setTypeLibre] = useState("");
  const [creerType, setCreerType] = useState(false);
  const [titre, setTitre] = useState("");
  const [plageDebut, setPlageDebut] = useState("10:00");
  const [plageFin, setPlageFin] = useState("14:00");
  const [precise, setPrecise] = useState("");
  const [porteur, setPorteur] = useState<PorteurPrestation>("prestataire");
  const [assigne, setAssigne] = useState("");
  const [attribution, setAttribution] = useState<AttributionPrestation | "">("");
  const [tarif, setTarif] = useState("");
  const [reservationId, setReservationId] = useState("");
  const [description, setDescription] = useState("");
  const [logement, setLogement] = useState(bienId ?? "");
  const [jour, setJour] = useState(date ?? "");
  const [jourFin, setJourFin] = useState(date ?? "");
  const [menage, setMenage] = useState(true);
  const [linge, setLinge] = useState(false);
  const [consommable, setConsommable] = useState(false);

  useEffect(() => {
    if (!ouvert) return;
    const meta = mission ? lireMetaPrestation(mission.description) : {};
    setType(mission?.type ?? "Menage");
    setTypeLibre(meta.typeLibre ?? "");
    setCreerType(Boolean(meta.typeLibre));
    setTitre(mission ? descriptionVisible(mission.titre) : "");
    setPlageDebut(meta.plageDebut ?? mission?.heure.slice(0, 5) ?? "10:00");
    setPlageFin(meta.plageFin ?? "14:00");
    setPrecise(meta.horairePrecise ?? "");
    setPorteur(meta.porteur ?? "prestataire");
    setAssigne(mission?.assigne === "Non assigné" ? "" : (mission?.assigne ?? ""));
    setAttribution(meta.attribution ?? "");
    setTarif(meta.tarif != null ? String(meta.tarif) : "");
    setReservationId(meta.reservationId ?? "");
    setDescription(mission ? descriptionVisible(mission.description) : "");
    setLogement(mission?.bienId ?? bienId ?? session.biens[0]?.id ?? "");
    setJour(mission?.date ?? date ?? "");
    setJourFin(mission?.date ?? date ?? "");
    setMenage(meta.menage ?? (mission?.type ?? "Menage") === "Menage");
    setLinge(meta.linge ?? false);
    setConsommable(meta.consommable ?? false);
  }, [ouvert, mission, bienId, date, session.biens]);

  const metaCourante = (): MetaPrestation => ({
    plageDebut,
    plageFin,
    ...(precise ? { horairePrecise: precise } : {}),
    ...(attribution ? { attribution } : {}),
    ...(tarif.trim() ? { tarif: Math.max(0, Number(tarif.replace(",", ".")) || 0) } : {}),
    ...(reservationId ? { reservationId } : {}),
    ...(creerType && typeLibre.trim() ? { typeLibre: typeLibre.trim() } : {}),
    ...(menage ? { menage: true } : {}),
    ...(linge ? { linge: true } : {}),
    ...(consommable ? { consommable: true } : {}),
    porteur,
  });

  const facture = facturationPrestation(metaCourante());
  const sejours = session.reservationsDossier.filter(
    (r) =>
      r.bienId === logement &&
      r.statut !== "Annulé" &&
      r.arrivee <= (jourFin || jour) &&
      r.depart >= jour,
  );

  const enregistrer = () => {
    const bien = logement || bienId;
    const debut = mission?.date ?? jour;
    if (!bien || !debut) {
      toastErreur("Indiquez le logement et la date.");
      return;
    }
    if (!plageValide(plageDebut, plageFin)) {
      toastErreur("La plage horaire doit commencer avant de finir.");
      return;
    }
    if (!horaireDansPlage(precise, plageDebut, plageFin)) {
      toastErreur("L'horaire précis doit rester dans la plage indiquée au prestataire.");
      return;
    }
    const typeLibrePropre = creerType ? typeLibre.trim() : "";
    if (creerType && !typeLibrePropre) {
      toastErreur("Indiquez le nom du type de prestation.");
      return;
    }
    const courante = metaCourante();
    const precedente = mission
      ? lireMetaPrestation(
          session.missions.find((item) => item.id === mission.id)?.description ??
            mission.description,
        )
      : {};
    const meta = edition ? conserverReglementPrestation(precedente, courante) : courante;
    // Les types custom restent sous le bucket enum « Maintenance » (contrainte SQL)
    // mais le libellé et typeLibre sont persistés pour l'affichage et le filtre.
    const typeStocke: MissionMo1["type"] = typeLibrePropre ? "Maintenance" : type;
    const libelle =
      typeLibrePropre || titre.trim() || TYPES_PRESTATION.find((t) => t.id === type)?.label || type;
    const nomAssigne =
      porteur === "proprietaire" ? "Propriétaire" : assigne.trim() || "Non assigné";
    const commun = {
      type: typeStocke,
      titre: libelle,
      emoji: emojiMission(typeStocke),
      heure: heureAffichee("", meta),
      assigne: nomAssigne,
      description: ecrireDescription(description.trim() || `${libelle} planifié.`, meta),
      bienId: bien,
    };
    if (edition && mission) {
      modifierMission(mission.id, commun);
      toastOk("Prestation mise à jour.");
      onFermer();
      return;
    }
    const jours = joursPrestation(debut, jourFin || debut);
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
        ? `Prestation posée sur ${jours.length} jours. Le prestataire choisira son horaire dans la plage.`
        : "Prestation ajoutée. Le prestataire choisira son horaire dans la plage.",
    );
    onFermer();
  };

  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onFermer()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogTitle>{edition ? "Modifier la prestation" : "Ajouter une prestation"}</DialogTitle>
        <DialogDescription>
          Choisissez un type ou créez-le. La plage est une ouverture : le prestataire confirme
          l'horaire précis à l'intérieur.
        </DialogDescription>
        <div className="mt-3 space-y-3">
          <label className="block text-xs text-ink-muted">
            Type de mission
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
            <label className="block text-xs text-ink-muted">
              Nouveau type
              <input
                value={typeLibre}
                onChange={(e) => setTypeLibre(e.target.value)}
                placeholder="Ex. Pressing, lit bébé"
                className={champ}
              />
            </label>
          )}
          <label className="block text-xs text-ink-muted">
            Titre
            <input value={titre} onChange={(e) => setTitre(e.target.value)} className={champ} />
          </label>
          {!mission && (
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs text-ink-muted">
                Logement
                <select
                  value={logement}
                  onChange={(e) => setLogement(e.target.value)}
                  className={champ}
                >
                  {session.biens.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nom}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-ink-muted">
                Associée à la réservation
                <select
                  value={reservationId}
                  onChange={(e) => setReservationId(e.target.value)}
                  className={champ}
                >
                  <option value="">Aucune</option>
                  {sejours.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.occupant}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs text-ink-muted">
              Date de début
              <input
                type="date"
                value={jour}
                onChange={(e) => setJour(e.target.value)}
                className={champ}
                disabled={edition}
              />
            </label>
            <label className="block text-xs text-ink-muted">
              Date de fin
              <input
                type="date"
                value={jourFin}
                onChange={(e) => setJourFin(e.target.value)}
                className={champ}
                disabled={edition}
              />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <label className="block text-xs text-ink-muted">
              Plage début
              <input
                type="time"
                value={plageDebut}
                onChange={(e) => setPlageDebut(e.target.value)}
                className={champ}
              />
            </label>
            <label className="block text-xs text-ink-muted">
              Plage fin
              <input
                type="time"
                value={plageFin}
                onChange={(e) => setPlageFin(e.target.value)}
                className={champ}
              />
            </label>
            <label className="block text-xs text-ink-muted">
              Horaire précis
              <input
                type="time"
                value={precise}
                onChange={(e) => setPrecise(e.target.value)}
                className={champ}
              />
            </label>
          </div>
          <p className="text-[11px] text-ink-muted">
            Le prestataire vous informera de l'horaire précis choisi dans cette plage.
          </p>
          <fieldset className="grid grid-cols-3 gap-2">
            <legend className="col-span-3 text-xs text-ink-muted">Inclus</legend>
            <Yn label="Ménage" oui={menage} onChange={setMenage} />
            <Yn label="Linge" oui={linge} onChange={setLinge} />
            <Yn label="Consommable" oui={consommable} onChange={setConsommable} />
          </fieldset>
          <label className="block text-xs text-ink-muted">
            Attribuée à
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
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs text-ink-muted">
              Réalisée par
              <select
                value={porteur}
                onChange={(e) => setPorteur(e.target.value as PorteurPrestation)}
                className={champ}
              >
                <option value="prestataire">Prestataire</option>
                <option value="teammate">Team mate</option>
                <option value="proprietaire">Propriétaire</option>
              </select>
            </label>
            {porteur !== "proprietaire" && (
              <label className="block text-xs text-ink-muted">
                {porteur === "teammate" ? "Team mate" : "Prestataire"}
                {porteur === "prestataire" ? (
                  <select
                    value={assigne}
                    onChange={(e) => setAssigne(e.target.value)}
                    className={champ}
                  >
                    <option value="">Non assigné</option>
                    {session.prestataires.map((p) => (
                      <option key={p.id} value={p.nom}>
                        {p.nom}
                      </option>
                    ))}
                  </select>
                ) : (equipe ?? []).filter((m) => m.statut === "actif").length > 0 ? (
                  <select
                    value={assigne}
                    onChange={(e) => setAssigne(e.target.value)}
                    className={champ}
                  >
                    <option value="">Non assigné</option>
                    {(equipe ?? [])
                      .filter((m) => m.statut === "actif")
                      .map((m) => (
                        <option key={m.id} value={`${m.prenom} ${m.nom}`.trim()}>
                          {m.prenom} {m.nom}
                        </option>
                      ))}
                  </select>
                ) : (
                  <input
                    value={assigne}
                    onChange={(e) => setAssigne(e.target.value)}
                    placeholder="Nom du coéquipier"
                    className={champ}
                  />
                )}
              </label>
            )}
          </div>
          <label className="block text-xs text-ink-muted">
            Tarif facturé (€)
            <input
              inputMode="decimal"
              value={tarif}
              onChange={(e) => setTarif(e.target.value)}
              placeholder={attribution === "mandataire" ? "Tarif contractuel" : "Tarif prestataire"}
              className={champ}
            />
          </label>
          <p className="rounded-card border border-line bg-surface px-3 py-2 text-xs text-ink-body">
            {facture.libelle}
          </p>
          <label className="block text-xs text-ink-muted">
            Consigne
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Ex. Installer le lit bébé dans la chambre 1"
              className="mt-1 w-full rounded-card border border-line px-3 py-2 text-sm text-ink outline-none"
            />
          </label>
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
            className="h-11 rounded-card bg-ink px-3 text-xs font-medium text-white md:h-9"
          >
            {edition ? "Enregistrer" : "Créer la prestation"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Yn({
  label,
  oui,
  onChange,
}: {
  label: string;
  oui: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="rounded-card border border-line p-2">
      <p className="text-[11px] text-ink">{label}</p>
      <div className="mt-1 inline-flex rounded-card border border-line p-0.5">
        <button
          type="button"
          aria-pressed={oui}
          onClick={() => onChange(true)}
          className={`h-7 min-w-8 rounded-[10px] px-2 text-[11px] ${oui ? "bg-ink text-white" : "text-ink-muted"}`}
        >
          Y
        </button>
        <button
          type="button"
          aria-pressed={!oui}
          onClick={() => onChange(false)}
          className={`h-7 min-w-8 rounded-[10px] px-2 text-[11px] ${!oui ? "bg-ink text-white" : "text-ink-muted"}`}
        >
          N
        </button>
      </div>
    </div>
  );
}
