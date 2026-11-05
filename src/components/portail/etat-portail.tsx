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
import type { ModePortail, PaiementSimulation } from "@/lib/portail-mobile";
import { toastErreur } from "@/lib/feedback";

export type PortailDonnees = EtatPortail & {
  pret: boolean;
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

function aDuLocal(local: ReturnType<typeof lireInstantaneLocal>) {
  return (
    local.mode !== null ||
    local.demarre ||
    local.notes.length > 0 ||
    local.paiements.length > 0 ||
    Boolean(local.edl.valideLe) ||
    local.rdv !== null ||
    local.demandes.length > 0 ||
    local.favoris.length > 0 ||
    Boolean(local.docCourant) ||
    Object.keys(local.candidature).length > 0
  );
}

function fusionner(
  distant: EtatPortail,
  local: ReturnType<typeof lireInstantaneLocal>,
): EtatPortail {
  return {
    mode: distant.mode ?? local.mode,
    demarre: distant.demarre || local.demarre,
    notes: distant.notes.length > 0 ? distant.notes : local.notes,
    paiements: distant.paiements.length > 0 ? distant.paiements : local.paiements,
    edl: distant.edl.valideLe || distant.edl.emisLe ? distant.edl : local.edl,
    rdv: distant.rdv ?? local.rdv,
    demandes: distant.demandes.length > 0 ? distant.demandes : local.demandes,
    favoris: distant.favoris.length > 0 ? distant.favoris : local.favoris,
    docCourant: distant.docCourant ?? local.docCourant,
    candidature:
      Object.keys(distant.candidature).length > 0 ? distant.candidature : local.candidature,
  };
}

export function PortailDonneesProvider({ children }: { children: ReactNode }) {
  const [etat, setEtat] = useState<EtatPortail>(ETAT_PORTAIL_VIDE);
  const [pret, setPret] = useState(false);
  const etatRef = useRef(etat);
  const sauvegardes = useRef<Promise<void>>(Promise.resolve());
  etatRef.current = etat;

  useEffect(() => {
    let vivant = true;
    void (async () => {
      try {
        const res = await chargerPortailDistant();
        if (!vivant) return;
        if (!res.ok) {
          setEtat(fusionner(ETAT_PORTAIL_VIDE, lireInstantaneLocal()));
          setPret(true);
          return;
        }
        const local = lireInstantaneLocal();
        const suivant = fusionner(res.data, local);
        const distantVide =
          !res.data.demarre &&
          !res.data.mode &&
          res.data.notes.length === 0 &&
          res.data.paiements.length === 0 &&
          !res.data.rdv &&
          res.data.demandes.length === 0 &&
          res.data.favoris.length === 0;
        if (distantVide && aDuLocal(local)) {
          const sauve = await sauverPortailDistant({ data: suivant });
          if (sauve.ok) oublierEtatMetierLocal();
        } else if (!distantVide) {
          oublierEtatMetierLocal();
        }
        if (!vivant) return;
        setEtat(suivant);
        setPret(true);
      } catch {
        if (!vivant) return;
        setEtat(fusionner(ETAT_PORTAIL_VIDE, lireInstantaneLocal()));
        setPret(true);
        toastErreur("Le portail n'a pas pu se synchroniser. Vérifiez votre connexion et rechargez la page.");
      }
    })();
    return () => {
      vivant = false;
    };
  }, []);

  const enregistrer = useCallback((recette: (actuel: EtatPortail) => EtatPortail) => {
    const suivant = recette(etatRef.current);
    etatRef.current = suivant;
    setEtat(suivant);
    // Serialiser les mutations : un enregistrement lent ne doit pas ecraser le plus recent.
    sauvegardes.current = sauvegardes.current
      .catch(() => undefined)
      .then(async () => {
        const res = await sauverPortailDistant({ data: suivant });
        if (!res.ok) {
          toastErreur("La modification n'a pas ete enregistree. Verifiez votre connexion et reessayez.");
        }
      })
      .catch(() => {
        toastErreur("La modification n'a pas ete enregistree. Verifiez votre connexion et reessayez.");
      });
    return suivant;
  }, []);

  const valeur: PortailDonnees = {
    ...etat,
    pret,
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
