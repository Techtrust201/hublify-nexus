// Chrome 375 — tab bar Accueil / Agenda / + / Documents / Profil (notes 15/09).
// Hors scope : biométrie hardware, modes proprio/voyageur complets, copie Grocery/Livia.

import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  FileText,
  Home,
  LogOut,
  MessageSquare,
  Plus,
  User,
  Wrench,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/auth/auth-context";
import { BandeauSync } from "@/components/layout/BandeauSync";
import { CorpsEnAttente } from "@/components/layout/CorpsEnAttente";
import { useSessionChargee } from "@/data/session";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function PortailShell({
  titre,
  sousTitre,
  children,
}: {
  titre?: string;
  sousTitre?: string;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const auth = useAuth();
  const chargee = useSessionChargee();
  const [plus, setPlus] = useState(false);
  const locataire = auth?.roleId === "locataire";
  const prestataire = auth?.roleId === "prestataire";
  const agendaUrl = prestataire ? "/espace/missions" : "/espace/calendrier";
  const profilUrl = locataire ? "/espace/dossier" : "/profil";

  const tabs = [
    { id: "accueil", titre: "Accueil", url: "/espace", icone: Home, exact: true },
    { id: "agenda", titre: "Agenda", url: agendaUrl, icone: CalendarDays, exact: false },
    { id: "plus", titre: "Ajouter", url: "__plus__", icone: Plus, exact: false },
    { id: "docs", titre: "Docs", url: "/espace/documents", icone: FileText, exact: false },
    { id: "profil", titre: "Profil", url: profilUrl, icone: User, exact: false },
  ] as const;

  const actif = (url: string, exact?: boolean) =>
    exact ? pathname === "/espace" || pathname === "/espace/" : pathname.startsWith(url);

  const actionsPlus: Array<{
    label: string;
    to: "/espace/missions" | "/espace/messages" | "/espace/documents" | "/espace/logement" | "/espace/dossier" | "/espace/candidature";
    hash?: string;
  }> = prestataire
    ? [
        { label: "Rapport d'intervention", to: "/espace/missions" },
        { label: "Message au gestionnaire", to: "/espace/messages" },
        { label: "Documents", to: "/espace/documents" },
      ]
    : [
        { label: "J'ai un problème dans mon logement", to: "/espace/logement", hash: "faq" },
        { label: "Contacter le gestionnaire", to: "/espace/messages" },
        { label: "Déclarer un départ", to: "/espace/logement", hash: "depart" },
        { label: "Envoyer mon dossier", to: "/espace/dossier" },
        { label: "Proposer une candidature", to: "/espace/candidature" },
      ];

  return (
    <div className="min-h-dvh bg-[#ece6d8]">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[375px] flex-col overflow-hidden bg-[radial-gradient(circle_at_20%_10%,#fff7e8,transparent_42%),radial-gradient(circle_at_90%_80%,#e8f3ef,transparent_38%),#f6f1e6] shadow-[0_0_0_1px_rgba(28,25,23,0.06)]">
        <header className="flex items-start justify-between px-5 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
              {auth?.role ?? "Espace"}
            </p>
            <h1 className="mt-1 text-[22px] font-medium leading-tight text-ink-deep">
              {titre ?? `Bonjour ${auth?.prenom ?? ""}`}
            </h1>
            {sousTitre && <p className="mt-0.5 text-xs text-ink-muted">{sousTitre}</p>}
          </div>
          <button
            type="button"
            onClick={() => void authClient.signOut().then(() => (window.location.href = "/connexion"))}
            className="mt-1 inline-flex h-9 items-center gap-1 rounded-full border border-line bg-white/80 px-3 text-[11px] text-ink-body"
          >
            <LogOut className="size-3" /> Sortir
          </button>
        </header>
        <BandeauSync />
        <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-28">
          {chargee ? children : <CorpsEnAttente />}
        </main>

        {plus && (
          <div className="absolute inset-x-0 bottom-20 z-20 px-4">
            <div className="rounded-[22px] border border-line bg-white/95 p-3 shadow-lg">
              <p className="px-1 pb-2 text-[11px] uppercase tracking-wide text-ink-muted">Ajouter</p>
              <ul className="space-y-1">
                {actionsPlus.map((a) => (
                  <li key={a.label}>
                    <button
                      type="button"
                      className="flex h-11 w-full items-center rounded-card px-3 text-left text-sm text-ink"
                      onClick={() => {
                        setPlus(false);
                        void navigate({
                          to: a.to,
                          ...(a.hash ? { hash: a.hash } : {}),
                        } as Parameters<typeof navigate>[0]);
                      }}
                    >
                      {a.label}
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setPlus(false)}
                className="mt-1 h-9 w-full text-xs text-ink-muted"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        <nav
          className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-between bg-white/90 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur"
          aria-label="Navigation portail"
        >
          {tabs.map((t) => {
            if (t.id === "plus") {
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPlus((v) => !v)}
                  className="-mt-5 flex size-14 items-center justify-center rounded-full bg-ink text-white shadow-md"
                  aria-label="Ajouter"
                >
                  <Plus className="size-6" />
                </button>
              );
            }
            const current = actif(t.url, t.exact);
            return (
              <Link
                key={t.id}
                to={t.url}
                {...(t.exact ? { activeOptions: { exact: true } } : {})}
                className={cn(
                  "flex w-14 flex-col items-center gap-0.5 text-[10px]",
                  current ? "text-ink" : "text-ink-muted",
                )}
              >
                <t.icone className="size-5" />
                {t.titre}
              </Link>
            );
          })}
        </nav>
        {prestataire && (
          <p className="sr-only">
            <Wrench className="size-3" /> Missions prestataire
          </p>
        )}
        {locataire && (
          <p className="sr-only">
            <MessageSquare className="size-3" /> Messages gestionnaire
          </p>
        )}
      </div>
    </div>
  );
}
