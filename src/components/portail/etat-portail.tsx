import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ETAT_PORTAIL_VIDE, type EtatPortail } from "@/data/portail-etat";
import { chargerPortailDistant, sauverPortailDistant } from "@/data/portail-remote";
import {
  lireInstantaneLocal,
  oublierEtatMetierLocal,
  type BrouillonCandidature,
  type DecisionStockee,
  type NoteCalendrier,
  type RdvPortail,
  type ValidationEdl,
} from "@/components/portail/etat-local";
import {
  aDuLocal,
  fusionDoitEtrePubliee,
  fusionnerPortail,
} from "@/components/portail/synchro-portail";
import type { ModePortail, PaiementSimulation } from "@/lib/portail-mobile";
import { toastErreur } from "@/lib/feedback";

export type PortailDonnees = EtatPortail & {
  pret: boolean;
  /** Faux après un échec réseau : on n'écrit pas le mode par défaut, pour ne pas afficher un échec d'enregistrement fantôme. */
  distantJoignable: boolean;
  definirMode: (mode: ModePortail) => void;
  demarrer: () => void;
  ajouterNote: (note: NoteCalendrier) => void;
  modifierNote: (note: NoteCalendrier) => void;
  supprimerNote: (id: string) => void;
  ajouterPaiement: (paiement: PaiementSimulation) => void;
  ecrireEdl: (valeur: ValidationEdl) => void;
  ecrireRdv: (valeur: RdvPortail) => void;
  ajouterDecision: (decision: DecisionStockee) => void;
  basculerFavori: (id: string) => string[];
  ecrireDocCourant: (id: string) => void;
  ecrireCandidature: (valeur: BrouillonCandidature) => void;
};

const Ctx = createContext<PortailDonnees | null>(null);

export function PortailDonneesProvider({ children }: { children: ReactNode }) {
  const [etat, setEtat] = useState<EtatPortail>(ETAT_PORTAIL_VIDE);
  const [pret, setPret] = useState(false);
  const [distantJoignable, setDistantJoignable] = useState(false);
  const etatRef = useRef(etat);
  const sale = useRef(false);
  const sauvegardes = useRef<Promise<void>>(Promise.resolve());
  etatRef.current = etat;

  useEffect(() => {
    let vivant = true;
    void (async () => {
      try {
        const res = await chargerPortailDistant();
        if (!vivant) return;
        if (!res.ok) {
          setEtat(fusionnerPortail(ETAT_PORTAIL_VIDE, lireInstantaneLocal()));
          setDistantJoignable(false);
          setPret(true);
          toastErreur(
            "Le portail n'a pas pu se synchroniser. Vérifiez votre connexion et rechargez la page.",
          );
          return;
        }
        const local = lireInstantaneLocal();
        const suivant = fusionnerPortail(res.data, local);
        const garderSaisie = (actuel: EtatPortail): EtatPortail => ({
          mode: actuel.mode ?? suivant.mode,
          demarre: actuel.demarre || suivant.demarre,
          notes: actuel.notes.length > 0 ? actuel.notes : suivant.notes,
          paiements: actuel.paiements.length > 0 ? actuel.paiements : suivant.paiements,
          edl: actuel.edl.valideLe ? actuel.edl : suivant.edl,
          rdv: actuel.rdv ?? suivant.rdv,
          demandes: actuel.demandes.length > 0 ? actuel.demandes : suivant.demandes,
          favoris: actuel.favoris.length > 0 ? actuel.favoris : suivant.favoris,
          docCourant: actuel.docCourant ?? suivant.docCourant,
          candidature:
            Object.keys(actuel.candidature).length > 0 ? actuel.candidature : suivant.candidature,
        });
        if (sale.current) {
          setEtat(garderSaisie);
          setDistantJoignable(true);
          setPret(true);
          return;
        }
        if (aDuLocal(local) && fusionDoitEtrePubliee(res.data, suivant)) {
          try {
            const sauve = await sauverPortailDistant({ data: suivant });
            if (sauve.ok) oublierEtatMetierLocal();
          } catch {
            if (vivant) {
              toastErreur(
                "Le portail n'a pas pu se synchroniser. Vérifiez votre connexion et rechargez la page.",
              );
            }
          }
        } else if (!aDuLocal(local) || !fusionDoitEtrePubliee(res.data, suivant)) {
          oublierEtatMetierLocal();
        }
        if (!vivant) return;
        setEtat(sale.current ? garderSaisie : suivant);
        setDistantJoignable(true);
        setPret(true);
      } catch {
        if (!vivant) return;
        setEtat(fusionnerPortail(ETAT_PORTAIL_VIDE, lireInstantaneLocal()));
        setDistantJoignable(false);
        setPret(true);
        toastErreur(
          "Le portail n'a pas pu se synchroniser. Vérifiez votre connexion et rechargez la page.",
        );
      }
    })();
    return () => {
      vivant = false;
    };
  }, []);

  const enregistrer = useCallback((recette: (actuel: EtatPortail) => EtatPortail) => {
    sale.current = true;
    const suivant = recette(etatRef.current);
    etatRef.current = suivant;
    setEtat(suivant);
    const promesse = sauvegardes.current.then(async () => {
      const photo = etatRef.current;
      try {
        const res = await sauverPortailDistant({ data: photo });
        if (etatRef.current !== photo) return;
        if (!res.ok && res.raison !== "non_configure") {
          toastErreur("L'enregistrement en base a échoué. Réessayez.");
        }
      } catch {
        if (etatRef.current !== photo) return;
        toastErreur("L'enregistrement en base a échoué. Réessayez.");
      }
    });
    sauvegardes.current = promesse.then(
      () => undefined,
      () => undefined,
    );
    return suivant;
  }, []);

  const valeur: PortailDonnees = {
    ...etat,
    pret,
    distantJoignable,
    definirMode: (mode) => enregistrer((e) => ({ ...e, mode })),
    demarrer: () => enregistrer((e) => ({ ...e, demarre: true, mode: e.mode ?? "resident" })),
    ajouterNote: (note) =>
      enregistrer((e) => ({
        ...e,
        notes: [note, ...e.notes.filter((n) => n.id !== note.id)],
      })),
    modifierNote: (note) =>
      enregistrer((e) => ({
        ...e,
        notes: e.notes.map((n) => (n.id === note.id ? note : n)),
      })),
    supprimerNote: (id) =>
      enregistrer((e) => ({ ...e, notes: e.notes.filter((n) => n.id !== id) })),
    ajouterPaiement: (paiement) =>
      enregistrer((e) => ({ ...e, paiements: [paiement, ...e.paiements] })),
    ecrireEdl: (edl) => enregistrer((e) => ({ ...e, edl })),
    ecrireRdv: (rdv) => enregistrer((e) => ({ ...e, rdv })),
    ajouterDecision: (decision) =>
      enregistrer((e) => ({ ...e, demandes: [decision, ...e.demandes] })),
    basculerFavori: (id) => {
      const actuel = etatRef.current.favoris;
      const suivant = actuel.includes(id) ? actuel.filter((x) => x !== id) : [id, ...actuel];
      enregistrer((e) => ({ ...e, favoris: suivant }));
      return suivant;
    },
    ecrireDocCourant: (id) => enregistrer((e) => ({ ...e, docCourant: id })),
    ecrireCandidature: (candidature) => enregistrer((e) => ({ ...e, candidature })),
  };

  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>;
}

export function usePortailDonnees() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("Portail hors du fournisseur de données");
  return ctx;
}
