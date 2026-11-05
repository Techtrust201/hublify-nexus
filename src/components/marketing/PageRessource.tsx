import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function PageRessource({
  kicker,
  titre,
  introduction,
  sommaire,
  children,
}: {
  kicker: string;
  titre: string;
  introduction: string;
  sommaire?: readonly { id: string; titre: string }[];
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16 lg:px-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.8px] text-v1-brand">{kicker}</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-v1-ink">
        {titre}
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-v1-ink-body">{introduction}</p>
      {sommaire && sommaire.length > 0 ? (
        <nav className="mt-8" aria-label="Dans cette page">
          <ol className="space-y-2 text-sm">
            {sommaire.map((entree) => (
              <li key={entree.id}>
                <a href={`#${entree.id}`} className="font-medium text-v1-brand">
                  {entree.titre}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      <div className="mt-10 space-y-12">{children}</div>
      <p className="mt-12 text-sm">
        <Link to="/" className="font-medium text-v1-brand">
          Retour à l'accueil
        </Link>
      </p>
    </article>
  );
}

export function ArticleRessource({
  id,
  titre,
  meta,
  paragraphes,
}: {
  id: string;
  titre: string;
  meta: string;
  paragraphes: readonly string[];
}) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-v1-line pt-8">
      <h2 className="font-display text-2xl tracking-tight text-v1-ink">{titre}</h2>
      <p className="mt-1 text-xs text-v1-ink-muted">{meta}</p>
      {paragraphes.map((texte) => (
        <p key={texte} className="mt-4 text-[15px] leading-relaxed text-v1-ink-body">
          {texte}
        </p>
      ))}
    </section>
  );
}
