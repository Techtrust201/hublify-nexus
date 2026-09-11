import { Skeleton } from "@/components/ui/skeleton";

/**
 * Contenu affiché tant que l'état métier n'est pas arrivé du serveur.
 *
 * Il vit dans son propre fichier parce que `AppShell` et `EcranAttente`
 * l'utilisent tous les deux, et que le second enveloppe le premier : les faire
 * dépendre l'un de l'autre créerait un cycle.
 */
export function CorpsEnAttente() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-3">
      <span className="sr-only">Chargement en cours</span>
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
