import { useMemo, useState } from "react";
import { ChevronRight, SquarePen } from "lucide-react";
import { useAuth } from "@/auth/auth-context";
import { Bouton, Carte, Ecran, Entete, champClasse } from "@/components/portail/chrome";
import { useAncre } from "@/components/portail/use-ancre";
import {
  ajouterMessageFil,
  enregistrerConversation,
  idNouveau,
  ouvrirConversationProspect,
  useSession,
} from "@/data/session";
import type { Conversation } from "@/data/messagerie-mo1";
import { GESTIONNAIRE_PORTAIL } from "@/lib/portail-mobile";
import { toastErreur, toastOk } from "@/lib/feedback";
import { useNavigate } from "@tanstack/react-router";

export function MessagesPortail() {
  const ancre = useAncre();
  if (ancre === "nouveau") return <NouveauContact />;
  if (ancre.startsWith("fil-")) return <Fil id={ancre.slice(4)} />;
  return <Liste />;
}

const FILTRES = [
  { id: "tous", label: "Tous" },
  { id: "locataires", label: "Locataires" },
  { id: "prestataires", label: "Prestataires" },
  { id: "prospects", label: "Prospects" },
  { id: "team", label: "Équipe" },
] as const;

function nomComplet(auth: { prenom?: string; nom?: string } | null) {
  return `${auth?.prenom ?? ""} ${auth?.nom ?? ""}`.trim();
}

/** Fil réellement rattaché à la personne : c'est celui que le serveur accepte d'enrichir. */
function filPersonnel(
  conversations: Conversation[],
  auth: { prenom?: string; nom?: string; email?: string; roleId?: string } | null,
) {
  const nom = nomComplet(auth).toLowerCase();
  const email = auth?.email?.trim().toLowerCase() ?? "";
  return conversations.find((c) => {
    if (auth?.roleId === "prestataire" && c.type !== "prestataire") return false;
    if (email && c.assigne?.trim().toLowerCase() === email) return true;
    return nom.length > 0 && !c.assigne && c.nom.trim().toLowerCase() === nom;
  });
}

