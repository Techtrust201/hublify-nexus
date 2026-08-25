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
import { ScrollHint } from "@/components/layout/ScrollHint";
import { IMMEUBLES_PATRIMOINE, LOGEMENTS_PATRIMOINE } from "@/data/documents-mo1";
import { cn } from "@/lib/utils";

function Etoiles({ note }: { note: number }) {
  const pleines = Math.round(note);
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-body">
      <span className="inline-flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "size-2.5",
              i < pleines ? "fill-ink text-ink" : "text-line-strong",
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
      <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs text-white">{statut}</span>
    );
  }
  if (statut === "libre") {
    return (
      <span className="rounded-full border border-line px-2.5 py-0.5 text-xs text-ink">
        {statut}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-surface-soft px-2.5 py-0.5 text-xs text-ink-body">{statut}</span>
  );
}

export function PatrimoineApp() {
  const [selLog, setSelLog] = useState<string[]>([]);
  const [selImm, setSelImm] = useState<string[]>([]);

  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="text-2xl text-ink">Biens Immobiliers</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-ink-subtle">
          Gérez votre patrimoine immobilier : logements, immeubles, propriétaires et droits d'accès.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <BtnNavy className="h-10 px-5 text-sm">
            <Plus className="size-3.5" /> Ajouter un logement
          </BtnNavy>
          <BtnOutline className="h-10 px-5 text-sm text-ink">
            <Plus className="size-3.5" /> Ajouter un immeuble
          </BtnOutline>
        </div>
      </div>

      <section className="mb-4 overflow-hidden rounded-card border border-line bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-soft px-5 py-4">
          <p className="flex items-center gap-2 text-sm text-ink">
            <Home className="size-4" />
            Logements
            <span className="rounded bg-surface-soft px-1.5 text-xs text-ink-subtle">4</span>
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
        <ScrollHint>
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-b border-surface-soft text-ink-subtle">
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
                <tr key={l.id} className="border-b border-surface-soft last:border-b-0">
                  <td className="px-4 py-4">
                    <label className="flex min-h-11 items-center md:min-h-0">
                      <input
                        type="checkbox"
                        checked={selLog.includes(l.id)}
                        onChange={() =>
                          setSelLog((s) =>
                            s.includes(l.id) ? s.filter((x) => x !== l.id) : [...s, l.id],
                          )
                        }
                        aria-label={`Sélectionner ${l.nom}`}
                      />
                    </label>
                  </td>
                  <td className="px-2 py-4">
                    <div className="flex items-start gap-2">
                      <span className="mt-1 flex size-7 items-center justify-center rounded-[8px] bg-surface-soft">
                        <Home className="size-3 text-ink-body" />
                      </span>
                      <div>
                        <p className="text-sm text-ink">{l.nom}</p>
                        <p className="text-[11px] text-ink-muted">
                          {l.typologie} · {l.surface}
                        </p>
                        <span className="mt-0.5 inline-block rounded border border-line px-1.5 text-[10px] text-ink-subtle">
                          {l.meuble ? "Meublé" : "Non meublé"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-4">
                    <span className="inline-flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-line text-[10px] text-ink-body">
                        {l.initiales}
                      </span>
                      {l.proprietaire}
                    </span>
                  </td>
                  <td className="px-2 py-4 text-ink-body">{l.immeuble}</td>
                  <td className="px-2 py-4 text-ink-body">{l.adresse}</td>
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
                    <div className="flex justify-end gap-1 text-ink-body">
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
        </ScrollHint>
        <p className="px-5 py-3 text-xs text-ink-muted">4 logements</p>
      </section>

      <section className="overflow-hidden rounded-card border border-line bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-soft px-5 py-4">
          <p className="flex items-center gap-2 text-sm text-ink">
            <Building2 className="size-4" />
            Immeubles
            <span className="rounded bg-surface-soft px-1.5 text-xs text-ink-subtle">2</span>
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
        <ScrollHint>
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="border-b border-surface-soft text-ink-subtle">
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
                <tr key={i.id} className="border-b border-surface-soft last:border-b-0">
                  <td className="px-4 py-4">
                    <label className="flex min-h-11 items-center md:min-h-0">
                      <input
                        type="checkbox"
                        checked={selImm.includes(i.id)}
                        onChange={() =>
                          setSelImm((s) =>
                            s.includes(i.id) ? s.filter((x) => x !== i.id) : [...s, i.id],
                          )
                        }
                        aria-label={`Sélectionner ${i.nom}`}
                      />
                    </label>
                  </td>
                  <td className="px-2 py-4">
                    <span className="inline-flex items-center gap-2 text-sm text-ink">
                      <span className="flex size-7 items-center justify-center rounded-[8px] bg-surface-soft">
                        <Building2 className="size-3 text-ink-body" />
                      </span>
                      {i.nom}
                    </span>
                  </td>
                  <td className="px-2 py-4">
                    <span className="inline-flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-line text-[10px]">
                        {i.initiales}
                      </span>
                      {i.proprietaire}
                    </span>
                  </td>
                  <td className="px-2 py-4">
                    <span className="inline-flex items-center gap-1 text-ink-body">
                      <Home className="size-3" /> {i.logements} logements
                    </span>
                  </td>
                  <td className="px-2 py-4 text-ink-body">{i.adresse}</td>
                  <td className="px-2 py-4">
                    <BadgeStatut statut={i.statut} />
                  </td>
                  <td className="px-2 py-4">
                    <div className="flex justify-end gap-1 text-ink-body">
                      <Pencil className="size-3.5" />
                      <Eye className="size-3.5" />
                      <Trash2 className="size-3.5" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollHint>
        <p className="px-5 py-3 text-xs text-ink-muted">2 immeubles</p>
      </section>
    </div>
  );
}
