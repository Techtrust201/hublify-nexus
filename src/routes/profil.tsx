import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { GESTIONNAIRE } from "@/data/mock";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [{ title: "Profil gestionnaire — Hublify" }],
  }),
  component: PageProfil,
});

function PageProfil() {
  const [prenom, setPrenom] = useState("Yannick");
  const [nom, setNom] = useState("Rath");

  return (
    <AppShell titre="Votre profil gestionnaire">
      <div className="mx-auto max-w-xl rounded-[10px] border border-[#e5e7eb] bg-white p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-14 items-center justify-center rounded-full bg-[#e5e7eb] text-base text-[#4a5565]">
            YR
          </span>
          <div>
            <p className="text-sm uppercase tracking-[0.3px] text-[#99a1af]">{GESTIONNAIRE.role}</p>
            <p className="text-base text-[#1e2939]">
              {prenom} {nom}
            </p>
            <p className="text-xs text-[#99a1af]">{GESTIONNAIRE.email}</p>
          </div>
        </div>
        <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="text-xs font-medium text-[#6a7282]" htmlFor="prenom">
              Prénom
            </label>
            <input
              id="prenom"
              className="mt-1 h-10 w-full rounded-[10px] border border-[#e5e7eb] px-3 text-sm outline-none"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6a7282]" htmlFor="nom">
              Nom
            </label>
            <input
              id="nom"
              className="mt-1 h-10 w-full rounded-[10px] border border-[#e5e7eb] px-3 text-sm outline-none"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="h-10 rounded-[10px] bg-[#1e2939] px-4 text-sm font-medium text-white"
          >
            Enregistrer
          </button>
        </form>
      </div>
    </AppShell>
  );
}
