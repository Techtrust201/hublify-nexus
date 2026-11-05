import { Link, useNavigate } from "@tanstack/react-router";
import { Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ecrireMode, lireMode } from "@/components/portail/etat-local";
import { Bouton, Marque } from "@/components/portail/chrome";
import { toastOk } from "@/lib/feedback";

/** Écran 374:2271. Uniquement avant connexion. */
export function OnboardingPortail() {
  const navigate = useNavigate();
  const [pret, setPret] = useState(false);
  const [prestataire, setPrestataire] = useState(false);
  useEffect(() => {
    setPrestataire(lireMode() === "prestataire");
    setPret(true);
  }, []);

  const choisir = (valeur: boolean) => {
    setPrestataire(valeur);
    ecrireMode(valeur ? "prestataire" : "resident");
  };

  return (
    <div
      className="portail min-h-dvh bg-[var(--portail-fond-bas)]"
      data-portail-pret={pret ? "1" : "0"}
    >
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[linear-gradient(180deg,var(--portail-fond-haut)_0%,var(--portail-fond-bas)_100%)] px-5 pb-8 pt-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            role="switch"
            aria-checked={prestataire}
            aria-label="Mode Prestataire"
            onClick={() => choisir(!prestataire)}
            className="flex items-center gap-2 text-sm text-[var(--portail-encre-douce)]"
          >
            <span
              className={`relative h-5 w-9 rounded-full ${prestataire ? "bg-[var(--portail-sarcelle)]" : "bg-[#c9c6be]"}`}
            >
              <span
                className={`absolute top-0.5 size-4 rounded-full bg-white shadow ${prestataire ? "left-4" : "left-0.5"}`}
              />
            </span>
            Mode Prestataire
          </button>
          <button
            type="button"
            aria-label="Partager l'accès"
            className="grid size-11 place-items-center rounded-full text-[var(--portail-encre)]"
            onClick={() => {
              const url = `${window.location.origin}/connexion`;
              void navigator.clipboard?.writeText(url).then(
                () => toastOk("Lien de connexion copié."),
                () => toastOk("Ouvrez la connexion pour partager l'accès."),
              );
            }}
          >
            <Share2 className="size-5" />
          </button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <Marque />
          <img
            src="/portail/onboarding-scene.webp"
            alt=""
            width={306}
            height={212}
            className="mt-6 h-auto w-[min(100%,306px)]"
          />
          <h1 className="mt-4 font-display text-[28px] font-semibold leading-tight text-[var(--portail-encre)]">
            Management &amp; gestion
          </h1>
          <p className="mt-4 max-w-[18rem] text-sm leading-relaxed text-[var(--portail-encre-douce)]">
            Cet outil est conçu pour vous aider à gérer vos locations et vos missions.
          </p>
        </div>
        <Bouton onClick={() => void navigate({ to: "/connexion" })}>Let&apos;s Start</Bouton>
        <p className="mt-3 text-center text-xs text-[var(--portail-encre-douce)]">
          Déjà un compte ?{" "}
          <Link to="/connexion" className="font-semibold text-[var(--portail-encre)]">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
