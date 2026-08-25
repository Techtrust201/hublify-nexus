import { Send, X } from "lucide-react";
import { useState } from "react";
import { nomComplet, type MembreEquipe } from "@/data/messagerie-mo1";

export function CarteMessage({
  membre,
  onFermer,
  onEnvoyer,
}: {
  membre: MembreEquipe;
  onFermer: () => void;
  onEnvoyer: (texte: string) => void;
}) {
  const [texte, setTexte] = useState("");

  return (
    <div className="ml-auto w-full max-w-[340px] overflow-hidden rounded-card border border-line bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-line text-[10px] text-ink-body">
            {membre.initiales}
          </span>
          <div>
            <p className="text-xs text-ink">{nomComplet(membre)}</p>
            <p className="text-[10px] text-ink-muted">{membre.role}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onFermer}
          aria-label="Fermer"
          className="-my-3 flex size-11 shrink-0 items-center justify-center md:my-0 md:size-3.5"
        >
          <X className="size-3.5 text-ink-muted" />
        </button>
      </div>
      <textarea
        value={texte}
        onChange={(e) => setTexte(e.target.value.slice(0, 500))}
        placeholder={`Écrire un message à ${membre.prenom}…`}
        rows={3}
        className="w-full resize-none px-4 text-xs text-ink outline-none placeholder:text-line-strong"
      />
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="text-[10px] text-ink-muted">{texte.length}/500</span>
        <button
          type="button"
          disabled={!texte.trim()}
          onClick={() => {
            onEnvoyer(texte.trim());
            setTexte("");
            onFermer();
          }}
          className="inline-flex h-7 items-center gap-1.5 rounded-card bg-ink px-3 text-xs font-medium text-white disabled:opacity-40"
        >
          <Send className="size-2.5" />
          Envoyer
        </button>
      </div>
    </div>
  );
}
