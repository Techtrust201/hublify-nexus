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
        "relative flex w-full gap-2.5 border-b border-[#f3f4f6] px-3 py-2.5 text-left",
        active && "bg-[#f3f4f6]",
      )}
    >
      <span className="relative mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e5e7eb] text-[10px] text-[#4a5565]">
        {conversation.initiales}
        {conversation.nonLu && (
          <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-[#1e2939]" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1">
          <span className="truncate text-xs text-[#4a5565]">{conversation.nom}</span>
          <Icone className="size-2.5 shrink-0 text-[#0a0a0a]" aria-hidden />
          <span className="ml-auto shrink-0 text-[10px] text-[#99a1af]">{conversation.ilYa}</span>
        </span>
        <span className="mt-0.5 block truncate text-[11px] leading-[16.5px] text-[#99a1af]">
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
}: {
  conversations: Conversation[];
  selectionId: string | undefined;
  recherche: string;
  onRecherche: (v: string) => void;
  onSelection: (id: string) => void;
  onEcrire: () => void;
  sectionsOuvertes: Record<SectionConversation, boolean>;
  onToggleSection: (s: SectionConversation) => void;
}) {
  const inbox = conversations.filter((c) => c.section === "inbox");

  return (
    <aside className="flex min-h-0 flex-col border-b border-[#e5e7eb] lg:w-[288px] lg:shrink-0 lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-2 border-b border-[#f3f4f6] px-3 py-2.5">
        <label className="flex h-[30px] min-w-0 flex-1 items-center gap-1.5 rounded-[10px] border border-[#e5e7eb] bg-white px-2.5">
          <Search className="size-3 shrink-0 text-[#99a1af]" />
          <input
            value={recherche}
            onChange={(e) => onRecherche(e.target.value)}
            placeholder="Rechercher…"
            className="h-full w-full bg-transparent text-xs text-[#1e2939] outline-none placeholder:text-[#d1d5dc]"
          />
        </label>
        <button
          type="button"
          onClick={onEcrire}
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-[10px] bg-[#1e2939] px-2.5 text-xs font-medium text-white"
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
                className="flex w-full items-center justify-between px-3 py-1.5 text-[11px] text-[#99a1af]"
              >
                <span className="flex items-center gap-1.5">
                  {s.label}
                  {aNonLu && <span className="size-1.5 rounded-full bg-[#1e2939]" />}
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
