import { useMemo, useState } from "react";
import { useAuth } from "@/auth/auth-context";
import { Bouton, Carte, Ecran, Entete, champClasse } from "@/components/portail/chrome";
import { useAncre } from "@/components/portail/use-ancre";
import { idNouveau, ouvrirConversationProspect, poserCollection, useSession } from "@/data/session";
import { GESTIONNAIRE_PORTAIL } from "@/lib/portail-mobile";
import { toastErreur, toastOk } from "@/lib/feedback";
import { useNavigate } from "@tanstack/react-router";

export function MessagesPortail() {
  const ancre = useAncre();
  if (ancre === "nouveau") return <NouveauContact />;
  if (ancre.startsWith("fil-")) return <Fil id={ancre.slice(4)} />;
  return <Liste />;
}

function Liste() {
  const navigate = useNavigate();
  const session = useSession();
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
          badge: "Gestionnaire",
          nonLu: true,
        },
      ];
  const prospects = conversations.filter(
    (c) => c.section === "prospections" || c.badge === "Prospect",
  );
  const autres = conversations.filter((c) => !prospects.includes(c));
  return (
    <Ecran>
      <Entete titre="Messagerie" />
      <button
        type="button"
        className="inline-flex min-h-11 items-center self-end text-xs font-medium text-[#5090A8]"
        onClick={() => void navigate({ to: "/espace/messages", hash: "nouveau" })}
      >
        Nouveau contact
      </button>
      <Groupe
        titre="Gestionnaire du logement"
        lignes={[
          {
            id: "gestionnaire",
            nom: `${GESTIONNAIRE_PORTAIL.nom} (${GESTIONNAIRE_PORTAIL.societe})`,
            initiales: "YR",
            extrait: GESTIONNAIRE_PORTAIL.telephone,
            ilYa: "",
            nonLu: false,
          },
        ]}
      />
      <Groupe titre="Échanges" lignes={autres} />
      <Groupe titre="Prospects" lignes={prospects} />
    </Ecran>
  );
}

function Groupe({
  titre,
  lignes,
}: {
  titre: string;
  lignes: Array<{
    id: string;
    nom: string;
    initiales: string;
    extrait: string;
    ilYa: string;
    nonLu?: boolean;
  }>;
}) {
  const navigate = useNavigate();
  if (lignes.length === 0) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-xs uppercase tracking-[0.14em] text-[#98a2b3]">{titre}</h2>
      <ul className="overflow-hidden rounded-[22px] bg-white">
        {lignes.map((c) => (
          <li key={c.id} className="border-b border-[#f2f4f7] last:border-0">
            <button
              type="button"
              className="flex w-full items-center gap-3 px-3 py-3 text-left"
              onClick={() => void navigate({ to: "/espace/messages", hash: `fil-${c.id}` })}
            >
              <span className="grid size-10 place-items-center rounded-full bg-[#e7f4f6] text-xs font-semibold text-[#5090A8]">
                {c.initiales}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-[#1d2939]">{c.nom}</span>
                  <span className="text-[10px] text-[#98a2b3]">{c.ilYa}</span>
                </span>
                <span className="block truncate text-xs text-[#667085]">{c.extrait}</span>
              </span>
              {c.nonLu && <span className="size-2 rounded-full bg-[#5090A8]" aria-label="Non lu" />}
            </button>
          </li>
        ))}
      </ul>
    </section>
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
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.kind === "envoye" ? "ml-auto bg-[#5090A8] text-white" : "bg-white text-[#1d2939]"}`}
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
          poserCollection("messagesFil", (liste) => [
            ...liste,
            {
              id: idNouveau("msg"),
              conversationId,
              kind: "envoye" as const,
              texte: texte.trim(),
              heure: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
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
            poserCollection("messagesFil", (liste) => [
              ...liste,
              {
                id: idNouveau("msg"),
                conversationId,
                kind: "envoye" as const,
                texte: connu
                  ? `Profil partagé avec ${nom}.`
                  : `Lien directionnel pour ${nom} : ${lien}`,
                heure: new Date().toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              },
            ]);
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
