import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  FileText,
  History,
  Info,
  Settings,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useDroit } from "@/auth/auth-context";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/outils/")({
  head: () => ({
    meta: [{ title: "Outils — Hublify" }],
  }),
  component: PageOutils,
});

const OUTILS = [
  {
    titre: "Modèles de documents",
    texte: "Créez et gérez vos modèles de factures, devis, quittances et contrats.",
    icone: FileText,
    vers: "/outils/modeles" as const,
  },
  {
    titre: "Baux",
    texte: "Espace de rédaction page par page, avec la prise de caution.",
    icone: FileText,
    vers: "/outils/baux" as const,
  },
  {
    titre: "Vue Annuelle",
    texte: "Disponibilités, blocages et réservations sur l'année.",
    icone: CalendarDays,
    vers: "/outils/vue-annuelle" as const,
  },
  {
    titre: "Inventaire",
    texte: "Conciergerie : draps, linge de maison et consommables.",
    icone: ClipboardList,
    vers: "/inventaire" as const,
  },
  {
    titre: "États des lieux",
    texte: "Espace de rédaction : entrée, sortie, inventaire du logement et du mobilier.",
    icone: ClipboardCheck,
    vers: "/outils/etats-des-lieux" as const,
  },
  {
    titre: "Paramétrage",
    texte: "Notifications, formulaires voyageurs et upsells.",
    icone: Settings,
    vers: "/parametrage" as const,
  },
  {
    titre: "Upsells",
    texte: "Ventes additionnelles : code, tarif, prestataire, ville et pièce jointe.",
    icone: Sparkles,
    vers: "/outils/upsells" as const,
  },
  {
    titre: "Timeline",
    texte: "Échanges de documents et réservations, du plus récent au plus ancien.",
    icone: History,
    vers: "/outils/timeline" as const,
  },
  {
    titre: "Fiche d'accès et livret",
    texte: "Modèles d'accueil à personnaliser, dupliquer et remettre au voyageur.",
    icone: BookOpen,
    vers: "/outils/livret" as const,
  },
  {
    titre: "Je débute",
    texte: "Fiche, documents reçus, paiement ou caution, puis les étapes du compte.",
    icone: Info,
    vers: "/outils/debuter" as const,
  },
  {
    titre: "Je découvre",
    texte: "Tous les modules de la maquette : planning, documents, messagerie, tarifs.",
    icone: Wrench,
    vers: "/" as const,
  },
];

function PageOutils() {
  const peutParametrer = useDroit("mod-biens");
  const peutReserver = useDroit("mod-reservations");
  const voirDocs = useDroit("voir-documents");
  const voirCal = useDroit("voir-calendrier");
  const voirBiens = useDroit("voir-biens");
  const outils = OUTILS.filter((o) => {
    if (o.vers === "/parametrage" || o.vers === "/outils/upsells") return peutParametrer;
    if (o.vers === "/outils/debuter") return peutReserver;
    if (
      o.vers === "/outils/modeles" ||
      o.vers === "/outils/etats-des-lieux" ||
      o.vers === "/outils/baux" ||
      o.vers === "/outils/timeline" ||
      o.vers === "/outils/livret"
    )
      return voirDocs;
    if (o.vers === "/outils/vue-annuelle") return voirCal;
    if (o.vers === "/inventaire") return voirBiens;
    return true;
  });
  return (
    <AppShell titre="Outils" sousTitre="Tous les outils">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {outils.map((o) => (
          <article key={o.titre} className="rounded-card border border-line bg-white p-4">
            <o.icone className="size-4 text-ink-body" />
            <h2 className="mt-3 text-sm font-medium text-ink">{o.titre}</h2>
            <p className="mt-1 text-xs text-ink-subtle">{o.texte}</p>
            {o.vers && (
              <Link
                to={o.vers}
                className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-ink-body"
              >
                Ouvrir
              </Link>
            )}
          </article>
        ))}
      </div>
    </AppShell>
  );
}
