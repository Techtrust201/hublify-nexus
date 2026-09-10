import { useEffect, useState, useSyncExternalStore } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  abonnerConfirmation,
  confirmationCourante,
  repondreConfirmation,
} from "@/lib/confirmation";
import { cn } from "@/lib/utils";

export function DialogueConfirmation() {
  const demande = useSyncExternalStore(abonnerConfirmation, confirmationCourante, () => null);
  // Radix garde le contenu monté pendant l'animation de fermeture : on continue
  // d'afficher la dernière demande pour éviter un dialogue vide qui clignote.
  const [derniere, setDerniere] = useState(demande);
  useEffect(() => {
    if (demande) setDerniere(demande);
  }, [demande]);
  const affichee = demande ?? derniere;

  return (
    <Dialog
      open={Boolean(demande)}
      onOpenChange={(ouvert) => {
        if (!ouvert) repondreConfirmation(false);
      }}
    >
      <DialogContent className="max-w-sm" aria-describedby={undefined}>
        <DialogTitle>{affichee?.titre ?? ""}</DialogTitle>
        {affichee?.description && <DialogDescription>{affichee.description}</DialogDescription>}
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => repondreConfirmation(false)}
            className="inline-flex h-11 items-center justify-center rounded-card border border-line px-4 text-sm text-ink-body md:h-9"
          >
            {affichee?.libelleAnnuler ?? "Annuler"}
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => repondreConfirmation(true)}
            className={cn(
              "inline-flex h-11 items-center justify-center rounded-card px-4 text-sm font-medium text-white md:h-9",
              affichee?.danger ? "bg-danger-loyer" : "bg-accent-teal",
            )}
          >
            {affichee?.libelleConfirmer ?? "Confirmer"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
