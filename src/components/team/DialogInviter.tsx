import { Eye, Pencil, Shield } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DROITS_CATALOGUE, type RoleMembre } from "@/data/messagerie-mo1";
import { cn } from "@/lib/utils";

const GROUPES = [
  { nom: "Lecture" as const, icone: Eye },
  { nom: "Modification" as const, icone: Pencil },
  { nom: "Administration" as const, icone: Shield },
];

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
    role: RoleMembre;
    affectation: string;
    droits: string[];
  }) => void;
}) {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleMembre>("Gestionnaire");
  const [affectation, setAffectation] = useState("");
  const [droits, setDroits] = useState<string[]>([]);

  const reset = () => {
    setPrenom("");
    setNom("");
    setEmail("");
    setRole("Gestionnaire");
    setAffectation("");
    setDroits([]);
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
      <DialogContent className="max-h-[90vh] max-w-[600px] gap-0 overflow-y-auto rounded-[10px] border-[#e5e7eb] p-0 sm:rounded-[10px]">
        <DialogHeader className="border-b border-[#f3f4f6] px-6 py-4">
          <DialogTitle className="text-base font-normal text-[#1e2939]">
            Inviter un membre
          </DialogTitle>
          <DialogDescription className="text-xs text-[#6a7282]">
            Le membre recevra un email d'invitation
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
                onChange={(e) => setRole(e.target.value as RoleMembre)}
                className={cn(champClasse, "h-9")}
              >
                <option>Gestionnaire</option>
                <option>Administrateur</option>
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
            <p className="mb-3 text-xs text-[#1e2939]">Droits d'accès</p>
            <ListeDroits selection={droits} onToggle={toggle} />
          </div>
        </div>

        <div className="flex gap-3 border-t border-[#f3f4f6] px-6 py-4">
          <button
            type="button"
            onClick={() => {
              reset();
              onFermer();
            }}
            className="h-[38px] flex-1 rounded-[10px] border border-[#e5e7eb] text-xs font-medium text-[#4a5565]"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={!prenom.trim() || !email.trim()}
            onClick={() => {
              onInviter({
                prenom: prenom.trim(),
                nom: nom.trim(),
                email: email.trim(),
                role,
                affectation: affectation.trim() || "Assignment",
                droits,
              });
              reset();
              onFermer();
            }}
            className="h-[38px] flex-1 rounded-[10px] bg-[#1e2939] text-xs font-medium text-white disabled:opacity-40"
          >
            Envoyer l'invitation
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ListeDroits({
  selection,
  onToggle,
}: {
  selection: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-5">
      {GROUPES.map(({ nom, icone: Icone }) => (
        <div key={nom}>
          <p className="mb-2 flex items-center gap-1.5 text-[10px] text-[#99a1af]">
            <Icone className="size-2.5" />
            {nom}
          </p>
          <ul className="space-y-2">
            {DROITS_CATALOGUE.filter((d) => d.groupe === nom).map((d) => (
              <li key={d.id}>
                <label className="flex cursor-pointer items-start gap-3">
                  <Checkbox
                    checked={selection.includes(d.id)}
                    onCheckedChange={() => onToggle(d.id)}
                    className="mt-0.5 border-[#d1d5dc] data-[state=checked]:border-[#1e2939] data-[state=checked]:bg-[#1e2939]"
                  />
                  <span>
                    <span className="block text-xs text-[#1e2939]">{d.titre}</span>
                    <span className="block text-[10px] text-[#99a1af]">{d.description}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Champ({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-[#4a5565]">{label}</span>
      {children}
    </label>
  );
}

const champClasse =
  "h-[34px] w-full rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-xs text-[#1e2939] outline-none placeholder:text-[#99a1af]";
