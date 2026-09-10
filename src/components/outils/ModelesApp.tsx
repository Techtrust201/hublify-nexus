import {
  Copy,
  Download,
  Eye,
  FileText,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BadgeType, BtnNavy, BtnOutline, Champ, Chip } from "@/components/documents/ui";
import { ScrollHint } from "@/components/layout/ScrollHint";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type ModeleDoc } from "@/data/documents-mo1";
import { idNouveau, poserCollection, useSession } from "@/data/session";
import { confirmer, telechargerDemo, telechargerPdf, toastOk } from "@/lib/feedback";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Tous", "Général", "Locataires", "Voyageurs", "Prestataires", "Propriétaires"];
const TYPES = [
  "Facture",
  "Devis",
  "Quittance",
  "Bail",
  "Contrat",
  "Avis échéance",
  "Attestation",
  "État des lieux",
  "Autre",
];

function contenuModele(m: ModeleDoc) {
  return [
    `Modèle Hublify — ${m.designation}`,
    `Type : ${m.type}`,
    `Catégorie : ${m.categorie}`,
    `Référence : ${m.reference}`,
    `Dernière utilisation : ${m.derniere}`,
    `Utilisations : ${m.utilisations}`,
    "",
    "Corps du modèle (à personnaliser à chaque génération).",
  ].join("\n");
}

