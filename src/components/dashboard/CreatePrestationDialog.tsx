import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { emojiMission } from "@/data/v1-metier";
import type { MissionMo1 } from "@/data/planning-mo1";
import { ajouterMission, idNouveau, modifierMission, useSession } from "@/data/session";
import { toastErreur, toastOk } from "@/lib/feedback";

const TYPES: MissionMo1["type"][] = ["Menage", "Check-in", "Check-out", "Inventaire", "Maintenance"];

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
  const edition = Boolean(mission);
  const [type, setType] = useState<MissionMo1["type"]>("Menage");
  const [titre, setTitre] = useState("");
  const [heure, setHeure] = useState("10:00");
  const [assigne, setAssigne] = useState("");
  const [description, setDescription] = useState("");
  const [logement, setLogement] = useState(bienId ?? session.biens[0]?.id ?? "");

  useEffect(() => {
    if (!ouvert) return;
    if (mission) {
      setType(mission.type);
      setTitre(mission.titre);
      setHeure(mission.heure);
      setAssigne(mission.assigne);
      setDescription(mission.description);
      setLogement(mission.bienId);
      return;
    }
    setType("Menage");
    setTitre("");
    setHeure("10:00");
    setAssigne(session.prestataires.find((p) => p.actif)?.nom ?? "");
    setDescription("");
    setLogement(bienId ?? session.biens[0]?.id ?? "");
  }, [ouvert, mission, bienId, session.biens, session.prestataires]);

  const enregistrer = () => {
    const bien = logement || bienId;
    const jour = mission?.date ?? date;
    if (!bien || !jour) {
      toastErreur("Indiquez le logement et la date.");
      return;
    }
    const libelle = titre.trim() || type;
    if (edition && mission) {
      modifierMission(mission.id, {
        type,
        titre: libelle,
        emoji: emojiMission(type),
        heure,
        assigne: assigne.trim() || "Non assigné",
        description: description.trim() || `${libelle} planifié.`,
        bienId: bien,
      });
      toastOk("Prestation mise à jour.");
      onFermer();
      return;
    }
    ajouterMission({
      id: idNouveau("ms"),
      bienId: bien,
      date: jour,
      titre: libelle,
      type,
      emoji: emojiMission(type),
      heure,
      assigne: assigne.trim() || "Non assigné",
      statut: "a_faire",
      description: description.trim() || `${libelle} planifié.`,
    });
    toastOk("Prestation ajoutée au calendrier.");
    onFermer();
  };

  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onFermer()}>
      <DialogContent className="max-w-md">
        <DialogTitle>{edition ? "Modifier la prestation" : "Ajouter une prestation"}</DialogTitle>
        <DialogDescription>
          {edition
            ? "Les changements s'appliquent immédiatement au planning."
            : "La mission apparaît sur la case choisie, avec un assigné et un horaire."}
        </DialogDescription>
        <div className="mt-3 space-y-3">
          <label className="block text-xs text-ink-muted">
            Type
            <select
              value={type}
              onChange={(e) => setType(e.target.value as MissionMo1["type"])}
              className={champ}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {emojiMission(t)} {t === "Menage" ? "Ménage" : t}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-ink-muted">
            Titre
            <input
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder={type === "Menage" ? "Ménage" : type}
              className={champ}
            />
          </label>
          {!mission && (
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
          )}
          <label className="block text-xs text-ink-muted">
            Horaire
            <input type="time" value={heure} onChange={(e) => setHeure(e.target.value)} className={champ} />
          </label>
          <label className="block text-xs text-ink-muted">
            Assigné à
            <select value={assigne} onChange={(e) => setAssigne(e.target.value)} className={champ}>
              <option value="">Non assigné</option>
              {session.prestataires.map((p) => (
                <option key={p.id} value={p.nom}>
                  {p.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-ink-muted">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-card border border-line px-3 py-2 text-sm text-ink outline-none"
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onFermer}
            className="h-9 rounded-card border border-line px-3 text-xs text-ink-body"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={enregistrer}
            className="h-9 rounded-card bg-ink px-3 text-xs font-medium text-white"
          >
            {edition ? "Enregistrer" : "Créer la prestation"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
