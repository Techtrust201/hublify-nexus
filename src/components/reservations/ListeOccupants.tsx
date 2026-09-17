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
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ScrollHint } from "@/components/layout/ScrollHint";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  formatJourFr,
  isoJour,
  type OccupantMo1,
  type PrestataireMo1,
  type TypeOccupantMo1,
} from "@/data/reservations-mo1";
import {
  ajouterPrestataire,
  idNouveau,
  modifierPrestataire,
  poserCollection,
  retirerPrestataire,
  useSession,
} from "@/data/session";
import { copierTexte, confirmer, telechargerDemo, toastOk } from "@/lib/feedback";
import { cn } from "@/lib/utils";
import type { CategoriePrestataire, Prestataire } from "@/data/types";

type Onglet = "residents" | "prestataires";
type FiltreOccupant = "tous" | "Locataire" | "Voyageur";

function vuePresta(p: Prestataire): PrestataireMo1 {
  const parts = p.nom.split(/\s+/);
  const initiales = `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? parts[0]?.[1] ?? ""}`.toUpperCase();
  return {
    id: p.id,
    nom: p.nom,
    initiales: initiales || "??",
    metier: p.categorie,
    telephone: p.telephone,
    email: p.email,
    statut: p.actif ? "Actif" : "Inactif",
  };
}

function categorieDe(metier: string): CategoriePrestataire {
  const m = metier.toLowerCase();
  if (m.includes("ménage") || m.includes("menage")) return "Ménage";
  if (m.includes("blanch")) return "Blanchisserie";
  if (m.includes("jardin")) return "Jardinage";
  if (m.includes("accueil") || m.includes("check")) return "Accueil";
  return "Maintenance";
}

