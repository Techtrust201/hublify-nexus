import { File, Paperclip, Pencil, Send, X } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PieceJointe } from "@/data/messagerie-mo1";
import { choisirFichierComplet } from "@/lib/feedback";

export function DialogNouveauMessage({
  ouvert,
  onFermer,
  onEnvoyer,
}: {
  ouvert: boolean;
  onFermer: () => void;
  onEnvoyer: (destinataire: string, objet: string, texte: string, pieces: PieceJointe[]) => void;
}) {
  const [destinataire, setDestinataire] = useState("");
  const [objet, setObjet] = useState("");
  const [texte, setTexte] = useState("");
  const [pieces, setPieces] = useState<PieceJointe[]>([]);

  const reset = () => {
    setDestinataire("");
    setObjet("");
    setTexte("");
    setPieces([]);
  };

  const peutEnvoyer = Boolean(destinataire.trim() && (texte.trim() || pieces.length));

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
      <DialogContent className="max-w-[520px] gap-0 overflow-hidden rounded-card border-line p-0 sm:rounded-card">
        <DialogHeader className="border-b border-surface-soft px-5 py-3.5">
          <DialogTitle className="flex items-center gap-2 text-sm font-normal text-ink">
            <Pencil className="size-3.5" />
            Nouveau message
          </DialogTitle>
          <DialogDescription className="sr-only">Rédiger un nouveau message</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 px-5 py-4">
          <label className="flex items-center gap-3 border-b border-surface-soft pb-2">
            <span className="w-12 text-xs text-ink-subtle">À :</span>
            <input
              value={destinataire}
              onChange={(e) => setDestinataire(e.target.value)}
              placeholder="Destinataire…"
              className="h-7 flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-line-strong"
            />
          </label>
          <label className="flex items-center gap-3 border-b border-surface-soft pb-2">
            <span className="w-12 text-xs text-ink-subtle">Objet :</span>
            <input
              value={objet}
              onChange={(e) => setObjet(e.target.value)}
              placeholder="Objet du message…"
              className="h-7 flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-line-strong"
            />
          </label>
          <textarea
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            placeholder="Rédigez votre message…"
            rows={4}
            className="w-full resize-none bg-transparent text-xs text-ink outline-none placeholder:text-line-strong"
          />
          {pieces.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {pieces.map((p) => (
                <span
                  key={p.nom}
                  className="inline-flex items-center gap-1.5 rounded-card border border-line bg-surface px-2 py-1"
                >
                  <File className="size-3 text-ink-body" />
                  <span className="max-w-[160px] truncate text-[11px] text-ink">{p.nom}</span>
                  <button
                    type="button"
                    aria-label={`Retirer ${p.nom}`}
                    onClick={() => setPieces((liste) => liste.filter((x) => x.nom !== p.nom))}
                    className="text-ink-muted"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-surface-soft px-5 py-3">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs text-ink-body"
            onClick={() =>
              choisirFichierComplet((fichier) =>
                setPieces((liste) =>
                  liste.some((p) => p.nom === fichier.nom)
                    ? liste
                    : [
                        ...liste,
                        {
                          nom: fichier.nom,
                          taille: fichier.taille,
                          mime: fichier.mime,
                          base64: fichier.base64,
                        },
                      ],
                ),
              )
            }
          >
            <Paperclip className="size-3.5" />
            Joindre un fichier
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                reset();
                onFermer();
              }}
              className="h-11 rounded-card border border-line px-3 text-xs font-medium text-ink-body md:h-[30px]"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={!peutEnvoyer}
              onClick={() => {
                onEnvoyer(destinataire.trim(), objet.trim(), texte.trim(), pieces);
                reset();
                onFermer();
              }}
              className="inline-flex h-11 items-center gap-1.5 rounded-card bg-ink px-3 text-xs font-medium text-white disabled:opacity-40 md:h-[30px]"
            >
              <Send className="size-2.5" />
              Envoyer
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
