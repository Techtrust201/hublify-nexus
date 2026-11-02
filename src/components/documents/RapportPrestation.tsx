// SOURCE: Hublify V1.0 — Rapport de prestation (Onglets Documents, frame 323:24893).

import { useState } from "react";
import { EspaceRedaction } from "@/components/documents/EspaceRedaction";
import { toastOk } from "@/lib/feedback";

const PIECES = [
  { id: "entree", label: "Entrée", detail: "2 comptes renseignés" },
  { id: "sejour", label: "Séjour", detail: "3 comptes renseignés" },
  { id: "cuisine", label: "Cuisine", detail: "Rien à saisir" },
  { id: "chambres", label: "Chambres", detail: "2 comptes renseignés" },
  { id: "sdb", label: "Salle de bains", detail: "1 compte" },
  { id: "wc", label: "WC", detail: "1 compte" },
];

const CLOTURE = [
  { id: "cles", label: "Compteurs et clés" },
  { id: "observations", label: "Observations générales" },
  { id: "signaletique", label: "Signalétique" },
];

export function RapportPrestation({
  titre,
  logement,
  onFermer,
}: {
  titre: string;
  logement: string;
  onFermer: () => void;
}) {
  const [page, setPage] = useState("cuisine");
  const [fait, setFait] = useState<Record<string, boolean>>({
    entree: true,
    sejour: true,
    chambres: true,
  });
  const [note, setNote] = useState("");
  const [pieces, setPieces] = useState(PIECES);
  const pages = [
    ...pieces.map((p) => ({ ...p, fait: Boolean(fait[p.id]) })),
    ...CLOTURE.map((p) => ({ ...p, detail: "Pour terminer", fait: Boolean(fait[p.id]) })),
  ];
  const active = pages.find((p) => p.id === page) ?? pages[0]!;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onFermer}
        className="text-xs font-medium text-ink-body hover:underline"
      >
        Retour aux rapports
      </button>
      <EspaceRedaction
        titre={`Rapport de prestation — ${titre}`}
        badge="Rénové"
        sousTitre={logement}
        unite="pièces renseignées"
        pages={pages}
        pageActive={active.id}
        onPage={setPage}
        libelleAjouter="Ajouter une pièce"
        onAjouter={() => {
          const id = `piece-${Date.now()}`;
          setPieces((liste) => [...liste, { id, label: "Nouvelle pièce", detail: "À nommer" }]);
          setPage(id);
        }}
        apercu={
          <div>
            <p className="text-xs text-ink-muted">Page</p>
            <h3 className="text-base font-medium text-ink">{active.label}</h3>
            <p className="mt-1 text-xs text-ink-subtle">{active.detail}</p>
            <label className="mt-4 block text-xs text-ink-muted">
              Constat
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={5}
                placeholder="Décrivez l'état constaté, les compteurs et les clés remises."
                className="mt-1 w-full rounded-card border border-line px-3 py-2 text-sm text-ink outline-none"
              />
            </label>
            <p className="mt-3 text-[11px] leading-relaxed text-ink-muted">
              Un constat précis décrit chaque pièce, les compteurs et les clés. Les photos se
              déposent depuis la fiche prestation.
            </p>
            <button
              type="button"
              onClick={() => {
                setFait((etat) => ({ ...etat, [active.id]: true }));
                toastOk(`${active.label} enregistré dans le rapport.`);
              }}
              className="mt-4 inline-flex h-11 items-center rounded-card bg-ink px-4 text-sm font-medium text-white md:h-9"
            >
              Enregistrer cette page
            </button>
          </div>
        }
      />
    </div>
  );
}
