import {
  Check,
  Download,
  Eye,
  Home,
  KeyRound,
  Mail,
  Pencil,
  Phone,
  Plane,
  Plus,
  Search,
  Trash2,
  Users,
  Wrench,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import {
  OCCUPANTS_MO1,
  PRESTATAIRES_MO1,
  type OccupantMo1,
  type PrestataireMo1,
} from "@/data/reservations-mo1";
import { cn } from "@/lib/utils";

type Onglet = "residents" | "prestataires";
type FiltreOccupant = "tous" | "Locataire" | "Voyageur";

export function ListeOccupants() {
  const [onglet, setOnglet] = useState<Onglet>("residents");
  const [filtre, setFiltre] = useState<FiltreOccupant>("tous");
  const [recherche, setRecherche] = useState("");
  const [fiche, setFiche] = useState<OccupantMo1 | PrestataireMo1 | null>(null);

  const occupants = useMemo(() => {
    return OCCUPANTS_MO1.filter((o) => {
      if (filtre !== "tous" && o.type !== filtre) return false;
      const q = recherche.trim().toLowerCase();
      if (!q) return true;
      return o.nom.toLowerCase().includes(q) || o.logement.toLowerCase().includes(q);
    });
  }, [filtre, recherche]);

  const prestataires = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return PRESTATAIRES_MO1;
    return PRESTATAIRES_MO1.filter(
      (p) => p.nom.toLowerCase().includes(q) || p.metier.toLowerCase().includes(q),
    );
  }, [recherche]);

  return (
    <div>
      <h1 className="text-[28px] font-medium leading-9 text-ink">Liste des occupants</h1>
      <p className="mt-1 text-sm text-ink-subtle">
        Gérez vos locataires, voyageurs et prestataires de services.
      </p>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={() => setOnglet("residents")}
          className={cn(
            "inline-flex h-[39px] items-center gap-2 rounded-card px-4 text-sm",
            onglet === "residents"
              ? "bg-ink text-white"
              : "border border-line bg-white text-ink-body",
          )}
        >
          <Users className="size-4" />
          Résidents (5)
        </button>
        <button
          type="button"
          onClick={() => setOnglet("prestataires")}
          className={cn(
            "inline-flex h-[39px] items-center gap-2 rounded-card px-4 text-sm",
            onglet === "prestataires"
              ? "bg-ink text-white"
              : "border border-line bg-white text-ink-body",
          )}
        >
          <Wrench className="size-4" />
          Prestataires (5)
        </button>
      </div>

      <div className="mt-8 overflow-hidden rounded-card border border-line bg-white">
        <div className="flex flex-wrap items-center gap-3 px-6 py-4">
          <label className="relative flex h-[39px] w-full max-w-[448px] items-center gap-2 rounded-card border border-line px-3">
            <Search className="size-4 text-ink-muted" />
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder={
                onglet === "residents" ? "Rechercher un résident..." : "Rechercher un prestataire..."
              }
              className="h-full w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
            />
          </label>
          {onglet === "residents" && (
            <div className="flex gap-2">
              {(
                [
                  ["tous", "Tous"],
                  ["Locataire", "Locataires"],
                  ["Voyageur", "Voyageurs"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFiltre(id)}
                  className={cn(
                    "h-[37px] rounded-card px-3.5 text-sm",
                    filtre === id ? "bg-ink-filter text-white" : "bg-surface-soft text-ink-body",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              className="inline-flex h-[39px] items-center gap-2 rounded-card border border-line px-4 text-sm text-ink-body"
            >
              <Download className="size-4" />
              Exporter
            </button>
            <button
              type="button"
              className="inline-flex h-[39px] items-center gap-2 rounded-card bg-ink px-4 text-sm text-white"
            >
              <Plus className="size-4" />
              Ajouter
            </button>
          </div>
        </div>

        {onglet === "residents" ? (
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-y border-line-table bg-surface text-xs font-medium uppercase tracking-[0.6px] text-ink-header">
                <th className="px-6 py-3 font-medium">Nom</th>
                <th className="px-3 py-3 font-medium">Type</th>
                <th className="px-3 py-3 font-medium">Logement</th>
                <th className="px-3 py-3 font-medium">Contact</th>
                <th className="px-3 py-3 font-medium">Dates</th>
                <th className="px-3 py-3 font-medium">Statut</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {occupants.map((o) => (
                <tr key={o.id} className="border-b border-surface-soft last:border-b-0">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-full bg-line text-sm text-ink-body">
                        {o.initiales}
                      </span>
                      <span className="text-sm text-ink">{o.nom}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <span
                      className={cn(
                        "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs text-white",
                        o.type === "Locataire" ? "bg-ink" : "bg-ink-body",
                      )}
                    >
                      {o.type === "Locataire" ? (
                        <Home className="size-3" />
                      ) : (
                        <Plane className="size-3" />
                      )}
                      {o.type}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm text-ink">{o.logement}</td>
                  <td className="px-3 py-4 text-sm text-ink-subtle">
                    <p className="flex items-center gap-1.5">
                      <Phone className="size-3" />
                      {o.telephone}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Mail className="size-3" />
                      {o.email}
                    </p>
                  </td>
                  <td className="px-3 py-4 text-sm text-ink-subtle">
                    <p className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-dot-arrivee" />
                      Arrivée: {o.arrivee}
                    </p>
                    {o.depart && (
                      <p className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-dot-depart" />
                        Départ: {o.depart}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <span
                      className={cn(
                        "inline-flex h-7 items-center rounded-full px-3 text-xs text-white",
                        o.statut === "Actif" ? "bg-ink-deep" : "bg-ink-status",
                      )}
                    >
                      {o.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      <IconeAction label="Voir" onClick={() => setFiche(o)}>
                        <Eye className="size-4" />
                      </IconeAction>
                      <IconeAction label="Modifier" className="text-dot-edit">
                        <Pencil className="size-4" />
                      </IconeAction>
                      <IconeAction label="Supprimer">
                        <Trash2 className="size-4" />
                      </IconeAction>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-y border-surface-soft text-sm text-ink-subtle">
                <th className="px-6 py-3 font-normal">Nom</th>
                <th className="px-3 py-3 font-normal">Métier</th>
                <th className="px-3 py-3 font-normal">Contact</th>
                <th className="px-3 py-3 font-normal">Statut</th>
                <th className="px-6 py-3 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {prestataires.map((p) => (
                <tr key={p.id} className="border-b border-surface-soft last:border-b-0">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-full bg-line text-sm text-ink-body">
                        {p.initiales}
                      </span>
                      <span className="text-sm text-ink">{p.nom}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm text-ink-body">{p.metier}</td>
                  <td className="px-3 py-4 text-sm text-ink-subtle">
                    <p>{p.telephone}</p>
                    <p>{p.email}</p>
                  </td>
                  <td className="px-3 py-4">
                    <span className="inline-flex h-7 items-center rounded-full bg-ink px-3 text-xs text-white">
                      {p.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      <IconeAction label="Voir" onClick={() => setFiche(p)}>
                        <Eye className="size-4" />
                      </IconeAction>
                      <IconeAction label="Modifier">
                        <Pencil className="size-4" />
                      </IconeAction>
                      <IconeAction label="Supprimer">
                        <Trash2 className="size-4" />
                      </IconeAction>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {onglet === "residents" && (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <CarteResume
            icone={Users}
            titre="Total locataires actifs"
            valeur="3"
            detail="3 locataires + 2 voyageurs"
          />
          <CarteResume icone={KeyRound} titre="Total à venir" valeur="1" detail="Arrivées prochaines" />
          <CarteResume icone={Check} titre="Total voyageurs actifs" valeur="1" detail="À venir" />
        </div>
      )}

      {fiche && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-card border border-line bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-ink">{"nom" in fiche ? fiche.nom : ""}</p>
                <p className="mt-1 text-xs text-ink-subtle">
                  {"type" in fiche ? `${fiche.type} · ${fiche.logement}` : fiche.metier}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFiche(null)}
                className="text-xs text-ink-body"
              >
                Fermer
              </button>
            </div>
            <p className="mt-4 text-sm text-ink-body">{fiche.telephone}</p>
            <p className="text-sm text-ink-body">{fiche.email}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function IconeAction({
  label,
  children,
  onClick,
  className,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex size-10 items-center justify-center rounded-card border border-line text-ink-body",
        className,
      )}
    >
      {children}
    </button>
  );
}

function CarteResume({
  icone: Icone,
  titre,
  valeur,
  detail,
}: {
  icone: typeof Users;
  titre: string;
  valeur: string;
  detail: string;
}) {
  return (
    <div className="rounded-card border border-line bg-white p-6">
      <div className="flex gap-4">
        <span className="flex size-12 items-center justify-center rounded-full bg-ink-deep text-white">
          <Icone className="size-5" />
        </span>
        <div>
          <p className="text-sm text-ink-subtle">{titre}</p>
          <p className="mt-1 text-4xl text-ink">{valeur}</p>
          <p className="mt-1 text-xs text-ink-muted">{detail}</p>
        </div>
      </div>
    </div>
  );
}
