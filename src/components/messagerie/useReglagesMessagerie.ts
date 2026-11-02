import { useEffect, useState } from "react";
import {
  ecrireReglages,
  lireReglages,
  reglagesParDefaut,
  type ReglagesMessagerie,
} from "@/data/reglages-messagerie";

export function useReglagesMessagerie() {
  const [reglages, setReglages] = useState<ReglagesMessagerie>(reglagesParDefaut);
  useEffect(() => {
    setReglages(lireReglages());
  }, []);

  const mettreAJour = (fn: (actuel: ReglagesMessagerie) => ReglagesMessagerie) => {
    setReglages((actuel) => {
      const prochain = fn(actuel);
      ecrireReglages(prochain);
      return prochain;
    });
  };

  return [reglages, mettreAJour] as const;
}