export function ListeOccupants() {
  const session = useSession();
  const [onglet, setOnglet] = useState<Onglet>("residents");
  const [filtre, setFiltre] = useState<FiltreOccupant>("tous");
  const [logementFiltre, setLogementFiltre] = useState("tous");
  const [recherche, setRecherche] = useState("");
  const [fiche, setFiche] = useState<OccupantMo1 | PrestataireMo1 | null>(null);
  const occupantsBase = session.occupants;
  const prestasBase = session.prestataires.map(vuePresta);
  const [formOuvert, setFormOuvert] = useState(false);
  const [editionOccupant, setEditionOccupant] = useState<OccupantMo1 | null>(null);
  const [editionPresta, setEditionPresta] = useState<PrestataireMo1 | null>(null);
  const [form, setForm] = useState({
    nom: "",
    type: "Voyageur" as TypeOccupantMo1,
    logement: "",
    telephone: "",
    email: "",
    metier: "",
  });

  const logementsOptions = useMemo(() => {
    const noms = new Set(session.biens.map((b) => b.nom));
    for (const o of occupantsBase) if (o.logement) noms.add(o.logement);
    return [...noms].sort();
  }, [session.biens, occupantsBase]);

  const occupants = useMemo(() => {
    return occupantsBase.filter((o) => {
      if (filtre !== "tous" && o.type !== filtre) return false;
      if (logementFiltre !== "tous" && o.logement !== logementFiltre) return false;
      const q = recherche.trim().toLowerCase();
      if (!q) return true;
      return o.nom.toLowerCase().includes(q) || o.logement.toLowerCase().includes(q);
    });
  }, [filtre, recherche, occupantsBase, logementFiltre]);

  const prestataires = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return prestasBase;
    return prestasBase.filter(
      (p) => p.nom.toLowerCase().includes(q) || p.metier.toLowerCase().includes(q),
    );
  }, [recherche, prestasBase]);

  const locataires = occupantsBase.filter((o) => o.type === "Locataire");
  const voyageurs = occupantsBase.filter((o) => o.type === "Voyageur");

  const majOccupants = (next: OccupantMo1[] | ((liste: OccupantMo1[]) => OccupantMo1[])) =>
    poserCollection("occupants", next);

  const retirerOccupant = async (id: string) => {
    const ok = await confirmer({
      titre: "Retirer cet occupant ?",
      description: "Il disparaît de l'annuaire. Ses réservations passées restent consultables.",
      libelleConfirmer: "Retirer",
      danger: true,
    });
    if (!ok) return;
    majOccupants((liste) => liste.filter((x) => x.id !== id));
    toastOk("Occupant retiré.");
  };

  const supprimerPrestataire = async (id: string) => {
    const ok = await confirmer({
      titre: "Retirer ce prestataire ?",
      description: "Il ne sera plus proposé à l'assignation des missions.",
      libelleConfirmer: "Retirer",
      danger: true,
    });
    if (!ok) return;
    retirerPrestataire(id);
    toastOk("Prestataire retiré.");
  };

  const ouvrirAjout = () => {
    setEditionOccupant(null);
    setEditionPresta(null);
    setForm({
      nom: "",
      type: "Voyageur",
      logement: "",
      telephone: "",
      email: "",
      metier: "",
    });
    setFormOuvert(true);
  };

  const ouvrirEditOccupant = (o: OccupantMo1) => {
    setEditionOccupant(o);
    setEditionPresta(null);
    setForm({
      nom: o.nom,
      type: o.type,
      logement: o.logement,
      telephone: o.telephone,
      email: o.email,
      metier: "",
    });
    setFormOuvert(true);
  };

  const ouvrirEditPresta = (p: PrestataireMo1) => {
    setEditionPresta(p);
    setEditionOccupant(null);
    setForm({
      nom: p.nom,
      type: "Voyageur",
      logement: "",
      telephone: p.telephone,
      email: p.email,
      metier: p.metier,
    });
    setFormOuvert(true);
  };

  const enregistrerForm = () => {
    const nom = form.nom.trim();
    if (!nom) return;
    const initiales = nom
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
    if (onglet === "residents" || editionOccupant) {
      const ligne: OccupantMo1 = {
        id: editionOccupant?.id ?? idNouveau("occ"),
        nom,
        initiales: initiales || "??",
        type: form.type,
        logement: form.logement.trim() || "—",
        telephone: form.telephone.trim() || "—",
        email: form.email.trim() || `${nom.toLowerCase().replace(/\s+/g, ".")}@email.fr`,
        arrivee: editionOccupant?.arrivee ?? isoJour(new Date()),
        statut: "Actif",
      };
      majOccupants((liste) =>
        editionOccupant
          ? liste.map((o) => (o.id === editionOccupant.id ? ligne : o))
          : [ligne, ...liste],
      );
      toastOk(editionOccupant ? "Occupant mis à jour." : "Occupant ajouté.");
    } else {
      const payload = {
        nom,
        categorie: categorieDe(form.metier.trim() || "Maintenance"),
        telephone: form.telephone.trim() || "—",
        email: form.email.trim() || `${nom.toLowerCase().replace(/\s+/g, ".")}@email.fr`,
        ville: "",
        actif: true,
        note: 0,
      };
      if (editionPresta) {
        modifierPrestataire(editionPresta.id, payload);
        toastOk("Prestataire mis à jour.");
      } else {
        ajouterPrestataire(payload);
        toastOk("Prestataire ajouté.");
      }
    }
    setFormOuvert(false);
    setFiche(null);
  };

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
            "inline-flex h-11 items-center gap-2 rounded-card px-4 text-sm",
            onglet === "residents"
              ? "bg-ink text-white"
              : "border border-line bg-white text-ink-body",
          )}
        >
          <Users className="size-4" />
          Résidents ({occupantsBase.length})
        </button>
        <button
          type="button"
          onClick={() => setOnglet("prestataires")}
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-card px-4 text-sm",
            onglet === "prestataires"
              ? "bg-ink text-white"
              : "border border-line bg-white text-ink-body",
          )}
        >
          <Wrench className="size-4" />
          Prestataires ({prestasBase.length})
        </button>
      </div>

      <div className="mt-8 rounded-card border border-line bg-white">
        <div className="flex flex-wrap items-center gap-3 px-4 py-4 md:px-6">
          <label className="relative flex h-11 w-full max-w-[448px] items-center gap-2 rounded-card border border-line px-3">
            <Search className="size-4 text-ink-muted" />
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder={
                onglet === "residents"
                  ? "Rechercher un résident..."
                  : "Rechercher un prestataire..."
              }
              className="h-full w-full bg-transparent text-base text-ink outline-none placeholder:text-ink-muted md:text-sm"
            />
          </label>
          {onglet === "residents" && (
            <div className="flex flex-wrap gap-2">
              <select
                value={logementFiltre}
                onChange={(e) => setLogementFiltre(e.target.value)}
                className="h-11 rounded-card border border-line bg-white px-3 text-sm text-ink outline-none md:h-9"
                aria-label="Filtrer par logement"
              >
                <option value="tous">Tous les logements</option>
                {logementsOptions.map((nom) => (
                  <option key={nom} value={nom}>
                    {nom}
                  </option>
                ))}
              </select>
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
                    "h-11 rounded-card px-3.5 text-sm",
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
              onClick={() => {
                if (onglet === "residents") {
                  const lignes = [
                    "Nom;Type;Logement;Telephone;Email;Statut",
                    ...occupants.map(
                      (o) =>
                        `${o.nom};${o.type};${o.logement};${o.telephone};${o.email};${o.statut}`,
                    ),
                  ];
                  telechargerDemo("occupants-hublify.csv", lignes.join("\n"));
                } else {
                  const lignes = [
                    "Nom;Metier;Telephone;Email;Statut",
                    ...prestataires.map(
                      (p) => `${p.nom};${p.metier};${p.telephone};${p.email};${p.statut}`,
                    ),
                  ];
                  telechargerDemo("prestataires-occupants-hublify.csv", lignes.join("\n"));
                }
              }}
              className="inline-flex h-11 items-center gap-2 rounded-card border border-line px-4 text-sm text-ink-body"
            >
              <Download className="size-4" />
              Exporter
            </button>
            <button
              type="button"
              onClick={ouvrirAjout}
              className="inline-flex h-11 items-center gap-2 rounded-card bg-ink px-4 text-sm text-white"
            >
              <Plus className="size-4" />
              Ajouter
            </button>
          </div>
        </div>

        {onglet === "residents" ? (
          <>
            <div className="divide-y divide-surface-soft md:hidden">
              {occupants.map((o) => (
                <article
                  key={o.id}
                  className="flex cursor-pointer flex-col gap-3 px-4 py-4"
                  onClick={() => setFiche(o)}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-line text-sm text-ink-body">
                      {o.initiales}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{o.nom}</p>
                      <p className="text-xs text-ink-muted">{o.logement}</p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex h-7 items-center rounded-full px-3 text-xs text-white",
                        o.statut === "Actif" ? "bg-ink-deep" : "bg-ink-status",
                      )}
                    >
                      {o.statut}
                    </span>
                  </div>
                  <p className="text-sm text-ink-subtle">
                    {o.telephone} · {o.email}
                  </p>
                  <p className="text-xs text-ink-muted">
                    Arrivée {formatJourFr(o.arrivee)}
                    {o.depart ? ` · Départ ${formatJourFr(o.depart)}` : ""}
                  </p>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <IconeAction label="Voir" onClick={() => setFiche(o)}>
                      <Eye className="size-4" />
                    </IconeAction>
                    <IconeAction
                      label="Modifier"
                      className="text-dot-edit"
                      onClick={() => ouvrirEditOccupant(o)}
                    >
                      <Pencil className="size-4" />
                    </IconeAction>
                    <IconeAction label="Supprimer" onClick={() => void retirerOccupant(o.id)}>
                      <Trash2 className="size-4" />
                    </IconeAction>
                  </div>
                </article>
              ))}
            </div>
            <ScrollHint className="hidden md:block">
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
                    <tr
                      key={o.id}
                      className="cursor-pointer border-b border-surface-soft last:border-b-0"
                      onClick={() => setFiche(o)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 items-center justify-center rounded-full bg-line text-sm text-ink-body">
                            {o.initiales}
                          </span>
                          <button
                            type="button"
                            onClick={() => setFiche(o)}
                            className="text-left text-sm text-ink hover:underline"
                          >
                            {o.nom}
                          </button>
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
                          Arrivée: {formatJourFr(o.arrivee)}
                        </p>
                        {o.depart && (
                          <p className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-dot-depart" />
                            Départ: {formatJourFr(o.depart)}
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
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <IconeAction label="Voir" onClick={() => setFiche(o)}>
                            <Eye className="size-4" />
                          </IconeAction>
                          <IconeAction
                            label="Modifier"
                            className="text-dot-edit"
                            onClick={() => ouvrirEditOccupant(o)}
                          >
                            <Pencil className="size-4" />
                          </IconeAction>
                          <IconeAction label="Supprimer" onClick={() => void retirerOccupant(o.id)}>
                            <Trash2 className="size-4" />
                          </IconeAction>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollHint>
          </>
        ) : (
          <>
            <div className="divide-y divide-surface-soft md:hidden">
              {prestataires.map((p) => (
                <article key={p.id} className="flex flex-col gap-3 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-line text-sm text-ink-body">
                      {p.initiales}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{p.nom}</p>
                      <p className="text-xs text-ink-muted">{p.metier}</p>
                    </div>
                    <span className="inline-flex h-7 items-center rounded-full bg-ink px-3 text-xs text-white">
                      {p.statut}
                    </span>
                  </div>
                  <p className="text-sm text-ink-subtle">
                    {p.telephone} · {p.email}
                  </p>
                  <div className="flex gap-2">
                    <IconeAction label="Voir" onClick={() => setFiche(p)}>
                      <Eye className="size-4" />
                    </IconeAction>
                    <IconeAction label="Modifier" onClick={() => ouvrirEditPresta(p)}>
                      <Pencil className="size-4" />
                    </IconeAction>
                    <IconeAction label="Supprimer" onClick={() => void supprimerPrestataire(p.id)}>
                      <Trash2 className="size-4" />
                    </IconeAction>
                  </div>
                </article>
              ))}
            </div>
            <ScrollHint className="hidden md:block">
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
                          <IconeAction label="Modifier" onClick={() => ouvrirEditPresta(p)}>
                            <Pencil className="size-4" />
                          </IconeAction>
                          <IconeAction
                            label="Supprimer"
                            onClick={() => void supprimerPrestataire(p.id)}
                          >
                            <Trash2 className="size-4" />
                          </IconeAction>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollHint>
          </>
        )}
      </div>

      {onglet === "residents" && (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <CarteResume
            icone={Users}
            titre="Total locataires actifs"
            valeur={String(locataires.filter((o) => o.statut === "Actif").length)}
            detail={`${locataires.length} locataires · ${voyageurs.length} voyageurs`}
          />
          <CarteResume
            icone={KeyRound}
            titre="Total à venir"
            valeur={String(occupantsBase.filter((o) => o.statut === "À venir").length)}
            detail="Arrivées prochaines"
          />
          <CarteResume
            icone={Check}
            titre="Total voyageurs actifs"
            valeur={String(voyageurs.filter((o) => o.statut === "Actif").length)}
            detail="Séjours en cours"
          />
        </div>
      )}

      {fiche && (
        <Dialog
          open
          onOpenChange={(ouvert) => {
            if (!ouvert) setFiche(null);
          }}
        >
          <DialogContent className="max-w-md gap-0 rounded-card border-line p-5 sm:rounded-card">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-sm font-medium text-ink">
                  {"nom" in fiche ? fiche.nom : ""}
                </DialogTitle>
                <p className="mt-1 text-xs text-ink-subtle">
                  {"type" in fiche ? `${fiche.type} · ${fiche.logement}` : fiche.metier}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFiche(null)}
                className="flex h-11 items-center px-2 text-sm text-ink-body"
              >
                Fermer
              </button>
            </div>
            <p className="mt-4 text-sm text-ink-body">
              <a href={`tel:${fiche.telephone.replace(/\s+/g, "")}`} className="text-accent-teal">
                {fiche.telephone}
              </a>
            </p>
            <p className="text-sm text-ink-body">
              <a href={`mailto:${fiche.email}`} className="text-accent-teal">
                {fiche.email}
              </a>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copierTexte(fiche.email, "E-mail copié.")}
                className="h-9 rounded-card border border-line px-3 text-xs text-ink-body"
              >
                Copier l'e-mail
              </button>
              {"type" in fiche && fiche.type === "Locataire" && (
                <Link
                  to="/dossiers/$occupantId"
                  params={{ occupantId: fiche.id }}
                  onClick={() => setFiche(null)}
                  className="inline-flex h-9 items-center rounded-card border border-line px-3 text-xs text-ink-body"
                >
                  Dossier locataire
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  if ("type" in fiche) {
                    const occ = fiche;
                    setFiche(null);
                    ouvrirEditOccupant(occ);
                  } else {
                    const pre = fiche;
                    setFiche(null);
                    ouvrirEditPresta(pre);
                  }
                }}
                className="h-9 rounded-card bg-ink px-3 text-xs text-white"
              >
                Modifier
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog
        open={formOuvert}
        onOpenChange={(o) => {
          if (!o) {
            setFormOuvert(false);
            setEditionOccupant(null);
            setEditionPresta(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogTitle>
            {editionOccupant || editionPresta
              ? "Modifier"
              : onglet === "residents"
                ? "Ajouter un occupant"
                : "Ajouter un prestataire"}
          </DialogTitle>
          <DialogDescription>Les informations apparaissent dans la liste.</DialogDescription>
          <label className="mt-3 block text-xs text-ink-muted">
            Nom
            <input
              value={form.nom}
              onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
              className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
            />
          </label>
          {onglet === "residents" || editionOccupant ? (
            <>
              <label className="mt-3 block text-xs text-ink-muted">
                Type
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value as TypeOccupantMo1 }))
                  }
                  className="mt-1 h-9 w-full rounded-card border border-line bg-white px-3 text-sm text-ink"
                >
                  <option>Locataire</option>
                  <option>Voyageur</option>
                </select>
              </label>
              <label className="mt-3 block text-xs text-ink-muted">
                Logement
                <input
                  value={form.logement}
                  onChange={(e) => setForm((f) => ({ ...f, logement: e.target.value }))}
                  className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
                />
              </label>
            </>
          ) : (
            <label className="mt-3 block text-xs text-ink-muted">
              Métier
              <input
                value={form.metier}
                onChange={(e) => setForm((f) => ({ ...f, metier: e.target.value }))}
                className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
              />
            </label>
          )}
          <label className="mt-3 block text-xs text-ink-muted">
            Téléphone
            <input
              value={form.telephone}
              onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
              className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
            />
          </label>
          <label className="mt-3 block text-xs text-ink-muted">
            E-mail
            <input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
            />
          </label>
          <button
            type="button"
            onClick={enregistrerForm}
            className="mt-4 h-10 w-full rounded-card bg-ink text-sm font-medium text-white"
          >
            Enregistrer
          </button>
        </DialogContent>
      </Dialog>
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
        "flex size-11 items-center justify-center rounded-card border border-line text-ink-body",
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
