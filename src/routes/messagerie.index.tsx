// SOURCE: Maquette MO1 — Dashboard/Messagerie (+ variantes presta, teammate, archivés, panneaux)

import { createFileRoute } from "@tanstack/react-router";
import { Archive, MessageSquare } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  DOCUMENTS_LIES,
  type Conversation,
  type MessageFil,
  type PieceJointe,
  type SectionConversation,
} from "@/data/messagerie-mo1";
import { ajouterNotif, modifierSession, useSession } from "@/data/session";
import { choisirFichierComplet, confirmer, toastOk } from "@/lib/feedback";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/messagerie/")({
  validateSearch: (raw: Record<string, unknown>): { conv?: string } => {
    const conv = typeof raw["conv"] === "string" ? raw["conv"] : undefined;
    return conv ? { conv } : {};
  },
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
  const { conv } = Route.useSearch();
  const session = useSession();
  const conversations = session.conversations;
  const messages = session.messagesFil;
  const setConversations = (next: Conversation[] | ((prev: Conversation[]) => Conversation[])) => {
    const resolu = typeof next === "function" ? next(conversations) : next;
    modifierSession((e) => ({ ...e, conversations: resolu }));
  };
  const setMessages = (next: MessageFil[] | ((prev: MessageFil[]) => MessageFil[])) => {
    const resolu = typeof next === "function" ? next(messages) : next;
    modifierSession((e) => ({ ...e, messagesFil: resolu }));
  };
  const [selection, setSelection] = useState(conv ?? "c-brian");
  const [recherche, setRecherche] = useState("");
  const [archives, setArchives] = useState(false);
  const [brouillon, setBrouillon] = useState("");
  const [piecesBrouillon, setPiecesBrouillon] = useState<PieceJointe[]>([]);
  const [ecrire, setEcrire] = useState(false);
  const [panneau, setPanneau] = useState<Panneau>(null);
  const [sectionsOuvertes, setSectionsOuvertes] = useState<Record<SectionConversation, boolean>>({
    inbox: true,
    prospections: true,
    prestataires: true,
    team: true,
  });

  const [filMobileOuvert, setFilMobileOuvert] = useState(false);

  useEffect(() => {
    if (!conv) return;
    const cible = conversations.find(
      (c) => c.id === conv || c.nom.toLowerCase() === conv.toLowerCase(),
    );
    if (!cible) return;
    setArchives(cible.archivee);
    setSelection(cible.id);
    // Ouvrir une conversation la marque comme lue, quel que soit le chemin d'entrée.
    if (cible.nonLu) {
      setConversations((liste) =>
        liste.map((c) => (c.id === cible.id ? { ...c, nonLu: false } : c)),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv, conversations]);

  const filtrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return conversations.filter((c) => {
      if (c.archivee !== archives) return false;
      if (!q) return true;
      return (
        c.nom.toLowerCase().includes(q) ||
        c.initiales.toLowerCase().includes(q) ||
        (c.bienNom?.toLowerCase().includes(q) ?? false) ||
        (c.extrait?.toLowerCase().includes(q) ?? false)
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
    setBrouillon("");
    setPiecesBrouillon([]);
    setFilMobileOuvert(true);
    setConversations((liste) => liste.map((c) => (c.id === id ? { ...c, nonLu: false } : c)));
  };

  const envoyer = () => {
    const texte = brouillon.trim();
    if ((!texte && piecesBrouillon.length === 0) || !actif) return;
    const heure = heureMaintenant();
    const extrait = texte || piecesBrouillon.map((p) => p.nom).join(", ");
    setMessages((liste) => [
      ...liste,
      {
        id: `m-local-${Date.now()}`,
        conversationId: actif.id,
        kind: "envoye",
        texte,
        heure,
        ...(piecesBrouillon.length ? { pieces: piecesBrouillon } : {}),
      },
    ]);
    setConversations((liste) =>
      liste.map((c) => (c.id === actif.id ? { ...c, extrait, ilYa: "À l'instant" } : c)),
    );
    setBrouillon("");
    setPiecesBrouillon([]);
    toastOk("Message envoyé.");
  };

  const docsLies = actif ? (actif.documents ?? DOCUMENTS_LIES[actif.id] ?? []) : [];

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
              archives ? "border-ink text-ink" : "border-line text-ink-subtle",
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
            onToggleSection={(s) => setSectionsOuvertes((o) => ({ ...o, [s]: !o[s] }))}
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
              piecesBrouillon={piecesBrouillon}
              onJoindre={() =>
                choisirFichierComplet((fichier) =>
                  setPiecesBrouillon((liste) =>
                    liste.some((p) => p.nom === fichier.nom)
                      ? liste
                      : [
                          ...liste,
                          {
                            nom: fichier.nom,
                            taille: fichier.taille,
                            mime: fichier.mime,
                            base64: fichier.base64,
                          },
                        ],
                  ),
                )
              }
              onRetirerPiece={(nom) =>
                setPiecesBrouillon((liste) => liste.filter((p) => p.nom !== nom))
              }
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
                void (async () => {
                  const ok = await confirmer({
                    titre: `Supprimer la conversation avec ${actif.nom} ?`,
                    description: "Les messages et pièces jointes de ce fil seront perdus.",
                    libelleConfirmer: "Supprimer",
                    danger: true,
                  });
                  if (!ok) return;
                  setConversations((liste) => liste.filter((c) => c.id !== actif.id));
                  setMessages((liste) => liste.filter((m) => m.conversationId !== actif.id));
                  setPanneau(null);
                  setFilMobileOuvert(false);
                  toastOk("Conversation supprimée.");
                })();
              }}
              enfantsPanneau={
                <>
                  {panneau === "partage" && (
                    <MenuPartage
                      conversationId={actif.id}
                      onFermer={() => setPanneau(null)}
                      nom={actif.nom}
                      {...(actif.bienNom ? { logement: actif.bienNom } : {})}
                    />
                  )}
                  {panneau === "documents" && (
                    <MenuDocuments
                      nom={actif.nom}
                      {...(actif.bienNom ? { logement: actif.bienNom } : {})}
                      documents={docsLies}
                      onAjouter={(doc) =>
                        setConversations((liste) =>
                          liste.map((c) => {
                            if (c.id !== actif.id) return c;
                            const existants = c.documents ?? DOCUMENTS_LIES[c.id] ?? [];
                            if (existants.some((d) => d.nom === doc.nom)) return c;
                            return {
                              ...c,
                              documents: [...existants, doc],
                            };
                          }),
                        )
                      }
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
                  {panneau === "assigner" && (
                    <MenuAssigner
                      {...(actif.assigne ? { actuel: actif.assigne } : {})}
                      onChoisir={(nom) =>
                        setConversations((liste) =>
                          liste.map((c) => (c.id === actif.id ? { ...c, assigne: nom } : c)),
                        )
                      }
                      onFermer={() => setPanneau(null)}
                    />
                  )}
                </>
              }
            />
          ) : (
            <p
              className={cn(
                "flex flex-1 items-center justify-center p-6 text-sm text-ink-subtle",
                !filMobileOuvert && "hidden lg:flex",
              )}
            >
              Aucun message.
            </p>
          )}
        </div>
      </div>

      <DialogNouveauMessage
        ouvert={ecrire}
        onFermer={() => setEcrire(false)}
        onEnvoyer={(destinataire, objet, texte, pieces) => {
          const id = `c-new-${Date.now()}`;
          const corps = [objet && `Objet : ${objet}`, texte].filter(Boolean).join("\n\n");
          const extrait = corps || pieces.map((p) => p.nom).join(", ");
          const conv: Conversation = {
            id,
            section: "inbox",
            nom: destinataire,
            initiales: initialesDe(destinataire) || "??",
            type: "voyageur",
            badge: "Voyageur",
            extrait,
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
              texte: corps,
              heure: heureMaintenant(),
              ...(pieces.length ? { pieces } : {}),
            },
          ]);
          setSelection(id);
          setFilMobileOuvert(true);
          setArchives(false);
          ajouterNotif({
            titre: "Message envoyé",
            detail: destinataire,
            href: `/messagerie?conv=${encodeURIComponent(id)}`,
          });
          toastOk("Conversation créée.");
        }}
      />
    </AppShell>
  );
}
