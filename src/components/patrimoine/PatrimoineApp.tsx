import {
  Building2,
  Copy,
  Download,
  Eye,
  Home,
  Pencil,
  Plus,
  SlidersHorizontal,
  Star,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { BtnNavy, BtnOutline } from "@/components/documents/ui";
import { IMMEUBLES_PATRIMOINE, LOGEMENTS_PATRIMOINE } from "@/data/documents-mo1";
import { cn } from "@/lib/utils";

function Etoiles({ note }: { note: number }) {
  const pleines = Math.round(note);
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[#4a5565]">
      <span className="inline-flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "size-2.5",
              i < pleines ? "fill-[#1e2939] text-[#1e2939]" : "text-[#d1d5dc]",
            )}
          />
        ))}
      </span>
      {note.toFixed(1)}
    </span>
  );
}

function BadgeStatut({ statut }: { statut: string }) {
  if (statut === "loué" || statut === "actif") {
    return (
      <span className="rounded-full bg-[#1e2939] px-2.5 py-0.5 text-xs text-white">{statut}</span>
    );
  }
  if (statut === "libre") {
    return (
      <span className="rounded-full border border-[#e5e7eb] px-2.5 py-0.5 text-xs text-[#1e2939]">
        {statut}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[#f3f4f6] px-2.5 py-0.5 text-xs text-[#4a5565]">{statut}</span>
  );
}

export function PatrimoineApp() {
  const [selLog, setSelLog] = useState<string[]>([]);
  const [selImm, setSelImm] = useState<string[]>([]);

  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="text-2xl text-[#1e2939]">Biens Immobiliers</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-[#6a7282]">
          Gérez votre patrimoine immobilier : logements, immeubles, propriétaires et droits d'accès.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <BtnNavy className="h-10 px-5 text-sm">
            <Plus className="size-3.5" /> Ajouter un logement
          </BtnNavy>
          <BtnOutline className="h-10 px-5 text-sm text-[#1e2939]">
            <Plus className="size-3.5" /> Ajouter un immeuble
          </BtnOutline>
        </div>
      </div>

      <section className="mb-4 overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f3f4f6] px-5 py-4">
          <p className="flex items-center gap-2 text-sm text-[#1e2939]">
            <Home className="size-4" />
            Logements
            <span className="rounded bg-[#f3f4f6] px-1.5 text-xs text-[#6a7282]">4</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <BtnOutline>
              <SlidersHorizontal className="size-3" /> Filtres
            </BtnOutline>
            <BtnOutline disabled={selLog.length === 0}>
              <Trash2 className="size-3" /> Supprimer
            </BtnOutline>
            <BtnOutline>
              <Download className="size-3" /> Exporter
            </BtnOutline>
            <BtnNavy>
              <Plus className="size-3" /> Ajouter
            </BtnNavy>
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-b border-[#f3f4f6] text-[#6a7282]">
              <tr>
                <th className="w-12 px-4 py-3" />
                <th className="px-2 py-3 font-medium">Logement</th>
                <th className="px-2 py-3 font-medium">Propriétaire</th>
                <th className="px-2 py-3 font-medium">Immeuble</th>
                <th className="px-2 py-3 font-medium">Adresse</th>
                <th className="px-2 py-3 font-medium">Notation</th>
                <th className="px-2 py-3 font-medium">Statut</th>
                <th className="px-2 py-3 font-medium">Documents</th>
                <th className="px-2 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {LOGEMENTS_PATRIMOINE.map((l) => (
                <tr key={l.id} className="border-b border-[#f3f4f6] last:border-b-0">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selLog.includes(l.id)}
                      onChange={() =>
                        setSelLog((s) =>
                          s.includes(l.id) ? s.filter((x) => x !== l.id) : [...s, l.id],
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-4">
                    <div className="flex items-start gap-2">
                      <span className="mt-1 flex size-7 items-center justify-center rounded-[8px] bg-[#f3f4f6]">
                        <Home className="size-3 text-[#4a5565]" />
                      </span>
                      <div>
                        <p className="text-sm text-[#1e2939]">{l.nom}</p>
                        <p className="text-[11px] text-[#99a1af]">
                          {l.typologie} · {l.surface}
                        </p>
                        <span className="mt-0.5 inline-block rounded border border-[#e5e7eb] px-1.5 text-[10px] text-[#6a7282]">
                          {l.meuble ? "Meublé" : "Non meublé"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-4">
                    <span className="inline-flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-[#e5e7eb] text-[10px] text-[#4a5565]">
                        {l.initiales}
                      </span>
                      {l.proprietaire}
                    </span>
                  </td>
                  <td className="px-2 py-4 text-[#4a5565]">{l.immeuble}</td>
                  <td className="px-2 py-4 text-[#4a5565]">{l.adresse}</td>
                  <td className="px-2 py-4">
                    <Etoiles note={l.note} />
                  </td>
                  <td className="px-2 py-4">
                    <BadgeStatut statut={l.statut} />
                  </td>
                  <td className="px-2 py-4">
                    <BtnOutline className="h-[30px]">
                      <Eye className="size-2.5" /> Voir docs
                    </BtnOutline>
                  </td>
                  <td className="px-2 py-4">
                    <div className="flex justify-end gap-1 text-[#4a5565]">
                      <Pencil className="size-3.5" />
                      <Eye className="size-3.5" />
                      <Copy className="size-3.5" />
                      <Trash2 className="size-3.5" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-5 py-3 text-xs text-[#99a1af]">4 logements</p>
      </section>

      <section className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f3f4f6] px-5 py-4">
          <p className="flex items-center gap-2 text-sm text-[#1e2939]">
            <Building2 className="size-4" />
            Immeubles
            <span className="rounded bg-[#f3f4f6] px-1.5 text-xs text-[#6a7282]">2</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <BtnOutline>
              <SlidersHorizontal className="size-3" /> Filtres
            </BtnOutline>
            <BtnOutline disabled={selImm.length === 0}>
              <Trash2 className="size-3" /> Supprimer
            </BtnOutline>
            <BtnOutline>
              <Download className="size-3" /> Exporter
            </BtnOutline>
            <BtnNavy>
              <Plus className="size-3" /> Ajouter
            </BtnNavy>
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="border-b border-[#f3f4f6] text-[#6a7282]">
              <tr>
                <th className="w-12 px-4 py-3" />
                <th className="px-2 py-3 font-medium">Immeuble</th>
                <th className="px-2 py-3 font-medium">Propriétaire</th>
                <th className="px-2 py-3 font-medium">Logements</th>
                <th className="px-2 py-3 font-medium">Adresse</th>
                <th className="px-2 py-3 font-medium">Statut</th>
                <th className="px-2 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {IMMEUBLES_PATRIMOINE.map((i) => (
                <tr key={i.id} className="border-b border-[#f3f4f6] last:border-b-0">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selImm.includes(i.id)}
                      onChange={() =>
                        setSelImm((s) =>
                          s.includes(i.id) ? s.filter((x) => x !== i.id) : [...s, i.id],
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-4">
                    <span className="inline-flex items-center gap-2 text-sm text-[#1e2939]">
                      <span className="flex size-7 items-center justify-center rounded-[8px] bg-[#f3f4f6]">
                        <Building2 className="size-3 text-[#4a5565]" />
                      </span>
                      {i.nom}
                    </span>
                  </td>
                  <td className="px-2 py-4">
                    <span className="inline-flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-[#e5e7eb] text-[10px]">
                        {i.initiales}
                      </span>
                      {i.proprietaire}
                    </span>
                  </td>
                  <td className="px-2 py-4">
                    <span className="inline-flex items-center gap-1 text-[#4a5565]">
                      <Home className="size-3" /> {i.logements} logements
                    </span>
                  </td>
                  <td className="px-2 py-4 text-[#4a5565]">{i.adresse}</td>
                  <td className="px-2 py-4">
                    <BadgeStatut statut={i.statut} />
                  </td>
                  <td className="px-2 py-4">
                    <div className="flex justify-end gap-1 text-[#4a5565]">
                      <Pencil className="size-3.5" />
                      <Eye className="size-3.5" />
                      <Trash2 className="size-3.5" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-5 py-3 text-xs text-[#99a1af]">2 immeubles</p>
      </section>
    </div>
  );
}
