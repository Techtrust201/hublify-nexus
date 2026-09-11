import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Écran affiché par une fiche de détail tant que l'état métier n'est pas chargé.
 *
 * Le rendu serveur ne dispose pas encore des données : sans cet écran, la fiche
 * conclurait « introuvable » et provoquerait une erreur de rendu pour une fiche
 * qui existe bel et bien.
 */
export function EcranAttente({ titre }: { titre: string }) {
  return (
    <AppShell titre={titre}>
      <div aria-busy="true" aria-live="polite" className="space-y-3">
        <span className="sr-only">Chargement en cours</span>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </AppShell>
  );
}