export function ModelesApp() {
  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState("Tous");
  const [cartes, setCartes] = useState(false);
  const [filtres, setFiltres] = useState(false);
  const [formOuvert, setFormOuvert] = useState(false);
  const [edition, setEdition] = useState<ModeleDoc | null>(null);
  const [apercu, setApercu] = useState<ModeleDoc | null>(null);
  const [selection, setSelection] = useState<string[]>([]);
  const modeles = useSession().modeles;
  const setModeles = (maj: (liste: ModeleDoc[]) => ModeleDoc[]) => poserCollection("modeles", maj);

  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) setCartes(true);
  }, []);

  const list = useMemo(() => {
    let rows = modeles;
    if (categorie !== "Tous") rows = rows.filter((m) => m.categorie === categorie);
    const q = recherche.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (m) =>
          m.designation.toLowerCase().includes(q) ||
          m.reference.toLowerCase().includes(q) ||
          m.type.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [modeles, categorie, recherche]);

  const favoris = modeles.filter((m) => m.favori);

  const ouvrirCreation = () => {
    setEdition(null);
    setFormOuvert(true);
  };

  const ouvrirEdition = (m: ModeleDoc) => {
    setEdition(m);
    setFormOuvert(true);
    setApercu(null);
  };

  const telecharger = (m: ModeleDoc) => {
    const lignes = contenuModele(m).split("\n");
    void telechargerPdf(m.designation, lignes, {
      identifiant: m.reference,
      extra: [`Type : Modèle`, ...lignes],
    });
  };

  const dupliquer = (m: ModeleDoc) => {
    const copie: ModeleDoc = {
      ...m,
      id: idNouveau("m"),
      designation: `${m.designation} (copie)`,
      reference: `INV-${Math.floor(1030 + Math.random() * 90)}`,
      utilisations: 0,
      derniere: "—",
      favori: false,
    };
    setModeles((prev) => [copie, ...prev]);
    toastOk("Modèle dupliqué.");
    setApercu(copie);
  };

  const supprimerIds = async (ids: string[]) => {
    if (ids.length === 0) return;
    const ok = await confirmer({
      titre: ids.length > 1 ? `Retirer ${ids.length} modèles ?` : "Retirer ce modèle ?",
      description: "Le modèle ne sera plus proposé à la génération de documents.",
      libelleConfirmer: "Retirer",
      danger: true,
    });
    if (!ok) return;
    setModeles((prev) => prev.filter((m) => !ids.includes(m.id)));
    setSelection((s) => s.filter((id) => !ids.includes(id)));
    setApercu((a) => (a && ids.includes(a.id) ? null : a));
    toastOk(ids.length > 1 ? `${ids.length} modèles retirés.` : "Modèle retiré.");
  };

  const basculerFavori = (m: ModeleDoc) => {
    setModeles((prev) => prev.map((x) => (x.id === m.id ? { ...x, favori: !x.favori } : x)));
    setApercu((a) => (a && a.id === m.id ? { ...a, favori: !a.favori } : a));
    toastOk(m.favori ? "Retiré des favoris." : "Ajouté aux favoris.");
  };

  const enregistrerModele = (m: ModeleDoc) => {
    setModeles((prev) => {
      const i = prev.findIndex((x) => x.id === m.id);
      if (i >= 0) return prev.map((x) => (x.id === m.id ? m : x));
      return [m, ...prev];
    });
    toastOk(edition ? "Modèle mis à jour." : "Modèle créé.");
  };

  const toggleSel = (id: string) =>
    setSelection((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const uniqueSelection =
    selection.length === 1 ? modeles.find((m) => m.id === selection[0]) : undefined;

  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="text-2xl text-ink">Modèles de documents</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-ink-subtle">
          Créez et gérez vos modèles de factures, devis, quittances et contrats réutilisables.
        </p>
        <BtnNavy className="mt-4 h-12 px-6 text-sm" onClick={ouvrirCreation}>
          <Plus className="size-4" /> Créer un nouveau document
        </BtnNavy>
      </div>

      <div className="mx-auto max-w-5xl space-y-6">
        <label className="flex h-[46px] items-center gap-3 rounded-card border border-line bg-white px-4">
          <Search className="size-4 text-ink-muted" />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un modèle ou un document…"
            className="h-full w-full bg-transparent text-sm outline-none placeholder:text-ink-muted"
          />
        </label>

        <section>
          <p className="mb-2 flex items-center gap-2 text-sm text-ink">
            <Star className="size-3.5 fill-ink text-ink" />
            Favoris
            <span className="rounded bg-surface-soft px-1.5 text-xs text-ink-subtle">
              {favoris.length}
            </span>
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {favoris.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 rounded-card border border-line bg-white pr-2"
              >
                <button
                  type="button"
                  onClick={() => setApercu(m)}
                  className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-surface-soft">
                    <FileText className="size-3.5 text-ink-body" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs text-ink">{m.designation}</span>
                    <span className="block text-[10px] text-ink-muted">
                      {m.type} · {m.reference}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => basculerFavori(m)}
                  aria-label={`Retirer ${m.designation} des favoris`}
                  className="flex size-11 shrink-0 items-center justify-center rounded-card text-ink-body md:size-8"
                >
                  <Star className="size-3.5 fill-ink text-ink" />
                </button>
              </div>
            ))}
            {favoris.length === 0 && (
              <p className="text-xs text-ink-muted">
                Marquez un modèle d'une étoile pour le retrouver ici.
              </p>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-card border border-line bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-soft px-4 py-3">
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map((c) => (
                <Chip key={c} actif={categorie === c} onClick={() => setCategorie(c)}>
                  {c}
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <BtnOutline onClick={() => setFiltres(true)}>
                <SlidersHorizontal className="size-3" /> Filtres
              </BtnOutline>
              <BtnOutline onClick={ouvrirCreation}>
                <Plus className="size-3" /> Ajouter
              </BtnOutline>
              <BtnOutline
                disabled={!uniqueSelection}
                onClick={() => uniqueSelection && ouvrirEdition(uniqueSelection)}
              >
                <Pencil className="size-3" /> Modifier
              </BtnOutline>
              <BtnOutline disabled={selection.length === 0} onClick={() => supprimerIds(selection)}>
                <Trash2 className="size-3" /> Supprimer
              </BtnOutline>
              <BtnOutline
                onClick={() => {
                  const source = selection.length
                    ? modeles.filter((m) => selection.includes(m.id))
                    : list;
                  const lignes = [
                    "Designation;Type;Categorie;Reference;Utilisations",
                    ...source.map(
                      (m) =>
                        `${m.designation};${m.type};${m.categorie};${m.reference};${m.utilisations}`,
                    ),
                  ];
                  telechargerDemo("modeles-hublify.csv", lignes.join("\n"));
                }}
              >
                <Download className="size-3" /> Télécharger modèle
              </BtnOutline>
              <button
                type="button"
                onClick={() => setCartes((v) => !v)}
                className="flex size-11 shrink-0 items-center justify-center rounded-card border border-line text-ink-body md:size-8"
                aria-label={cartes ? "Vue liste" : "Vue cartes"}
              >
                {cartes ? <List className="size-3.5" /> : <LayoutGrid className="size-3.5" />}
              </button>
            </div>
          </div>

          {cartes ? (
            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((m) => (
                <article
                  key={m.id}
                  className={cn(
                    "rounded-card border bg-white p-4",
                    selection.includes(m.id) ? "border-ink" : "border-line",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span className="flex size-8 items-center justify-center rounded-[8px] bg-surface-soft">
                      <FileText className="size-3.5 text-ink-body" />
                    </span>
                    <label className="-my-1 flex min-h-11 min-w-11 items-center justify-end md:my-0 md:min-h-0 md:min-w-0">
                      <input
                        type="checkbox"
                        checked={selection.includes(m.id)}
                        onChange={() => toggleSel(m.id)}
                        aria-label={`Sélectionner ${m.designation}`}
                      />
                    </label>
                  </div>
                  <p className="mt-3 text-sm text-ink">{m.designation}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {m.type} · {m.categorie}
                  </p>
                  <p className="mt-1 text-xs text-ink-subtle">
                    {m.derniere} · {m.utilisations} utilisations
                  </p>
                  <ActionsModele
                    modele={m}
                    onApercu={() => setApercu(m)}
                    onFavori={() => basculerFavori(m)}
                    onTelecharger={() => telecharger(m)}
                    onDupliquer={() => dupliquer(m)}
                    onSupprimer={() => supprimerIds([m.id])}
                  />
                </article>
              ))}
              {list.length === 0 && (
                <p className="py-10 text-center text-sm text-ink-muted sm:col-span-2 lg:col-span-3">
                  Aucun modèle pour cette recherche.
                </p>
              )}
            </div>
          ) : (
            <ScrollHint>
              <table className="w-full min-w-[800px] text-left text-xs">
                <thead className="border-b border-surface-soft text-ink-subtle">
                  <tr>
                    <th className="w-12 px-4 py-4" />
                    <th className="px-2 py-4 font-medium">Désignation</th>
                    <th className="px-2 py-4 font-medium">Type</th>
                    <th className="px-2 py-4 font-medium">Catégorie</th>
                    <th className="px-2 py-4 font-medium">Dernière utilisation</th>
                    <th className="px-2 py-4 text-center font-medium">Utilisations</th>
                    <th className="px-2 py-4 font-medium">Référence</th>
                    <th className="px-2 py-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((m) => (
                    <tr key={m.id} className="border-b border-surface-soft last:border-b-0">
                      <td className="px-4 py-3">
                        <label className="flex min-h-11 items-center md:min-h-0">
                          <input
                            type="checkbox"
                            checked={selection.includes(m.id)}
                            onChange={() => toggleSel(m.id)}
                            aria-label={`Sélectionner ${m.designation}`}
                          />
                        </label>
                      </td>
                      <td className="px-2 py-3">
                        <button
                          type="button"
                          onClick={() => setApercu(m)}
                          className="inline-flex min-h-11 items-center gap-2 text-sm text-ink md:min-h-0"
                        >
                          <span className="flex size-7 items-center justify-center rounded-[8px] bg-surface-soft">
                            <FileText className="size-3.5 text-ink-body" />
                          </span>
                          {m.designation}
                        </button>
                      </td>
                      <td className="px-2 py-3">
                        <BadgeType>{m.type}</BadgeType>
                      </td>
                      <td className="px-2 py-3 text-ink-body">{m.categorie}</td>
                      <td className="px-2 py-3 text-ink-body">{m.derniere}</td>
                      <td className="px-2 py-3 text-center text-ink-body">{m.utilisations}</td>
                      <td className="px-2 py-3 text-ink-body">{m.reference}</td>
                      <td className="px-2 py-3">
                        <ActionsModele
                          modele={m}
                          compact
                          onApercu={() => setApercu(m)}
                          onFavori={() => basculerFavori(m)}
                          onTelecharger={() => telecharger(m)}
                          onDupliquer={() => dupliquer(m)}
                          onSupprimer={() => supprimerIds([m.id])}
                        />
                      </td>
                    </tr>
                  ))}
                  {list.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-ink-muted">
                        Aucun modèle pour cette recherche.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </ScrollHint>
          )}
        </section>
      </div>

      <CreateModeleDialog
        ouvert={formOuvert}
        edition={edition}
        onClose={() => {
          setFormOuvert(false);
          setEdition(null);
        }}
        onEnregistrer={enregistrerModele}
      />
      <PreviewModeleDialog
        modele={apercu}
        onClose={() => setApercu(null)}
        onTelecharger={() => apercu && telecharger(apercu)}
        onDupliquer={() => apercu && dupliquer(apercu)}
      />
      <Dialog open={filtres} onOpenChange={(o) => !o && setFiltres(false)}>
        <DialogContent className="max-w-sm rounded-card">
          <DialogHeader>
            <DialogTitle className="text-base">Filtres</DialogTitle>
            <DialogDescription>Affiner la liste des modèles</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <Chip
                key={c}
                actif={categorie === c}
                onClick={() => {
                  setCategorie(c);
                  setFiltres(false);
                }}
              >
                {c}
              </Chip>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ActionsModele({
  modele,
  compact,
  onApercu,
  onFavori,
  onTelecharger,
  onDupliquer,
  onSupprimer,
}: {
  modele: ModeleDoc;
  compact?: boolean;
  onApercu: () => void;
  onFavori: () => void;
  onTelecharger: () => void;
  onDupliquer: () => void;
  onSupprimer: () => void;
}) {
  return (
    <div className={cn("flex gap-1", compact ? "justify-end" : "mt-3")}>
      <BoutonIcone
        label={`Aperçu ${modele.designation}`}
        onClick={onApercu}
        compact={Boolean(compact)}
      >
        <Eye className="size-3.5 text-ink-body" />
      </BoutonIcone>
      <BoutonIcone
        label={
          modele.favori
            ? `Retirer ${modele.designation} des favoris`
            : `Ajouter ${modele.designation} aux favoris`
        }
        onClick={onFavori}
        compact={Boolean(compact)}
      >
        <Star className={cn("size-3.5", modele.favori ? "fill-ink text-ink" : "text-ink-body")} />
      </BoutonIcone>
      <BoutonIcone
        label={`Télécharger ${modele.designation}`}
        onClick={onTelecharger}
        compact={Boolean(compact)}
      >
        <Download className="size-3.5 text-ink-body" />
      </BoutonIcone>
      <BoutonIcone
        label={`Dupliquer ${modele.designation}`}
        onClick={onDupliquer}
        compact={Boolean(compact)}
      >
        <Copy className="size-3.5 text-ink-body" />
      </BoutonIcone>
      <BoutonIcone
        label={`Supprimer ${modele.designation}`}
        onClick={onSupprimer}
        compact={Boolean(compact)}
      >
        <Trash2 className="size-3.5 text-ink-body" />
      </BoutonIcone>
    </div>
  );
}

function BoutonIcone({
  label,
  onClick,
  compact,
  children,
}: {
  label: string;
  onClick: () => void;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={
        compact
          ? "-my-3 flex size-11 shrink-0 items-center justify-center rounded-card hover:bg-surface-soft md:my-0 md:size-8"
          : "flex size-11 items-center justify-center rounded-card border border-line md:size-8"
      }
    >
      {children}
    </button>
  );
}

function CreateModeleDialog({
  ouvert,
  edition,
  onClose,
  onEnregistrer,
}: {
  ouvert: boolean;
  edition: ModeleDoc | null;
  onClose: () => void;
  onEnregistrer: (m: ModeleDoc) => void;
}) {
  const [nom, setNom] = useState("");
  const [type, setType] = useState("Quittance");
  const [categorie, setCategorie] = useState("Général");

  useEffect(() => {
    if (!ouvert) return;
    if (edition) {
      setNom(edition.designation);
      setType(edition.type);
      setCategorie(edition.categorie);
    } else {
      setNom("");
      setType("Quittance");
      setCategorie("Général");
    }
  }, [ouvert, edition]);

  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[480px] rounded-card border-line p-0">
        <DialogHeader className="border-b border-surface-soft px-6 py-5">
          <DialogTitle className="text-base font-medium text-ink">
            {edition ? "Modifier le modèle" : "Créer un nouveau modèle"}
          </DialogTitle>
          <DialogDescription className="text-xs text-ink-muted">
            Ce modèle sera archivé et disponible depuis la bibliothèque.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-6 py-4">
          <Champ
            label="Nom du modèle *"
            value={nom}
            onChange={setNom}
            placeholder="Ex : Modèle de quittance mensuelle"
          />
          <div>
            <p className="mb-2 text-xs text-ink-subtle">Type de document</p>
            <div className="flex flex-wrap gap-1.5">
              {TYPES.map((t) => (
                <Chip key={t} actif={type === t} onClick={() => setType(t)}>
                  {t}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs text-ink-subtle">Catégorie</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.filter((c) => c !== "Tous").map((c) => (
                <Chip key={c} actif={categorie === c} onClick={() => setCategorie(c)}>
                  {c}
                </Chip>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-surface-soft px-6 py-4">
          <BtnOutline onClick={onClose}>Annuler</BtnOutline>
          <BtnNavy
            onClick={() => {
              if (!nom.trim()) return;
              onEnregistrer({
                id: edition?.id ?? idNouveau("m"),
                designation: nom.trim(),
                type,
                categorie,
                derniere: edition?.derniere ?? "—",
                utilisations: edition?.utilisations ?? 0,
                reference: edition?.reference ?? `INV-${Math.floor(1030 + Math.random() * 50)}`,
                ...(edition?.favori ? { favori: true } : {}),
              });
              onClose();
            }}
          >
            {edition ? "Enregistrer" : "Créer le modèle"}
          </BtnNavy>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PreviewModeleDialog({
  modele,
  onClose,
  onTelecharger,
  onDupliquer,
}: {
  modele: ModeleDoc | null;
  onClose: () => void;
  onTelecharger: () => void;
  onDupliquer: () => void;
}) {
  return (
    <Dialog open={modele !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[620px] gap-0 overflow-hidden rounded-2xl border-line p-0">
        <DialogHeader className="border-b border-surface-soft px-6 py-4">
          <DialogTitle className="text-base font-normal text-ink-deep">
            {modele?.designation}
          </DialogTitle>
          <DialogDescription className="text-xs text-ink-muted">
            {modele?.reference} · {modele?.type} · {modele?.categorie}
          </DialogDescription>
        </DialogHeader>
        <div className="bg-surface px-6 py-6">
          <div className="flex flex-col gap-5 rounded-[14px] border border-line bg-white px-8 py-8">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-ink">{modele?.designation}</p>
                <p className="text-xs text-ink-muted">{modele?.type}</p>
                <p className="text-xs text-ink-subtle">{modele?.categorie}</p>
              </div>
              <p className="text-sm font-medium text-ink">{modele?.reference}</p>
            </div>
            <p className="text-xs leading-5 text-ink-body">
              Document type prêt à personnaliser. Téléchargez-le ou dupliquez-le pour une variante.
            </p>
            <div className="overflow-hidden rounded-card border border-line text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-soft px-4 py-2 font-medium text-ink-subtle sm:grid-cols-4">
                <span>Désignation</span>
                <span className="hidden sm:inline">Type</span>
                <span className="hidden sm:inline">Catégorie</span>
                <span>Réf.</span>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-surface-soft px-4 py-2 text-ink-body sm:grid-cols-4">
                <span>{modele?.designation}</span>
                <span className="hidden sm:inline">{modele?.type}</span>
                <span className="hidden sm:inline">{modele?.categorie}</span>
                <span>{modele?.reference}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-surface-soft px-6 py-4">
          <div className="flex gap-2">
            <BtnOutline onClick={onTelecharger}>
              <Download className="size-3" /> Télécharger
            </BtnOutline>
            <BtnOutline onClick={onDupliquer}>
              <Copy className="size-3" /> Dupliquer
            </BtnOutline>
          </div>
          <BtnNavy onClick={onClose}>Fermer</BtnNavy>
        </div>
      </DialogContent>
    </Dialog>
  );
}
