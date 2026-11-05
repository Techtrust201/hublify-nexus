import { Download, Eye, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BtnNavy, BtnOutline, Chip } from "@/components/documents/ui";
import { ScrollHint } from "@/components/layout/ScrollHint";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ITEMS_INVENTAIRE, type ItemInventaire } from "@/data/documents-mo1";
import { idNouveau, poserCollection, useSession } from "@/data/session";
import { confirmer, telechargerDemo, telechargerPdf, toastErreur, toastOk } from "@/lib/feedback";
import {
  besoinStock,
  centimesDepuisSaisie,
  champsDe,
  euroCentimes,
  lieuxDepuisSerie,
  serieAEnregistrer,
  serieDepuisLieux,
  verdictStock,
  type ChampsConsommable,
} from "@/lib/inventaire-maquette";
const ID_LIEUX = "meta-lieux-inventaire";

const ONGLETS = [
  { id: "1" as const, label: "Inventaire consommables 1" },
  { id: "2" as const, label: "Inventaire consommables 2" },
  { id: "conso" as const, label: "Consommables ménage" },
  { id: "linge" as const, label: "Linge de maison" },
];

const FORM_VIDE = {
  designation: "",
  emplacement: "",
  qte: "1",
  etat: "Bon",
  marque: "",
  typeArticle: "",
  prix: "",
  lieuStockage: "",
  seuil: "",
  qteParOccupant: "",
};

function estMeta(item: ItemInventaire) {
  return item.id === ID_LIEUX;
}

