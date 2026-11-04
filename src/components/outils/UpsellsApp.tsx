import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  csvUpsells,
  ficheEffective,
  filtrerUpsells,
  type FicheUpsell,
} from "@/data/upsells-catalogue";
import { modifierSession, useSession } from "@/data/session";
import type { UpsellParam } from "@/data/parametrage-mo1";
import { confirmer, toastOk } from "@/lib/feedback";

const CLE = "hublify.upsells.fiches.v1";

function lireSurcharges(): Record<string, FicheUpsell> {
  if (typeof localStorage === "undefined") return {};
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return {};
    const parsed = JSON.parse(brut) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, FicheUpsell>) : {};
  } catch {
    return {};
  }
}

function ecrireSurcharge(id: string, fiche: FicheUpsell) {
  const toutes = { ...lireSurcharges(), [id]: fiche };
  localStorage.setItem(CLE, JSON.stringify(toutes));
  return toutes;
}

type Brouillon = FicheUpsell & { nom: string; prix: string };

const VIDE: Brouillon = {
  nom: "",
  prix: "15",
  code: "",
  type: "Service",
  prestataire: "",
  ville: "Cannes",
  pieceJointe: "",
};

export function UpsellsApp() {
  const session = useSession();
  const [recherche, setRecherche] = useState("");
  const [fiches, setFiches] = useState(lireSurcharges);
  const [edition, setEdition] = useState<string | "nouveau" | null>(null);
  const [apercu, setApercu] = useState<string | null>(null);
  const [brouillon, setBrouillon] = useState<Brouillon>(VIDE);

  const lignes = session.parametrage.upsells;
  const visibles = useMemo(
    () => filtrerUpsells(lignes, fiches, recherche),
    [lignes, fiches, recherche],
  );
  const ouverte = lignes.find((u) => u.id === apercu) ?? null;

  const ouvrirEdition = (upsell?: UpsellParam) => {
    if (!upsell) {
      setBrouillon(VIDE);
      setEdition("nouveau");
      return;
    }
    const fiche = ficheEffective(upsell.id, fiches[upsell.id]);
    setBrouillon({ ...fiche, nom: upsell.nom, prix: String(upsell.prix) });
    setEdition(upsell.id);
  };

  const enregistrer = () => {
    const nom = brouillon.nom.trim();
    const prix = Number(brouillon.prix.replace(",", "."));
    if (!nom || Number.isNaN(prix) || prix < 0) return;
    const fiche: FicheUpsell = {
      code: brouillon.code.trim(),
      type: brouillon.type.trim() || "Service",
      prestataire: brouillon.prestataire.trim(),
      ville: brouillon.ville.trim(),
      pieceJointe: brouillon.pieceJointe.trim(),
    };
    if (edition === "nouveau") {
      const id = `u-${Date.now().toString(36)}`;
      modifierSession((e) => ({
        ...e,
        parametrage: {
          ...e.parametrage,
          upsells: [...e.parametrage.upsells, { id, nom, prix, actif: true }],
        },
      }));
      setFiches(ecrireSurcharge(id, fiche));
      toastOk("Upsell ajouté.");
    } else if (edition) {
      modifierSession((e) => ({
        ...e,
        parametrage: {
          ...e.parametrage,
          upsells: e.parametrage.upsells.map((u) => (u.id === edition ? { ...u, nom, prix } : u)),
        },
      }));
      setFiches(ecrireSurcharge(edition, fiche));
      toastOk("Upsell mis à jour.");
    }
    setEdition(null);
  };

  const telecharger = () => {
    const csv = `\uFEFF${csvUpsells(visibles, fiches)}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = "upsells-hublify.csv";
    lien.click();
    URL.revokeObjectURL(url);
    toastOk("Tableau téléchargé.");
  };

  return (
    <div className="space-y-4">
      <section className="rounded-card border border-line bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-ink">Liste des upsells</h2>
            <p className="mt-1 text-xs text-ink-muted">
              {visibles.length} élément{visibles.length > 1 ? "s" : ""} · tarif unitaire proposé au
              voyageur
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={telecharger}
              className="inline-flex h-11 items-center rounded-card border border-line px-3 text-sm text-ink-body md:h-9"
            >
              Télécharger le tableau
            </button>
            <button
              type="button"
              onClick={() => ouvrirEdition()}
              className="inline-flex h-11 items-center gap-1 rounded-card bg-accent-teal px-4 text-sm font-medium text-white md:h-9"
            >
              <Plus className="size-3.5" /> Ajouter
            </button>
          </div>
        </div>
        <label className="mt-4 flex h-11 items-center gap-2 rounded-card border border-line px-3 text-sm md:h-9">
          <Search className="size-4 text-ink-muted" aria-hidden />
          <span className="sr-only">Rechercher</span>
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un code, un service, une ville"
            className="w-full bg-transparent text-ink outline-none"
          />
        </label>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-ink-muted">
                {[
                  "Code",
                  "Désignation",
                  "Type",
                  "Prestataire",
                  "Pièce jointe",
                  "Ville",
                  "Tarif",
                  "Actions",
                ].map((col) => (
                  <th key={col} className="px-2 py-2 font-medium">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibles.map((u) => {
                const fiche = ficheEffective(u.id, fiches[u.id]);
                return (
                  <tr key={u.id} className="border-b border-surface-soft">
                    <td className="px-2 py-3 font-medium text-ink">{fiche.code}</td>
                    <td className="px-2 py-3 text-ink">{u.nom}</td>
                    <td className="px-2 py-3 text-ink-body">{fiche.type}</td>
                    <td className="px-2 py-3 text-ink-body">{fiche.prestataire || "—"}</td>
                    <td className="px-2 py-3 text-ink-body">{fiche.pieceJointe || "—"}</td>
                    <td className="px-2 py-3 text-ink-body">{fiche.ville || "—"}</td>
                    <td className="px-2 py-3 text-ink">{u.prix.toFixed(2).replace(".", ",")} €</td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Voir ${u.nom}`}
                          onClick={() => setApercu(u.id)}
                          className="flex size-11 items-center justify-center rounded-card text-ink-muted hover:bg-surface md:size-8"
                        >
                          <Eye className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Modifier ${u.nom}`}
                          onClick={() => ouvrirEdition(u)}
                          className="flex size-11 items-center justify-center rounded-card text-ink-muted hover:bg-surface md:size-8"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Retirer ${u.nom}`}
                          onClick={() => {
                            void (async () => {
                              const ok = await confirmer({
                                titre: `Retirer « ${u.nom} » ?`,
                                description:
                                  "Le service ne sera plus proposé sur les nouvelles réservations.",
                                libelleConfirmer: "Retirer",
                                danger: true,
                              });
                              if (!ok) return;
                              modifierSession((e) => ({
                                ...e,
                                parametrage: {
                                  ...e.parametrage,
                                  upsells: e.parametrage.upsells.filter((x) => x.id !== u.id),
                                },
                              }));
                              toastOk("Upsell retiré.");
                            })();
                          }}
                          className="flex size-11 items-center justify-center rounded-card text-ink-muted hover:bg-surface md:size-8"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visibles.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-2 py-8 text-center text-sm text-ink-muted">
                    Aucun upsell ne correspond à cette recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={edition != null} onOpenChange={(o) => !o && setEdition(null)}>
        <DialogContent>
          <DialogTitle>
            {edition === "nouveau" ? "Ajouter un upsell" : "Modifier l'upsell"}
          </DialogTitle>
          <DialogDescription>
            Code, désignation, type, prestataire, pièce jointe, ville et tarif unitaire.
          </DialogDescription>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Champ
              label="Désignation"
              value={brouillon.nom}
              onChange={(nom) => setBrouillon({ ...brouillon, nom })}
            />
            <Champ
              label="Code"
              value={brouillon.code}
              onChange={(code) => setBrouillon({ ...brouillon, code })}
            />
            <Champ
              label="Type"
              value={brouillon.type}
              onChange={(type) => setBrouillon({ ...brouillon, type })}
            />
            <Champ
              label="Tarif unitaire (€)"
              value={brouillon.prix}
              onChange={(prix) => setBrouillon({ ...brouillon, prix })}
            />
            <Champ
              label="Prestataire"
              value={brouillon.prestataire}
              onChange={(prestataire) => setBrouillon({ ...brouillon, prestataire })}
            />
            <Champ
              label="Ville"
              value={brouillon.ville}
              onChange={(ville) => setBrouillon({ ...brouillon, ville })}
            />
            <Champ
              label="Pièce jointe"
              value={brouillon.pieceJointe}
              onChange={(pieceJointe) => setBrouillon({ ...brouillon, pieceJointe })}
            />
          </div>
          <button
            type="button"
            onClick={enregistrer}
            className="mt-4 h-11 rounded-card bg-accent-teal px-4 text-sm font-medium text-white md:h-9"
          >
            Enregistrer
          </button>
        </DialogContent>
      </Dialog>

      <Dialog open={ouverte != null} onOpenChange={(o) => !o && setApercu(null)}>
        <DialogContent>
          <DialogTitle>{ouverte?.nom}</DialogTitle>
          <DialogDescription>Aperçu de la vente additionnelle.</DialogDescription>
          {ouverte ? (
            <dl className="mt-3 space-y-2 text-sm text-ink-body">
              {Object.entries({
                Code: ficheEffective(ouverte.id, fiches[ouverte.id]).code,
                Type: ficheEffective(ouverte.id, fiches[ouverte.id]).type,
                Prestataire: ficheEffective(ouverte.id, fiches[ouverte.id]).prestataire || "—",
                Ville: ficheEffective(ouverte.id, fiches[ouverte.id]).ville || "—",
                "Pièce jointe": ficheEffective(ouverte.id, fiches[ouverte.id]).pieceJointe || "—",
                Tarif: `${ouverte.prix.toFixed(2).replace(".", ",")} €`,
                Statut: ouverte.actif ? "Actif" : "Inactif",
              }).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-ink-muted">{k}</dt>
                  <dd className="text-right text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Champ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-xs text-ink-muted">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-11 w-full rounded-card border border-line px-3 text-sm text-ink outline-none md:h-9"
      />
    </label>
  );
}
