import { Bot, ChevronLeft, Plus } from "lucide-react";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import {
  CIBLES_MESSAGE,
  DECLENCHEURS,
  ajouterParcours,
  ajouterTypeMessage,
  basculerParcours,
  basculerType,
  libelleDeclencheur,
  retirerTypeMessage,
  type CibleMessage,
  type DeclencheurId,
  type ParcoursAuto,
} from "@/data/messagerie-auto";
import { toastErreur, toastOk } from "@/lib/feedback";
import { cn } from "@/lib/utils";

export function PanneauMessagesAuto({
  parcours,
  onChange,
  onRetour,
  className,
}: {
  parcours: ParcoursAuto[];
  onChange: (parcours: ParcoursAuto[]) => void;
  onRetour: () => void;
  className?: string;
}) {
  return (
    <section className={cn("flex min-h-0 min-w-0 flex-1 flex-col bg-white", className)}>
      <header className="flex flex-wrap items-center gap-3 border-b border-surface-soft px-4 py-3">
        <button
          type="button"
          onClick={onRetour}
          className="flex size-11 items-center justify-center rounded-card border border-line text-ink-body"
          aria-label="Retour à la conversation"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 text-sm text-ink">
            <Bot className="size-4" aria-hidden />
            Paramétrage des messages automatiques
          </h2>
          <p className="text-xs text-ink-muted">
            Chaque parcours envoie un message type quand son déclencheur se produit.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(ajouterParcours(parcours))}
          className="inline-flex h-11 items-center gap-1.5 rounded-card border border-line px-3 text-xs font-medium text-ink-body"
        >
          <Plus className="size-3.5" />
          Ajouter un parcours
        </button>
      </header>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {parcours.map((p) => (
          <ParcoursCarte key={p.id} parcours={p} onChange={onChange} tous={parcours} />
        ))}
      </div>
    </section>
  );
}

function ParcoursCarte({
  parcours,
  tous,
  onChange,
}: {
  parcours: ParcoursAuto;
  tous: ParcoursAuto[];
  onChange: (parcours: ParcoursAuto[]) => void;
}) {
  return (
    <article className="rounded-card border border-line">
      <div className="flex items-center justify-between gap-3 border-b border-surface-soft px-4 py-3">
        <div>
          <h3 className="text-sm text-ink">{parcours.nom}</h3>
          <p className="text-[11px] text-ink-muted">
            {parcours.types.filter((t) => t.actif).length} actif
            {parcours.types.filter((t) => t.actif).length > 1 ? "s" : ""} sur{" "}
            {parcours.types.length}
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-xs text-ink-body">
          <span className="sr-only">Activer {parcours.nom}</span>
          <Switch
            checked={parcours.actif}
            onCheckedChange={(actif) => onChange(basculerParcours(tous, parcours.id, actif))}
            aria-label={`Activer ${parcours.nom}`}
          />
        </label>
      </div>
      <ul>
        {parcours.types.map((type) => (
          <li
            key={type.id}
            className="flex flex-col gap-2 border-b border-surface-soft px-4 py-3 last:border-b-0 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs text-ink">{type.libelle}</p>
              <p className="text-[11px] text-ink-muted">
                {libelleDeclencheur(type.declencheur)} ·{" "}
                {CIBLES_MESSAGE.find((c) => c.id === type.cible)?.libelle}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-subtle">{type.modele}</p>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={type.actif}
                onCheckedChange={(actif) => onChange(basculerType(tous, type.id, actif))}
                aria-label={`${type.actif ? "Désactiver" : "Activer"} ${type.libelle}`}
              />
              <button
                type="button"
                className="text-xs text-ink-muted underline-offset-2 hover:underline"
                onClick={() => onChange(retirerTypeMessage(tous, type.id))}
              >
                Retirer
              </button>
            </div>
          </li>
        ))}
      </ul>
      <FormulaireType
        onAjouter={(type) => {
          const resultat = ajouterTypeMessage(tous, parcours.id, type);
          if (resultat.erreur) {
            toastErreur(resultat.erreur);
            return false;
          }
          onChange(resultat.parcours);
          toastOk("Message type ajouté.");
          return true;
        }}
      />
    </article>
  );
}

function FormulaireType({
  onAjouter,
}: {
  onAjouter: (type: {
    libelle: string;
    declencheur: DeclencheurId;
    cible: CibleMessage;
    modele: string;
  }) => boolean;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [libelle, setLibelle] = useState("");
  const [declencheur, setDeclencheur] = useState<DeclencheurId>("demande-location");
  const [cible, setCible] = useState<CibleMessage>("tous");
  const [modele, setModele] = useState("Bonjour {nom}, ");

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="flex w-full items-center gap-1.5 px-4 py-3 text-left text-xs text-ink-body"
      >
        <Plus className="size-3.5" />
        Ajouter un message type
      </button>
    );
  }

  return (
    <form
      className="space-y-3 border-t border-surface-soft px-4 py-3"
      onSubmit={(e) => {
        e.preventDefault();
        const ok = onAjouter({ libelle, declencheur, cible, modele });
        if (!ok) return;
        setLibelle("");
        setModele("Bonjour {nom}, ");
        setOuvert(false);
      }}
    >
      <p className="text-xs text-ink">Nouveau message type</p>
      <label className="block text-[11px] text-ink-muted">
        Libellé
        <input
          value={libelle}
          onChange={(e) => setLibelle(e.target.value)}
          required
          className="mt-1 h-11 w-full rounded-card border border-line px-3 text-xs text-ink outline-none"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-[11px] text-ink-muted">
          Déclencheur
          <select
            value={declencheur}
            onChange={(e) => setDeclencheur(e.target.value as DeclencheurId)}
            className="mt-1 h-11 w-full rounded-card border border-line bg-white px-3 text-xs text-ink"
          >
            {DECLENCHEURS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.libelle}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[11px] text-ink-muted">
          Destinataires
          <select
            value={cible}
            onChange={(e) => setCible(e.target.value as CibleMessage)}
            className="mt-1 h-11 w-full rounded-card border border-line bg-white px-3 text-xs text-ink"
          >
            {CIBLES_MESSAGE.map((c) => (
              <option key={c.id} value={c.id}>
                {c.libelle}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-[11px] text-ink-muted">
        Texte
        <textarea
          value={modele}
          onChange={(e) => setModele(e.target.value)}
          required
          rows={3}
          className="mt-1 w-full rounded-card border border-line px-3 py-2 text-xs text-ink outline-none"
        />
        <span className="mt-1 block">
          Variables : {"{nom}"} {"{bien}"} {"{heure}"} {"{date}"}
        </span>
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOuvert(false)}
          className="h-11 rounded-card border border-line px-3 text-xs text-ink-body"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="h-11 rounded-card bg-ink px-3 text-xs font-medium text-white"
        >
          Ajouter
        </button>
      </div>
    </form>
  );
}
