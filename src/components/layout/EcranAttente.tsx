import { AppShell } from "@/components/layout/AppShell";
import { CorpsEnAttente } from "@/components/layout/CorpsEnAttente";

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
      <CorpsEnAttente />
    </AppShell>
  );
}
