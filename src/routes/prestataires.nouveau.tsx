// SOURCE: V2 Redris — « AddPrestataireForm.tsx », « Enregistrer le prestataire »
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ajouterPrestataire } from "@/data/session";
import { toastOk } from "@/lib/feedback";
import type { CategoriePrestataire } from "@/data/types";

export const Route = createFileRoute("/prestataires/nouveau")({
  head: () => ({
    meta: [
      { title: "Ajouter un prestataire — Hublify" },
      {
        name: "description",
        content:
          "Formulaire d'ajout d'un prestataire Hublify : identité, catégorie d'intervention, coordonnées et ville.",
      },
      { property: "og:title", content: "Ajouter un prestataire — Hublify" },
      {
        property: "og:description",
        content: "Enregistrer un nouveau prestataire dans l'annuaire Hublify.",
      },
    ],
  }),
  component: AjoutPrestataire,
});

const CATEGORIES: CategoriePrestataire[] = [
  "Ménage",
  "Maintenance",
  "Blanchisserie",
  "Jardinage",
  "Accueil",
];

const champ =
  "mt-1 h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand md:h-auto";

function AjoutPrestataire() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nom: "",
    categorie: "Ménage" as CategoriePrestataire,
    telephone: "",
    email: "",
    ville: "",
    actif: true,
  });

  const soumettre = (e: React.FormEvent) => {
    e.preventDefault();
    const id = ajouterPrestataire({ ...form, note: 0 });
    toastOk("Prestataire ajouté.");
    navigate({ to: "/prestataires/$prestataireId", params: { prestataireId: id } });
  };

  return (
    <AppShell titre="Ajouter un prestataire" sousTitre="Le prestataire est rattaché à votre organisation">
      <Link
        to="/prestataires"
        className="mb-2 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground md:mb-4 md:min-h-0"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux prestataires
      </Link>

      <form
        onSubmit={soumettre}
        className="max-w-2xl space-y-4 rounded-xl border border-border bg-card p-5"
      >
        <div>
          <label className="text-xs font-medium text-muted-foreground" htmlFor="nom">
            Nom et prénom
          </label>
          <input
            id="nom"
            required
            className={champ}
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground" htmlFor="categorie">
              Catégorie
            </label>
            <select
              id="categorie"
              className={champ}
              value={form.categorie}
              onChange={(e) =>
                setForm({ ...form, categorie: e.target.value as CategoriePrestataire })
              }
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground" htmlFor="ville">
              Ville
            </label>
            <input
              id="ville"
              required
              className={champ}
              value={form.ville}
              onChange={(e) => setForm({ ...form, ville: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground" htmlFor="telephone">
              Téléphone
            </label>
            <input
              id="telephone"
              required
              className={champ}
              value={form.telephone}
              onChange={(e) => setForm({ ...form, telephone: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              className={champ}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>

        <label className="flex min-h-11 items-center gap-2 text-sm text-foreground md:min-h-0">
          <input
            type="checkbox"
            checked={form.actif}
            onChange={(e) => setForm({ ...form, actif: e.target.checked })}
          />
          Prestataire actif
        </label>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:opacity-90 md:min-h-0"
          >
            Enregistrer le prestataire
          </button>
          <Link
            to="/prestataires"
            className="inline-flex min-h-11 items-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent md:min-h-0"
          >
            Annuler
          </Link>
        </div>
      </form>
    </AppShell>
  );
}
