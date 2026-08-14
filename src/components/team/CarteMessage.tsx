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
    <div className="ml-auto w-full max-w-[340px] overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-[#e5e7eb] text-[10px] text-[#4a5565]">
            {membre.initiales}
          </span>
          <div>
            <p className="text-xs text-[#1e2939]">{nomComplet(membre)}</p>
            <p className="text-[10px] text-[#99a1af]">{membre.role}</p>
          </div>
        </div>
        <button type="button" onClick={onFermer} aria-label="Fermer">
          <X className="size-3.5 text-[#99a1af]" />
        </button>
      </div>
      <textarea
        value={texte}
        onChange={(e) => setTexte(e.target.value.slice(0, 500))}
        placeholder={`Écrire un message à ${membre.prenom}…`}
        rows={3}
        className="w-full resize-none px-4 text-xs text-[#1e2939] outline-none placeholder:text-[#d1d5dc]"
      />
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="text-[10px] text-[#99a1af]">{texte.length}/500</span>
        <button
          type="button"
          disabled={!texte.trim()}
          onClick={() => {
            onEnvoyer(texte.trim());
            setTexte("");
            onFermer();
          }}
          className="inline-flex h-7 items-center gap-1.5 rounded-[10px] bg-[#1e2939] px-3 text-xs font-medium text-white disabled:opacity-40"
        >
          <Send className="size-2.5" />
          Envoyer
        </button>
      </div>
    </div>
  );
}
