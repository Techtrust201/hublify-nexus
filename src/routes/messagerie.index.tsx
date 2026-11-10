// SOURCE: Maquette MO1 — Dashboard/Messagerie (+ variantes presta, teammate, archivés, panneaux)

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/auth-context";
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
import { PanneauMessagesAuto } from "@/components/messagerie/PanneauMessagesAuto";
import { ProfilInterlocuteur } from "@/components/messagerie/ProfilInterlocuteur";
import { PropositionBail } from "@/components/messagerie/PropositionBail";
import { useReglagesMessagerie } from "@/components/messagerie/useReglagesMessagerie";
import { cibleConversation, messagesDeclenches } from "@/data/messagerie-auto";
import {
  DOCUMENTS_LIES,
  MESSAGES_MO1,
  completerMessagesFil,
  type ActionFil,
  type Conversation,
  type MessageFil,
  type PieceJointe,
  type SectionConversation,
} from "@/data/messagerie-mo1";
import { profilDepuisConversation } from "@/data/profil-interlocuteur";
import { propositionPour } from "@/data/reglages-messagerie";
import type { BrouillonBail } from "@/data/proposition-bail";
import {
  ajouterMessageFil,
  ajouterNotif,
  enregistrerConversation,
  idNouveau,
  modifierSession,
  useSession,
  useSessionChargee,
} from "@/data/session";
import {
  choisirFichierComplet,
  confirmer,
  telechargerPdf,
  toastErreur,
  toastOk,
} from "@/lib/feedback";
import { cn } from "@/lib/utils";

const VUES = ["profil", "proposition", "automatiques"] as const;
type VueMessagerie = (typeof VUES)[number];

