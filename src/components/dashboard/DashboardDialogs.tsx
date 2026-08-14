import {
  Calendar,
  CheckCircle,
  ClipboardList,
  MapPin,
  Maximize2,
  Plus,
  SlidersHorizontal,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  BIENS_MO1,
  ENSEMBLES_MO1,
  TYPES_REGLE,
  emojiType,
  libelleStatut,
  type EnsembleRegles,
  type EvenementMo1,
  type ImpactEvenement,
  type LoyerMo1,
  type MissionMo1,
  type RegleTarif,
  type TypeModifTarif,
  type TypeRegle,
} from "@/data/planning-mo1";
import { cn } from "@/lib/utils";

export function MissionsPlusPopover({
  bienNom,
  dateLabel,
  missions,
  onChoisir,
}: {
  bienNom: string;
  dateLabel: string;
  missions: MissionMo1[];
  onChoisir: (m: MissionMo1) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-[19px] w-full items-center gap-1 px-1 text-left text-[10px] font-medium text-[#99a1af]"
        >
          <Maximize2 className="size-[9px] shrink-0" />
          +{missions.length - 1} voir plus
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[360px] overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white p-0 shadow-lg"
      >
        <div className="flex items-start justify-between border-b border-[#f3f4f6] px-4 py-3">
          <div>
            <p className="text-sm text-[#1e2939]">{bienNom}</p>
            <p className="text-xs text-[#99a1af]">
              {dateLabel} · {missions.length} mission{missions.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <ul>
          {missions.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onChoisir(m)}
                className="flex w-full items-start gap-3 border-b border-[#f3f4f6] px-4 py-3 text-left last:border-b-0 hover:bg-[#f9fafb]"
              >
                <span className="text-base leading-6">{m.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#1e2939]">{m.titre}</span>
                    <span
                      className={cn(
                        "rounded border px-1.5 py-0.5 text-[10px]",
                        m.statut === "en_cours"
                          ? "border-[#d1d5dc] text-[#4a5565]"
                          : m.statut === "terminee"
                            ? "border-[#e5e7eb] text-[#99a1af] line-through"
                            : "border-[#d1d5dc] text-[#4a5565]",
                      )}
                    >
                      {libelleStatut(m.statut)}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-[#99a1af]">
                    {m.heure} · {m.assigne}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export function MissionInfoDialog({
  mission,
  bienNom,
  ouvert,
  onFermer,
}: {
  mission: MissionMo1 | null;
  bienNom: string;
  ouvert: boolean;
  onFermer: () => void;
}) {
  const [details, setDetails] = useState(false);

  if (!mission) return null;

  return (
    <Dialog
      open={ouvert}
      onOpenChange={(o) => {
        if (!o) {
          setDetails(false);
          onFermer();
        }
      }}
    >
      <DialogContent
        className={cn(
          "gap-0 overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white p-0 shadow-lg",
          details ? "max-h-[90vh] max-w-[448px] overflow-y-auto" : "max-w-[440px]",
        )}
      >
        {details ? (
          <DetailsMissionPanel mission={mission} onFermer={onFermer} />
        ) : (
          <>
            <div className="flex items-center gap-2 border-b border-[#f3f4f6] px-5 py-4">
              <ClipboardList className="size-4 text-[#4a5565]" />
              <DialogTitle className="text-sm font-medium text-[#1e2939]">
                Détail de la mission
              </DialogTitle>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base text-[#1e2939]">{mission.titre}</p>
                  <p className="mt-1 text-xs text-[#6a7282]">
                    {mission.emoji} {mission.type === "Menage" ? "Ménage" : mission.type}
                  </p>
                </div>
                <span className="rounded border border-[#d1d5dc] px-2 py-1 text-xs text-[#4a5565]">
                  {libelleStatut(mission.statut)}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-[10px] border border-[#f3f4f6] p-2.5">
                  <p className="text-xs text-[#99a1af]">Bien</p>
                  <p className="mt-1 text-xs text-[#1e2939]">{bienNom}</p>
                </div>
                <div className="rounded-[10px] border border-[#f3f4f6] p-2.5">
                  <p className="text-xs text-[#99a1af]">Date & heure</p>
                  <p className="mt-1 text-xs text-[#1e2939]">
                    {new Date(mission.date + "T12:00:00").toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                    })}{" "}
                    · {mission.heure}
                  </p>
                </div>
                <div className="col-span-2 rounded-[10px] border border-[#f3f4f6] p-2.5">
                  <p className="text-xs text-[#99a1af]">Assigné à</p>
                  <p className="mt-1 text-xs text-[#1e2939]">{mission.assigne}</p>
                </div>
              </div>
              <div className="mt-2 rounded-[10px] border border-[#f3f4f6] p-2.5">
                <p className="text-xs text-[#99a1af]">Description</p>
                <p className="mt-1 text-xs leading-5 text-[#4a5565]">{mission.description}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-[#f3f4f6] px-5 py-3">
              <button
                type="button"
                onClick={() => setDetails(true)}
                className="h-[30px] rounded border border-[#d1d5dc] bg-white px-3 text-xs font-medium text-[#4a5565]"
              >
                Plus de détails
              </button>
              <button
                type="button"
                onClick={onFermer}
                className="h-[30px] rounded border border-[#d1d5dc] bg-white px-4 text-xs font-medium text-[#4a5565]"
              >
                Fermer
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailsMissionPanel({
  mission,
  onFermer,
}: {
  mission: MissionMo1;
  onFermer: () => void;
}) {
  const [ouvert, setOuvert] = useState({ desc: true, periode: true });
  return (
    <div>
      <div className="flex items-start justify-between px-4 pt-4">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-[10px] bg-[#e5e7eb] text-lg text-[#4a5565]">
            J
          </span>
          <div>
            <DialogTitle className="text-lg font-medium text-[#1e2939]">Clean Up</DialogTitle>
            <p className="text-sm text-[#99a1af]">ID #12345</p>
          </div>
        </div>
        <button type="button" onClick={onFermer} aria-label="Fermer" className="text-[#99a1af]">
          <X className="size-4" />
        </button>
      </div>
      <DialogDescription className="px-4 pt-2 text-sm text-[#6a7282]">
        Détails de la réservation et informations du locataire
      </DialogDescription>
      <div className="mx-auto mt-3 flex h-[29px] w-[305px] items-center justify-center rounded-full bg-[#f3f4f6] text-xs text-[#4a5565]">
        Validé
      </div>
      <button
        type="button"
        className="mt-4 flex w-full items-center justify-between border-t border-[#f3f4f6] px-4 py-4 text-left"
        onClick={() => setOuvert((o) => ({ ...o, desc: !o.desc }))}
      >
        <span className="text-base text-[#1e2939]">Descriptions</span>
        <span className="text-[#99a1af]">▼</span>
      </button>
      {ouvert.desc && (
        <div className="space-y-3 px-4 pb-4 text-sm">
          <p className="text-[#1e2939]">★ Prestations et services</p>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-[#99a1af]">Type appartement</p>
              <p className="text-[#1e2939]">2 pièces</p>
            </div>
            <div>
              <p className="text-[#99a1af]">Montant</p>
              <p className="text-[#1e2939]">30 euros</p>
            </div>
            <div>
              <p className="text-[#99a1af]">Lavage du linge</p>
              <p className="text-[#1e2939]">20 euros</p>
            </div>
            <div>
              <p className="text-[#99a1af]">Installation du linge</p>
              <p className="text-[#1e2939]">Inclus</p>
            </div>
            <div>
              <p className="text-[#99a1af]">Consommables</p>
              <p className="text-[#1e2939]">Inclus</p>
            </div>
            <div>
              <p className="text-[#99a1af]">Autres</p>
              <p className="text-[#1e2939]">Lit bébé</p>
              <p className="text-[#1e2939]">Installation</p>
            </div>
            <div>
              <p className="text-[#99a1af]">Montant</p>
              <p className="text-[#1e2939]">10 euros</p>
              <p className="text-[#1e2939]">10 euros</p>
            </div>
            <div>
              <p className="text-[#99a1af]">Comissions</p>
              <p className="text-[#1e2939]">10%</p>
            </div>
            <div>
              <p className="text-[#99a1af]">Montant</p>
              <p className="text-[#1e2939]">200 euros</p>
            </div>
          </div>
        </div>
      )}
      <button
        type="button"
        className="flex w-full items-center justify-between border-t border-[#f3f4f6] px-4 py-4 text-left"
        onClick={() => setOuvert((o) => ({ ...o, periode: !o.periode }))}
      >
        <span className="text-base text-[#1e2939]">Période de la prestation</span>
        <span className="text-[#99a1af]">▼</span>
      </button>
      {ouvert.periode && (
        <div className="grid grid-cols-3 gap-3 px-4 pb-6 text-xs">
          <div>
            <p className="text-[#99a1af]">Prestatation réalisée par:</p>
            <p className="mt-1 text-[#1e2939]">Clean Up</p>
          </div>
          <div>
            <p className="text-[#99a1af]">Date de début:</p>
            <p className="mt-1 text-[#1e2939]">01/01/2025</p>
          </div>
          <div>
            <p className="text-[#99a1af]">Date de fin:</p>
            <p className="mt-1 text-[#1e2939]">01/01/2025</p>
          </div>
          <div>
            <p className="text-[#99a1af]">Récurrence</p>
            <p className="mt-1 text-[#1e2939]">Hebdomadaire</p>
          </div>
          <div className="col-span-2">
            <p className="text-[#99a1af]">Mission</p>
            <p className="mt-1 text-[#1e2939]">{mission.titre}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function QuittanceDialog({
  loyer,
  ouvert,
  onFermer,
  onConfirmer,
}: {
  loyer: LoyerMo1 | null;
  ouvert: boolean;
  onFermer: () => void;
  onConfirmer: () => void;
}) {
  if (!loyer) return null;
  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onFermer()}>
      <DialogContent className="max-w-[320px] gap-0 rounded-[10px] border border-[#e5e7eb] bg-white p-0 shadow-lg">
        <DialogTitle className="px-6 pt-6 text-sm font-medium text-[#1e2939]">
          Générer une quittance
        </DialogTitle>
        <div className="space-y-1 px-6 py-3 text-xs text-[#4a5565]">
          <p>Locataire : {loyer.locataire}</p>
          <p>Bien : {loyer.bienNom}</p>
          <p>Montant : {loyer.montant.toLocaleString("fr-FR")} €</p>
        </div>
        <div className="flex justify-end gap-2 px-6 pb-6">
          <button
            type="button"
            onClick={onFermer}
            className="h-[30px] rounded border border-[#d1d5dc] bg-white px-3 text-xs font-medium text-[#4a5565]"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirmer}
            className="h-[30px] rounded bg-[#1e2939] px-3 text-xs font-medium text-white"
          >
            Confirmer & Générer
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CreateEventDialog({
  ouvert,
  onFermer,
  onCreer,
}: {
  ouvert: boolean;
  onFermer: () => void;
  onCreer: (e: EvenementMo1) => void;
}) {
  const [nom, setNom] = useState("");
  const [lieu, setLieu] = useState("");
  const [debut, setDebut] = useState("");
  const [fin, setFin] = useState("");
  const [impact, setImpact] = useState<ImpactEvenement>("Impact modéré");
  const [biens, setBiens] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const reset = () => {
    setNom("");
    setLieu("");
    setDebut("");
    setFin("");
    setImpact("Impact modéré");
    setBiens([]);
    setNotes("");
  };

  return (
    <Dialog
      open={ouvert}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onFermer();
        }
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-[720px] overflow-y-auto rounded-[10px] border border-[#e5e7eb] bg-white p-6">
        <DialogTitle className="text-sm font-medium text-[#1e2939]">Créer un événement</DialogTitle>
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm text-[#1e2939]">Nom de l'événement *</span>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Festival de Jazz, Marathon, Salon professionnel..."
              className="mt-2 h-[42px] w-full rounded-[10px] border border-[#e5e7eb] px-4 text-sm text-[#1e2939] outline-none placeholder:text-[#99a1af]"
            />
          </label>
          <label className="block">
            <span className="flex items-center gap-2 text-sm text-[#1e2939]">
              <MapPin className="size-4" />
              Localisation
            </span>
            <input
              value={lieu}
              onChange={(e) => setLieu(e.target.value)}
              placeholder="Ex: Paris 15ème, Lyon Centre..."
              className="mt-2 h-[42px] w-full rounded-[10px] border border-[#e5e7eb] px-4 text-sm text-[#1e2939] outline-none placeholder:text-[#99a1af]"
            />
            <p className="mt-2 text-xs text-[#99a1af]">
              Indiquez où se déroule l'événement pour calculer l'impact sur vos biens.
            </p>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="flex items-center gap-2 text-sm text-[#1e2939]">
                <Calendar className="size-4" />
                Date de début *
              </span>
              <input
                type="date"
                value={debut}
                onChange={(e) => setDebut(e.target.value)}
                className="mt-2 h-[42px] w-full rounded-[10px] border border-[#e5e7eb] px-4 text-sm text-[#1e2939] outline-none"
              />
            </label>
            <label className="block">
              <span className="flex items-center gap-2 text-sm text-[#1e2939]">
                <Calendar className="size-4" />
                Date de fin
              </span>
              <input
                type="date"
                value={fin}
                onChange={(e) => setFin(e.target.value)}
                className="mt-2 h-[42px] w-full rounded-[10px] border border-[#e5e7eb] px-4 text-sm text-[#1e2939] outline-none"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-sm text-[#1e2939]">Type d'impact</span>
            <select
              value={impact}
              onChange={(e) => setImpact(e.target.value as ImpactEvenement)}
              className="mt-2 h-[41px] w-full rounded-[10px] border border-[#e5e7eb] bg-white px-4 text-sm text-[#1e2939] outline-none"
            >
              <option>Fort impact</option>
              <option>Impact modéré</option>
              <option>Opportunité</option>
            </select>
          </label>
          <fieldset>
            <legend className="text-sm text-[#1e2939]">Propriétés concernées</legend>
            <div className="mt-3 space-y-2 rounded-[10px] border border-[#e5e7eb] p-4">
              {[...BIENS_MO1.map((b) => b.nom), "Maison des Vignes"].map((nomBien) => (
                <label key={nomBien} className="flex items-center gap-2 text-sm text-[#1e2939]">
                  <input
                    type="checkbox"
                    checked={biens.includes(nomBien)}
                    onChange={() =>
                      setBiens((l) =>
                        l.includes(nomBien) ? l.filter((x) => x !== nomBien) : [...l, nomBien],
                      )
                    }
                    className="size-4 rounded border-[#d1d5dc]"
                  />
                  {nomBien}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-[#99a1af]">
              Sélectionnez les propriétés qui pourraient être impactées.
            </p>
          </fieldset>
          <label className="block">
            <span className="text-sm text-[#1e2939]">Description / Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Décrivez l'impact potentiel de cet événement sur vos propriétés..."
              className="mt-2 h-[114px] w-full resize-none rounded-[10px] border border-[#e5e7eb] px-4 py-2 text-sm text-[#1e2939] outline-none placeholder:text-[#99a1af]"
            />
          </label>
        </div>
        <div className="flex items-center justify-between pt-2">
          <p className="max-w-[309px] text-xs text-[#99a1af]">
            💡 Les événements vous aident à anticiper les variations de demande.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onFermer}
              className="h-9 rounded-[10px] border border-[#d1d5dc] px-4 text-sm text-[#4a5565]"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={!nom.trim() || !debut}
              onClick={() => {
                onCreer({
                  id: `ev-${Date.now()}`,
                  titre: nom.trim(),
                  lieu: lieu.trim() || "Non précisé",
                  dates: fin ? `${debut} – ${fin}` : debut,
                  impact,
                  description: notes.trim() || "Événement ajouté manuellement.",
                });
                reset();
                onFermer();
              }}
              className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-[#1e2939] px-4 text-sm font-medium text-white disabled:opacity-50"
            >
              <Plus className="size-4" />
              Créer l'événement
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CreateRegleDialog({
  ouvert,
  onFermer,
  onCreer,
  ensembles,
}: {
  ouvert: boolean;
  onFermer: () => void;
  onCreer: (r: RegleTarif, nouvelEnsemble?: string) => void;
  ensembles: EnsembleRegles[];
}) {
  const [nom, setNom] = useState("");
  const [type, setType] = useState<TypeRegle>("weekend");
  const [debut, setDebut] = useState("2026-03-13");
  const [fin, setFin] = useState("2026-03-13");
  const [bienId, setBienId] = useState("suzette");
  const [modif, setModif] = useState<TypeModifTarif>("majoration");
  const [valeur, setValeur] = useState(20);
  const [note, setNote] = useState("");
  const [ensembleId, setEnsembleId] = useState("en1");

  const bien = BIENS_MO1.find((b) => b.id === bienId) ?? BIENS_MO1[0]!;
  const signe = modif === "reduction" ? -1 : 1;
  const variation = modif === "fixe" ? 0 : valeur * signe;
  const prix = modif === "fixe" ? valeur : Math.round(bien.baseNuit * (1 + variation / 100));

  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onFermer()}>
      <DialogContent className="max-h-[90vh] max-w-[520px] overflow-y-auto rounded-[10px] border border-[#e5e7eb] bg-white p-0">
        <div className="flex items-center justify-between border-b border-[#f3f4f6] px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-sm font-medium text-[#1e2939]">
            <Tag className="size-[15px]" />
            Créer une règle de tarification
          </DialogTitle>
        </div>
        <div className="space-y-4 px-5 py-4">
          <label className="block">
            <span className="text-xs text-[#4a5565]">
              Nom de la règle (ex : Week-end fête de la musique)
            </span>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Nommez cette règle…"
              className="mt-2 h-[34px] w-full rounded-[10px] border border-[#e5e7eb] px-3 text-xs text-[#1e2939] outline-none placeholder:text-[#99a1af]"
            />
          </label>
          <div>
            <p className="text-xs text-[#4a5565]">Type d'événement / condition</p>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {TYPES_REGLE.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={cn(
                    "flex h-[49px] flex-col items-center justify-center rounded-[10px] border text-[10px]",
                    type === t.id
                      ? "border-[#1e2939] bg-[#f9fafb] text-[#1e2939]"
                      : "border-[#e5e7eb] text-[#4a5565]",
                  )}
                >
                  <span>{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="flex items-center gap-1 text-xs text-[#4a5565]">
                <Calendar className="size-2.5" /> Début
              </span>
              <input
                type="date"
                value={debut}
                onChange={(e) => setDebut(e.target.value)}
                className="mt-2 h-[34px] w-full rounded-[10px] border border-[#e5e7eb] px-3 text-xs outline-none"
              />
            </label>
            <label className="block">
              <span className="flex items-center gap-1 text-xs text-[#4a5565]">
                <Calendar className="size-2.5" /> Fin
              </span>
              <input
                type="date"
                value={fin}
                onChange={(e) => setFin(e.target.value)}
                className="mt-2 h-[34px] w-full rounded-[10px] border border-[#e5e7eb] px-3 text-xs outline-none"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs text-[#4a5565]">Bien(s) concerné(s)</span>
            <select
              value={bienId}
              onChange={(e) => setBienId(e.target.value)}
              className="mt-2 h-9 w-full rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-xs outline-none"
            >
              {BIENS_MO1.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nom}
                </option>
              ))}
            </select>
          </label>
          <div>
            <p className="text-xs text-[#4a5565]">Type de modification tarifaire</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(
                [
                  ["majoration", "Majoration %"],
                  ["reduction", "Réduction %"],
                  ["fixe", "Prix fixe"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setModif(id)}
                  className={cn(
                    "h-14 rounded-[10px] border text-xs",
                    modif === id
                      ? "border-[#1e2939] bg-[#f9fafb] text-[#1e2939]"
                      : "border-[#e5e7eb] text-[#4a5565]",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="text-xs text-[#4a5565]">Valeur (%)</span>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="number"
                value={valeur}
                onChange={(e) => setValeur(Number(e.target.value))}
                className="h-[34px] w-[112px] rounded-[10px] border border-[#e5e7eb] px-3 text-xs outline-none"
              />
              <p className="text-xs text-[#6a7282]">
                Base {bien.baseNuit}€ →{" "}
                <span className="text-[#1e2939]">
                  {prix} €/nuit{modif !== "fixe" ? `(${variation > 0 ? "+" : ""}${variation}%)` : ""}
                </span>
              </p>
            </div>
          </label>
          <label className="block">
            <span className="text-xs text-[#4a5565]">Note / commentaire (optionnel)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex : Marché de Noël, festival local…"
              className="mt-2 h-[50px] w-full resize-none rounded-[10px] border border-[#e5e7eb] px-3 py-2 text-xs outline-none placeholder:text-[#99a1af]"
            />
          </label>
          <div className="rounded-[10px] border border-[#e5e7eb] p-3">
            <p className="text-xs text-[#4a5565]">Ajouter à un ensemble de règles</p>
            <div className="mt-2 space-y-1">
              {ensembles.map((e) => (
                <label
                  key={e.id}
                  className="flex items-center gap-2 rounded-[8px] px-2 py-2 text-xs hover:bg-[#f9fafb]"
                >
                  <input
                    type="radio"
                    name="ensemble"
                    checked={ensembleId === e.id}
                    onChange={() => setEnsembleId(e.id)}
                  />
                  <SlidersHorizontal className="size-3 text-[#6a7282]" />
                  <span className="flex-1 text-[#1e2939]">{e.nom}</span>
                  <span className="text-[#99a1af]">
                    {ENSEMBLES_MO1.find((x) => x.id === e.id) ? (e.id === "en3" ? "1 règle" : "2 règles") : ""}
                  </span>
                </label>
              ))}
              <p className="flex items-center gap-2 px-2 py-2 text-xs text-[#4a5565]">
                <Plus className="size-3" />
                Créer un nouvel ensemble
              </p>
            </div>
          </div>
          <div className="rounded-[10px] border border-[#e5e7eb] p-3">
            <p className="flex items-center gap-2 text-xs text-[#1e2939]">
              <CheckCircle className="size-3" />
              Récapitulatif de la règle
            </p>
            <dl className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <dt className="text-[#99a1af]">Type</dt>
                <dd>
                  {emojiType(type)} {TYPES_REGLE.find((t) => t.id === type)?.label}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#99a1af]">Période</dt>
                <dd>1 nuit · 13 mars → 13 mars</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#99a1af]">Bien(s)</dt>
                <dd>{bien.nom}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#99a1af]">Tarif</dt>
                <dd>
                  {prix} €/nuit ({variation > 0 ? "+" : ""}
                  {variation}%)
                </dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-[#f3f4f6] px-5 py-3">
          <button
            type="button"
            onClick={onFermer}
            className="h-[30px] rounded border border-[#d1d5dc] px-3 text-xs font-medium text-[#4a5565]"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => {
              onCreer({
                id: `rg-${Date.now()}`,
                ensembleId,
                nom: nom.trim() || "Nouvelle règle",
                type,
                debut,
                fin,
                nuits: 1,
                biens: bienId,
                variation,
                note: note.trim() || undefined,
              });
              onFermer();
            }}
            className="inline-flex h-[30px] items-center gap-1 rounded bg-[#1e2939] px-3 text-xs font-medium text-white"
          >
            <Tag className="size-[11px]" />
            Créer la règle
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function GererReglesPanel({
  ouvert,
  onFermer,
  ensembles,
  regles,
  onToggleEnsemble,
  onSupprimerEnsemble,
  onSupprimerRegle,
  onAjouterRegle,
}: {
  ouvert: boolean;
  onFermer: () => void;
  ensembles: EnsembleRegles[];
  regles: RegleTarif[];
  onToggleEnsemble: (id: string) => void;
  onSupprimerEnsemble: (id: string) => void;
  onSupprimerRegle: (id: string) => void;
  onAjouterRegle: (ensembleId: string) => void;
}) {
  const parEnsemble = useMemo(
    () =>
      ensembles.map((e) => ({
        ...e,
        items: regles.filter((r) => r.ensembleId === e.id),
      })),
    [ensembles, regles],
  );

  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onFermer()}>
      <DialogContent className="max-h-[90vh] max-w-[400px] overflow-y-auto rounded-[10px] border border-[#e5e7eb] bg-white p-0">
        <div className="flex items-center gap-2 border-b border-[#f3f4f6] px-5 py-5">
          <SlidersHorizontal className="size-[15px] text-[#4a5565]" />
          <DialogTitle className="text-sm font-medium text-[#1e2939]">
            Ensembles de règles
          </DialogTitle>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-2 px-5 py-3 text-[10px] text-[#6a7282]">
          {TYPES_REGLE.map((t) => (
            <span key={t.id}>
              {t.emoji} {t.label}
            </span>
          ))}
        </div>
        <div className="space-y-3 px-4 pb-6">
          {parEnsemble.map((e) => (
            <div key={e.id} className="overflow-hidden rounded-[10px] border border-[#e5e7eb]">
              <div className="flex items-start gap-2 px-3 py-3">
                <button
                  type="button"
                  onClick={() => onToggleEnsemble(e.id)}
                  className={cn(
                    "mt-0.5 h-5 w-9 shrink-0 rounded-full border",
                    e.actif ? "border-[#1e2939] bg-[#1e2939]" : "border-[#d1d5dc] bg-[#e5e7eb]",
                  )}
                  aria-label={e.actif ? "Désactiver" : "Activer"}
                >
                  <span
                    className={cn(
                      "block size-4 rounded-full bg-white transition-transform",
                      e.actif ? "translate-x-4" : "translate-x-0.5",
                    )}
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-xs text-[#1e2939]">
                    {e.nom}
                    {!e.actif && (
                      <span className="rounded border border-[#e5e7eb] px-1.5 text-[10px] text-[#99a1af]">
                        Inactif
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-[#99a1af]">{e.description}</p>
                </div>
                <span className="text-[10px] text-[#99a1af]">
                  {e.items.length} règle{e.items.length > 1 ? "s" : ""}
                </span>
                <button
                  type="button"
                  onClick={() => onSupprimerEnsemble(e.id)}
                  aria-label={`Supprimer ${e.nom}`}
                  className="text-[#99a1af]"
                >
                  <Trash2 className="size-[13px]" />
                </button>
              </div>
              {(
                <div className="border-t border-[#f3f4f6]">
                  {e.items.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-start gap-2 border-b border-[#f3f4f6] px-3 py-2.5 last:border-b-0"
                    >
                      <span className="mt-1 size-2.5 rounded-full bg-[#e5e7eb]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-[#1e2939]">
                          {r.nom} {emojiType(r.type)}
                        </p>
                        <p className="text-[10px] text-[#99a1af]">
                          {new Date(r.debut + "T12:00:00").toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })}{" "}
                          →{" "}
                          {new Date(r.fin + "T12:00:00").toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })}{" "}
                          · {r.nuits} nuit{r.nuits > 1 ? "s" : ""} · Tous les biens
                        </p>
                        {r.note && <p className="text-[10px] text-[#99a1af]">{r.note}</p>}
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px]",
                          r.variation < 0
                            ? "border-[#e5e7eb] text-[#6a7282]"
                            : "border-[#e5e7eb] text-[#4a5565]",
                        )}
                      >
                        {r.variation < 0 ? (
                          <TrendingDown className="size-[9px]" />
                        ) : (
                          <TrendingUp className="size-[9px]" />
                        )}
                        {r.variation > 0 ? "+" : ""}
                        {r.variation}%
                      </span>
                      <button
                        type="button"
                        onClick={() => onSupprimerRegle(r.id)}
                        aria-label={`Supprimer ${r.nom}`}
                        className="text-[#99a1af]"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => onAjouterRegle(e.id)}
                    className="flex h-8 w-full items-center justify-center gap-1 text-xs text-[#4a5565]"
                  >
                    <Plus className="size-[11px]" />
                    Ajouter une règle
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
