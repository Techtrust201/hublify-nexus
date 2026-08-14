import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { nomComplet, type MembreEquipe } from "@/data/messagerie-mo1";
import { ListeDroits } from "./DialogInviter";

export function DialogDroits({
  membre,
  onFermer,
  onEnregistrer,
}: {
  membre: MembreEquipe | null;
  onFermer: () => void;
  onEnregistrer: (membreId: string, droits: string[]) => void;
}) {
  const [droits, setDroits] = useState<string[]>([]);
  const ouvert = Boolean(membre);

  useEffect(() => {
    setDroits(membre?.droits ?? []);
  }, [membre]);

  return (
    <Dialog
      open={ouvert}
      onOpenChange={(o) => {
        if (!o) onFermer();
      }}
    >
      <DialogContent
        key={membre?.id}
        className="max-h-[90vh] max-w-[540px] gap-0 overflow-y-auto rounded-[10px] border-[#e5e7eb] p-0 sm:rounded-[10px]"
      >
        <DialogHeader className="border-b border-[#f3f4f6] px-6 py-4">
          <DialogTitle className="text-base font-normal text-[#1e2939]">Droits d'accès</DialogTitle>
          <DialogDescription className="text-xs text-[#6a7282]">
            {membre ? `${nomComplet(membre)} · ${membre.role}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5">
          <ListeDroits
            selection={droits}
            onToggle={(id) =>
              setDroits((liste) =>
                liste.includes(id) ? liste.filter((d) => d !== id) : [...liste, id],
              )
            }
          />
        </div>
        <div className="flex gap-3 border-t border-[#f3f4f6] px-6 py-4">
          <button
            type="button"
            onClick={onFermer}
            className="h-[38px] flex-1 rounded-[10px] border border-[#e5e7eb] text-xs font-medium text-[#4a5565]"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => {
              if (membre) onEnregistrer(membre.id, droits);
              onFermer();
            }}
            className="h-[38px] flex-1 rounded-[10px] bg-[#1e2939] text-xs font-medium text-white"
          >
            Enregistrer
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
