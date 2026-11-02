import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/marque/Logo";
import { lienParrainage } from "@/design/offres";

export function ParrainagePage() {
  const [copie, setCopie] = useState(false);

  async function copierLien() {
    const lien = lienParrainage(window.location.origin);
    try {
      await navigator.clipboard.writeText(lien);
      setCopie(true);
    } catch {
      setCopie(false);
    }
  }

  return (
    <div className="bg-v1-brand-soft px-4 py-10 sm:px-8">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <Logo />
        <h1 className="mt-8 font-display text-2xl font-semibold text-v1-ink">Parrainage boosté</h1>
        <p className="mt-1 text-lg font-semibold tracking-wide text-v1-ink">
          Recommandez-nous, profitez-en
        </p>
        <div className="mt-8 grid w-full gap-4 rounded-3xl bg-white p-4 text-left shadow-sm sm:grid-cols-2 sm:p-6">
          <div className="space-y-4">
            <article className="rounded-2xl bg-v1-line px-5 py-6">
              <p className="font-semibold text-v1-ink">Pour vous</p>
              <p className="mt-2 text-xl font-semibold">1 mois offert</p>
              <p className="mt-6 text-center text-xs text-v1-ink-muted">
                Par parrainage, dans la limite de mois cumulables du programme.
              </p>
            </article>
            <article className="rounded-2xl bg-v1-line px-5 py-6">
              <p className="font-semibold text-v1-ink">Pour votre filleul</p>
              <p className="mt-2 text-xl font-semibold">1 mois offert</p>
              <p className="mt-6 text-center text-xs text-v1-ink-muted">
                Pour tout abonnement annuel contracté
              </p>
            </article>
          </div>
          <div className="flex flex-col justify-between rounded-2xl bg-v1-canvas-warm p-5">
            <p className="text-sm text-v1-ink-body">
              Le visuel de cette carte est un emplacement vide dans la maquette (libellé « PHOTO »).
            </p>
            <button
              type="button"
              onClick={() => void copierLien()}
              className="mt-6 inline-flex h-10 items-center justify-center self-end rounded-full border border-v1-ink bg-white px-4 text-sm"
            >
              {copie ? "Lien copié" : "Proposez votre filleul"}
            </button>
          </div>
        </div>
        <section className="mt-4 w-full rounded-3xl bg-white px-5 py-6 text-center shadow-sm">
          <h2 className="text-sm font-semibold text-v1-ink">
            Devenez un affilié et gagnez une commission
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-v1-ink-body">
            Chaque fois qu'un client apporté remplit nos conditions, vous gagnez un pourcentage de
            commission.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link
              to="/inscription"
              search={{ parrainage: "1" }}
              className="inline-flex h-10 items-center rounded-full border border-v1-ink px-4 text-sm"
            >
              Inscrivez-vous maintenant
            </Link>
            <button
              type="button"
              onClick={() => void copierLien()}
              className="inline-flex h-10 items-center rounded-full border border-v1-ink bg-v1-line px-4 text-sm"
            >
              Proposez un client
            </button>
            <button
              type="button"
              onClick={() => void copierLien()}
              className="inline-flex h-10 items-center rounded-full border border-v1-ink bg-v1-line px-4 text-sm"
            >
              Votre lien d'affiliation
            </button>
          </div>
          <p className="mt-3 text-xs text-v1-ink-subtle">
            Le plafond « X mois » et le pourcentage de commission ne sont pas chiffrés dans la
            maquette. Le lien ouvre l'inscription avec le parrainage, sans prélèvement.
          </p>
        </section>
      </div>
    </div>
  );
}
