import { useMemo, useState } from "react";
import { ChevronRight, SquarePen } from "lucide-react";
import { useAuth } from "@/auth/auth-context";
import { Bouton, Carte, Ecran, Entete, champClasse } from "@/components/portail/chrome";
import { useAncre } from "@/components/portail/use-ancre";
import {
  ajouterMessageFil,
  idNouveau,
  ouvrirConversationProspect,
  useSession,
} from "@/data/session";
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

function Liste() {
  const navigate = useNavigate();
  const session = useSession();
  const [filtre, setFiltre] = useState<(typeof FILTRES)[number]["id"]>("tous");
  const conversations = session.conversations.length
    ? session.conversations
    : [
        {
          id: "demo-gestionnaire",
          nom: GESTIONNAIRE_PORTAIL.nom,
          initiales: "YR",
          extrait: "Bonjour, je reste disponible pour le logement.",
          ilYa: "aujourd'hui",
          section: "team" as const,
          type: "team" as const,
          badge: "Gestionnaire",
          nonLu: true,
        },
      ];
  const lignes = [
    {
      id: "gestionnaire",
      nom: `${GESTIONNAIRE_PORTAIL.nom}`,
      initiales: "YR",
      extrait: `${GESTIONNAIRE_PORTAIL.societe} · ${GESTIONNAIRE_PORTAIL.telephone}`,
      ilYa: "",
      nonLu: false,
      section: "team" as const,
      type: "team" as const,
      badge: "Gestionnaire",
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
      <div className="flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Filtres">
        {FILTRES.map((f) => {
          const on = filtre === f.id;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setFiltre(f.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
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
              onClick={() => void navigate({ to: "/espace/messages", hash: `fil-${c.id}` })}
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
        titre={nom}
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
          if (!texte.trim()) {
            toastErreur("Écrivez un message.");
            return;
          }
          const conversationId = conv?.id ?? id;
          ajouterMessageFil({
            id: idNouveau("msg"),
            conversationId,
            kind: "envoye",
            texte: texte.trim(),
            heure: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          });
          setTexte("");
          toastOk("Message envoyé.");
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
