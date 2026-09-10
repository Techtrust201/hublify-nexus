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
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  MODELES_MESSAGE,
  type Conversation,
  type IconeSysteme,
  type MessageFil,
  type PieceJointe,
} from "@/data/messagerie-mo1";
import { exporterFichier } from "@/lib/feedback";
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
  piecesBrouillon = [],
  onJoindre,
  onRetirerPiece,
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
  piecesBrouillon?: PieceJointe[];
  onJoindre?: () => void;
  onRetirerPiece?: (nom: string) => void;
  panneau: Panneau;
  onPanneau: (p: Panneau) => void;
  onArchiver: () => void;
  onSupprimer: () => void;
  enfantsPanneau: ReactNode;
  onRetour?: () => void;
  className?: string;
}) {
  const [modelesOuverts, setModelesOuverts] = useState(false);
  const zoneModeles = useRef<HTMLDivElement>(null);
  const peutEnvoyer = Boolean(brouillon.trim() || piecesBrouillon.length);

  useEffect(() => {
    if (!modelesOuverts) return;
    const auClic = (e: MouseEvent) => {
      if (!zoneModeles.current?.contains(e.target as Node)) setModelesOuverts(false);
    };
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModelesOuverts(false);
    };
    document.addEventListener("mousedown", auClic);
    document.addEventListener("keydown", auClavier);
    return () => {
      document.removeEventListener("mousedown", auClic);
      document.removeEventListener("keydown", auClavier);
    };
  }, [modelesOuverts]);

  return (
    <section className={cn("flex min-h-0 min-w-0 flex-1 flex-col", className)}>
      <header className="relative flex flex-wrap items-center gap-3 border-b border-surface-soft px-4 py-3">
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
        <div className="min-w-0 flex-1 basis-40">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-ink">{conversation.nom}</p>
            <span className="rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] text-ink-subtle">
              {conversation.badge}
            </span>
          </div>
          {conversation.bienNom && (
            <p className="truncate text-xs text-ink-muted">{conversation.bienNom}</p>
          )}
          {conversation.assigne && (
            <p className="truncate text-[10px] text-ink-muted">Assigné à {conversation.assigne}</p>
          )}
        </div>
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <BoutonOutil
            label="Partager"
            actif={panneau === "partage"}
            onClick={() => onPanneau(panneau === "partage" ? null : "partage")}
          >
            <Share2 className="size-3.5" />
          </BoutonOutil>
          <BoutonOutil
            label={conversation.archivee ? "Désarchiver" : "Archiver"}
            onClick={onArchiver}
          >
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
        {messages.length === 0 && (
          <p className="m-auto max-w-xs text-center text-xs text-ink-muted">
            Aucun message dans ce fil. Écrivez le premier ci-dessous.
          </p>
        )}
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
              {m.texte ? (
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
              ) : null}
              {m.pieces && m.pieces.length > 0 && (
                <div className="flex max-w-full flex-wrap justify-end gap-1.5">
                  {m.pieces.map((p) => (
                    <button
                      key={p.nom}
                      type="button"
                      onClick={() =>
                        exporterFichier(p, {
                          titulaire: conversation.nom,
                          ...(conversation.bienNom
                            ? { adresse: conversation.bienNom, logement: conversation.bienNom }
                            : {}),
                          extra: [
                            `Locataire : ${conversation.nom}`,
                            ...(conversation.bienNom ? [`Logement : ${conversation.bienNom}`] : []),
                            `Taille : ${p.taille}`,
                          ],
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-card border border-line bg-white px-2.5 py-1.5"
                    >
                      <File className="size-3 text-ink-body" />
                      <span className="max-w-[140px] truncate text-xs text-ink-body">{p.nom}</span>
                      <span className="text-[10px] text-ink-muted">{p.taille}</span>
                      <Download className="size-2.5 text-ink-muted" />
                    </button>
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
          if (peutEnvoyer) onEnvoyer();
        }}
      >
        {piecesBrouillon.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {piecesBrouillon.map((p) => (
              <span
                key={p.nom}
                className="inline-flex items-center gap-1.5 rounded-card border border-line bg-surface px-2 py-1"
              >
                <File className="size-3 text-ink-body" />
                <span className="max-w-[140px] truncate text-[11px] text-ink">{p.nom}</span>
                <button
                  type="button"
                  aria-label={`Retirer ${p.nom}`}
                  onClick={() => onRetirerPiece?.(p.nom)}
                  className="text-ink-muted"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <button
            type="button"
            className="flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-line text-ink-body"
            aria-label="Joindre un fichier"
            onClick={onJoindre}
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
            disabled={!peutEnvoyer}
            className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-ink text-white disabled:opacity-40"
            aria-label="Envoyer"
          >
            <Send className="size-3.5" />
          </button>
          <div className="relative" ref={zoneModeles}>
            <button
              type="button"
              className="flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-line text-ink-body"
              aria-label="Modèles"
              aria-expanded={modelesOuverts}
              onClick={() => setModelesOuverts((o) => !o)}
            >
              <Bot className="size-3.5" />
            </button>
            {modelesOuverts && (
              <div className="absolute bottom-full right-0 z-20 mb-2 w-[280px] overflow-hidden rounded-card border border-line bg-white py-1 shadow-md">
                <p className="px-3 py-1.5 text-[10px] text-ink-muted">Réponses types</p>
                {MODELES_MESSAGE.map((modele) => (
                  <button
                    key={modele}
                    type="button"
                    className="w-full px-3 py-2 text-left text-xs text-ink-body hover:bg-surface"
                    onClick={() => {
                      onBrouillon(modele);
                      setModelesOuverts(false);
                    }}
                  >
                    {modele}
                  </button>
                ))}
              </div>
            )}
          </div>
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
