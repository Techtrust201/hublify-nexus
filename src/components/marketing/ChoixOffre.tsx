import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { CadreAuth } from "@/components/marque/CadreAuth";
import {
  formaterEuros,
  OFFRES,
  prixAnnuelCentimes,
  type IdOffre,
  type PeriodeOffre,
} from "@/design/offres";
import { cn } from "@/lib/utils";

const CHOIX: { id: IdOffre; annuel: boolean }[] = [
  { id: "freemium", annuel: false },
  { id: "solo", annuel: true },
  { id: "standard", annuel: true },
  { id: "professionnel", annuel: false },
];

export function ChoixOffre() {
  const navigate = useNavigate();
  const [offre, setOffre] = useState<IdOffre>("standard");
  const [periode, setPeriode] = useState<PeriodeOffre>("mensuel");

  function continuer() {
    const cible = OFFRES.find((o) => o.id === offre);
    if (!cible) return;
    if (offre === "professionnel") {
      void navigate({ to: "/inscription", search: { offre, periode: "mensuel", devis: "1" } });
      return;
    }
    void navigate({
      to: "/inscription",
      search: { offre, periode: offre === "freemium" ? "mensuel" : periode },
    });
  }

  return (
    <CadreAuth
      large
      titre="Quel profil voulez-vous être ?"
      description="Sélectionnez l'offre qui correspond le mieux à vos besoins. Vous pourrez la modifier plus tard."
    >
      <fieldset className="space-y-2.5">
        <legend className="sr-only">Offres</legend>
        {CHOIX.map((ligne) => {
          const item = OFFRES.find((o) => o.id === ligne.id);
          if (!item) return null;
          const actif = offre === item.id;
          return (
            <label
              key={item.id}
              className={cn(
                "flex cursor-pointer flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center",
                actif ? "border-v1-line-auth bg-v1-brand-soft" : "border-v1-line-auth bg-white",
              )}
            >
              <span className="flex min-w-0 flex-1 items-start gap-3">
                <input
                  type="radio"
                  name="offre"
                  value={item.id}
                  checked={actif}
                  onChange={() => setOffre(item.id)}
                  className="mt-1 size-5 accent-v1-brand"
                />
                <span>
                  <span className="block text-sm font-semibold text-v1-ink-strong">
                    {item.titreChoix}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-v1-ink-muted">
                    {item.detailChoix}
                  </span>
                </span>
              </span>
              <span className="flex flex-wrap gap-2 sm:justify-end">
                {item.id === "freemium" ? (
                  <span className="inline-flex h-[34px] items-center rounded-xl border border-v1-line-auth px-4 text-[15px] font-semibold text-v1-ink-subtle">
                    Gratuit
                  </span>
                ) : null}
                {item.id === "professionnel" ? (
                  <span className="inline-flex h-[34px] items-center rounded-xl border border-v1-line-auth px-4 text-[15px] font-semibold text-v1-ink-subtle">
                    Demander un devis
                  </span>
                ) : null}
                {ligne.annuel && item.prixMoisCentimes != null ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setOffre(item.id);
                        setPeriode("mensuel");
                      }}
                      className={cn(
                        "inline-flex h-[34px] items-center rounded-xl border px-4 text-[15px] font-semibold",
                        actif && periode === "mensuel"
                          ? "border-v1-line-auth bg-v1-brand-pill text-v1-ink-subtle"
                          : "border-v1-line-auth bg-white text-v1-ink-subtle",
                      )}
                    >
                      {formaterEuros(item.prixMoisCentimes)}/mois
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOffre(item.id);
                        setPeriode("annuel");
                      }}
                      className={cn(
                        "inline-flex h-[34px] items-center rounded-xl border px-4 text-[15px] font-semibold",
                        actif && periode === "annuel"
                          ? "border-v1-line-auth bg-v1-brand-pill text-v1-ink-subtle"
                          : "border-v1-line-auth bg-white text-v1-ink-subtle",
                      )}
                    >
                      {formaterEuros(prixAnnuelCentimes(item.prixMoisCentimes))}/an
                    </button>
                  </>
                ) : null}
              </span>
            </label>
          );
        })}
      </fieldset>
      <p className="mt-3 text-xs text-v1-ink-muted">
        L'annuel reprend la remise de 20 % indiquée sur la landing. L'essai freemium ne demande
        aucune carte bancaire.
      </p>
      <button
        type="button"
        onClick={continuer}
        className="mt-4 flex h-[50px] w-full items-center justify-center rounded-xl bg-v1-brand text-[15px] font-semibold text-white"
      >
        Continuer
      </button>
      <Link
        to="/"
        className="mt-2 inline-flex h-[42px] w-full items-center justify-center gap-2 text-sm font-semibold text-v1-ink-muted"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Revenir à l'étape précédente
      </Link>
    </CadreAuth>
  );
}
