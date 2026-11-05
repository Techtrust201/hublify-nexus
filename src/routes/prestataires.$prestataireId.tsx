// SOURCE: V2 Redris — fiche prestataire (« Mes prestataires » / détail)
import { useDroit } from "@/auth/auth-context";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Mail, MapPin, Phone, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { EcranAttente } from "@/components/layout/EcranAttente";
import {
  modifierPrestataire,
  retirerPrestataire,
  useSession,
  useSessionChargee,
} from "@/data/session";
import type { CategoriePrestataire } from "@/data/types";
import { confirmer, toastErreur, toastOk } from "@/lib/feedback";
import { emailValide, telephoneValide } from "@/lib/saisie";

export const Route = createFileRoute("/prestataires/$prestataireId")({
  head: () => ({
    meta: [
      { title: "Fiche prestataire — Hublify" },
      {
        name: "description",
        content:
          "Fiche prestataire Hublify : coordonnées, catégorie d'intervention et missions affectées.",
      },
      { property: "og:title", content: "Fiche prestataire — Hublify" },
      {
        property: "og:description",
        content: "Coordonnées et missions affectées à un prestataire.",
      },
    ],
  }),
  component: FichePrestataire,
});

const CATEGORIES: CategoriePrestataire[] = [
  "Ménage",
  "Maintenance",
  "Blanchisserie",
  "Jardinage",
  "Accueil",
];

function FichePrestataire() {
  const { prestataireId } = Route.useParams();
  const navigate = useNavigate();
  const peutMod = useDroit("mod-biens");
  const { prestataires, missions, biens } = useSession();
  const chargee = useSessionChargee();
  const presta = prestataires.find((p) => p.id === prestataireId);
  const [form, setForm] = useState({
    nom: "",
    categorie: "Ménage" as CategoriePrestataire,
    telephone: "",
    email: "",
    ville: "",
    actif: true,
  });
  const vu = useRef("");
  useEffect(() => {
    if (!presta || vu.current === presta.id) return;
    vu.current = presta.id;
    setForm({
      nom: presta.nom,
      categorie: presta.categorie,
      telephone: presta.telephone,
      email: presta.email,
      ville: presta.ville,
      actif: presta.actif,
    });
  }, [presta]);

  // Avant le chargement de l'état, l'absence ne prouve rien : le prestataire
  // existe peut-être. On attend d'en être sûr avant de conclure.
  useEffect(() => {
    if (chargee && !presta) void navigate({ to: "/prestataires" });
  }, [chargee, navigate, presta]);

  if (!presta) return <EcranAttente titre="Prestataire" />;

  const siennes = missions
    .filter((m) => m.assigne === presta.nom)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <AppShell titre={presta.nom} sousTitre={`${presta.categorie} · ${presta.ville}`}>
      <Link
        to="/prestataires"
        className="mb-2 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground md:mb-4 md:min-h-0"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux prestataires
      </Link>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-base font-semibold text-brand-strong">
              {presta.nom
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">{presta.nom}</p>
              <p className="text-xs text-muted-foreground">
                {presta.actif ? "Actif" : "Inactif"} · {presta.categorie}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <p className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" /> {presta.telephone}
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" /> {presta.email}
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" /> {presta.ville}
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <Star className="h-4 w-4" /> {presta.note.toFixed(1)} / 5
            </p>
          </div>
          {peutMod && (
            <form
              className="mt-4 space-y-3 border-t border-border pt-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.nom.trim() || !form.ville.trim()) {
                  toastErreur("Indiquez le nom et la ville du prestataire.");
                  return;
                }
                if (form.email.trim() && !emailValide(form.email)) {
                  toastErreur("Indiquez un e-mail valide.");
                  return;
                }
                if (form.telephone.trim() && !telephoneValide(form.telephone)) {
                  toastErreur("Indiquez un téléphone valide (8 chiffres au minimum).");
                  return;
                }
                modifierPrestataire(prestataireId, {
                  nom: form.nom.trim(),
                  categorie: form.categorie,
                  telephone: form.telephone.trim(),
                  email: form.email.trim(),
                  ville: form.ville.trim(),
                  actif: form.actif,
                });
                toastOk("Prestataire mis à jour.");
              }}
            >
              <label className="block text-xs text-muted-foreground">
                Nom
                <input
                  required
                  aria-label="Nom du prestataire"
                  value={form.nom}
                  onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                  className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
                />
              </label>
              <label className="block text-xs text-muted-foreground">
                Catégorie
                <select
                  aria-label="Catégorie"
                  value={form.categorie}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, categorie: e.target.value as CategoriePrestataire }))
                  }
                  className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-muted-foreground">
                Ville
                <input
                  aria-label="Ville"
                  value={form.ville}
                  onChange={(e) => setForm((f) => ({ ...f, ville: e.target.value }))}
                  className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
                />
              </label>
              <label className="block text-xs text-muted-foreground">
                Téléphone
                <input
                  aria-label="Téléphone du prestataire"
                  value={form.telephone}
                  onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
                  className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.actif}
                  onChange={(e) => setForm((f) => ({ ...f, actif: e.target.checked }))}
                />
                Actif
              </label>
              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center rounded-md bg-brand text-sm font-medium text-brand-foreground"
              >
                Enregistrer
              </button>
              <button
                type="button"
                className="inline-flex h-11 w-full items-center justify-center rounded-md border border-danger text-sm text-danger"
                onClick={() => {
                  void (async () => {
                    const ok = await confirmer({
                      titre: `Supprimer ${presta.nom} ?`,
                      description: "Le prestataire disparaît de l'annuaire.",
                      libelleConfirmer: "Supprimer",
                      danger: true,
                    });
                    if (!ok) return;
                    retirerPrestataire(prestataireId);
                    toastOk("Prestataire supprimé.");
                    void navigate({ to: "/prestataires" });
                  })();
                }}
              >
                Supprimer
              </button>
            </form>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card lg:col-span-2">
          <header className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              Missions affectées ({siennes.length})
            </h2>
          </header>
          <ul className="divide-y divide-border">
            {siennes.length === 0 && (
              <li className="px-4 py-6 text-sm text-muted-foreground">Aucune mission affectée.</li>
            )}
            {siennes.map((m) => (
              <li key={m.id}>
                <Link
                  to="/missions/$missionId"
                  params={{ missionId: m.id }}
                  className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-accent/50"
                >
                  <span className="w-28 text-xs text-muted-foreground">
                    {new Date(m.date).toLocaleDateString("fr-FR")} · {m.heure}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {m.titre}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {biens.find((b) => b.id === m.bienId)?.nom}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">{m.statut}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
