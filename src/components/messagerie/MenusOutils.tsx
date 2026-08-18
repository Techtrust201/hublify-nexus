import { Check, Download, File, FolderOpen, Plus, X } from "lucide-react";
import type { ReactNode } from "react";
import {
  ASSIGNEES_CONVERSATION,
  DOCUMENTS_LIES,
  SECTIONS_DEPLACEMENT,
  type SectionConversation,
} from "@/data/messagerie-mo1";
import { cn } from "@/lib/utils";

export function MenuPartage({ onFermer }: { onFermer: () => void }) {
  return (
    <MenuFlottant titre="Partager" onFermer={onFermer}>
      {["Copier le lien", "Exporter en PDF", "Envoyer par e-mail"].map((libelle) => (
        <button
          key={libelle}
          type="button"
          className="w-full px-3 py-2 text-left text-xs text-ink-body hover:bg-surface"
        >
          {libelle}
        </button>
      ))}
    </MenuFlottant>
  );
}

export function MenuDocuments({
  conversationId,
  nom,
  onFermer,
}: {
  conversationId: string;
  nom: string;
  onFermer: () => void;
}) {
  const docs = DOCUMENTS_LIES[conversationId] ?? [];
  return (
    <div className="absolute right-4 top-full z-20 w-[288px] overflow-hidden rounded-card border border-line bg-white shadow-md">
      <div className="flex items-center justify-between border-b border-surface-soft px-4 py-3">
        <p className="flex items-center gap-2 text-xs text-ink">
          <FolderOpen className="size-3.5" />
          Documents liés à {nom}
        </p>
        <button type="button" onClick={onFermer} aria-label="Fermer">
          <X className="size-3.5 text-ink-muted" />
        </button>
      </div>
      <ul>
        {docs.map((d) => (
          <li key={d.nom} className="flex items-center gap-2.5 border-b border-surface-soft px-4 py-2.5">
            <File className="size-3.5 shrink-0 text-ink-body" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs text-ink">{d.nom}</span>
              <span className="block text-[10px] text-ink-muted">{d.date}</span>
            </span>
            <Download className="size-3 text-ink-muted" />
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="flex w-full items-center justify-center gap-1.5 py-2.5 text-xs text-ink-body"
      >
        <Plus className="size-2.5" />
        Ajouter un document
      </button>
    </div>
  );
}

export function MenuCategorie({
  sectionActive,
  onChoisir,
  onFermer,
}: {
  sectionActive: SectionConversation;
  onChoisir: (s: SectionConversation) => void;
  onFermer: () => void;
}) {
  return (
    <MenuFlottant titre="Déplacer vers" onFermer={onFermer}>
      {SECTIONS_DEPLACEMENT.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => {
            onChoisir(s.id);
            onFermer();
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-ink-body hover:bg-surface"
        >
          {sectionActive === s.id ? (
            <Check className="size-2.5" />
          ) : (
            <span className="size-2.5" />
          )}
          {s.label}
        </button>
      ))}
    </MenuFlottant>
  );
}

export function MenuAssigner({ onFermer }: { onFermer: () => void }) {
  return (
    <MenuFlottant titre="Assigner à" onFermer={onFermer}>
      {ASSIGNEES_CONVERSATION.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={onFermer}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-ink-body hover:bg-surface"
        >
          <span className="flex size-5 items-center justify-center rounded-full bg-line text-[10px] text-ink-body">
            {a.initiales}
          </span>
          {a.nom}
        </button>
      ))}
    </MenuFlottant>
  );
}

function MenuFlottant({
  titre,
  onFermer,
  children,
}: {
  titre: string;
  onFermer: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "absolute right-4 top-full z-20 w-[208px] overflow-hidden rounded-card border border-line bg-white py-1 shadow-md",
      )}
    >
      <p className="flex items-center justify-between px-3 py-1.5 text-[10px] text-ink-muted">
        {titre}
        <button type="button" onClick={onFermer} aria-label="Fermer">
          <X className="size-3" />
        </button>
      </p>
      {children}
    </div>
  );
}
