import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Contenu affiché tant que l'état métier n'est pas arrivé du serveur.
 *
 * Il vit dans son propre fichier parce que `AppShell` et `EcranAttente`
 * l'utilisent tous les deux, et que le second enveloppe le premier : les faire
 * dépendre l'un de l'autre créerait un cycle.
 */
export function CorpsEnAttente() {
  const [lent, setLent] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setLent(true), 8_000);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-3">
      <span className="sr-only">Chargement en cours</span>
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-24 w-full" />
      {lent && (
        <p className="text-sm text-ink-muted">
          La connexion est lente. L'écran s'affichera dès que le serveur répond.
        </p>
      )}
    </div>
  );
}
