import { createFileRoute, Link } from "@tanstack/react-router";
import { PageRessource } from "@/components/marketing/PageRessource";
import { SitePublic } from "@/components/marque/SitePublic";
import { MODELES_DOCS } from "@/data/documents-mo1";

export const Route = createFileRoute("/modeles")({
  head: () => ({
    meta: [
      { title: "Modèles de documents — Hublify" },
      {
        name: "description",
        content: "La liste des modèles déjà présents dans l'espace documents Hublify.",
      },
    ],
  }),
  component: PageModeles,
});

function PageModeles() {
  const categories = [...new Set(MODELES_DOCS.map((modele) => modele.categorie))];
  return (
    <SitePublic>
      <PageRessource
        kicker="Modèles gratuits"
        titre="Les modèles déjà dans l'espace"
        introduction="Ce sont les pièces livrées avec Hublify : baux, quittance, factures, attestation, devis et contrats. Les ouvrir, les dupliquer ou les remplir se fait une fois connecté, dans Modèles de documents."
      >
        {categories.map((categorie) => (
          <section key={categorie} className="border-t border-v1-line pt-8">
            <h2 className="font-display text-2xl text-v1-ink">{categorie}</h2>
            <ul className="mt-4 divide-y divide-v1-line rounded-xl border border-v1-line bg-white">
              {MODELES_DOCS.filter((modele) => modele.categorie === categorie).map((modele) => (
                <li
                  key={modele.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3"
                >
                  <span>
                    <span className="block text-sm font-medium text-v1-ink">
                      {modele.designation}
                    </span>
                    <span className="text-xs text-v1-ink-muted">
                      {modele.type} · {modele.reference}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <p className="text-sm text-v1-ink-body">
          <Link to="/connexion" className="font-medium text-v1-brand">
            Se connecter pour les utiliser
          </Link>
        </p>
      </PageRessource>
    </SitePublic>
  );
}
