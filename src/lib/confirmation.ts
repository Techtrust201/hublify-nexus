export type DemandeConfirmation = {
  titre: string;
  description?: string;
  libelleConfirmer?: string;
  libelleAnnuler?: string;
  danger?: boolean;
};

type DemandeEnCours = DemandeConfirmation & { cle: number; resoudre: (ok: boolean) => void };

let courante: DemandeEnCours | null = null;
let compteur = 0;
const abonnes = new Set<() => void>();

function notifier() {
  abonnes.forEach((fn) => fn());
}

export function demanderConfirmation(demande: DemandeConfirmation | string): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  const options = typeof demande === "string" ? { titre: demande } : demande;
  // Une seule demande à la fois : la précédente est refusée pour ne pas laisser sa promesse en suspens.
  courante?.resoudre(false);
  compteur += 1;
  return new Promise((resoudre) => {
    courante = { ...options, cle: compteur, resoudre };
    notifier();
  });
}

export function repondreConfirmation(ok: boolean) {
  const demande = courante;
  if (!demande) return;
  courante = null;
  notifier();
  demande.resoudre(ok);
}

export function abonnerConfirmation(fn: () => void) {
  abonnes.add(fn);
  return () => {
    abonnes.delete(fn);
  };
}

export function confirmationCourante() {
  return courante;
}
