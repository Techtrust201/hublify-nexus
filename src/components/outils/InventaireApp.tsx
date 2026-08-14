import { Download, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { BtnNavy, BtnOutline, Chip } from "@/components/documents/ui";
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
          <h2 className="text-2xl text-[#1e2939]">Inventaire</h2>
          <p className="text-sm text-[#6a7282]">Tous les inventaires de la maison sont réunis ici</p>
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

      <section className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f3f4f6] px-6 py-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg text-[#1e2939]">{titre}</h3>
            <span className="text-sm text-[#99a1af]">{items.length} éléments</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative flex h-[39px] w-[320px] max-w-full items-center">
              <Search className="absolute left-3 size-3.5 text-[#99a1af]" />
              <input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher par code ou désignation..."
                className="h-full w-full rounded-[10px] border border-[#e5e7eb] bg-white pl-9 pr-3 text-sm outline-none placeholder:text-[#99a1af]"
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

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-[#f3f4f6] text-xs text-[#6a7282]">
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
                <tr key={i.id} className="border-b border-[#f3f4f6] last:border-b-0">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selection.includes(i.id)}
                      onChange={() =>
                        setSelection((s) =>
                          s.includes(i.id) ? s.filter((x) => x !== i.id) : [...s, i.id],
                        )
                      }
                    />
                  </td>
                  <td className="px-3 py-4 text-[#1e2939]">{i.code}</td>
                  <td className="px-3 py-4 text-[#1e2939]">{i.designation}</td>
                  <td className="px-3 py-4">
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-xs",
                        i.etat === "Très bon"
                          ? "bg-[#dcfce7] text-[#008236]"
                          : i.etat === "Bon"
                            ? "bg-[#f3f4f6] text-[#4a5565]"
                            : i.etat === "Moyen"
                              ? "bg-[#ffedd4] text-[#ca3500]"
                              : "border border-[#e5e7eb] text-[#6a7282]",
                      )}
                    >
                      {i.etat}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-[#1e2939]">{i.qte}</td>
                  <td className="px-3 py-4 text-xl leading-none">{i.emoji}</td>
                  <td className="px-3 py-4 text-[#4a5565]">{i.emplacement}</td>
                  <td className="px-3 py-4 text-[#4a5565]">{i.serie}</td>
                  <td className="px-3 py-4">
                    <div className="flex gap-1">
                      <button type="button" aria-label="Voir" className="p-1 text-[#4a5565]">
                        <Eye className="size-4" />
                      </button>
                      <button type="button" aria-label="Modifier" className="p-1 text-[#4a5565]">
                        <Pencil className="size-4" />
                      </button>
                      <button type="button" aria-label="Supprimer" className="p-1 text-[#4a5565]">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
