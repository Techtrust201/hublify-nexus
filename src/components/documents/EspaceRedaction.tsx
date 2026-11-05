// SOURCE: Hublify V1.0 — Espace de rédaction (baux, états des lieux, rapport de prestation)

import { Check, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PageRedaction = {
  id: string;
  label: string;
  detail?: string;
  fait: boolean;
};

function progressionRedaction(pages: Array<{ fait: boolean }>) {
  const total = pages.length;
  const fait = pages.filter((p) => p.fait).length;
  const ratio = total === 0 ? 0 : Math.round((fait / total) * 100);
  return { fait, total, ratio };
}

export function EspaceRedaction({
  titre,
  badge = "Brouillon",
  sousTitre,
  meta,
  pages,
  pageActive,
  onPage,
  unite = "pages renseignées",
  apercu,
  mentionApercu,
  onAjouter,
  libelleAjouter,
  pied,
}: {
  titre: string;
  badge?: string;
  sousTitre?: string;
  meta?: ReactNode;
  pages: PageRedaction[];
  pageActive: string;
  onPage: (id: string) => void;
  unite?: string;
  apercu: ReactNode;
  /** Précision sous le titre d'aperçu, par exemple « affichage par page ». */
  mentionApercu?: string;
  onAjouter?: () => void;
  libelleAjouter?: string;
  pied?: ReactNode;
}) {
  const prog = progressionRedaction(pages);
  return (
    <section className="overflow-hidden rounded-card border border-line bg-white">
      <header className="border-b border-surface-soft px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-medium text-ink">{titre}</h2>
              {badge ? (
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-800">
                  {badge}
                </span>
              ) : null}
            </div>
            {sousTitre ? <p className="mt-1 text-xs text-ink-muted">{sousTitre}</p> : null}
          </div>
          {meta ? <div className="flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-xs text-ink-body">
            {prog.fait} sur {prog.total} {unite} · {prog.ratio} %
          </p>
          <div
            className="h-1.5 min-w-36 flex-1 overflow-hidden rounded-full bg-surface-soft"
            role="progressbar"
            aria-valuenow={prog.ratio}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full bg-ink" style={{ width: `${prog.ratio}%` }} />
          </div>
          <p className="text-[11px] text-emerald-700">Modifications conservées dans la session</p>
        </div>
      </header>
      <div className="grid lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)]">
        <aside className="border-b border-surface-soft p-3 lg:border-r lg:border-b-0">
          <p className="px-2 pb-2 text-xs font-medium text-ink">Rédaction</p>
          <ul className="space-y-1">
            {pages.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onPage(p.id)}
                  aria-current={p.id === pageActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 w-full items-start gap-2 rounded-card px-2 py-2 text-left text-sm",
                    p.id === pageActive ? "bg-sky-50 text-ink" : "text-ink-body hover:bg-surface",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                      p.fait
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-line-strong",
                    )}
                    aria-hidden
                  >
                    {p.fait ? <Check className="size-2.5" /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block">{p.label}</span>
                    {p.detail ? (
                      <span className="block text-[11px] text-ink-muted">{p.detail}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {onAjouter ? (
            <button
              type="button"
              onClick={onAjouter}
              className="mt-2 inline-flex min-h-11 items-center gap-1 px-2 text-xs font-medium text-ink-body"
            >
              <Plus className="size-3" /> {libelleAjouter ?? "Ajouter une page"}
            </button>
          ) : null}
          {pied}
        </aside>
        <div className="min-h-[420px] bg-[#f6f1ee] p-4 sm:p-6">
          <p className="mb-3 text-center text-xs font-medium tracking-wide text-ink-muted uppercase">
            Aperçu document
            {mentionApercu ? (
              <span className="mt-1 block font-normal normal-case tracking-normal text-ink-body">
                {mentionApercu}
              </span>
            ) : null}
          </p>
          <div className="mx-auto max-w-xl rounded-card border border-line/60 bg-white p-5 shadow-sm">
            {apercu}
          </div>
        </div>
      </div>
    </section>
  );
}