function Liste() {
  const navigate = useNavigate();
  const session = useSession();
  const auth = useAuth();
  const [filtre, setFiltre] = useState<(typeof FILTRES)[number]["id"]>("tous");
  const personnel = filPersonnel(session.conversations, auth);
  const conversations = session.conversations.filter((c) => c.id !== personnel?.id);
  const typeFil =
    personnel?.type ??
    (auth?.roleId === "prestataire"
      ? "prestataire"
      : auth?.roleId === "voyageur"
        ? "voyageur"
        : "locataire");
  const lignes = [
    {
      id: personnel?.id ?? "creer-gestionnaire",
      nom: GESTIONNAIRE_PORTAIL.nom,
      initiales: "YR",
      extrait:
        personnel?.extrait || `${GESTIONNAIRE_PORTAIL.societe} · ${GESTIONNAIRE_PORTAIL.telephone}`,
      ilYa: personnel?.ilYa ?? "",
      nonLu: personnel?.nonLu ?? false,
      section: typeFil === "prestataire" ? ("prestataires" as const) : ("inbox" as const),
      type: typeFil,
      badge: "Gestionnaire",
      creer: !personnel,
    },
    ...conversations,
  ];
  const visibles = lignes.filter((c) => {
    if (filtre === "tous") return true;
    if (filtre === "prospects") return c.section === "prospections" || c.badge === "Prospect";
    if (filtre === "prestataires") return c.section === "prestataires" || c.type === "prestataire";
    if (filtre === "team") return c.section === "team" || c.type === "team";
    return c.type === "locataire" || c.type === "voyageur" || c.section === "inbox";
  });
  return (
    <Ecran className="gap-3 px-0">
      <div className="px-4">
        <div className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center">
          <span />
          <h1 className="text-center font-display text-[20px] font-semibold">Messagerie</h1>
          <button
            type="button"
            aria-label="Nouveau contact"
            onClick={() => void navigate({ to: "/espace/messages", hash: "nouveau" })}
            className="grid size-11 place-items-center justify-self-end text-[#3b82f6]"
          >
            <SquarePen className="size-5" />
          </button>
        </div>
      </div>
      <div
        className="flex w-full min-w-0 gap-2 overflow-x-auto px-4 pb-1"
        role="tablist"
        aria-label="Filtres"
      >
        {FILTRES.map((f) => {
          const on = filtre === f.id;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setFiltre(f.id)}
              className={`inline-flex h-11 shrink-0 items-center rounded-full px-3 text-xs font-semibold ${
                on ? "bg-[#3b82f6] text-white" : "bg-white text-[#3b82f6]"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>
      <ul className="bg-white">
        {visibles.map((c) => (
          <li key={c.id} className="border-b border-[#f2f4f7]">
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
              onClick={() => {
                if ("creer" in c && c.creer) {
                  const nom = nomComplet(auth);
                  const email = auth?.email?.trim().toLowerCase() ?? "";
                  if (!nom || !email) return;
                  const type =
                    auth?.roleId === "prestataire"
                      ? "prestataire"
                      : auth?.roleId === "voyageur"
                        ? "voyageur"
                        : "locataire";
                  const id = idNouveau("c");
                  const initiales = nom
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase() ?? "")
                    .join("");
                  void enregistrerConversation({
                    id,
                    section: type === "prestataire" ? "prestataires" : "inbox",
                    nom,
                    initiales: initiales || "??",
                    type,
                    badge:
                      type === "prestataire"
                        ? "Prestataire"
                        : auth?.roleId === "proprietaire"
                          ? "Propriétaire"
                          : type === "voyageur"
                            ? "Voyageur"
                            : "Locataire",
                    extrait: "Message au gestionnaire",
                    ilYa: "À l'instant",
                    nonLu: false,
                    archivee: false,
                    assigne: email,
                  }).then((ok) => {
                    if (!ok) return;
                    void navigate({ to: "/espace/messages", hash: `fil-${id}` });
                  });
                  return;
                }
                void navigate({ to: "/espace/messages", hash: `fil-${c.id}` });
              }}
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#e7eef2] text-sm font-semibold text-[var(--portail-encre)]">
                {c.initiales}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[15px] font-semibold text-[var(--portail-encre)]">
                    {c.nom}
                  </span>
                  <span className="shrink-0 text-[11px] text-[#98a2b3]">{c.ilYa}</span>
                </span>
                <span className="block truncate text-xs text-[#667085]">{c.extrait}</span>
              </span>
              {c.nonLu && <span className="size-2 rounded-full bg-[#3b82f6]" aria-label="Non lu" />}
              <ChevronRight className="size-4 shrink-0 text-[#c5c8ce]" />
            </button>
          </li>
        ))}
        {visibles.length === 0 && (
          <li className="px-4 py-6 text-sm text-[#667085]">Aucune conversation dans ce filtre.</li>
        )}
      </ul>
    </Ecran>
  );
}

function Fil({ id }: { id: string }) {
  const navigate = useNavigate();
  const session = useSession();
  const auth = useAuth();
  const [texte, setTexte] = useState("");
  const conv = session.conversations.find((c) => c.id === id);
  const nom = conv?.nom ?? GESTIONNAIRE_PORTAIL.nom;
  const messages = useMemo(
    () => session.messagesFil.filter((m) => m.conversationId === id),
    [id, session.messagesFil],
  );
  return (
    <Ecran>
      <Entete
        titre={conv && filPersonnel([conv], auth) ? GESTIONNAIRE_PORTAIL.nom : nom}
        sousTitre={conv?.bienNom}
        surRetour={() => void navigate({ to: "/espace/messages" })}
      />
      <ul className="space-y-2">
        {messages.length === 0 && (
          <li className="rounded-2xl bg-white px-3 py-2 text-sm text-[#667085]">
            Fil avec {nom}. Écrivez le premier message.
          </li>
        )}
        {messages.map((m) => (
          <li
            key={m.id}
            className={`max-w-[85%] rounded-[12px] px-3 py-2 text-[14px] shadow-sm ${m.kind === "envoye" ? "ml-auto bg-[#d9fdd3] text-black" : "bg-white text-black"}`}
          >
            <p>{m.texte}</p>
            {m.heure && <p className="mt-1 text-[10px] opacity-70">{m.heure}</p>}
          </li>
        ))}
      </ul>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void (async () => {
            if (!texte.trim()) {
              toastErreur("Écrivez un message.");
              return;
            }
            const conversationId = conv?.id ?? id;
            if (!conv) {
              toastErreur("Ce fil n'est pas enregistré. Ouvrez le gestionnaire depuis la liste.");
              return;
            }
            const ok = await ajouterMessageFil({
              id: idNouveau("msg"),
              conversationId,
              kind: "envoye",
              texte: texte.trim(),
              heure: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
            });
            if (!ok) {
              toastErreur("Le message n'a pas été enregistré.");
              return;
            }
            setTexte("");
            toastOk("Message envoyé.");
          })();
        }}
      >
        <input
          className={champClasse}
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder="Votre message"
          aria-label="Message"
        />
        <button
          type="submit"
          className="h-11 rounded-full bg-[#5090A8] px-4 text-xs font-semibold text-white"
        >
          Envoyer
        </button>
      </form>
    </Ecran>
  );
}

function NouveauContact() {
  const navigate = useNavigate();
  const session = useSession();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");
  const [resultat, setResultat] = useState("");
  return (
    <Ecran>
      <Entete titre="Nouveau contact" surRetour={() => void navigate({ to: "/espace/messages" })} />
      <Carte className="space-y-3">
        <p className="text-xs leading-relaxed text-[#667085]">
          E-mail ou téléphone. S'il est déjà sur Hublify, le profil arrive dans ses messages. Sinon
          un lien directionnel est préparé, sans envoi réel.
        </p>
        <input
          className={champClasse}
          value={email}
          placeholder="E-mail"
          onChange={(e) => setEmail(e.target.value)}
          aria-label="E-mail du contact"
        />
        <input
          className={champClasse}
          value={tel}
          placeholder="Téléphone"
          onChange={(e) => setTel(e.target.value)}
          aria-label="Téléphone du contact"
        />
        <Bouton
          onClick={() => {
            const cible = email.trim().toLowerCase();
            if (!cible && !tel.trim()) {
              toastErreur("Indiquez un e-mail ou un téléphone.");
              return;
            }
            const connu =
              session.membres.some((m) => m.email?.toLowerCase() === cible) ||
              session.prestataires.some((p) => p.email.toLowerCase() === cible) ||
              cible === GESTIONNAIRE_PORTAIL.email;
            const nom = cible || tel.trim();
            const lien = `https://hublify.app/invitation?de=${encodeURIComponent(auth?.email ?? "portail")}`;
            const extrait = connu
              ? "Profil partagé dans la messagerie."
              : "Lien directionnel préparé, sans envoi réel.";
            const conversationId = ouvrirConversationProspect({
              nom,
              extrait,
              type: "voyageur",
              assigne: auth?.email,
            });
            ajouterMessageFil({
              id: idNouveau("msg"),
              conversationId,
              kind: "envoye",
              texte: connu
                ? `Profil partagé avec ${nom}.`
                : `Lien directionnel pour ${nom} : ${lien}`,
              heure: new Date().toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            });
            if (connu) {
              setResultat("Contact déjà sur Hublify : le profil est dans la messagerie.");
              toastOk("Contact trouvé sur la plateforme.");
              return;
            }
            setResultat(`Lien directionnel (non envoyé) : ${lien}`);
            void navigator.clipboard?.writeText(lien).catch(() => {});
            toastOk("Lien préparé et copié. Aucun SMS ni e-mail n'est parti.");
          }}
        >
          Préparer le contact
        </Bouton>
        {resultat && <p className="break-all text-xs text-[#344054]">{resultat}</p>}
      </Carte>
    </Ecran>
  );
}
