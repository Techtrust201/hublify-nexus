import { Download, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BtnNavy, BtnOutline, Chip } from "@/components/documents/ui";
import { ScrollHint } from "@/components/layout/ScrollHint";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { type ItemInventaire } from "@/data/documents-mo1";
import { idNouveau, poserCollection, useSession } from "@/data/session";
import { confirmer, telechargerDemo, telechargerPdf, toastErreur, toastOk } from "@/lib/feedback";
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
  const items = useSession().inventaire;
  const setItems = (maj: (liste: ItemInventaire[]) => ItemInventaire[]) =>
    poserCollection("inventaire", maj);
  const [edition, setEdition] = useState<ItemInventaire | null>(null);
  const [fiche, setFiche] = useState<ItemInventaire | null>(null);
  const [creer, setCreer] = useState(false);
  const [form, setForm] = useState({ designation: "", emplacement: "", qte: "1", etat: "Bon" });

  const filtrés = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return items
      .filter((i) => i.onglet === onglet)
      .filter(
        (i) =>
          !q ||
          i.code.toLowerCase().includes(q) ||
          i.designation.toLowerCase().includes(q) ||
          i.emplacement.toLowerCase().includes(q),
      );
  }, [onglet, recherche, items]);

  const titre =
    onglet === "1"
      ? "Inventaire 1"
      : onglet === "2"
        ? "Inventaire 2"
        : "Inventaire des consommables";

  const supprimer = async (ids: string[]) => {
    const ok = await confirmer({
      titre: ids.length > 1 ? `Retirer ${ids.length} éléments ?` : "Retirer cet élément ?",
      description:
        "L'inventaire est enregistré localement : vous pourrez recréer la ligne à tout moment.",
      libelleConfirmer: "Retirer",
      danger: true,
    });
    if (!ok) return;
    setItems((liste) => liste.filter((i) => !ids.includes(i.id)));
    setSelection([]);
    toastOk(ids.length > 1 ? `${ids.length} éléments retirés.` : "Élément retiré.");
  };

  const enregistrerItem = () => {
    const designation = form.designation.trim();
    if (!designation) {
      toastErreur("La désignation est obligatoire.");
      return;
    }
    const qteSaisie = Number(form.qte.replace(",", "."));
    if (!Number.isFinite(qteSaisie) || qteSaisie < 0) {
      toastErreur("Indiquez une quantité valide.");
      return;
    }
    const qte = Math.round(qteSaisie);
    if (edition) {
      setItems((liste) =>
        liste.map((i) =>
          i.id === edition.id
            ? {
                ...i,
                designation,
                emplacement: form.emplacement.trim() || i.emplacement,
                qte,
                etat: form.etat,
              }
            : i,
        ),
      );
      toastOk("Élément mis à jour.");
      setEdition(null);
      setSelection([]);
    } else {
      setItems((liste) => [
        {
          id: idNouveau("inv"),
          code: `NEW-${Date.now().toString(36).toUpperCase()}`,
          designation,
          etat: form.etat,
          qte,
          emoji: "📦",
          emplacement: form.emplacement.trim() || "—",
          serie: "—",
          onglet,
        },
        ...liste,
      ]);
      toastOk("Élément ajouté.");
      setCreer(false);
    }
    setForm({ designation: "", emplacement: "", qte: "1", etat: "Bon" });
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl text-ink">Inventaire</h2>
          <p className="text-sm text-ink-subtle">
            Tous les inventaires de la maison sont réunis ici
          </p>
        </div>
        <BtnNavy
          className="h-[49px] px-5 text-sm"
          onClick={() => {
            const lignes = [
              "Code;Designation;Etat;Qte;Emplacement;Serie",
              ...filtrés.map(
                (i) => `${i.code};${i.designation};${i.etat};${i.qte};${i.emplacement};${i.serie}`,
              ),
            ];
            telechargerDemo(`inventaire-${onglet}.csv`, lignes.join("\n"));
          }}
        >
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
            <span className="text-sm text-ink-muted">{filtrés.length} éléments</span>
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
            <BtnOutline
              onClick={() => {
                setForm({ designation: "", emplacement: "", qte: "1", etat: "Bon" });
                setCreer(true);
              }}
            >
              <Plus className="size-3" /> Ajouter un élément
            </BtnOutline>
            <BtnOutline
              disabled={selection.length !== 1}
              onClick={() => {
                const cible = items.find((i) => i.id === selection[0]);
                if (!cible) return;
                setForm({
                  designation: cible.designation,
                  emplacement: cible.emplacement,
                  qte: String(cible.qte),
                  etat: cible.etat,
                });
                setEdition(cible);
              }}
            >
              <Pencil className="size-3" /> Modifier
            </BtnOutline>
            <BtnOutline disabled={selection.length === 0} onClick={() => supprimer(selection)}>
              <Trash2 className="size-3" /> Supprimer
            </BtnOutline>
          </div>
        </header>

        <div className="divide-y divide-surface-soft md:hidden">
          {filtrés.map((i) => (
            <article key={i.id} className="px-4 py-4">
              <div className="flex items-start justify-between gap-2">
                <label className="flex min-h-11 min-w-0 items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selection.includes(i.id)}
                    onChange={() =>
                      setSelection((s) =>
                        s.includes(i.id) ? s.filter((x) => x !== i.id) : [...s, i.id],
                      )
                    }
                    aria-label={`Sélectionner ${i.designation}`}
                  />
                  <span>
                    <span className="block text-sm font-medium text-ink">{i.designation}</span>
                    <span className="block text-xs text-ink-muted">
                      {i.code} · {i.emplacement} · Qté {i.qte}
                    </span>
                  </span>
                </label>
                <span className="text-xl leading-none">{i.emoji}</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFiche(i)}
                  className="inline-flex h-11 items-center justify-center rounded-card border border-line text-xs font-medium text-ink-body"
                >
                  Voir
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm({
                      designation: i.designation,
                      emplacement: i.emplacement,
                      qte: String(i.qte),
                      etat: i.etat,
                    });
                    setEdition(i);
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-card border border-line text-xs font-medium text-ink-body"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => supprimer([i.id])}
                  className="inline-flex h-11 items-center justify-center rounded-card border border-line text-xs font-medium text-ink-body"
                >
                  Supprimer
                </button>
              </div>
            </article>
          ))}
          {filtrés.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-ink-muted">
              {recherche.trim()
                ? "Aucun élément pour cette recherche."
                : "Cet inventaire est vide. Utilisez « Ajouter un élément »."}
            </p>
          )}
        </div>
        <ScrollHint className="hidden md:block">
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
              {filtrés.map((i) => (
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
                      <button
                        type="button"
                        aria-label={`Voir ${i.designation}`}
                        className="flex size-8 items-center justify-center rounded-card text-ink-body hover:bg-surface-soft"
                        onClick={() => setFiche(i)}
                      >
                        <Eye className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Modifier ${i.designation}`}
                        className="flex size-8 items-center justify-center rounded-card text-ink-body hover:bg-surface-soft"
                        onClick={() => {
                          setForm({
                            designation: i.designation,
                            emplacement: i.emplacement,
                            qte: String(i.qte),
                            etat: i.etat,
                          });
                          setEdition(i);
                        }}
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Supprimer ${i.designation}`}
                        className="flex size-8 items-center justify-center rounded-card text-ink-body hover:bg-surface-soft"
                        onClick={() => supprimer([i.id])}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtrés.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-sm text-ink-muted">
                    {recherche.trim()
                      ? "Aucun élément pour cette recherche."
                      : "Cet inventaire est vide. Utilisez « Ajouter un élément »."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </ScrollHint>
      </section>

      <Dialog
        open={creer || Boolean(edition)}
        onOpenChange={(o) => {
          if (!o) {
            setCreer(false);
            setEdition(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogTitle>{edition ? "Modifier l'élément" : "Nouvel élément"}</DialogTitle>
          <DialogDescription>L'élément apparaît dans l'onglet {titre}.</DialogDescription>
          <label className="mt-3 block text-xs text-ink-muted">
            Désignation
            <input
              value={form.designation}
              onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
              className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
            />
          </label>
          <label className="mt-3 block text-xs text-ink-muted">
            Emplacement
            <input
              value={form.emplacement}
              onChange={(e) => setForm((f) => ({ ...f, emplacement: e.target.value }))}
              className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
            />
          </label>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="block text-xs text-ink-muted">
              Quantité
              <input
                value={form.qte}
                onChange={(e) => setForm((f) => ({ ...f, qte: e.target.value }))}
                className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
              />
            </label>
            <label className="block text-xs text-ink-muted">
              État
              <select
                value={form.etat}
                onChange={(e) => setForm((f) => ({ ...f, etat: e.target.value }))}
                className="mt-1 h-9 w-full rounded-card border border-line bg-white px-2 text-sm text-ink"
              >
                <option>Très bon</option>
                <option>Bon</option>
                <option>Moyen</option>
                <option>Usé</option>
              </select>
            </label>
          </div>
          <BtnNavy className="mt-4 w-full justify-center" onClick={enregistrerItem}>
            Enregistrer
          </BtnNavy>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(fiche)} onOpenChange={(o) => !o && setFiche(null)}>
        <DialogContent className="max-w-sm">
          <DialogTitle>{fiche?.designation}</DialogTitle>
          <DialogDescription>
            {fiche?.code} · {fiche?.emplacement}
          </DialogDescription>
          {fiche && (
            <div className="mt-3 space-y-1 text-sm text-ink-body">
              <p>État : {fiche.etat}</p>
              <p>Quantité : {fiche.qte}</p>
              <p>N° de série : {fiche.serie}</p>
              <BtnNavy
                className="mt-3 w-full justify-center"
                onClick={() =>
                  void telechargerPdf(fiche.designation, [], {
                    extra: [
                      `Code : ${fiche.code}`,
                      `Etat : ${fiche.etat}`,
                      `Quantite : ${fiche.qte}`,
                      `Emplacement : ${fiche.emplacement}`,
                      `Logement : ${fiche.emplacement}`,
                      `Serie : ${fiche.serie}`,
                    ],
                    identifiant: fiche.code,
                    logement: fiche.emplacement,
                    adresse: fiche.emplacement,
                  })
                }
              >
                Télécharger la fiche
              </BtnNavy>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
