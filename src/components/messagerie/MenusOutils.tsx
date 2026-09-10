import { Check, Download, File, FolderOpen, Plus, X } from "lucide-react";
import type { ReactNode } from "react";
import {
  ASSIGNEES_CONVERSATION,
  SECTIONS_DEPLACEMENT,
  type DocumentLie,
  type SectionConversation,
} from "@/data/messagerie-mo1";
import {
  choisirFichierComplet,
  copierTexte,
  exporterFichier,
  telechargerPdf,
  toastOk,
} from "@/lib/feedback";
import { cn } from "@/lib/utils";

export function MenuPartage({
  onFermer,
  nom,
  logement,
  conversationId,
}: {
  onFermer: () => void;
  nom?: string;
  logement?: string;
  conversationId: string;
}) {
  const sujet = nom ?? "conversation";
  const lien = `${window.location.origin}/messagerie?conv=${encodeURIComponent(conversationId)}`;
  return (
    <MenuFlottant titre="Partager" onFermer={onFermer}>
      <button
        type="button"
        className="w-full px-3 py-2 text-left text-xs text-ink-body hover:bg-surface"
        onClick={() => {
          copierTexte(lien, "Lien de la conversation copié.");
          onFermer();
        }}
      >
        Copier le lien
      </button>
      <button
        type="button"
        className="w-full px-3 py-2 text-left text-xs text-ink-body hover:bg-surface"
        onClick={() => {
          void telechargerPdf(`Conversation ${sujet}`, [`Conversation Hublify — ${sujet}`, lien], {
            ...(nom ? { titulaire: nom, locataire: nom } : {}),
            ...(logement ? { logement, adresse: logement } : {}),
            extra: [`Locataire : ${sujet}`, ...(logement ? [`Logement : ${logement}`] : []), lien],
          });
          onFermer();
        }}
      >
        Exporter en PDF
      </button>
      <button
        type="button"
        className="w-full px-3 py-2 text-left text-xs text-ink-body hover:bg-surface"
        onClick={() => {
          window.location.href = `mailto:?subject=${encodeURIComponent(`Hublify — ${sujet}`)}&body=${encodeURIComponent(lien)}`;
          onFermer();
        }}
      >
        Envoyer par e-mail
      </button>
    </MenuFlottant>
  );
}

export function MenuDocuments({
  nom,
  logement,
  documents,
  onAjouter,
  onFermer,
}: {
  nom: string;
  logement?: string;
  documents: DocumentLie[];
  onAjouter: (doc: DocumentLie) => void;
  onFermer: () => void;
}) {
  return (
    <div className="absolute right-4 top-full z-20 w-[288px] overflow-hidden rounded-card border border-line bg-white shadow-md">
      <div className="flex items-center justify-between border-b border-surface-soft px-4 py-3">
        <p className="flex items-center gap-2 text-xs text-ink">
          <FolderOpen className="size-3.5" />
          Documents liés à {nom}
        </p>
        <button
          type="button"
          onClick={onFermer}
          aria-label="Fermer"
          className="flex size-11 items-center justify-center md:size-8"
        >
          <X className="size-3.5 text-ink-muted" />
        </button>
      </div>
      {documents.length === 0 ? (
        <p className="px-4 py-3 text-xs text-ink-muted">Aucun document lié.</p>
      ) : (
        <ul>
          {documents.map((d) => (
            <li
              key={`${d.nom}-${d.date}`}
              className="flex items-center gap-2.5 border-b border-surface-soft px-4 py-2.5"
            >
              <File className="size-3.5 shrink-0 text-ink-body" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs text-ink">{d.nom}</span>
                <span className="block text-[10px] text-ink-muted">{d.date}</span>
              </span>
              <button
                type="button"
                aria-label={`Télécharger ${d.nom}`}
                className="flex size-11 shrink-0 items-center justify-center md:size-8"
                onClick={() =>
                  exporterFichier(d, {
                    titulaire: nom,
                    date: d.date,
                    ...(logement ? { adresse: logement, logement } : {}),
                    extra: [
                      `Locataire : ${nom}`,
                      ...(logement ? [`Logement : ${logement}`] : []),
                      `Date : ${d.date}`,
                    ],
                  })
                }
              >
                <Download className="size-3 text-ink-muted" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className="flex w-full items-center justify-center gap-1.5 py-2.5 text-xs text-ink-body"
        onClick={() => {
          choisirFichierComplet((fichier) => {
            onAjouter({
              nom: fichier.nom,
              date: new Date().toLocaleDateString("fr-FR"),
              mime: fichier.mime,
              base64: fichier.base64,
            });
            toastOk(`Document lié : ${fichier.nom}`);
          });
        }}
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
          {sectionActive === s.id ? <Check className="size-2.5" /> : <span className="size-2.5" />}
          {s.label}
        </button>
      ))}
    </MenuFlottant>
  );
}

export function MenuAssigner({
  actuel,
  onChoisir,
  onFermer,
}: {
  actuel?: string;
  onChoisir: (nom: string) => void;
  onFermer: () => void;
}) {
  return (
    <MenuFlottant titre="Assigner à" onFermer={onFermer}>
      {ASSIGNEES_CONVERSATION.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => {
            onChoisir(a.nom);
            toastOk(`Assigné à ${a.nom}.`);
            onFermer();
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-ink-body hover:bg-surface"
        >
          {actuel === a.nom ? (
            <Check className="size-2.5 shrink-0" />
          ) : (
            <span className="size-2.5 shrink-0" />
          )}
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
        <button
          type="button"
          onClick={onFermer}
          aria-label="Fermer"
          className="flex size-11 items-center justify-center md:size-6"
        >
          <X className="size-3" />
        </button>
      </p>
      {children}
    </div>
  );
}