export const Route = createFileRoute("/messagerie/")({
  validateSearch: (raw: Record<string, unknown>): { conv?: string; vue?: VueMessagerie } => {
    const conv = typeof raw["conv"] === "string" && raw["conv"] ? raw["conv"] : undefined;
    const vue =
      typeof raw["vue"] === "string" && (VUES as readonly string[]).includes(raw["vue"])
        ? (raw["vue"] as VueMessagerie)
        : undefined;
    return { ...(conv ? { conv } : {}), ...(vue ? { vue } : {}) };
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
  const { conv, vue } = Route.useSearch();
  const navigate = useNavigate();
  const auth = useAuth();
  const redacteur = auth ? `${auth.prenom} ${auth.nom}` : "Yannick Rath";
  const [reglages, mettreAJourReglages] = useReglagesMessagerie();
  const session = useSession();
  const chargee = useSessionChargee();
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
  const [selection, setSelection] = useState(conv ?? "");
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

  const [filMobileOuvert, setFilMobileOuvert] = useState(Boolean(vue || conv));

  useEffect(() => {
    if (conv || vue) setFilMobileOuvert(true);
  }, [conv, vue]);

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

  useEffect(() => {
    if (!chargee) return;
    const avecFil = new Set(messages.map((m) => m.conversationId));
    for (const message of MESSAGES_MO1) {
      if (avecFil.has(message.conversationId)) continue;
      if (!conversations.some((c) => c.id === message.conversationId)) continue;
      ajouterMessageFil(message);
    }
  }, [chargee, conversations, messages]);

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

  const actif = filtrees.find((c) => c.id === selection) ?? filtrees[0];
  const messagesComplets = completerMessagesFil(messages);
  const fil = messagesComplets.filter((m) => m.id && m.conversationId === actif?.id);
  const nonLus = conversations.filter((c) => !c.archivee && c.nonLu).length;
  const nbArchives = conversations.filter((c) => c.archivee).length;

  const aller = (recherche: { conv?: string; vue?: VueMessagerie }) => {
    void navigate({
      to: "/messagerie",
      search: recherche.conv || recherche.vue ? recherche : {},
    });
  };

  useEffect(() => {
    if (!chargee || conv) return;
    const premiere =
      conversations.find((c) => !c.archivee && c.section === "inbox") ??
      conversations.find((c) => !c.archivee);
    if (!premiere) return;
    setSelection(premiere.id);
    aller({ conv: premiere.id });
    // La première conversation visible s'ouvre sans clic, comme sur la maquette.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chargee, conv, conversations]);

  const selectionner = (id: string) => {
    setSelection(id);
    setPanneau(null);
    setBrouillon("");
    setPiecesBrouillon([]);
    setFilMobileOuvert(true);
    setConversations((liste) => liste.map((c) => (c.id === id ? { ...c, nonLu: false } : c)));
    aller({ conv: id });
  };

  const definirVue = (suivante?: VueMessagerie) => {
    const id = actif?.id ?? conv;
    aller({ ...(id ? { conv: id } : {}), ...(suivante ? { vue: suivante } : {}) });
    setFilMobileOuvert(true);
  };

  const envoyer = () => {
    const texte = brouillon.trim();
    if ((!texte && piecesBrouillon.length === 0) || !actif) return;
    const heure = heureMaintenant();
    const extrait = texte || piecesBrouillon.map((p) => p.nom).join(", ");
    const conversationId = actif.id;
    const pieces = piecesBrouillon;
    void ajouterMessageFil({
      id: idNouveau("m"),
      conversationId,
      kind: "envoye",
      texte,
      heure,
      ...(pieces.length ? { pieces } : {}),
    }).then((ok) => {
      if (!ok) {
        toastErreur("Le message n'a pas été enregistré.");
        return;
      }
      setConversations((liste) =>
        liste.map((c) => (c.id === conversationId ? { ...c, extrait, ilYa: "À l'instant" } : c)),
      );
      setBrouillon("");
      setPiecesBrouillon([]);
      toastOk("Message envoyé.");
    });
  };

  const docsLies = actif ? (actif.documents ?? DOCUMENTS_LIES[actif.id] ?? []) : [];
  const occupant = actif
    ? session.occupants.find((o) => o.nom.toLowerCase() === actif.nom.toLowerCase())
    : undefined;
  const profil = actif
    ? profilDepuisConversation(actif, messagesComplets, docsLies, {
        ...(occupant?.email ? { email: occupant.email } : {}),
        ...(occupant?.telephone ? { telephone: occupant.telephone } : {}),
      })
    : undefined;
  const situation =
    (actif && reglages.situations[actif.id]) ||
    (actif?.id === "c-albert" ? "En études supérieures" : "");
  const brouillonBail = actif
    ? propositionPour(reglages, actif.id, {
        locataire: actif.nom,
        redacteur,
        ...(situation ? { situation } : {}),
      })
    : undefined;
  const sousVue = Boolean(vue);

  const memoriserBrouillon = (suivant: BrouillonBail) => {
    if (!actif) return;
    mettreAJourReglages((r) => ({
      ...r,
      propositions: { ...r.propositions, [actif.id]: suivant },
      ...(suivant.situation
        ? { situations: { ...r.situations, [actif.id]: suivant.situation } }
        : {}),
    }));
  };

  const publierProposition = (signature: boolean) => {
    if (!actif || !brouillonBail) return;
    memoriserBrouillon(brouillonBail);
    const heure = heureMaintenant();
    const date = new Date().toLocaleDateString("fr-FR");
    const textes = messagesDeclenches(
      reglages.parcours,
      "proposition-bail",
      cibleConversation(actif.type, actif.badge),
      { nom: actif.nom, heure, date, bien: actif.bienNom ?? "" },
    );
    const piece = `Proposition de bail - ${actif.nom}${actif.bienNom ? ` - ${actif.bienNom}` : ""}`;
    const conversationId = actif.id;
    const envois = [
      ...textes.map((texte, index) =>
        ajouterMessageFil({
          id: idNouveau(`m-auto-${index}`),
          conversationId,
          kind: "systeme",
          iconeSysteme: "key",
          texte,
        }),
      ),
      ajouterMessageFil({
        id: idNouveau("m-bail"),
        conversationId,
        kind: "envoye",
        heure,
        texte: signature
          ? `Bonjour,\nLa proposition de bail est prête pour signature. Merci de suivre le parcours indiqué.\nBien à vous,\n${redacteur}`
          : `Bonjour,\nVous trouverez ci-joint la proposition de bail.\nBien à vous,\n${redacteur}`,
        pieces: [{ nom: piece, taille: "186 Ko" }],
      }),
    ];
    void Promise.all(envois).then((resultats) => {
      if (resultats.some((ok) => !ok)) {
        toastErreur("La proposition n'a pas été enregistrée.");
        return;
      }
      setConversations((liste) =>
        liste.map((c) =>
          c.id === conversationId
            ? { ...c, extrait: "Proposition de bail", ilYa: "À l'instant" }
            : c,
        ),
      );
      toastOk(signature ? "Parcours de signature préparé." : "Proposition envoyée dans le fil.");
    });
    definirVue();
  };

  const apercuBail = () => {
    if (!actif || !brouillonBail) return;
    void telechargerPdf(
      `Proposition de bail — ${actif.nom}`,
      [
        `Logement : ${actif.bienNom ?? "—"}`,
        `Bailleur : ${brouillonBail.bailleur}`,
        `Locataire : ${brouillonBail.locataire}`,
        `Situation : ${brouillonBail.situation}`,
        `Du ${brouillonBail.debut} au ${brouillonBail.fin}`,
        `Loyer : ${brouillonBail.loyer || "—"} €`,
      ],
      {
        titulaire: actif.nom,
        locataire: brouillonBail.locataire,
        ...(actif.bienNom ? { logement: actif.bienNom } : {}),
        ...(profil?.adresse ? { adresse: profil.adresse } : {}),
      },
    );
  };

  const agir = (id: ActionFil["id"]) => {
    if (id === "voir-dossier") definirVue("profil");
    if (id === "proposer-bail") definirVue("proposition");
  };

  const basculerArchives = () => {
    const versArchives = !archives;
    setArchives(versArchives);
    setPanneau(null);
    const premiere = conversations.find((c) => c.archivee === versArchives);
    if (premiere) {
      setSelection(premiere.id);
      aller({ conv: premiere.id });
    }
  };

  return (
    <AppShell attendDonnees titre="Messagerie" sousTitre="Occupants, prestataires et équipe">
      <div className="flex min-h-[calc(100dvh-10rem)] flex-col overflow-hidden rounded-card border border-line bg-white lg:h-[calc(100dvh-12rem)] lg:min-h-[36rem] lg:flex-row">
        <ListeConversations
          className={cn((filMobileOuvert || sousVue) && "hidden lg:flex")}
          conversations={filtrees}
          selectionId={actif?.id}
          recherche={recherche}
          onRecherche={setRecherche}
          onSelection={selectionner}
          onEcrire={() => setEcrire(true)}
          onAutomatiques={() => definirVue("automatiques")}
          nonLus={nonLus}
          sectionsOuvertes={sectionsOuvertes}
          onToggleSection={(s) => setSectionsOuvertes((o) => ({ ...o, [s]: !o[s] }))}
        />

        {vue === "automatiques" ? (
          <PanneauMessagesAuto
            className={cn(!filMobileOuvert && "hidden lg:flex")}
            parcours={reglages.parcours}
            onChange={(parcours) => mettreAJourReglages((r) => ({ ...r, parcours }))}
            onRetour={() => definirVue()}
          />
        ) : vue === "profil" && profil ? (
          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col",
              !filMobileOuvert && "hidden lg:flex",
            )}
          >
            <ProfilInterlocuteur
              profil={profil}
              situation={situation}
              onSituation={(valeur) => {
                if (!actif) return;
                mettreAJourReglages((r) => ({
                  ...r,
                  situations: { ...r.situations, [actif.id]: valeur },
                }));
              }}
              onRetour={() => definirVue()}
              {...(profil.peutProposerBail
                ? { onProposerBail: () => definirVue("proposition") }
                : {})}
            />
          </div>
        ) : vue === "proposition" && actif && brouillonBail ? (
          <PropositionBail
            className={cn(!filMobileOuvert && "hidden lg:flex")}
            bienNom={actif.bienNom ?? "Logement"}
            adresse={profil?.adresse ?? "Adresse à compléter"}
            redacteur={redacteur}
            brouillon={brouillonBail}
            onChange={memoriserBrouillon}
            onRetour={() => definirVue()}
            onApercu={apercuBail}
            onEnregistrer={() => {
              memoriserBrouillon(brouillonBail);
              toastOk("Brouillon enregistré.");
            }}
            onPreparerSignature={() => publierProposition(true)}
          />
        ) : actif ? (
          <FilConversation
            className={cn(!filMobileOuvert && "hidden lg:flex")}
            onRetour={() => setFilMobileOuvert(false)}
            onVoirProfil={() => definirVue("profil")}
            onAction={agir}
            nbArchives={nbArchives}
            archivesOuvertes={archives}
            onBasculerArchives={basculerArchives}
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
                const suivante = conversations.find((c) => c.id !== id && c.archivee === archives);
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
          <div
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-3 p-6 text-sm text-ink-subtle",
              !filMobileOuvert && "hidden lg:flex",
            )}
          >
            <p>Aucun message.</p>
            <button
              type="button"
              onClick={basculerArchives}
              className="inline-flex h-11 items-center rounded-card border border-line px-3 text-xs text-ink-body"
            >
              {archives ? "Retour aux messages" : `Messages archivés (${nbArchives})`}
            </button>
          </div>
        )}
      </div>

      <DialogNouveauMessage
        ouvert={ecrire}
        onFermer={() => setEcrire(false)}
        onEnvoyer={(destinataire, objet, texte, pieces) => {
          const id = idNouveau("c");
          const corps = [objet && `Objet : ${objet}`, texte].filter(Boolean).join("\n\n");
          const extrait = corps || pieces.map((p) => p.nom).join(", ");
          const nouvelle: Conversation = {
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
          void enregistrerConversation(nouvelle).then(async (filOk) => {
            if (!filOk) {
              toastErreur("La conversation n'a pas été enregistrée.");
              return;
            }
            const messageOk = await ajouterMessageFil({
              id: idNouveau("m"),
              conversationId: id,
              kind: "envoye",
              texte: corps,
              heure: heureMaintenant(),
              ...(pieces.length ? { pieces } : {}),
            });
            if (!messageOk) {
              toastErreur("La conversation est ouverte, mais le message n'a pas été enregistré.");
              return;
            }
            setSelection(id);
            setFilMobileOuvert(true);
            setArchives(false);
            ajouterNotif({
              titre: "Message envoyé",
              detail: destinataire,
              href: `/messagerie?conv=${encodeURIComponent(id)}`,
            });
            toastOk("Conversation créée.");
          });
        }}
      />
    </AppShell>
  );
}
