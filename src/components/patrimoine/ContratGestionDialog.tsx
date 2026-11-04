import { useState } from "react";
import { BtnNavy, BtnOutline } from "@/components/documents/ui";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { MandatGestion, ResumeBien } from "@/data/patrimoine-fiche";

type Logement = ResumeBien & { id: string };

export function ContratGestionDialog({
  ouvert,
  logements,
  gestionnaires,
  onFermer,
  onEnregistrer,
}: {
  ouvert: boolean;
  logements: Logement[];
  gestionnaires: string[];
  onFermer: () => void;
  onEnregistrer: (bienId: string, mandat: MandatGestion) => void;
}) {
  const [bienId, setBienId] = useState(logements[0]?.id ?? "");
  const [proprietaire, setProprietaire] = useState(logements[0]?.proprietaire ?? "");
  const [gestionnaire, setGestionnaire] = useState(gestionnaires[0] ?? "");
  const [debut, setDebut] = useState("");
  const [fin, setFin] = useState("");
  const [reference, setReference] = useState("");
  const [signe, setSigne] = useState(true);
  const [erreur, setErreur] = useState("");

  const choisir = (id: string) => {
    setBienId(id);
    const lieu = logements.find((l) => l.id === id);
    if (lieu?.proprietaire && lieu.proprietaire !== "—") setProprietaire(lieu.proprietaire);
  };

  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onFermer()}>
      <DialogContent className="max-w-lg">
        <DialogTitle>Ajouter un contrat de gestion</DialogTitle>
        <DialogDescription>
          Une fois le mandat signé, le propriétaire n'a plus qu'une vision « gestionnaire en charge
          ». Le gestionnaire garde l'accès complet et ouvre, catégorie par catégorie, ce qu'il rend
          au propriétaire.
        </DialogDescription>
        <div className="space-y-3 pt-2">
          <label className="block text-xs text-ink-muted">
            Logement
            <select
              value={bienId}
              onChange={(e) => choisir(e.target.value)}
              className="mt-1 h-11 w-full rounded-card border border-line bg-white px-3 text-sm text-ink md:h-9"
            >
              {logements.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-ink-muted">
            Propriétaire
            <input
              value={proprietaire}
              onChange={(e) => setProprietaire(e.target.value)}
              className="mt-1 h-11 w-full rounded-card border border-line px-3 text-sm text-ink md:h-9"
            />
          </label>
          <label className="block text-xs text-ink-muted">
            Gestionnaire en charge
            <input
              value={gestionnaire}
              onChange={(e) => setGestionnaire(e.target.value)}
              list="gestionnaires-mandat"
              className="mt-1 h-11 w-full rounded-card border border-line px-3 text-sm text-ink md:h-9"
            />
            <datalist id="gestionnaires-mandat">
              {gestionnaires.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-ink-muted">
              Début
              <input
                type="date"
                value={debut}
                onChange={(e) => setDebut(e.target.value)}
                className="mt-1 h-11 w-full rounded-card border border-line px-3 text-sm text-ink md:h-9"
              />
            </label>
            <label className="block text-xs text-ink-muted">
              Fin
              <input
                type="date"
                value={fin}
                onChange={(e) => setFin(e.target.value)}
                className="mt-1 h-11 w-full rounded-card border border-line px-3 text-sm text-ink md:h-9"
              />
            </label>
          </div>
          <label className="block text-xs text-ink-muted">
            Référence du mandat
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="MANDAT-2026-001"
              className="mt-1 h-11 w-full rounded-card border border-line px-3 text-sm text-ink md:h-9"
            />
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={signe} onChange={(e) => setSigne(e.target.checked)} />
            Mandat signé
          </label>
          {erreur && <p className="text-sm text-chip-danger-fg">{erreur}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <BtnOutline onClick={onFermer}>Annuler</BtnOutline>
            <BtnNavy
              onClick={() => {
                if (!bienId) {
                  setErreur("Choisissez un logement.");
                  return;
                }
                if (!proprietaire.trim() || !gestionnaire.trim()) {
                  setErreur("Le propriétaire et le gestionnaire sont obligatoires.");
                  return;
                }
                if (signe && (!debut || !fin || fin < debut)) {
                  setErreur("Un mandat signé a une date de début et une date de fin postérieure.");
                  return;
                }
                setErreur("");
                onEnregistrer(bienId, {
                  reference: reference.trim() || `MANDAT-${bienId}`,
                  proprietaire: proprietaire.trim(),
                  gestionnaire: gestionnaire.trim(),
                  debut,
                  fin,
                  signe,
                });
              }}
            >
              Enregistrer le contrat
            </BtnNavy>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
