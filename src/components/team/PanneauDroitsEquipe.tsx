import { useEffect, useState } from "react";
import { DROITS_CATALOGUE, DROITS_PAR_ROLE, roleParLabel } from "@/auth/permissions";
import { nomComplet, type MembreEquipe } from "@/data/messagerie-mo1";
import type { BienSession } from "@/data/etat-session";
import { droitsPersonnalises } from "@/lib/gestionnaire-planning";
import { ListeDroits, ModeDroits } from "./DialogInviter";

export function PanneauDroitsEquipe({
  membre,
  biens,
  onFermer,
  onEnregistrer,
  onAjouterBien,
}: {
  membre: MembreEquipe;
  biens: BienSession[];
  onFermer: () => void;
  onEnregistrer: (membreId: string, droits: string[]) => void;
  onAjouterBien: (membreId: string, bienNom: string) => void;
}) {
  const [droits, setDroits] = useState<string[]>([]);
  const [mode, setMode] = useState<"profil" | "personnalise">("profil");
  const [bienNom, setBienNom] = useState(biens[0]?.nom ?? "");
  const roleId = roleParLabel(membre.role);

  useEffect(() => {
    const profil = DROITS_PAR_ROLE[roleId];
    const effectifs = membre.droits.filter((id) => profil.includes(id as (typeof profil)[number]));
    const estProfil =
      effectifs.length === profil.length && profil.every((id) => effectifs.includes(id));
    if (effectifs.length === 0 || !estProfil) {
      setMode("personnalise");
      setDroits(effectifs);
      return;
    }
    setMode("profil");
    setDroits([...profil]);
  }, [membre, roleId]);

  return (
    <div className="space-y-4">
      <section className="rounded-card border border-line bg-white p-5">
        <h2 className="text-sm text-ink">Droits d'accès</h2>
        <p className="mt-1 text-xs text-ink-muted">
          {nomComplet(membre)} · définissez vos accès personnalisés pour gérer votre bien en toute
          sécurité.
        </p>
        <div className="mt-4">
          <ModeDroits
            mode={mode}
            libelleProfil="Total"
            onProfil={() => {
              setMode("profil");
              setDroits([...DROITS_PAR_ROLE[roleId]]);
            }}
            onPersonnalise={() => {
              setMode("personnalise");
              setDroits([]);
            }}
          />
        </div>
        <p className="mb-3 text-[11px] text-ink-muted">
          {mode === "profil" ? "Total : le profil a tous les droits de son rôle." : "Personnalisé"}
        </p>
        <ListeDroits
          selection={droits}
          mode={mode}
          roleId={roleId}
          onToggle={(id) =>
            setDroits((liste) =>
              liste.includes(id) ? liste.filter((d) => d !== id) : [...liste, id],
            )
          }
        />
        <ul className="mt-3 text-[11px] text-ink-muted">
          {droits.map((id) => {
            const fiche = DROITS_CATALOGUE.find((d) => d.id === id);
            return <li key={id}>{fiche?.titre ?? id}</li>;
          })}
        </ul>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onFermer}
            className="h-11 flex-1 rounded-card border border-line text-sm text-ink-body md:h-9"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() =>
              onEnregistrer(
                membre.id,
                mode === "personnalise"
                  ? droitsPersonnalises(roleId, droits)
                  : [...DROITS_PAR_ROLE[roleId]],
              )
            }
            className="h-11 flex-1 rounded-card bg-ink text-sm font-medium text-white md:h-9"
          >
            Enregistrer
          </button>
        </div>
      </section>

      <section className="rounded-card border border-line bg-white p-5">
        <h2 className="text-sm text-ink">Droits d'accès aux biens et événements</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Définissez les biens ou événements du calendrier auxquels le profil pourra avoir accès.
        </p>
        <label className="mt-4 block text-xs text-ink-muted">
          Bien ou événement
          <select
            value={bienNom}
            onChange={(e) => setBienNom(e.target.value)}
            className="mt-1 h-11 w-full rounded-card border border-line bg-white px-3 text-sm text-ink md:h-9"
          >
            {biens.length === 0 && <option value="">Aucun bien</option>}
            {biens.map((b) => (
              <option key={b.id} value={b.nom}>
                {b.nom}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => setBienNom(biens[0]?.nom ?? "")}
            className="h-11 flex-1 rounded-card border border-line text-sm text-ink-body md:h-9"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={!bienNom.trim()}
            onClick={() => onAjouterBien(membre.id, bienNom.trim())}
            className="h-11 flex-1 rounded-card bg-ink text-sm font-medium text-white disabled:opacity-40 md:h-9"
          >
            Ajouter
          </button>
        </div>
      </section>
    </div>
  );
}
