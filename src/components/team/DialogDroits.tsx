import { useEffect, useState } from "react";
import { DROITS_PAR_ROLE, roleParLabel } from "@/auth/permissions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { nomComplet, type MembreEquipe } from "@/data/messagerie-mo1";
import { droitsPersonnalises } from "@/lib/gestionnaire-planning";
import { ListeDroits, ModeDroits } from "./DialogInviter";

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
  const [mode, setMode] = useState<"profil" | "personnalise">("profil");
  const ouvert = Boolean(membre);
  const roleId = roleParLabel(membre?.role ?? "Lecture");

  useEffect(() => {
    if (!membre) return;
    const profil = DROITS_PAR_ROLE[roleParLabel(membre.role)];
    const effectifs = membre.droits.filter((id) => profil.includes(id as (typeof profil)[number]));
    const estProfil =
      effectifs.length === profil.length && profil.every((id) => effectifs.includes(id));
    if (effectifs.length === 0 || !estProfil) {
      setMode("personnalise");
      setDroits(effectifs);
      return;
    }
    setMode("profil");
    setDroits([...profil]);
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
        className="max-h-[90vh] max-w-[540px] gap-0 overflow-y-auto rounded-card border-line p-0 sm:rounded-card"
      >
        <DialogHeader className="border-b border-surface-soft px-6 py-4">
          <DialogTitle className="text-base font-normal text-ink">Droits d'accès</DialogTitle>
          <DialogDescription className="text-xs text-ink-subtle">
            {membre ? `${nomComplet(membre)} · ${membre.role}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5">
          <p className="mb-3 text-[11px] text-ink-muted">
            Le profil du rôle valide le plafond. Personnalisé part avec tout restreint.
          </p>
          <ModeDroits
            mode={mode}
            onProfil={() => {
              setMode("profil");
              setDroits([...DROITS_PAR_ROLE[roleId]]);
            }}
            onPersonnalise={() => {
              setMode("personnalise");
              setDroits([]);
            }}
          />
          <ListeDroits
            selection={droits}
            mode={mode}
            roleId={roleId}
            onToggle={(id) =>
              setDroits((liste) =>
                liste.includes(id) ? liste.filter((d) => d !== id) : [...liste, id],
              )
            }
          />
        </div>
        <div className="flex gap-3 border-t border-surface-soft px-6 py-4">
          <button
            type="button"
            onClick={onFermer}
            className="h-[38px] flex-1 rounded-card border border-line text-xs font-medium text-ink-body"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => {
              if (membre) {
                onEnregistrer(
                  membre.id,
                  mode === "personnalise"
                    ? droitsPersonnalises(roleId, droits)
                    : [...DROITS_PAR_ROLE[roleId]],
                );
              }
              onFermer();
            }}
            className="h-[38px] flex-1 rounded-card bg-ink text-xs font-medium text-white"
          >
            Enregistrer
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
