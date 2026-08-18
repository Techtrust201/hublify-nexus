// SOURCE: Maquette MO1 — Dashboard/Messagerie (+ variantes presta, teammate, archivés, panneaux)

import { createFileRoute } from "@tanstack/react-router";
import { Archive, MessageSquare } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DialogNouveauMessage } from "@/components/messagerie/DialogNouveauMessage";
import { FilConversation } from "@/components/messagerie/FilConversation";
import { ListeConversations } from "@/components/messagerie/ListeConversations";
import {
  MenuAssigner,
  MenuCategorie,
  MenuDocuments,
  MenuPartage,
} from "@/components/messagerie/MenusOutils";
import {
  type Conversation,
  type MessageFil,
  type SectionConversation,
} from "@/data/messagerie-mo1";
import { ajouterNotif, modifierSession, useSession } from "@/data/session";
import { toastOk } from "@/lib/feedback";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/messagerie/")({
  head: () => ({
    meta: [{ title: "Messagerie — Hublify" }],
  }),
  component: PageMessagerie,
});

type Panneau = "partage" | "documents" | "categorie" | "assigner" | null;

function heureMaintenant() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}`;
}

function initialesDe(nom: string) {
  return nom
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function PageMessagerie() {
  const session = useSession();
  const conversations = session.conversations;
  const messages = session.messagesFil;
  const setConversations = (
    next: Conversation[] | ((prev: Conversation[]) => Conversation[]),
  ) => {
    const resolu = typeof next === "function" ? next(conversations) : next;
    modifierSession((e) => ({ ...e, conversations: resolu }));
  };
  const setMessages = (next: MessageFil[] | ((prev: MessageFil[]) => MessageFil[])) => {
    const resolu = typeof next === "function" ? next(messages) : next;
    modifierSession((e) => ({ ...e, messagesFil: resolu }));
  };
  const [selection, setSelection] = useState("c-brian");
  const [recherche, setRecherche] = useState("");
  const [archives, setArchives] = useState(false);
  const [brouillon, setBrouillon] = useState("");
  const [ecrire, setEcrire] = useState(false);
  const [panneau, setPanneau] = useState<Panneau>(null);
  const [sectionsOuvertes, setSectionsOuvertes] = useState<Record<SectionConversation, boolean>>({
    inbox: true,
    prospections: true,
    prestataires: true,
    team: true,
  });

  const [filMobileOuvert, setFilMobileOuvert] = useState(false);

  const filtrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return conversations.filter((c) => {
      if (c.archivee !== archives) return false;
      if (!q) return true;
      return (
        c.nom.toLowerCase().includes(q) ||
        c.initiales.toLowerCase().includes(q) ||
        (c.bienNom?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [conversations, archives, recherche]);

  const actif = conversations.find((c) => c.id === selection) ?? filtrees[0];
  const fil = messages.filter((m) => m.id && m.conversationId === actif?.id);
  const nonLus = conversations.filter((c) => !c.archivee && c.nonLu).length;
  const nbArchives = conversations.filter((c) => c.archivee).length;

  const selectionner = (id: string) => {
    setSelection(id);
    setPanneau(null);
    setFilMobileOuvert(true);
    setConversations((liste) => liste.map((c) => (c.id === id ? { ...c, nonLu: false } : c)));
  };

  const envoyer = () => {
    const texte = brouillon.trim();
    if (!texte || !actif) return;
    const heure = heureMaintenant();
    setMessages((liste) => [
      ...liste,
      {
        id: `m-local-${Date.now()}`,
        conversationId: actif.id,
        kind: "envoye",
        texte,
        heure,
      },
    ]);
    setConversations((liste) =>
      liste.map((c) => (c.id === actif.id ? { ...c, extrait: texte, ilYa: "À l'instant" } : c)),
    );
    setBrouillon("");
    toastOk("Message envoyé.");
  };

  return (
    <AppShell titre="Messagerie" sousTitre="Occupants, prestataires et équipe">
      <div className="flex min-h-[calc(100dvh-10rem)] flex-col overflow-hidden rounded-card border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line bg-[color-mix(in srgb, var(--surface) 50%, transparent)] px-4 py-3">
          <p className="flex items-center gap-2 text-sm text-ink">
            <MessageSquare className="size-[15px]" />
            Messagerie
            {nonLus > 0 && (
              <span className="inline-flex h-[19px] min-w-[17px] items-center justify-center rounded-full bg-ink px-1.5 text-[10px] text-white">
                {nonLus}
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={() => {
              const versArchives = !archives;
              setArchives(versArchives);
              setPanneau(null);
              const premiere = conversations.find((c) => c.archivee === versArchives);
              if (premiere) setSelection(premiere.id);
            }}
            className={cn(
              "inline-flex h-11 items-center gap-1.5 rounded-card border px-3 text-sm font-medium md:h-[30px] md:text-xs",
              archives
                ? "border-ink text-ink"
                : "border-line text-ink-subtle",
            )}
          >
            <Archive className="size-3" />
            Messages archivés ({nbArchives})
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <ListeConversations
            className={cn(filMobileOuvert && "hidden lg:flex")}
            conversations={filtrees}
            selectionId={actif?.id}
            recherche={recherche}
            onRecherche={setRecherche}
            onSelection={selectionner}
            onEcrire={() => setEcrire(true)}
            sectionsOuvertes={sectionsOuvertes}
            onToggleSection={(s) =>
              setSectionsOuvertes((o) => ({ ...o, [s]: !o[s] }))
            }
          />

          {actif ? (
            <FilConversation
              className={cn(!filMobileOuvert && "hidden lg:flex")}
              onRetour={() => setFilMobileOuvert(false)}
              conversation={actif}
              messages={fil}
              brouillon={brouillon}
              onBrouillon={setBrouillon}
              onEnvoyer={envoyer}
              panneau={panneau}
              onPanneau={setPanneau}
              onArchiver={() => {
                const id = actif.id;
                const devientArchivee = !actif.archivee;
                setConversations((liste) =>
                  liste.map((c) => (c.id === id ? { ...c, archivee: devientArchivee } : c)),
                );
                setPanneau(null);
                if (devientArchivee !== archives) {
                  const suivante = conversations.find(
                    (c) => c.id !== id && c.archivee === archives,
                  );
                  if (suivante) setSelection(suivante.id);
                }
              }}
              onSupprimer={() => {
                setConversations((liste) => liste.filter((c) => c.id !== actif.id));
                setMessages((liste) => liste.filter((m) => m.conversationId !== actif.id));
                setPanneau(null);
              }}
              enfantsPanneau={
                <>
                  {panneau === "partage" && <MenuPartage onFermer={() => setPanneau(null)} />}
                  {panneau === "documents" && (
                    <MenuDocuments
                      conversationId={actif.id}
                      nom={actif.nom}
                      onFermer={() => setPanneau(null)}
                    />
                  )}
                  {panneau === "categorie" && (
                    <MenuCategorie
                      sectionActive={actif.section}
                      onChoisir={(s) =>
                        setConversations((liste) =>
                          liste.map((c) => (c.id === actif.id ? { ...c, section: s } : c)),
                        )
                      }
                      onFermer={() => setPanneau(null)}
                    />
                  )}
                  {panneau === "assigner" && <MenuAssigner onFermer={() => setPanneau(null)} />}
                </>
              }
            />
          ) : (
            <p className={cn("flex flex-1 items-center justify-center p-6 text-sm text-ink-subtle", !filMobileOuvert && "hidden lg:flex")}>
              Aucun message.
            </p>
          )}
        </div>
      </div>

      <DialogNouveauMessage
        ouvert={ecrire}
        onFermer={() => setEcrire(false)}
        onEnvoyer={(destinataire, _objet, texte) => {
          const id = `c-new-${Date.now()}`;
          const conv: Conversation = {
            id,
            section: "inbox",
            nom: destinataire,
            initiales: initialesDe(destinataire) || "??",
            type: "voyageur",
            badge: "Voyageur",
            extrait: texte,
            ilYa: "À l'instant",
            nonLu: false,
            archivee: false,
          };
          setConversations((liste) => [conv, ...liste]);
          setMessages((liste) => [
            ...liste,
            {
              id: `m-new-${Date.now()}`,
              conversationId: id,
              kind: "envoye",
              texte,
              heure: heureMaintenant(),
            },
          ]);
          setSelection(id);
          setFilMobileOuvert(true);
          setArchives(false);
          ajouterNotif({
            titre: "Message envoyé",
            detail: destinataire,
            href: "/messagerie",
          });
          toastOk("Conversation créée.");
        }}
      />
    </AppShell>
  );
}
