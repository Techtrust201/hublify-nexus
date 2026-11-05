import { Download, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/auth/auth-context";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  ficheEffective,
  filtrerUpsells,
  fusionMigrationFiches,
  lireFichesUpsellLegacy,
  purgerFichesUpsellLocales,
  type FicheUpsell,
  csvUpsells,
} from "@/data/upsells-catalogue";
import { modifierSession, useSession } from "@/data/session";
import type { UpsellParam } from "@/data/parametrage-mo1";
import { peutEcrireFichesUpsell } from "@/data/outils-distant";
import { retirerFicheUpsellDistante, sauverFicheUpsellDistante } from "@/data/outils-remote";
import { confirmer, toastErreur, toastOk } from "@/lib/feedback";

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

export function UpsellsApp({
  fichesInitiales,
  distantOk,
}: {
  fichesInitiales: Record<string, FicheUpsell>;
  distantOk: boolean;
}) {
  const session = useSession();
  const auth = useAuth();
  const peutEcrire = Boolean(distantOk && auth && peutEcrireFichesUpsell(auth));
  const [recherche, setRecherche] = useState("");
  const [fiches, setFiches] = useState(fichesInitiales);
  const [edition, setEdition] = useState<string | "nouveau" | null>(null);
  const [apercu, setApercu] = useState<string | null>(null);
  const [brouillon, setBrouillon] = useState<Brouillon>(VIDE);
  const [enCours, setEnCours] = useState(false);
  const migre = useRef(false);

  useEffect(() => {
    if (migre.current || !peutEcrire) return;
    migre.current = true;
    const decision = fusionMigrationFiches(fichesInitiales, lireFichesUpsellLegacy());
    if (!decision.pousser) {
      if (Object.keys(fichesInitiales).length > 0) purgerFichesUpsellLocales();
      return;
    }
    setFiches(decision.fiches);
    void Promise.all(
      Object.entries(decision.fiches).map(([upsellId, fiche]) =>
        sauverFicheUpsellDistante({ data: { upsellId, fiche } }),
      ),
    ).then((resultats) => {
      if (resultats.every((res) => res.ok)) purgerFichesUpsellLocales();
    });
  }, [fichesInitiales, peutEcrire]);

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
    if (!peutEcrire) {
      toastErreur("L'enregistrement des upsells est indisponible pour le moment.");
      return;
    }
    if (!nom) {
      toastErreur("Indiquez le nom de l'upsell.");
      return;
    }
    if (Number.isNaN(prix) || prix < 0) {
      toastErreur("Indiquez un prix en euros, positif ou nul.");
      return;
    }
    const fiche: FicheUpsell = {
      code: brouillon.code.trim(),
      type: brouillon.type.trim() || "Service",
      prestataire: brouillon.prestataire.trim(),
      ville: brouillon.ville.trim(),
      pieceJointe: brouillon.pieceJointe.trim(),
    };
    const id = edition === "nouveau" ? `u-${Date.now().toString(36)}` : edition;
    if (!id) return;
    setEnCours(true);
    void sauverFicheUpsellDistante({ data: { upsellId: id, fiche } })
      .then((res) => {
        if (!res.ok) {
          toastErreur("L'upsell n'a pas été enregistré.");
          return;
        }
        if (edition === "nouveau") {
          modifierSession((e) => ({
            ...e,
            parametrage: {
              ...e.parametrage,
              upsells: [...e.parametrage.upsells, { id, nom, prix, actif: true }],
            },
          }));
          toastOk("Upsell ajouté.");
        } else {
          modifierSession((e) => ({
            ...e,
            parametrage: {
              ...e.parametrage,
              upsells: e.parametrage.upsells.map((u) => (u.id === id ? { ...u, nom, prix } : u)),
            },
          }));
          toastOk("Upsell mis à jour.");
        }
        setFiches((actuelles) => ({ ...actuelles, [id]: fiche }));
        purgerFichesUpsellLocales();
        setEdition(null);
      })
      .catch(() => toastErreur("L'upsell n'a pas été enregistré."))
      .finally(() => setEnCours(false));
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
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl text-ink">Upsells</h2>
          <p className="mt-1 max-w-xl text-sm text-ink-subtle">
            Tous les Upsells et les ventes additionnelles à proposer aux voyageurs sont réunis ici
          </p>
        </div>
        <button
          type="button"
          onClick={telecharger}
          className="inline-flex h-10 items-center gap-1.5 rounded-card border border-line bg-white px-3 text-sm text-ink-body"
        >
          <Download className="size-3.5" /> Télécharger le tableau
        </button>
      </header>
      <section className="rounded-card border border-line bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-ink">
              Liste des Upsells et Ventes additionnels
            </p>
            <p className="mt-1 text-xs text-ink-muted">{visibles.length} éléments</p>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <label className="flex h-10 w-full items-center gap-2 rounded-card border border-line px-3 text-sm sm:w-56">
              <Search className="size-4 text-ink-muted" aria-hidden />
              <span className="sr-only">Rechercher</span>
              <input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher"
                className="w-full bg-transparent text-ink outline-none"
              />
            </label>
            <button
              type="button"
              disabled={!peutEcrire}
              onClick={() => ouvrirEdition()}
              className="inline-flex h-10 items-center gap-1 rounded-card border border-line px-3 text-sm text-ink-body"
            >
              <Plus className="size-3.5" /> Ajouter
            </button>
            <button
              type="button"
              disabled={!peutEcrire || visibles.length === 0}
              onClick={() => {
                const premier = visibles[0];
                if (premier) ouvrirEdition(premier);
              }}
              className="inline-flex h-10 items-center gap-1 rounded-card border border-line px-3 text-sm text-ink-body"
            >
              <Pencil className="size-3.5" /> Modifier
            </button>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-ink-muted">
                {[
                  "CODE",
                  "DÉSIGNATION",
                  "TYPE",
                  "PRESTATAIRE",
                  "PIÈCE JOINTE",
                  "VILLE",
                  "TARIF UNITAIRE",
                  "ACTIONS",
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
                          disabled={!peutEcrire}
                          onClick={() => ouvrirEdition(u)}
                          className="flex size-11 items-center justify-center rounded-card text-ink-muted hover:bg-surface md:size-8"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Retirer ${u.nom}`}
                          disabled={!peutEcrire}
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
                              const res = await retirerFicheUpsellDistante({
                                data: { upsellId: u.id },
                              });
                              if (!res.ok) {
                                toastErreur("L'upsell n'a pas été retiré.");
                                return;
                              }
                              modifierSession((e) => ({
                                ...e,
                                parametrage: {
                                  ...e.parametrage,
                                  upsells: e.parametrage.upsells.filter((x) => x.id !== u.id),
                                },
                              }));
                              setFiches((actuelles) => {
                                const suivantes = { ...actuelles };
                                delete suivantes[u.id];
                                return suivantes;
                              });
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
            disabled={enCours || !peutEcrire}
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
