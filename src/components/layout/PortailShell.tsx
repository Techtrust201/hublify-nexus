// Chrome 375 du portail locataire / prestataire (Hublify V1).
// Onglets : Accueil, Agenda, +, Documents, Messages. Le profil s'ouvre par l'avatar.
// Le 5e onglet des frames hésite entre silhouette et enveloppe : on retient Messages,
// le profil étant déjà l'avatar de l'accueil (écart documenté).

import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { CalendarDays, FileText, Home, Mail, Plus, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/auth/auth-context";
import { PortailUiProvider } from "@/components/portail/chrome";
import { PortailDonneesProvider, usePortailDonnees } from "@/components/portail/etat-portail";
import { BandeauSync } from "@/components/layout/BandeauSync";
import { CorpsEnAttente } from "@/components/layout/CorpsEnAttente";
import { useSession, useSessionChargee } from "@/data/session";
import { cn } from "@/lib/utils";

export function PortailShell({
  children,
}: {
  titre?: string;
  sousTitre?: string;
  children: ReactNode;
}) {
  return (
    <PortailDonneesProvider>
      <Coque>{children}</Coque>
    </PortailDonneesProvider>
  );
}

function Coque({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const auth = useAuth();
  const session = useSession();
  const chargee = useSessionChargee();
  const donnees = usePortailDonnees();
  const [plus, setPlus] = useState(false);
  const [notifs, setNotifs] = useState(false);
  const [navCachee, setNavCachee] = useState(false);
  const defautPose = useRef(false);

  useEffect(() => {
    if (!donnees.pret || defautPose.current) return;
    defautPose.current = true;
    if (!donnees.mode) {
      donnees.definirMode(auth?.roleId === "prestataire" ? "prestataire" : "resident");
    }
  }, [auth?.roleId, donnees]);

  const mode = donnees.mode ?? "resident";
  const prestataire = mode === "prestataire";
  const ui = {
    mode,
    definirMode: donnees.definirMode,
    demarre: donnees.demarre,
    demarrer: donnees.demarrer,
    masquerNav: setNavCachee,
    ouvrirNotifs: () => setNotifs(true),
  };

  const tabs = [
    { id: "accueil", titre: "Accueil", url: "/espace" as const, icone: Home, exact: true },
    {
      id: "agenda",
      titre: "Agenda",
      url: "/espace/calendrier" as const,
      icone: CalendarDays,
      exact: false,
    },
    { id: "plus", titre: "Ajouter", url: "/espace" as const, icone: Plus, exact: false },
    {
      id: "docs",
      titre: "Documents",
      url: "/espace/documents" as const,
      icone: FileText,
      exact: false,
    },
    {
      id: "messages",
      titre: "Messages",
      url: "/espace/messages" as const,
      icone: Mail,
      exact: false,
    },
  ];

  const actif = (url: string, exact?: boolean) =>
    exact ? pathname === "/espace" || pathname === "/espace/" : pathname.startsWith(url);

  const actionsPlus: Array<{
    label: string;
    to:
      | "/espace"
      | "/espace/missions"
      | "/espace/messages"
      | "/espace/documents"
      | "/espace/logement"
      | "/espace/dossier"
      | "/espace/candidature"
      | "/espace/calendrier";
    hash?: string;
  }> = prestataire
    ? [
        { label: "Rapport d'intervention", to: "/espace/missions" },
        { label: "Ajouter une note dans le calendrier", to: "/espace/calendrier", hash: "note" },
        { label: "Message au gestionnaire", to: "/espace/messages" },
        { label: "Documents", to: "/espace/documents" },
      ]
    : [
        { label: "Rechercher une prestation", to: "/espace", hash: "autour" },
        { label: "Rechercher une location", to: "/espace", hash: "recherche" },
        { label: "Ajouter une note dans le calendrier", to: "/espace/calendrier", hash: "note" },
        { label: "J'ai un problème dans mon logement", to: "/espace/logement", hash: "faq" },
        { label: "Contacter le gestionnaire", to: "/espace/messages" },
        { label: "Déclarer un départ", to: "/espace/logement", hash: "depart" },
        { label: "Envoyer mon dossier", to: "/espace/dossier", hash: "pieces" },
        { label: "Proposer une candidature", to: "/espace/candidature" },
      ];

  const nonLues = session.notifications.filter((n) => !n.lu);

  return (
    <PortailUiProvider valeur={ui}>
      <div className="min-h-dvh bg-[#dfe8e4]">
        <div className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-[linear-gradient(165deg,#f7fbf8_0%,#f4f6ef_42%,#f8f1e8_100%)] shadow-[0_0_0_1px_rgba(28,25,23,0.05)]">
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <span className="absolute -left-8 top-10 size-24 rounded-full bg-[#d7efe4]/80" />
            <span className="absolute right-6 top-24 size-16 rounded-full bg-[#f6d9c8]/70" />
            <span className="absolute -right-6 bottom-36 size-28 rounded-full bg-[#d5ebf2]/80" />
            <span className="absolute bottom-28 left-8 size-14 rounded-full bg-[#efe4c6]/80" />
          </div>
          <div className="relative z-10">
            <BandeauSync />
          </div>
          <main className="relative z-10 min-h-0 flex-1 overflow-y-auto pb-28">
            {chargee && donnees.pret ? (
              children
            ) : (
              <div className="px-4 pt-8">
                <CorpsEnAttente />
              </div>
            )}
          </main>

          {notifs && (
            <div className="absolute inset-x-3 top-3 z-40 rounded-[22px] bg-white p-4 shadow-xl">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#1d2939]">Notifications</p>
                <button
                  type="button"
                  aria-label="Fermer les notifications"
                  onClick={() => setNotifs(false)}
                >
                  <X className="size-4" />
                </button>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {nonLues.length === 0 && (
                  <li className="text-[#667085]">
                    Rien de nouveau. Les alertes de loyer et de mission s'affichent ici.
                  </li>
                )}
                {nonLues.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      className="w-full rounded-2xl bg-[#f6f7f6] px-3 py-2 text-left"
                      onClick={() => {
                        setNotifs(false);
                        if (n.href.startsWith("/espace")) {
                          void navigate({ to: n.href as "/espace" });
                        }
                      }}
                    >
                      <span className="block font-medium text-[#1d2939]">{n.titre}</span>
                      <span className="text-xs text-[#667085]">{n.detail}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {plus && (
            <div className="absolute inset-x-4 bottom-24 z-40 space-y-2">
              <ul className="space-y-2">
                {actionsPlus.map((a) => (
                  <li key={a.label}>
                    <button
                      type="button"
                      className="flex min-h-12 w-full items-center justify-center rounded-full bg-white px-4 text-sm font-medium text-[#1d2939] shadow-[0_8px_24px_rgba(30,40,30,0.08)]"
                      onClick={() => {
                        setPlus(false);
                        void navigate({
                          to: a.to,
                          ...(a.hash ? { hash: a.hash } : {}),
                        });
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
                className="mt-1 h-10 w-full text-xs text-[#98a2b3]"
              >
                Fermer
              </button>
            </div>
          )}

          <button type="button" className="sr-only" onClick={() => setNotifs(false)}>
            {auth?.role ?? "Espace"}
          </button>
          {!navCachee && (
            <nav
              className="absolute inset-x-3 bottom-3 z-30 flex items-end justify-between rounded-full bg-[#e7f4f6]/95 px-3 pb-2 pt-2 shadow-[0_8px_24px_rgba(30,40,30,0.06)] backdrop-blur"
              aria-label="Navigation portail"
            >
              {tabs.map((t) => {
                if (t.id === "plus") {
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPlus((v) => !v)}
                      className="-mt-7 flex size-14 items-center justify-center rounded-full bg-[#f6f1df] text-[#1d2939] shadow-[0_8px_20px_rgba(30,40,30,0.12)]"
                      aria-label="Ajouter"
                      aria-expanded={plus}
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
                    aria-label={t.titre}
                    className={cn(
                      "flex size-11 items-center justify-center",
                      current ? "text-[#5090A8]" : "text-[#98a2b3]",
                    )}
                  >
                    <t.icone className="size-5" strokeWidth={current ? 2.4 : 1.8} />
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </PortailUiProvider>
  );
}
