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
import { useMemo, useState } from "react";
import { BadgeType, BtnNavy, BtnOutline, Champ, Chip } from "@/components/documents/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MODELES_DOCS, type ModeleDoc } from "@/data/documents-mo1";
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

export function ModelesApp() {
  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState("Tous");
  const [cartes, setCartes] = useState(false);
  const [filtres, setFiltres] = useState(false);
  const [creer, setCreer] = useState(false);
  const [apercu, setApercu] = useState<ModeleDoc | null>(null);
  const [selection, setSelection] = useState<string[]>([]);
  const [modeles, setModeles] = useState(MODELES_DOCS);

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

  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="text-2xl text-[#1e2939]">Modèles de documents</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-[#6a7282]">
          Créez et gérez vos modèles de factures, devis, quittances et contrats réutilisables.
        </p>
        <BtnNavy className="mt-4 h-12 px-6 text-sm" onClick={() => setCreer(true)}>
          <Plus className="size-4" /> Créer un nouveau document
        </BtnNavy>
      </div>

      <div className="mx-auto max-w-5xl space-y-6">
        <label className="flex h-[46px] items-center gap-3 rounded-[10px] border border-[#e5e7eb] bg-white px-4">
          <Search className="size-4 text-[#99a1af]" />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un modèle ou un document…"
            className="h-full w-full bg-transparent text-sm outline-none placeholder:text-[#99a1af]"
          />
        </label>

        <section>
          <p className="mb-2 flex items-center gap-2 text-sm text-[#1e2939]">
            <Star className="size-3.5 fill-[#1e2939] text-[#1e2939]" />
            Favoris
            <span className="rounded bg-[#f3f4f6] px-1.5 text-xs text-[#6a7282]">{favoris.length}</span>
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {favoris.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setApercu(m)}
                className="flex items-center gap-3 rounded-[10px] border border-[#e5e7eb] bg-white px-4 py-3 text-left"
              >
                <span className="flex size-8 items-center justify-center rounded-[8px] bg-[#f3f4f6]">
                  <FileText className="size-3.5 text-[#4a5565]" />
                </span>
                <span>
                  <span className="block text-xs text-[#1e2939]">{m.designation}</span>
                  <span className="block text-[10px] text-[#99a1af]">
                    {m.type} · {m.reference}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f3f4f6] px-4 py-3">
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
              <BtnOutline onClick={() => setCreer(true)}>
                <Plus className="size-3" /> Ajouter
              </BtnOutline>
              <BtnOutline disabled={selection.length === 0}>
                <Pencil className="size-3" /> Modifier
              </BtnOutline>
              <BtnOutline disabled={selection.length === 0}>
                <Trash2 className="size-3" /> Supprimer
              </BtnOutline>
              <BtnOutline>
                <Download className="size-3" /> Télécharger modèle
              </BtnOutline>
              <button
                type="button"
                onClick={() => setCartes((v) => !v)}
                className="flex size-8 items-center justify-center rounded-[10px] border border-[#e5e7eb] text-[#4a5565]"
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
                    "rounded-[10px] border bg-white p-4",
                    selection.includes(m.id) ? "border-[#1e2939]" : "border-[#e5e7eb]",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span className="flex size-8 items-center justify-center rounded-[8px] bg-[#f3f4f6]">
                      <FileText className="size-3.5 text-[#4a5565]" />
                    </span>
                    <input
                      type="checkbox"
                      checked={selection.includes(m.id)}
                      onChange={() =>
                        setSelection((s) =>
                          s.includes(m.id) ? s.filter((x) => x !== m.id) : [...s, m.id],
                        )
                      }
                    />
                  </div>
                  <p className="mt-3 text-sm text-[#1e2939]">{m.designation}</p>
                  <p className="mt-1 text-xs text-[#99a1af]">
                    {m.type} · {m.categorie}
                  </p>
                  <p className="mt-1 text-xs text-[#6a7282]">
                    {m.derniere} · {m.utilisations} utilisations
                  </p>
                  <div className="mt-3 flex gap-1">
                    <button type="button" onClick={() => setApercu(m)} aria-label="Aperçu">
                      <Eye className="size-3.5 text-[#4a5565]" />
                    </button>
                    <Download className="size-3.5 text-[#4a5565]" />
                    <Copy className="size-3.5 text-[#4a5565]" />
                    <Trash2 className="size-3.5 text-[#4a5565]" />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-xs">
                <thead className="border-b border-[#f3f4f6] text-[#6a7282]">
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
                    <tr key={m.id} className="border-b border-[#f3f4f6] last:border-b-0">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selection.includes(m.id)}
                          onChange={() =>
                            setSelection((s) =>
                              s.includes(m.id) ? s.filter((x) => x !== m.id) : [...s, m.id],
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-3">
                        <button
                          type="button"
                          onClick={() => setApercu(m)}
                          className="inline-flex items-center gap-2 text-sm text-[#1e2939]"
                        >
                          <span className="flex size-7 items-center justify-center rounded-[8px] bg-[#f3f4f6]">
                            <FileText className="size-3.5 text-[#4a5565]" />
                          </span>
                          {m.designation}
                        </button>
                      </td>
                      <td className="px-2 py-3">
                        <BadgeType>{m.type}</BadgeType>
                      </td>
                      <td className="px-2 py-3 text-[#4a5565]">{m.categorie}</td>
                      <td className="px-2 py-3 text-[#4a5565]">{m.derniere}</td>
                      <td className="px-2 py-3 text-center text-[#4a5565]">{m.utilisations}</td>
                      <td className="px-2 py-3 text-[#4a5565]">{m.reference}</td>
                      <td className="px-2 py-3">
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => setApercu(m)} aria-label="Aperçu">
                            <Eye className="size-3.5 text-[#4a5565]" />
                          </button>
                          <Download className="size-3.5 text-[#4a5565]" />
                          <Copy className="size-3.5 text-[#4a5565]" />
                          <Trash2 className="size-3.5 text-[#4a5565]" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <CreateModeleDialog
        ouvert={creer}
        onClose={() => setCreer(false)}
        onCreer={(m) => setModeles((prev) => [m, ...prev])}
      />
      <PreviewModeleDialog modele={apercu} onClose={() => setApercu(null)} />
      <Dialog open={filtres} onOpenChange={setFiltres}>
        <DialogContent className="max-w-sm rounded-[10px]">
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

function CreateModeleDialog({
  ouvert,
  onClose,
  onCreer,
}: {
  ouvert: boolean;
  onClose: () => void;
  onCreer: (m: ModeleDoc) => void;
}) {
  const [nom, setNom] = useState("");
  const [type, setType] = useState("Quittance");
  const [categorie, setCategorie] = useState("Général");

  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[480px] rounded-[10px] border-[#e5e7eb] p-0">
        <DialogHeader className="border-b border-[#f3f4f6] px-6 py-5">
          <DialogTitle className="text-base font-medium text-[#1e2939]">
            Créer un nouveau modèle
          </DialogTitle>
          <DialogDescription className="text-xs text-[#99a1af]">
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
            <p className="mb-2 text-xs text-[#6a7282]">Type de document</p>
            <div className="flex flex-wrap gap-1.5">
              {TYPES.map((t) => (
                <Chip key={t} actif={type === t} onClick={() => setType(t)}>
                  {t}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs text-[#6a7282]">Catégorie</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.filter((c) => c !== "Tous").map((c) => (
                <Chip key={c} actif={categorie === c} onClick={() => setCategorie(c)}>
                  {c}
                </Chip>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-[#f3f4f6] px-6 py-4">
          <BtnOutline onClick={onClose}>Annuler</BtnOutline>
          <BtnNavy
            onClick={() => {
              if (!nom.trim()) return;
              onCreer({
                id: `m-${Date.now()}`,
                designation: nom.trim(),
                type,
                categorie,
                derniere: "—",
                utilisations: 0,
                reference: `INV-${Math.floor(1030 + Math.random() * 50)}`,
              });
              setNom("");
              onClose();
            }}
          >
            Créer le modèle
          </BtnNavy>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PreviewModeleDialog({
  modele,
  onClose,
}: {
  modele: ModeleDoc | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={modele !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[620px] gap-0 overflow-hidden rounded-2xl border-[#e5e7eb] p-0">
        <DialogHeader className="border-b border-[#f3f4f6] px-6 py-4">
          <DialogTitle className="text-base font-normal text-[#101828]">
            {modele?.designation}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#99a1af]">
            {modele?.reference} · {modele?.type} · {modele?.categorie}
          </DialogDescription>
        </DialogHeader>
        <div className="bg-[#f9fafb] px-6 py-6">
          <div className="flex flex-col gap-5 rounded-[14px] border border-[#e5e7eb] bg-white px-8 py-8">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <div className="h-3 w-28 rounded bg-[#e5e7eb]" />
                <div className="h-2.5 w-20 rounded bg-[#f3f4f6]" />
                <div className="h-2.5 w-24 rounded bg-[#f3f4f6]" />
              </div>
              <div className="space-y-1.5">
                <div className="h-4 w-24 rounded bg-[#1e2939]" />
                <div className="ml-8 h-2.5 w-16 rounded bg-[#f3f4f6]" />
              </div>
            </div>
            <div className="space-y-2 border-t border-[#f3f4f6] pt-4">
              <div className="h-2.5 w-64 rounded bg-[#e5e7eb]" />
              <div className="h-2 w-96 max-w-full rounded bg-[#f3f4f6]" />
              <div className="h-2 w-80 max-w-full rounded bg-[#f3f4f6]" />
            </div>
            <div className="overflow-hidden rounded-[10px] border border-[#e5e7eb]">
              <div className="flex gap-4 bg-[#f3f4f6] px-4 py-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-2 flex-1 rounded bg-[#d1d5dc]" />
                ))}
              </div>
              {Array.from({ length: 3 }).map((_, r) => (
                <div key={r} className="flex gap-4 border-t border-[#f3f4f6] px-4 py-2">
                  {Array.from({ length: 4 }).map((_, c) => (
                    <div key={c} className="h-2 flex-1 rounded bg-[#f3f4f6]" />
                  ))}
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <div className="w-40 space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-2 w-12 rounded bg-[#f3f4f6]" />
                  <div className="h-2 w-16 rounded bg-[#f3f4f6]" />
                </div>
                <div className="flex justify-between">
                  <div className="h-2 w-8 rounded bg-[#f3f4f6]" />
                  <div className="h-2 w-16 rounded bg-[#f3f4f6]" />
                </div>
                <div className="flex justify-between border-t border-[#e5e7eb] pt-1.5">
                  <div className="h-2.5 w-10 rounded bg-[#1e2939]" />
                  <div className="h-2.5 w-16 rounded bg-[#1e2939]" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-[#f3f4f6] px-6 py-4">
          <div className="flex gap-2">
            <BtnOutline>
              <Download className="size-3" /> Télécharger
            </BtnOutline>
            <BtnOutline>
              <Copy className="size-3" /> Dupliquer
            </BtnOutline>
          </div>
          <BtnNavy onClick={onClose}>Fermer</BtnNavy>
        </div>
      </DialogContent>
    </Dialog>
  );
}
