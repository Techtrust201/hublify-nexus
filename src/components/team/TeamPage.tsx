import {
  Check,
  Clock,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  ACTIONS_EN_COURS,
  DROIT_PERSONNALISE_INITIAL,
  MEMBRES_MO1,
  nomComplet,
  type ActionEnCours,
  type DroitPersonnalise,
  type MembreEquipe,
  type RoleMembre,
  type StatutMembre,
} from "@/data/messagerie-mo1";
import { cn } from "@/lib/utils";
import { CarteMessage } from "./CarteMessage";
import { DialogDroits } from "./DialogDroits";
import { DialogInviter } from "./DialogInviter";
import { DialogSupprimer } from "./DialogSupprimer";

const BADGE: Record<StatutMembre, { label: string; classe: string }> = {
  actif: { label: "Actif", classe: "bg-[#1e2939] text-white" },
  externe: { label: "En externe", classe: "border border-[#d1d5dc] text-[#6a7282]" },
  attente: { label: "En attente", classe: "border border-[#e5e7eb] text-[#99a1af]" },
};

export function TeamPage() {
  const [membres, setMembres] = useState<MembreEquipe[]>(MEMBRES_MO1);
  const [recherche, setRecherche] = useState("");
  const [inviter, setInviter] = useState(false);
  const [edition, setEdition] = useState<MembreEquipe | null>(null);
  const [suppression, setSuppression] = useState<MembreEquipe | null>(null);
  const [messagePour, setMessagePour] = useState<string | null>(null);
  const [actions, setActions] = useState<ActionEnCours[]>(ACTIONS_EN_COURS);
  const [formDroit, setFormDroit] = useState(false);
  const [nomDroit, setNomDroit] = useState("");
  const [descDroit, setDescDroit] = useState("");
  const [droitsPerso, setDroitsPerso] = useState<DroitPersonnalise[]>([
    DROIT_PERSONNALISE_INITIAL,
  ]);
  const [selectMembres, setSelectMembres] = useState<string | null>(null);

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return membres;
    return membres.filter(
      (m) =>
        nomComplet(m).toLowerCase().includes(q) ||
        m.affectation.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q),
    );
  }, [membres, recherche]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl text-[#1e2939]">Team Mate</h2>
          <p className="mt-1 text-sm text-[#6a7282]">
            Constituez votre équipe afin de vous assister au quotidien
          </p>
        </div>
        <button
          type="button"
          onClick={() => setInviter(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[14px] bg-[#1e2939] px-4 text-sm font-medium text-white"
        >
          <UserPlus className="size-3.5" />
          Inviter un membre
        </button>
      </div>

      <section className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
        <header className="flex flex-col gap-3 border-b border-[#f3f4f6] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-[10px] border border-[#e5e7eb] bg-[#f9fafb]">
              <Users className="size-3.5 text-[#4a5565]" />
            </span>
            <div>
              <p className="text-sm text-[#1e2939]">Membres de l'équipe ({membres.length})</p>
              <p className="text-[10px] text-[#99a1af]">Gérez les accès et les permissions</p>
            </div>
          </div>
          <label className="flex h-[34px] w-full max-w-[220px] items-center gap-2 rounded-[10px] border border-[#e5e7eb] px-3">
            <Search className="size-3 text-[#99a1af]" />
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un membre…"
              className="h-full w-full bg-transparent text-xs text-[#1e2939] outline-none placeholder:text-[#d1d5dc]"
            />
          </label>
        </header>
        <ul>
          {filtres.map((m) => {
            const badge = BADGE[m.statut];
            return (
              <li key={m.id} className="border-b border-[#f3f4f6] last:border-b-0">
                <div className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e5e7eb] text-xs text-[#4a5565]">
                    {m.initiales}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm text-[#1e2939]">{nomComplet(m)}</p>
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-[10px]",
                          badge.classe,
                        )}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-[#6a7282]">
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-2.5" />
                        {m.role}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-2.5" />
                        {m.affectation}
                      </span>
                      <span>
                        {m.droits.length} droit{m.droits.length > 1 ? "s" : ""} d'accès
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setMessagePour((id) => (id === m.id ? null : m.id))}
                      className="inline-flex h-[30px] items-center gap-1.5 rounded-[10px] border border-[#e5e7eb] px-3 text-xs font-medium text-[#4a5565]"
                    >
                      <Mail className="size-2.5" />
                      Envoyer un message
                    </button>
                    <button
                      type="button"
                      aria-label="Modifier les droits"
                      onClick={() => setEdition(m)}
                      className="flex size-8 items-center justify-center rounded-[10px] border border-[#e5e7eb] text-[#4a5565]"
                    >
                      <Pencil className="size-3" />
                    </button>
                    <button
                      type="button"
                      aria-label="Supprimer le membre"
                      onClick={() => setSuppression(m)}
                      className="flex size-8 items-center justify-center rounded-[10px] border border-[#e5e7eb] text-[#4a5565]"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
                {messagePour === m.id && (
                  <div className="px-5 pb-4">
                    <CarteMessage
                      membre={m}
                      onFermer={() => setMessagePour(null)}
                      onEnvoyer={() => setMessagePour(null)}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {actions.length > 0 && (
        <section className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
          <header className="flex items-center gap-2.5 border-b border-[#f3f4f6] px-5 py-4">
            <span className="flex size-8 items-center justify-center rounded-[10px] border border-[#e5e7eb] bg-[#f9fafb]">
              <Clock className="size-3.5 text-[#4a5565]" />
            </span>
            <div>
              <p className="text-sm text-[#1e2939]">Actions en cours</p>
              <p className="text-[10px] text-[#99a1af]">Tâches et invitations en attente</p>
            </div>
          </header>
          <div className="grid gap-4 p-5 md:grid-cols-3">
            {actions.map((a) => (
              <article key={a.id} className="rounded-[10px] border border-[#e5e7eb] p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#1e2939]">{a.titre}</span>
                  <span className="text-[10px] text-[#99a1af]">{a.quand}</span>
                </div>
                <p className="mt-2 text-xs text-[#6a7282]">{a.detail}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActions((liste) => liste.filter((x) => x.id !== a.id))}
                    className="inline-flex h-[29px] flex-1 items-center justify-center gap-1 rounded-[10px] bg-[#1e2939] text-[10px] font-medium text-white"
                  >
                    <Check className="size-2.5" />
                    Valider
                  </button>
                  <button
                    type="button"
                    onClick={() => setActions((liste) => liste.filter((x) => x.id !== a.id))}
                    className="inline-flex h-[29px] flex-1 items-center justify-center gap-1 rounded-[10px] border border-[#e5e7eb] text-[10px] font-medium text-[#4a5565]"
                  >
                    <RotateCcw className="size-2.5" />
                    Reporter
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
        <header className="flex items-center gap-2.5 border-b border-[#f3f4f6] px-5 py-4">
          <span className="flex size-8 items-center justify-center rounded-[10px] border border-[#e5e7eb] bg-[#f9fafb]">
            <Lock className="size-3.5 text-[#4a5565]" />
          </span>
          <div>
            <p className="text-sm text-[#1e2939]">Droits d'accès</p>
            <p className="text-[10px] text-[#99a1af]">
              Définissez vos accès personnalisés pour gérer votre équipe
            </p>
          </div>
        </header>
        <div className="space-y-4 p-5">
          <p className="text-xs text-[#6a7282]">
            Définissez vos propres droits et attribuez-les à un ou plusieurs membres de votre équipe.
          </p>

          {droitsPerso.map((d) => (
            <div key={d.id} className="rounded-[10px] border border-[#e5e7eb] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-[#1e2939]">{d.nom}</p>
                  <p className="mt-0.5 text-[10px] text-[#99a1af]">{d.description}</p>
                </div>
                <button
                  type="button"
                  aria-label="Supprimer le droit"
                  onClick={() => setDroitsPerso((liste) => liste.filter((x) => x.id !== d.id))}
                  className="text-[#99a1af]"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
              <p className="mt-3 text-[10px] text-[#99a1af]">Membres assignés</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {d.membresIds.map((id) => {
                  const m = membres.find((x) => x.id === id);
                  if (!m) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex h-[26px] items-center gap-1.5 rounded-[10px] border border-[#e5e7eb] px-2 text-[10px] text-[#4a5565]"
                    >
                      <span className="size-4 rounded-full bg-[#e5e7eb]" />
                      {m.prenom}
                      <button
                        type="button"
                        aria-label={`Retirer ${m.prenom}`}
                        onClick={() =>
                          setDroitsPerso((liste) =>
                            liste.map((x) =>
                              x.id === d.id
                                ? { ...x, membresIds: x.membresIds.filter((mid) => mid !== id) }
                                : x,
                            ),
                          )
                        }
                      >
                        <X className="size-2.5" />
                      </button>
                    </span>
                  );
                })}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSelectMembres((id) => (id === d.id ? null : d.id))}
                    className="h-[26px] rounded-[10px] border border-dashed border-[#d1d5dc] px-2 text-[10px] text-[#6a7282]"
                  >
                    + Assigner
                  </button>
                  {selectMembres === d.id && (
                    <div className="absolute left-0 top-full z-10 mt-1 w-48 overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white py-1 shadow-md">
                      {membres
                        .filter((m) => !d.membresIds.includes(m.id))
                        .map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setDroitsPerso((liste) =>
                                liste.map((x) =>
                                  x.id === d.id
                                    ? { ...x, membresIds: [...x.membresIds, m.id] }
                                    : x,
                                ),
                              );
                              setSelectMembres(null);
                            }}
                            className="flex w-full px-3 py-1.5 text-left text-xs text-[#4a5565] hover:bg-[#f9fafb]"
                          >
                            {nomComplet(m)}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {formDroit ? (
            <div className="space-y-3 rounded-[10px] border border-[#e5e7eb] p-4">
              <label className="block">
                <span className="mb-1.5 block text-xs text-[#4a5565]">Nom du droit *</span>
                <input
                  value={nomDroit}
                  onChange={(e) => setNomDroit(e.target.value)}
                  placeholder="Ex: Accès aux statistiques"
                  className="h-[34px] w-full rounded-[10px] border border-[#e5e7eb] px-3 text-xs outline-none placeholder:text-[#99a1af]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs text-[#4a5565]">Description</span>
                <input
                  value={descDroit}
                  onChange={(e) => setDescDroit(e.target.value)}
                  placeholder="Courte description du droit"
                  className="h-[34px] w-full rounded-[10px] border border-[#e5e7eb] px-3 text-xs outline-none placeholder:text-[#99a1af]"
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormDroit(false);
                    setNomDroit("");
                    setDescDroit("");
                  }}
                  className="h-[34px] flex-1 rounded-[10px] border border-[#e5e7eb] text-xs font-medium text-[#4a5565]"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={!nomDroit.trim()}
                  onClick={() => {
                    setDroitsPerso((liste) => [
                      ...liste,
                      {
                        id: `dp-${Date.now()}`,
                        nom: nomDroit.trim(),
                        description: descDroit.trim(),
                        membresIds: [],
                      },
                    ]);
                    setFormDroit(false);
                    setNomDroit("");
                    setDescDroit("");
                  }}
                  className="h-[34px] flex-1 rounded-[10px] bg-[#1e2939] text-xs font-medium text-white disabled:opacity-40"
                >
                  Ajouter
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setFormDroit(true)}
              className="flex h-[42px] w-full items-center justify-center gap-1.5 rounded-[10px] border border-[#e5e7eb] text-xs font-medium text-[#4a5565]"
            >
              <Plus className="size-3.5" />
              Ajouter un droit d'accès
            </button>
          )}
        </div>
      </section>

      <DialogInviter
        ouvert={inviter}
        onFermer={() => setInviter(false)}
        onInviter={({ prenom, nom, role, affectation, droits }) => {
          const nouveau: MembreEquipe = {
            id: `me-${Date.now()}`,
            prenom,
            nom: nom || prenom,
            initiales: `${prenom[0] ?? ""}${nom[0] ?? prenom[1] ?? ""}`.toUpperCase(),
            statut: "attente",
            role: role as RoleMembre,
            affectation: affectation.startsWith("Assignment")
              ? affectation
              : `Assignment ${affectation}`,
            droits,
          };
          setMembres((liste) => [...liste, nouveau]);
        }}
      />
      <DialogDroits
        membre={edition}
        onFermer={() => setEdition(null)}
        onEnregistrer={(id, droits) =>
          setMembres((liste) => liste.map((m) => (m.id === id ? { ...m, droits } : m)))
        }
      />
      <DialogSupprimer
        membre={suppression}
        onFermer={() => setSuppression(null)}
        onConfirmer={(id) => setMembres((liste) => liste.filter((m) => m.id !== id))}
      />
    </div>
  );
}
