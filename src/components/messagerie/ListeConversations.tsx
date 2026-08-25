import { ChevronDown, ChevronRight, Home, Plane, Plus, Search, Users, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation, SectionConversation, TypeInterlocuteur } from "@/data/messagerie-mo1";

const ICONE_TYPE: Record<TypeInterlocuteur, typeof Plane> = {
  voyageur: Plane,
  locataire: Home,
  prestataire: Wrench,
  team: Users,
};

const SECTIONS: { id: SectionConversation; label: string }[] = [
  { id: "prospections", label: "Mes prospections" },
  { id: "prestataires", label: "Mes prestataires" },
  { id: "team", label: "Mes teams mate" },
];

function LigneConversation({
  conversation,
  active,
  onSelect,
}: {
  conversation: Conversation;
  active: boolean;
  onSelect: () => void;
}) {
  const Icone = ICONE_TYPE[conversation.type];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex min-h-11 w-full gap-2.5 border-b border-surface-soft px-3 py-3 text-left",
        active && "bg-surface-soft",
      )}
    >
      <span className="relative mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-line text-[10px] text-ink-body">
        {conversation.initiales}
        {conversation.nonLu && (
          <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-ink" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1">
          <span className="truncate text-xs text-ink-body">{conversation.nom}</span>
          <Icone className="size-2.5 shrink-0 text-ink-deep" aria-hidden />
          <span className="ml-auto shrink-0 text-[10px] text-ink-muted">{conversation.ilYa}</span>
        </span>
        <span className="mt-0.5 block truncate text-[11px] leading-[16.5px] text-ink-muted">
          {conversation.extrait}
        </span>
      </span>
    </button>
  );
}

export function ListeConversations({
  conversations,
  selectionId,
  recherche,
  onRecherche,
  onSelection,
  onEcrire,
  sectionsOuvertes,
  onToggleSection,
  className,
}: {
  conversations: Conversation[];
  selectionId: string | undefined;
  recherche: string;
  onRecherche: (v: string) => void;
  onSelection: (id: string) => void;
  onEcrire: () => void;
  sectionsOuvertes: Record<SectionConversation, boolean>;
  onToggleSection: (s: SectionConversation) => void;
  className?: string;
}) {
  const inbox = conversations.filter((c) => c.section === "inbox");

  return (
    <aside className={cn("flex min-h-0 flex-col border-b border-line lg:w-[288px] lg:shrink-0 lg:border-b-0 lg:border-r", className)}>
      <div className="flex items-center gap-2 border-b border-surface-soft px-3 py-2.5">
        <label className="flex h-11 min-w-0 flex-1 items-center gap-1.5 rounded-card border border-line bg-white px-2.5">
          <Search className="size-3 shrink-0 text-ink-muted" />
          <input
            value={recherche}
            onChange={(e) => onRecherche(e.target.value)}
            placeholder="Rechercher…"
            className="h-full w-full bg-transparent text-base text-ink outline-none placeholder:text-line-strong md:text-xs"
          />
        </label>
        <button
          type="button"
          onClick={onEcrire}
          className="inline-flex h-11 shrink-0 items-center gap-1 rounded-card bg-ink px-3 text-sm font-medium text-white"
        >
          <Plus className="size-3" />
          Écrire
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {inbox.map((c) => (
          <LigneConversation
            key={c.id}
            conversation={c}
            active={selectionId === c.id}
            onSelect={() => onSelection(c.id)}
          />
        ))}
        {SECTIONS.map((s) => {
          const items = conversations.filter((c) => c.section === s.id);
          if (items.length === 0) return null;
          const aNonLu = items.some((c) => c.nonLu);
          const ouverte = sectionsOuvertes[s.id];
          return (
            <div key={s.id}>
              <button
                type="button"
                onClick={() => onToggleSection(s.id)}
                className="flex min-h-11 w-full items-center justify-between px-3 py-1.5 text-[11px] text-ink-muted md:min-h-0"
              >
                <span className="flex items-center gap-1.5">
                  {s.label}
                  {aNonLu && <span className="size-1.5 rounded-full bg-ink" />}
                </span>
                {ouverte ? (
                  <ChevronDown className="size-3" />
                ) : (
                  <ChevronRight className="size-3" />
                )}
              </button>
              {ouverte &&
                items.map((c) => (
                  <LigneConversation
                    key={c.id}
                    conversation={c}
                    active={selectionId === c.id}
                    onSelect={() => onSelection(c.id)}
                  />
                ))}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
