import { Download, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { BtnNavy, BtnOutline, Chip } from "@/components/documents/ui";
import { ScrollHint } from "@/components/layout/ScrollHint";
import { ITEMS_INVENTAIRE } from "@/data/documents-mo1";
import { cn } from "@/lib/utils";

const ONGLETS = [
  { id: "1" as const, label: "Inventaire 1" },
  { id: "2" as const, label: "Inventaire 2" },
  { id: "conso" as const, label: "Inventaire des consommables" },
];

export function InventaireApp() {
  const [onglet, setOnglet] = useState<"1" | "2" | "conso">("1");
  const [recherche, setRecherche] = useState("");
  const [selection, setSelection] = useState<string[]>([]);

  const items = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return ITEMS_INVENTAIRE.filter((i) => i.onglet === onglet).filter(
      (i) =>
        !q ||
        i.code.toLowerCase().includes(q) ||
        i.designation.toLowerCase().includes(q) ||
        i.emplacement.toLowerCase().includes(q),
    );
  }, [onglet, recherche]);

  const titre =
    onglet === "1" ? "Inventaire 1" : onglet === "2" ? "Inventaire 2" : "Inventaire des consommables";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl text-ink">Inventaire</h2>
          <p className="text-sm text-ink-subtle">Tous les inventaires de la maison sont réunis ici</p>
        </div>
        <BtnNavy className="h-[49px] px-5 text-sm">
          <Download className="size-4" /> Télécharger le tableau
        </BtnNavy>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {ONGLETS.map((o) => (
          <Chip key={o.id} actif={onglet === o.id} onClick={() => setOnglet(o.id)}>
            {o.label}
          </Chip>
        ))}
      </div>

      <section className="overflow-hidden rounded-card border border-line bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-soft px-6 py-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg text-ink">{titre}</h3>
            <span className="text-sm text-ink-muted">{items.length} éléments</span>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <label className="relative flex h-11 w-full items-center sm:w-[320px] md:h-[39px]">
              <Search className="absolute left-3 size-3.5 text-ink-muted" />
              <input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher par code ou désignation..."
                className="h-full w-full rounded-card border border-line bg-white pl-9 pr-3 text-sm outline-none placeholder:text-ink-muted"
              />
            </label>
            <BtnOutline>
              <Plus className="size-3" /> Créer un sous-dossier
            </BtnOutline>
            <BtnOutline disabled={selection.length === 0}>
              <Pencil className="size-3" /> Modifier
            </BtnOutline>
            <BtnOutline disabled={selection.length === 0}>
              <Trash2 className="size-3" /> Supprimer
            </BtnOutline>
          </div>
        </header>

        <ScrollHint>
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-surface-soft text-xs text-ink-subtle">
              <tr>
                <th className="w-14 px-6 py-4" />
                <th className="px-3 py-4 font-medium">Code</th>
                <th className="px-3 py-4 font-medium">Désignation</th>
                <th className="px-3 py-4 font-medium">État</th>
                <th className="px-3 py-4 font-medium">QTÉ</th>
                <th className="px-3 py-4 font-medium">Image</th>
                <th className="px-3 py-4 font-medium">Emplacement</th>
                <th className="px-3 py-4 font-medium">N° de série</th>
                <th className="px-3 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-b border-surface-soft last:border-b-0">
                  <td className="px-6 py-4">
                    <label className="flex min-h-11 items-center md:min-h-0">
                      <input
                        type="checkbox"
                        checked={selection.includes(i.id)}
                        onChange={() =>
                          setSelection((s) =>
                            s.includes(i.id) ? s.filter((x) => x !== i.id) : [...s, i.id],
                          )
                        }
                        aria-label={`Sélectionner ${i.designation}`}
                      />
                    </label>
                  </td>
                  <td className="px-3 py-4 text-ink">{i.code}</td>
                  <td className="px-3 py-4 text-ink">{i.designation}</td>
                  <td className="px-3 py-4">
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-xs",
                        i.etat === "Très bon"
                          ? "bg-chip-success text-chip-success-fg"
                          : i.etat === "Bon"
                            ? "bg-surface-soft text-ink-body"
                            : i.etat === "Moyen"
                              ? "bg-chip-warning text-chip-warning-fg"
                              : "border border-line text-ink-subtle",
                      )}
                    >
                      {i.etat}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-ink">{i.qte}</td>
                  <td className="px-3 py-4 text-xl leading-none">{i.emoji}</td>
                  <td className="px-3 py-4 text-ink-body">{i.emplacement}</td>
                  <td className="px-3 py-4 text-ink-body">{i.serie}</td>
                  <td className="px-3 py-4">
                    <div className="flex gap-1">
                      <button type="button" aria-label="Voir" className="p-1 text-ink-body">
                        <Eye className="size-4" />
                      </button>
                      <button type="button" aria-label="Modifier" className="p-1 text-ink-body">
                        <Pencil className="size-4" />
                      </button>
                      <button type="button" aria-label="Supprimer" className="p-1 text-ink-body">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollHint>
      </section>
    </div>
  );
}
