// SOURCE: Hublify V1.0 — annotation 304:17490 (menu Créer du dossier occupants).

import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MenuCreer({
  onQuittance,
  onAppel,
  onFacture,
  onCourrier,
  onRecherche,
}: {
  onQuittance: () => void;
  onAppel: () => void;
  onFacture: () => void;
  onCourrier: () => void;
  onRecherche: () => void;
}) {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-11 min-h-11 items-center gap-1.5 rounded-card bg-ink px-3 text-sm font-medium text-white md:h-[34px] md:min-h-[34px] md:text-xs">
        <Plus className="size-3" /> Créer
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem onClick={() => void navigate({ to: "/occupants" })}>
          Créer fiche locataire
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void navigate({ to: "/reservations/nouveau" })}>
          Créer fiche voyageur
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void navigate({ to: "/outils/baux" })}>
          Créer bail
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onQuittance}>Créer quittance de loyer</DropdownMenuItem>
        <DropdownMenuItem onClick={onAppel}>Créer un appel de loyer</DropdownMenuItem>
        <DropdownMenuItem onClick={onFacture}>Créer une facture</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCourrier}>Autre courrier</DropdownMenuItem>
        <DropdownMenuItem onClick={onRecherche}>Recherche d'un document générique</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
