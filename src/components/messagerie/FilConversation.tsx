import {
  Archive,
  Bot,
  ChevronLeft,
  Download,
  File,
  FolderOpen,
  Key,
  LogIn,
  Paperclip,
  Send,
  Share2,
  Tag,
  Trash2,
  UserCheck,
  UserPlus,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Conversation, IconeSysteme, MessageFil } from "@/data/messagerie-mo1";
import { cn } from "@/lib/utils";

const ICONE_SYS: Record<IconeSysteme, typeof LogIn> = {
  login: LogIn,
  usercheck: UserCheck,
  key: Key,
};

type Panneau = "partage" | "documents" | "categorie" | "assigner" | null;

export function FilConversation({
  conversation,
  messages,
  brouillon,
  onBrouillon,
  onEnvoyer,
  panneau,
  onPanneau,
  onArchiver,
  onSupprimer,
  enfantsPanneau,
  onRetour,
  className,
}: {
  conversation: Conversation;
  messages: MessageFil[];
  brouillon: string;
  onBrouillon: (v: string) => void;
  onEnvoyer: () => void;
  panneau: Panneau;
  onPanneau: (p: Panneau) => void;
  onArchiver: () => void;
  onSupprimer: () => void;
  enfantsPanneau: ReactNode;
  onRetour?: () => void;
  className?: string;
}) {
  return (
    <section className={cn("flex min-h-0 min-w-0 flex-1 flex-col", className)}>
      <header className="relative flex items-center gap-3 border-b border-surface-soft px-4 py-3">
        {onRetour && (
          <button
            type="button"
            onClick={onRetour}
            className="flex size-11 shrink-0 items-center justify-center rounded-card border border-line text-ink-body lg:hidden"
            aria-label="Retour à la liste"
          >
            <ChevronLeft className="size-4" />
          </button>
        )}
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-line text-xs text-ink-body">
          {conversation.initiales}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-ink">{conversation.nom}</p>
            <span className="rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] text-ink-subtle">
              {conversation.badge}
            </span>
          </div>
          {conversation.bienNom && (
            <p className="truncate text-xs text-ink-muted">{conversation.bienNom}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <BoutonOutil
            label="Partager"
            actif={panneau === "partage"}
            onClick={() => onPanneau(panneau === "partage" ? null : "partage")}
          >
            <Share2 className="size-3.5" />
          </BoutonOutil>
          <BoutonOutil label="Archiver" onClick={onArchiver}>
            <Archive className="size-3.5" />
          </BoutonOutil>
          <BoutonOutil
            label="Documents"
            actif={panneau === "documents"}
            onClick={() => onPanneau(panneau === "documents" ? null : "documents")}
          >
            <FolderOpen className="size-3.5" />
          </BoutonOutil>
          <BoutonOutil
            label="Assigner"
            actif={panneau === "assigner"}
            onClick={() => onPanneau(panneau === "assigner" ? null : "assigner")}
          >
            <UserPlus className="size-3.5" />
          </BoutonOutil>
          <BoutonOutil
            label="Catégorie"
            actif={panneau === "categorie"}
            onClick={() => onPanneau(panneau === "categorie" ? null : "categorie")}
          >
            <Tag className="size-3.5" />
          </BoutonOutil>
          <BoutonOutil label="Supprimer" onClick={onSupprimer}>
            <Trash2 className="size-3.5" />
          </BoutonOutil>
        </div>
        {enfantsPanneau}
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-[color-mix(in srgb, var(--surface) 30%, transparent)] p-4">
        {messages.map((m) => {
          if (m.kind === "systeme") {
            const Icone = m.iconeSysteme ? ICONE_SYS[m.iconeSysteme] : LogIn;
            return (
              <div key={m.id} className="flex justify-center">
                <p className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-[10px] text-ink-subtle shadow-sm">
                  <Icone className="size-2.5 shrink-0" />
                  {m.texte}
                </p>
              </div>
            );
          }
          const envoye = m.kind === "envoye";
          return (
            <div
              key={m.id}
              className={cn("flex flex-col gap-1", envoye ? "items-end" : "items-start")}
            >
              <div
                className={cn(
                  "max-w-[70%] whitespace-pre-line rounded-[16px] px-3.5 py-2.5 text-xs leading-[19.5px]",
                  envoye
                    ? "rounded-tr-md bg-ink text-white"
                    : "rounded-tl-md border border-line bg-white text-ink-status shadow-sm",
                )}
              >
                {m.texte}
              </div>
              {m.pieces && m.pieces.length > 0 && (
                <div className="flex max-w-full flex-wrap justify-end gap-1.5">
                  {m.pieces.map((p) => (
                    <span
                      key={p.nom}
                      className="inline-flex items-center gap-1.5 rounded-card border border-line bg-white px-2.5 py-1.5"
                    >
                      <File className="size-3 text-ink-body" />
                      <span className="max-w-[140px] truncate text-xs text-ink-body">{p.nom}</span>
                      <span className="text-[10px] text-ink-muted">{p.taille}</span>
                      <Download className="size-2.5 text-ink-muted" />
                    </span>
                  ))}
                </div>
              )}
              {m.heure && <span className="px-1 text-[10px] text-ink-muted">{m.heure}</span>}
            </div>
          );
        })}
      </div>

      <form
        className="border-t border-line bg-white px-3 py-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          onEnvoyer();
        }}
      >
        <div className="flex items-end gap-2">
          <button
            type="button"
            className="flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-line text-ink-body"
            aria-label="Joindre un fichier"
          >
            <Paperclip className="size-3.5" />
          </button>
          <input
            value={brouillon}
            onChange={(e) => onBrouillon(e.target.value)}
            placeholder="Écrire un message…"
            className="h-11 min-w-0 flex-1 rounded-[14px] border border-line px-3 text-base text-ink outline-none placeholder:text-line-strong md:h-[34px] md:text-xs"
          />
          <button
            type="submit"
            disabled={!brouillon.trim()}
            className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-ink text-white disabled:opacity-40"
            aria-label="Envoyer"
          >
            <Send className="size-3.5" />
          </button>
          <button
            type="button"
            className="flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-line text-ink-body"
            aria-label="Modèles"
          >
            <Bot className="size-3.5" />
          </button>
        </div>
      </form>
    </section>
  );
}

function BoutonOutil({
  children,
  label,
  onClick,
  actif,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  actif?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex size-11 items-center justify-center rounded-card border border-line text-ink-body",
        actif && "bg-surface-soft",
      )}
    >
      {children}
    </button>
  );
}
