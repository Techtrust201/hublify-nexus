import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { nomComplet, type MembreEquipe } from "@/data/messagerie-mo1";

export function DialogSupprimer({
  membre,
  onFermer,
  onConfirmer,
}: {
  membre: MembreEquipe | null;
  onFermer: () => void;
  onConfirmer: (id: string) => void;
}) {
  return (
    <Dialog open={Boolean(membre)} onOpenChange={(o) => !o && onFermer()}>
      <DialogContent className="max-w-[400px] gap-0 rounded-[10px] border-[#e5e7eb] p-6 sm:rounded-[10px]">
        <DialogHeader>
          <DialogTitle className="text-sm font-normal text-[#1e2939]">
            Supprimer ce membre ?
          </DialogTitle>
          <DialogDescription className="text-xs leading-4 text-[#6a7282]">
            {membre
              ? `${nomComplet(membre)} sera retiré de l'équipe et perdra l'accès à Hublify.`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 flex gap-3">
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
              if (membre) onConfirmer(membre.id);
              onFermer();
            }}
            className="h-[38px] flex-1 rounded-[10px] bg-[#1e2939] text-xs font-medium text-white"
          >
            Supprimer
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
