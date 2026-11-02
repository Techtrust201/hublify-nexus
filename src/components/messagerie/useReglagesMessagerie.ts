import { useEffect, useState } from "react";
import {
  chargerReglagesMessagerieDistants,
  sauverReglagesMessagerieDistants,
} from "@/data/parametres-remote";
import {
  lireReglagesLegacyPuisPurger,
  purgerReglagesMessagerieLocal,
  reglagesParDefaut,
  type ReglagesMessagerie,
} from "@/data/reglages-messagerie";

export function useReglagesMessagerie() {
  const [reglages, setReglages] = useState<ReglagesMessagerie>(reglagesParDefaut);

  useEffect(() => {
    let actif = true;
    const legacy = lireReglagesLegacyPuisPurger();
    void chargerReglagesMessagerieDistants().then(async (res) => {
      if (!actif) return;
      if (res.ok) {
        const distant = res.data;
        const vide =
          Object.keys(distant.situations).length === 0 &&
          Object.keys(distant.propositions).length === 0;
        if (vide && legacy) {
          setReglages(legacy);
          await sauverReglagesMessagerieDistants({ data: legacy });
        } else {
          setReglages(distant);
        }
      } else if (legacy) {
        setReglages(legacy);
      }
      purgerReglagesMessagerieLocal();
    });
    return () => {
      actif = false;
    };
  }, []);

  const mettreAJour = (fn: (actuel: ReglagesMessagerie) => ReglagesMessagerie) => {
    setReglages((actuel) => {
      const prochain = fn(actuel);
      purgerReglagesMessagerieLocal();
      void sauverReglagesMessagerieDistants({ data: prochain });
      return prochain;
    });
  };

  return [reglages, mettreAJour] as const;
}
