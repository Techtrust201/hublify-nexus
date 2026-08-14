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
      <h1 className="text-[28px] font-medium leading-9 text-[#1e2939]">Liste des occupants</h1>
      <p className="mt-1 text-sm text-[#6a7282]">
        Gérez vos locataires, voyageurs et prestataires de services.
      </p>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={() => setOnglet("residents")}
          className={cn(
            "inline-flex h-[39px] items-center gap-2 rounded-[10px] px-4 text-sm",
            onglet === "residents"
              ? "bg-[#1e2939] text-white"
              : "border border-[#e5e7eb] bg-white text-[#4a5565]",
          )}
        >
          <Users className="size-4" />
          Résidents (5)
        </button>
        <button
          type="button"
          onClick={() => setOnglet("prestataires")}
          className={cn(
            "inline-flex h-[39px] items-center gap-2 rounded-[10px] px-4 text-sm",
            onglet === "prestataires"
              ? "bg-[#1e2939] text-white"
              : "border border-[#e5e7eb] bg-white text-[#4a5565]",
          )}
        >
          <Wrench className="size-4" />
          Prestataires (5)
        </button>
      </div>

      <div className="mt-8 overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
        <div className="flex flex-wrap items-center gap-3 px-6 py-4">
          <label className="relative flex h-[39px] w-full max-w-[448px] items-center gap-2 rounded-[10px] border border-[#e5e7eb] px-3">
            <Search className="size-4 text-[#99a1af]" />
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder={
                onglet === "residents" ? "Rechercher un résident..." : "Rechercher un prestataire..."
              }
              className="h-full w-full bg-transparent text-sm text-[#1e2939] outline-none placeholder:text-[#99a1af]"
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
                    "h-[37px] rounded-[10px] px-3.5 text-sm",
                    filtre === id ? "bg-[#24292f] text-white" : "bg-[#f3f4f6] text-[#4a5565]",
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
              className="inline-flex h-[39px] items-center gap-2 rounded-[10px] border border-[#e5e7eb] px-4 text-sm text-[#4a5565]"
            >
              <Download className="size-4" />
              Exporter
            </button>
            <button
              type="button"
              className="inline-flex h-[39px] items-center gap-2 rounded-[10px] bg-[#1e2939] px-4 text-sm text-white"
            >
              <Plus className="size-4" />
              Ajouter
            </button>
          </div>
        </div>

        {onglet === "residents" ? (
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-y border-[#eaecf0] bg-[#f9fafb] text-xs font-medium uppercase tracking-[0.6px] text-[#667085]">
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
                <tr key={o.id} className="border-b border-[#f3f4f6] last:border-b-0">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-full bg-[#e5e7eb] text-sm text-[#4a5565]">
                        {o.initiales}
                      </span>
                      <span className="text-sm text-[#1e2939]">{o.nom}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <span
                      className={cn(
                        "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs text-white",
                        o.type === "Locataire" ? "bg-[#1e2939]" : "bg-[#4a5565]",
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
                  <td className="px-3 py-4 text-sm text-[#1e2939]">{o.logement}</td>
                  <td className="px-3 py-4 text-sm text-[#6a7282]">
                    <p className="flex items-center gap-1.5">
                      <Phone className="size-3" />
                      {o.telephone}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Mail className="size-3" />
                      {o.email}
                    </p>
                  </td>
                  <td className="px-3 py-4 text-sm text-[#6a7282]">
                    <p className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#22c55e]" />
                      Arrivée: {o.arrivee}
                    </p>
                    {o.depart && (
                      <p className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-[#ef4444]" />
                        Départ: {o.depart}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <span
                      className={cn(
                        "inline-flex h-7 items-center rounded-full px-3 text-xs text-white",
                        o.statut === "Actif" ? "bg-[#101828]" : "bg-[#364153]",
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
                      <IconeAction label="Modifier" className="text-[#f97316]">
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
              <tr className="border-y border-[#f3f4f6] text-sm text-[#6a7282]">
                <th className="px-6 py-3 font-normal">Nom</th>
                <th className="px-3 py-3 font-normal">Métier</th>
                <th className="px-3 py-3 font-normal">Contact</th>
                <th className="px-3 py-3 font-normal">Statut</th>
                <th className="px-6 py-3 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {prestataires.map((p) => (
                <tr key={p.id} className="border-b border-[#f3f4f6] last:border-b-0">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-full bg-[#e5e7eb] text-sm text-[#4a5565]">
                        {p.initiales}
                      </span>
                      <span className="text-sm text-[#1e2939]">{p.nom}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm text-[#4a5565]">{p.metier}</td>
                  <td className="px-3 py-4 text-sm text-[#6a7282]">
                    <p>{p.telephone}</p>
                    <p>{p.email}</p>
                  </td>
                  <td className="px-3 py-4">
                    <span className="inline-flex h-7 items-center rounded-full bg-[#1e2939] px-3 text-xs text-white">
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#1e2939]/40 p-4">
          <div className="w-full max-w-md rounded-[10px] border border-[#e5e7eb] bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[#1e2939]">{"nom" in fiche ? fiche.nom : ""}</p>
                <p className="mt-1 text-xs text-[#6a7282]">
                  {"type" in fiche ? `${fiche.type} · ${fiche.logement}` : fiche.metier}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFiche(null)}
                className="text-xs text-[#4a5565]"
              >
                Fermer
              </button>
            </div>
            <p className="mt-4 text-sm text-[#4a5565]">{fiche.telephone}</p>
            <p className="text-sm text-[#4a5565]">{fiche.email}</p>
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
        "flex size-10 items-center justify-center rounded-[10px] border border-[#e5e7eb] text-[#4a5565]",
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
    <div className="rounded-[10px] border border-[#e5e7eb] bg-white p-6">
      <div className="flex gap-4">
        <span className="flex size-12 items-center justify-center rounded-full bg-[#101828] text-white">
          <Icone className="size-5" />
        </span>
        <div>
          <p className="text-sm text-[#6a7282]">{titre}</p>
          <p className="mt-1 text-4xl text-[#1e2939]">{valeur}</p>
          <p className="mt-1 text-xs text-[#99a1af]">{detail}</p>
        </div>
      </div>
    </div>
  );
}
