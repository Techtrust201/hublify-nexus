import {
  Bot,
  ChevronDown,
  ChevronRight,
  Home,
  MessageSquare,
  Plane,
  Plus,
  Search,
  Users,
  Wrench,
} from "lucide-react";
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
  { id: "team", label: "Mes coéquipiers" },
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
      aria-current={active ? "true" : undefined}
      className={cn(
        "relative flex min-h-11 w-full gap-2.5 border-b border-surface-soft px-3 py-3 text-left",
        active && "bg-surface-soft",
      )}
    >
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-line text-[10px] text-ink-body">
        {conversation.initiales}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1">
          {conversation.nonLu && (
            <span className="size-1.5 shrink-0 rounded-full bg-ink" aria-hidden />
          )}
          <span className="truncate text-xs text-ink-body">{conversation.nom}</span>
          <Icone className="size-2.5 shrink-0 text-ink-deep" aria-hidden />
          <span className="sr-only">{conversation.nonLu ? "Non lu. " : ""}</span>
          <span className="ml-auto shrink-0 text-[10px] text-ink-muted">{conversation.ilYa}</span>
        </span>
        <span className="mt-0.5 line-clamp-2 block text-[11px] leading-snug text-ink-muted">
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
  onAutomatiques,
  nonLus,
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
  onAutomatiques: () => void;
  nonLus: number;
  sectionsOuvertes: Record<SectionConversation, boolean>;
  onToggleSection: (s: SectionConversation) => void;
  className?: string;
}) {
  const inbox = conversations.filter((c) => c.section === "inbox");

  return (
    <aside
      className={cn(
        "flex min-h-0 flex-col border-b border-line lg:w-[288px] lg:shrink-0 lg:border-b-0 lg:border-r",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 pb-1 pt-3">
        <p className="flex items-center gap-2 text-sm text-ink">
          <MessageSquare className="size-[15px]" aria-hidden />
          Messagerie
          {nonLus > 0 && (
            <span className="inline-flex h-[19px] min-w-[17px] items-center justify-center rounded-full bg-ink px-1.5 text-[10px] text-white">
              <span className="sr-only">
                {nonLus} non lu{nonLus > 1 ? "s" : ""}
              </span>
              <span aria-hidden>{nonLus}</span>
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={onAutomatiques}
          className="inline-flex h-11 items-center gap-1.5 rounded-card px-2 text-[11px] text-ink-body"
        >
          <Bot className="size-3.5" aria-hidden />
          Messages automatiques
        </button>
      </div>
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
        {conversations.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-ink-muted">
            {recherche.trim()
              ? "Aucune conversation pour cette recherche."
              : "Aucune conversation ici."}
          </p>
        )}
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
                  {aNonLu && <span className="size-1.5 rounded-full bg-ink" aria-hidden />}
                </span>
                {ouverte ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
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