export function InventaireApp() {
  const session = useSession();
  const [onglet, setOnglet] = useState<"1" | "2" | "conso" | "linge">("1");
  const [recherche, setRecherche] = useState("");
  const [selection, setSelection] = useState<string[]>([]);
  const items = session.inventaire;
  const setItems = (maj: (liste: ItemInventaire[]) => ItemInventaire[]) =>
    poserCollection("inventaire", maj);
  const [edition, setEdition] = useState<ItemInventaire | null>(null);
  const [fiche, setFiche] = useState<ItemInventaire | null>(null);
  const [creer, setCreer] = useState(false);
  const [ajouterLieu, setAjouterLieu] = useState(false);
  const [form, setForm] = useState(FORM_VIDE);

  useEffect(() => {
    const ids = new Set(items.map((i) => i.id));
    const manquants = ITEMS_INVENTAIRE.filter((i) => i.onglet === "linge" && !ids.has(i.id));
    if (manquants.length === 0) return;
    setItems((liste) => {
      const connus = new Set(liste.map((i) => i.id));
      const ajout = manquants.filter((i) => !connus.has(i.id));
      return ajout.length ? [...ajout, ...liste] : liste;
    });
  }, [items]);

  const lignes = useMemo(() => items.filter((i) => !estMeta(i)), [items]);
  const lieuxAssignes = lieuxDepuisSerie(items.find(estMeta)?.serie);

  const filtrés = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return lignes
      .filter((i) => i.onglet === onglet)
      .filter((i) => {
        const champs = champsDe(i.serie);
        const texte = `${i.code} ${i.designation} ${i.emplacement} ${champs.marque} ${champs.typeArticle} ${champs.lieuStockage}`;
        return !q || texte.toLowerCase().includes(q);
      });
  }, [onglet, recherche, lignes]);

  const occupants = session.reservationsDossier
    .filter((r) => r.statut !== "Annulé")
    .reduce((n, r) => n + (r.voyageurs || 0), 0);
  const reservationsActives = session.reservationsDossier.filter(
    (r) => r.statut !== "Annulé",
  ).length;
  const suivi = filtrés
    .map((i) => {
      const champs = champsDe(i.serie);
      const besoin = besoinStock(champs, occupants);
      return { item: i, champs, besoin, verdict: verdictStock(i.qte, besoin) };
    })
    .filter((l) => l.verdict !== "non-suivi");

  const titre = ONGLETS.find((o) => o.id === onglet)?.label ?? "Inventaire";
  const vitrine = lignes.filter((i) => i.onglet === "1").slice(0, 2);
  const biensDispos = session.biens.map((b) => b.nom).filter((n) => !lieuxAssignes.includes(n));

  const supprimer = async (ids: string[]) => {
    const ok = await confirmer({
      titre: ids.length > 1 ? `Retirer ${ids.length} éléments ?` : "Retirer cet élément ?",
      description: "La ligne est retirée de l'inventaire enregistré.",
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
    const prix = centimesDepuisSaisie(form.prix);
    if (prix === null) {
      toastErreur("Indiquez un prix unitaire valide, ou laissez le champ vide.");
      return;
    }
    const seuil = Number(form.seuil.replace(",", "."));
    const parOccupant = Number(form.qteParOccupant.replace(",", "."));
    if (form.seuil.trim() && (!Number.isFinite(seuil) || seuil < 0)) {
      toastErreur("Le seuil de stock doit être un nombre.");
      return;
    }
    if (form.qteParOccupant.trim() && (!Number.isFinite(parOccupant) || parOccupant < 0)) {
      toastErreur("La quantité par occupant doit être un nombre.");
      return;
    }
    const champs: ChampsConsommable = {
      marque: form.marque.trim(),
      typeArticle: form.typeArticle.trim(),
      prixCentimes: prix,
      lieuStockage: form.lieuStockage.trim(),
      seuil: form.seuil.trim() ? Math.round(seuil) : 0,
      qteParOccupant: form.qteParOccupant.trim() ? Math.round(parOccupant) : 0,
    };
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
                serie: serieAEnregistrer(champs, i.serie),
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
          serie: serieAEnregistrer(champs, ""),
          onglet,
        },
        ...liste,
      ]);
      toastOk("Élément ajouté.");
      setCreer(false);
    }
    setForm(FORM_VIDE);
  };

  const ouvrirEdition = (cible: ItemInventaire) => {
    const champs = champsDe(cible.serie);
    setForm({
      designation: cible.designation,
      emplacement: cible.emplacement,
      qte: String(cible.qte),
      etat: cible.etat,
      marque: champs.marque,
      typeArticle: champs.typeArticle,
      prix: champs.prixCentimes ? String(champs.prixCentimes / 100).replace(".", ",") : "",
      lieuStockage: champs.lieuStockage,
      seuil: champs.seuil ? String(champs.seuil) : "",
      qteParOccupant: champs.qteParOccupant ? String(champs.qteParOccupant) : "",
    });
    setEdition(cible);
  };

  const poserLieux = (noms: string[]) => {
    setItems((liste) => {
      const sans = liste.filter((i) => !estMeta(i));
      if (noms.length === 0) return sans;
      const meta: ItemInventaire = {
        id: ID_LIEUX,
        code: "",
        designation: "Lieux d'utilisation",
        etat: "meta",
        qte: 0,
        emoji: "",
        emplacement: "",
        serie: serieDepuisLieux(noms),
        onglet: "1",
      };
      return [meta, ...sans];
    });
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl text-ink">Inventaire</h2>
        <p className="max-w-xl text-sm text-ink-subtle">
          Tous les inventaires des consommables sont réunis ici
        </p>
      </div>

      <section className="mb-4 flex flex-wrap items-center gap-3 rounded-card bg-[#f3f1ea] px-4 py-3">
        {vitrine.map((i) => {
          const champs = champsDe(i.serie);
          return (
            <article
              key={i.id}
              className="flex w-[210px] items-center gap-2 rounded-card border border-line bg-white p-2"
            >
              <span className="flex size-14 shrink-0 items-center justify-center rounded-[8px] bg-surface-soft text-2xl">
                {i.emoji || "📦"}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs text-ink">{i.designation}</span>
                <span className="block truncate text-[10px] text-ink-muted">
                  {champs.marque || i.code} · {i.qte} pièces
                </span>
                <span className="block text-[10px] text-ink">
                  {champs.prixCentimes > 0 ? euroCentimes(champs.prixCentimes) : "—"}
                </span>
              </span>
            </article>
          );
        })}
        <p className="text-sm text-ink">Proposition commerciale — À VOIR PLUS TARD</p>
      </section>

      <div className="mb-4 flex flex-wrap gap-2">
        {ONGLETS.map((o) => (
          <Chip key={o.id} actif={onglet === o.id} onClick={() => setOnglet(o.id)}>
            {o.label}
          </Chip>
        ))}
      </div>

      <section className="mb-4 rounded-card border border-line bg-white px-4 py-3">
        <p className="text-sm text-ink">
          Assigner un ou plusieurs lieu d'utilisation de cet inventaire :
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {lieuxAssignes.map((nom) => (
            <button
              key={nom}
              type="button"
              onClick={() => poserLieux(lieuxAssignes.filter((n) => n !== nom))}
              className="inline-flex h-8 items-center gap-1 rounded-full border border-line px-2 text-xs text-ink"
            >
              {nom}
              <X className="size-3" />
              <span className="sr-only">Retirer {nom}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAjouterLieu(true)}
            className="inline-flex size-8 items-center justify-center rounded-full border border-line text-sm text-ink"
            aria-label="Assigner un lieu"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          Vous pouvez paramétrer une alerte de fin de stock en fonction des réservations et du
          nombre de voyageurs.
        </p>
      </section>

      <section className="@container overflow-hidden rounded-card border border-line bg-white">
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
                setForm(FORM_VIDE);
                setCreer(true);
              }}
            >
              <Plus className="size-3" /> Ajouter item
            </BtnOutline>
            <BtnOutline
              disabled={selection.length !== 1}
              onClick={() => {
                const cible = lignes.find((i) => i.id === selection[0]);
                if (!cible) return;
                ouvrirEdition(cible);
              }}
            >
              <Pencil className="size-3" /> Modifier
            </BtnOutline>
            <BtnOutline disabled={selection.length === 0} onClick={() => supprimer(selection)}>
              <Trash2 className="size-3" /> Supprimer
            </BtnOutline>
          </div>
        </header>

        <div className="divide-y divide-surface-soft @min-[920px]:hidden">
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
                  onClick={() => ouvrirEdition(i)}
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
                : "Cet inventaire est vide. Utilisez « Ajouter item »."}
            </p>
          )}
        </div>
        <ScrollHint className="hidden @min-[920px]:block">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-surface-soft text-xs text-ink-subtle">
              <tr>
                <th className="w-14 px-6 py-4" />
                <th className="px-3 py-4 text-[11px] font-medium tracking-wide">MARQUE</th>
                <th className="px-3 py-4 text-[11px] font-medium tracking-wide">DÉSIGNATION</th>
                <th className="px-3 py-4 text-[11px] font-medium tracking-wide">TYPE</th>
                <th className="px-3 py-4 text-[11px] font-medium tracking-wide">QTÉ</th>
                <th className="px-3 py-4 text-[11px] font-medium tracking-wide">EMPLACEMENT</th>
                <th className="px-3 py-4 text-[11px] font-medium tracking-wide">PRIX UNITAIRE</th>
                <th className="px-3 py-4 text-[11px] font-medium tracking-wide">LIEU STOCKAGE</th>
                <th className="px-3 py-4 text-[11px] font-medium tracking-wide">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtrés.map((i) => {
                const champs = champsDe(i.serie);
                return (
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
                    <td className="px-3 py-4 text-ink">{champs.marque || "—"}</td>
                    <td className="px-3 py-4 text-ink">{i.designation}</td>
                    <td className="px-3 py-4 text-ink-body">{champs.typeArticle || i.etat}</td>
                    <td className="px-3 py-4 text-ink">{i.qte}</td>
                    <td className="px-3 py-4 text-ink-body">{i.emplacement}</td>
                    <td className="px-3 py-4 text-ink-body">
                      {champs.prixCentimes > 0 ? euroCentimes(champs.prixCentimes) : "—"}
                    </td>
                    <td className="px-3 py-4 text-ink-body">{champs.lieuStockage || "—"}</td>
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
                          onClick={() => ouvrirEdition(i)}
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
                );
              })}
              {filtrés.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-sm text-ink-muted">
                    {recherche.trim()
                      ? "Aucun élément pour cette recherche."
                      : "Cet inventaire est vide. Utilisez « Ajouter item »."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </ScrollHint>
        <div className="flex justify-end px-4 py-3">
          <BtnOutline
            onClick={() => {
              const csv = [
                "Marque;Designation;Type;Qte;Emplacement;Prix;LieuStockage",
                ...filtrés.map((i) => {
                  const champs = champsDe(i.serie);
                  return `${champs.marque};${i.designation};${champs.typeArticle || i.etat};${i.qte};${i.emplacement};${champs.prixCentimes};${champs.lieuStockage}`;
                }),
              ];
              telechargerDemo(`inventaire-${onglet}.csv`, csv.join("\n"));
            }}
          >
            <Download className="size-3" /> Télécharger le tableau
          </BtnOutline>
        </div>
      </section>

      <section className="mt-4 rounded-card bg-[#d9d9d9] px-5 py-4 text-sm text-ink">
        <h3 className="font-medium">État et prévision du stock</h3>
        <p className="mt-1 text-xs text-ink-body">
          {lieuxAssignes[0] ?? "Aucun lieu assigné"} · {reservationsActives} réservation
          {reservationsActives > 1 ? "s" : ""} · {occupants} occupant{occupants > 1 ? "s" : ""}{" "}
          total
        </p>
        {suivi.length === 0 ? (
          <p className="mt-3 text-xs text-ink-body">
            Aucun seuil. Ouvrez un élément et indiquez une quantité par occupant, ou un seuil, pour
            suivre le stock.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {suivi.map(({ item, champs, besoin, verdict }) => (
              <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-2">
                <span>
                  {item.designation}
                  {champs.marque ? ` · ${champs.marque}` : ""}
                  <span className="ml-2 text-xs text-ink-body">
                    {champs.qteParOccupant > 0
                      ? `${champs.qteParOccupant} par occupant`
                      : `seuil ${champs.seuil}`}
                    {" · "}besoin {besoin}
                  </span>
                </span>
                <span className="text-xs font-medium">
                  {verdict === "correct" ? "Stock CORRECT" : "Stock INCORRECT"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-4 text-xs text-ink-muted">
        <Link to="/outils/etats-des-lieux" className="font-medium text-ink underline">
          Ouvrir l'inventaire logement et mobilier
        </Link>
      </p>

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
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="block text-xs text-ink-muted">
              Marque
              <input
                value={form.marque}
                onChange={(e) => setForm((f) => ({ ...f, marque: e.target.value }))}
                className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
              />
            </label>
            <label className="block text-xs text-ink-muted">
              Type
              <input
                value={form.typeArticle}
                onChange={(e) => setForm((f) => ({ ...f, typeArticle: e.target.value }))}
                className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
              />
            </label>
          </div>
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
              Prix unitaire (€)
              <input
                value={form.prix}
                onChange={(e) => setForm((f) => ({ ...f, prix: e.target.value }))}
                placeholder="8,20"
                className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
              />
            </label>
            <label className="block text-xs text-ink-muted">
              Lieu de stockage
              <input
                value={form.lieuStockage}
                onChange={(e) => setForm((f) => ({ ...f, lieuStockage: e.target.value }))}
                className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
              />
            </label>
            <label className="block text-xs text-ink-muted">
              Seuil
              <input
                value={form.seuil}
                onChange={(e) => setForm((f) => ({ ...f, seuil: e.target.value }))}
                className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
              />
            </label>
            <label className="block text-xs text-ink-muted">
              Quantité par occupant
              <input
                value={form.qteParOccupant}
                onChange={(e) => setForm((f) => ({ ...f, qteParOccupant: e.target.value }))}
                className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
              />
            </label>
          </div>
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
              <p>Marque : {champsDe(fiche.serie).marque || "—"}</p>
              <p>Lieu de stockage : {champsDe(fiche.serie).lieuStockage || "—"}</p>
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

      <Dialog open={ajouterLieu} onOpenChange={setAjouterLieu}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Assigner un lieu</DialogTitle>
          <DialogDescription>
            Le lieu reste associé à cet inventaire après rechargement.
          </DialogDescription>
          {biensDispos.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">Tous les logements sont déjà assignés.</p>
          ) : (
            <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto">
              {biensDispos.map((nom) => (
                <li key={nom}>
                  <button
                    type="button"
                    onClick={() => {
                      poserLieux([...lieuxAssignes, nom]);
                      setAjouterLieu(false);
                      toastOk(`${nom} utilise cet inventaire.`);
                    }}
                    className="flex min-h-11 w-full items-center rounded-card px-2 text-left text-sm text-ink hover:bg-surface"
                  >
                    {nom}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
