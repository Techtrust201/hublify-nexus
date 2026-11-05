import { useState, type ReactNode } from "react";
import {
  DROITS_CATALOGUE,
  DROITS_PAR_ROLE,
  ROLES_EQUIPE,
  roleParLabel,
  type RoleId,
  type RoleLabel,
} from "@/auth/permissions";
import {
  CATEGORIES_DROITS,
  droitAutoriseParProfil,
  droitsPersonnalises,
} from "@/lib/gestionnaire-planning";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function DialogInviter({
  ouvert,
  onFermer,
  onInviter,
}: {
  ouvert: boolean;
  onFermer: () => void;
  onInviter: (payload: {
    prenom: string;
    nom: string;
    email: string;
    role: RoleLabel;
    affectation: string;
    droits: string[];
  }) => void;
}) {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleLabel>("Gestionnaire");
  const [affectation, setAffectation] = useState("");
  const [droits, setDroits] = useState<string[]>([...DROITS_PAR_ROLE.gestionnaire]);
  const [modeDroits, setModeDroits] = useState<"profil" | "personnalise">("profil");

  const reset = () => {
    setPrenom("");
    setNom("");
    setEmail("");
    setRole("Gestionnaire");
    setAffectation("");
    setDroits([...DROITS_PAR_ROLE.gestionnaire]);
    setModeDroits("profil");
  };

  const toggle = (id: string) =>
    setDroits((liste) => (liste.includes(id) ? liste.filter((d) => d !== id) : [...liste, id]));

  return (
    <Dialog
      open={ouvert}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onFermer();
        }
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-[600px] gap-0 overflow-y-auto rounded-card border-line p-0 sm:rounded-card">
        <DialogHeader className="border-b border-surface-soft px-6 py-4">
          <DialogTitle className="text-base font-normal text-ink">Inviter un membre</DialogTitle>
          <DialogDescription className="text-xs text-ink-subtle">
            Le compte est créé avec un mot de passe temporaire, transmis par e-mail.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Prénom *">
              <input
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Prénom"
                className={champClasse}
              />
            </Champ>
            <Champ label="Nom">
              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Nom"
                className={champClasse}
              />
            </Champ>
          </div>
          <Champ label="Email *">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.com"
              className={champClasse}
            />
          </Champ>
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Rôle">
              <select
                value={role}
                onChange={(e) => {
                  const prochain = e.target.value as RoleLabel;
                  setRole(prochain);
                  setModeDroits("profil");
                  setDroits([...DROITS_PAR_ROLE[roleParLabel(prochain)]]);
                }}
                className={cn(champClasse, "h-9")}
              >
                {ROLES_EQUIPE.map((r) => (
                  <option key={r.id}>{r.label}</option>
                ))}
              </select>
            </Champ>
            <Champ label="Affectation">
              <input
                value={affectation}
                onChange={(e) => setAffectation(e.target.value)}
                placeholder="Ex: Louisette"
                className={champClasse}
              />
            </Champ>
          </div>

          <div>
            <p className="mb-1 text-xs text-ink">Droits d'accès</p>
            <p className="mb-3 text-[11px] text-ink-muted">
              Le profil valide le plafond. En personnalisé, tout est restreint tant qu'une case
              n'est pas cochée.
            </p>
            <ModeDroits
              mode={modeDroits}
              onProfil={() => {
                setModeDroits("profil");
                setDroits([...DROITS_PAR_ROLE[roleParLabel(role)]]);
              }}
              onPersonnalise={() => {
                setModeDroits("personnalise");
                setDroits([]);
              }}
            />
            <ListeDroits
              selection={droits}
              onToggle={toggle}
              mode={modeDroits}
              roleId={roleParLabel(role)}
            />
          </div>
        </div>

        <div className="flex gap-3 border-t border-surface-soft px-6 py-4">
          <button
            type="button"
            onClick={() => {
              reset();
              onFermer();
            }}
            className="h-11 flex-1 rounded-card border border-line text-xs font-medium text-ink-body md:h-[38px]"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={!prenom.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())}
            onClick={() => {
              onInviter({
                prenom: prenom.trim(),
                nom: nom.trim(),
                email: email.trim(),
                role,
                affectation: affectation.trim() || "Non précisée",
                droits:
                  modeDroits === "personnalise"
                    ? droitsPersonnalises(roleParLabel(role), droits)
                    : [...DROITS_PAR_ROLE[roleParLabel(role)]],
              });
              reset();
              onFermer();
            }}
            className="h-11 flex-1 rounded-card bg-ink text-xs font-medium text-white disabled:opacity-40 md:h-[38px]"
          >
            Envoyer l'invitation
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ModeDroits({
  mode,
  onProfil,
  onPersonnalise,
  libelleProfil = "Profil",
}: {
  mode: "profil" | "personnalise";
  onProfil: () => void;
  onPersonnalise: () => void;
  libelleProfil?: string;
}) {
  return (
    <div className="mb-3 inline-flex rounded-card border border-line p-0.5">
      {(
        [
          ["profil", libelleProfil, onProfil],
          ["personnalise", "Personnalisé", onPersonnalise],
        ] as const
      ).map(([id, label, onClick]) => (
        <button
          key={id}
          type="button"
          aria-pressed={mode === id}
          onClick={onClick}
          className={cn(
            "h-8 rounded-[10px] px-3 text-xs font-medium",
            mode === id ? "bg-ink text-white" : "text-ink-muted",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function ListeDroits({
  selection,
  onToggle,
  mode = "personnalise",
  roleId = "gestionnaire",
}: {
  selection: string[];
  onToggle: (id: string) => void;
  mode?: "profil" | "personnalise";
  roleId?: RoleId;
}) {
  return (
    <div className="space-y-3">
      {mode === "profil" && (
        <p className="text-[11px] text-ink-muted">
          Ces droits sont ceux du profil. Ils sont validés par le rôle, sans case supplémentaire.
        </p>
      )}
      {CATEGORIES_DROITS.map((categorie) => (
        <fieldset key={categorie.id} className="rounded-card border border-line p-3">
          <legend className="px-1 text-xs font-medium text-ink">{categorie.titre}</legend>
          <ul className="mt-2 space-y-2">
            {categorie.droits.map((id) => {
              const fiche = DROITS_CATALOGUE.find((d) => d.id === id);
              const autorise = droitAutoriseParProfil(roleId, id);
              const coche = selection.includes(id);
              return (
                <li key={id}>
                  <label className={cn("flex items-start gap-3", !autorise && "opacity-50")}>
                    <Checkbox
                      checked={mode === "profil" ? autorise : coche}
                      disabled={mode === "profil" || !autorise}
                      onCheckedChange={() => {
                        if (mode === "personnalise" && autorise) onToggle(id);
                      }}
                      className="mt-0.5 border-line-strong data-[state=checked]:border-ink data-[state=checked]:bg-ink"
                    />
                    <span>
                      <span className="block text-xs text-ink">{fiche?.titre ?? id}</span>
                      <span className="block text-[10px] text-ink-muted">
                        {autorise
                          ? fiche?.description
                          : "Hors profil : le rôle ne valide pas ce droit."}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ))}
    </div>
  );
}

function Champ({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-ink-body">{label}</span>
      {children}
    </label>
  );
}

const champClasse =
  "h-[34px] w-full rounded-card border border-line bg-white px-3 text-xs text-ink outline-none placeholder:text-ink-muted";
