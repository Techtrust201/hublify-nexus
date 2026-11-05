import { ChevronLeft, Plus, Search, Star } from "lucide-react";
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
  const [recherche, setRecherche] = useState("");
  const [ouvert, setOuvert] = useState(parcours[0]?.id ?? "");
  const q = recherche.trim().toLowerCase();
  const visibles = q
    ? parcours.filter(
        (p) =>
          p.nom.toLowerCase().includes(q) ||
          p.types.some((t) => `${t.libelle} ${t.modele}`.toLowerCase().includes(q)),
      )
    : parcours;
  const detail = visibles.find((p) => p.id === ouvert) ?? visibles[0];

  return (
    <section className={cn("flex min-h-0 min-w-0 flex-1 flex-col bg-white", className)}>
      <div className="relative border-b border-surface-soft px-6 py-6 text-center">
        <button
          type="button"
          onClick={onRetour}
          className="absolute left-4 top-4 flex size-11 items-center justify-center rounded-card border border-line text-ink-body"
          aria-label="Retour à la conversation"
        >
          <ChevronLeft className="size-4" />
        </button>
        <h2 className="font-sans text-[28px] font-medium leading-tight text-ink">
          Automatisation des messages
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-5 text-ink-subtle">
          Créez et gérez vos parcours de messages automatiques, les messages apparaîtront également
          dans votre messagerie.
        </p>
        <button
          type="button"
          onClick={() => {
            const suivants = ajouterParcours(parcours);
            const cree = suivants[suivants.length - 1];
            if (cree) setOuvert(cree.id);
            onChange(suivants);
          }}
          className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-[14px] bg-ink px-5 text-sm font-medium text-white"
        >
          <Plus className="size-4" />
          Créer un nouveau parcours
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <label className="flex h-[46px] items-center gap-3 rounded-card border border-line px-4">
          <Search className="size-4 text-ink-muted" aria-hidden />
          <span className="sr-only">Rechercher</span>
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un modèle ou un document..."
            className="h-full w-full bg-transparent text-sm outline-none placeholder:text-ink-muted"
          />
        </label>
        <p className="flex items-start gap-2 text-xs text-ink-body">
          <Star className="mt-0.5 size-3.5 shrink-0 fill-ink text-ink" aria-hidden />
          Modèle de parcours de message automatique, vous pouvez attribuer un parcours différent à
          chacun depuis la fenêtre de discussion commune.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {visibles.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={detail?.id === p.id}
              onClick={() => setOuvert(p.id)}
              className={cn(
                "rounded-card border px-4 py-3 text-left text-sm text-ink",
                detail?.id === p.id ? "border-ink bg-surface-soft" : "border-line",
              )}
            >
              {p.nom}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-muted">
          Configuration des envois automatiques, les messages apparaîtront également dans votre
          discussion commune.
        </p>
        {detail ? (
          <ParcoursCarte parcours={detail} onChange={onChange} tous={parcours} />
        ) : (
          <p className="text-sm text-ink-muted">Aucun parcours ne correspond à cette recherche.</p>
        )}
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
        {parcours.types.map((type, index) => (
          <li
            key={type.id}
            className="flex flex-col gap-2 border-b border-surface-soft px-4 py-3 last:border-b-0 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-ink">Etape {index + 1}</p>
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
