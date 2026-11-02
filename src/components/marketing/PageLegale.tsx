import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function PageLegale({
  titre,
  kicker,
  children,
}: {
  titre: string;
  kicker: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16 lg:px-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.8px] text-v1-brand">{kicker}</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-v1-ink">
        {titre}
      </h1>
      <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-v1-ink-body">{children}</div>
      <p className="mt-10 text-sm">
        <Link to="/faq" className="font-medium text-v1-brand">
          Une question ? Voir la FAQ
        </Link>
      </p>
    </article>
  );
}
