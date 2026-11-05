import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bouton, Ecran, Entete } from "@/components/portail/chrome";
import { FRAMES_HD, frameParId, type FrameHd } from "@/data/frames-hd";
import { useSession } from "@/data/session";
import { GESTIONNAIRE_PORTAIL } from "@/lib/portail-mobile";
import { toastOk } from "@/lib/feedback";

const PIECES = [
  { id: "entree", nom: "Entrée", detail: "4 éléments inspectés" },
  { id: "sejour", nom: "Séjour", detail: "5 sur 6 éléments inspectés" },
  { id: "cuisine", nom: "Cuisine", detail: "8 éléments à inspecter" },
  { id: "chambre", nom: "Chambre", detail: "6 éléments à inspecter" },
  { id: "sdb", nom: "Salle de bains", detail: "7 éléments à inspecter" },
  { id: "wc", nom: "WC", detail: "4 éléments à inspecter" },
];

const COMPTEURS = ["EDF", "Eau chaude", "Eau froide", "Gaz"];

function lireSet(cle: string) {
  try {
    const brut = localStorage.getItem(cle);
    return new Set<string>(brut ? (JSON.parse(brut) as string[]) : []);
  } catch {
    return new Set<string>();
  }
}

function ecrireSet(cle: string, valeurs: Set<string>) {
  localStorage.setItem(cle, JSON.stringify([...valeurs]));
}

export function EtapesSejour() {
  const navigate = useNavigate();
  return (
    <Ecran>
      <Entete titre="Étapes du séjour" surRetour={() => void navigate({ to: "/espace" })} />
      <ul className="space-y-2">
        {FRAMES_HD.map((f) => (
          <li key={f.id}>
            <button
              type="button"
              className="flex min-h-12 w-full items-center justify-between rounded-[16px] bg-white px-4 text-left text-[14px] shadow-[var(--portail-ombre)]"
              onClick={() => void navigate({ to: "/espace", hash: `f-${f.id}` })}
            >
              <span className="font-semibold text-black">{f.titre}</span>
              <span className="text-[11px] text-[#667085]">{f.noeud}</span>
            </button>
          </li>
        ))}
      </ul>
    </Ecran>
  );
}

export function EcranFrame({ id }: { id: string }) {
  const frame = frameParId(id);
  const navigate = useNavigate();
  if (!frame) {
    return (
      <Ecran>
        <Entete titre="Écran introuvable" surRetour={() => void navigate({ to: "/espace" })} />
      </Ecran>
    );
  }
  return (
    <div data-frame={frame.id} data-famille={frame.famille}>
      {corps(frame)}
    </div>
  );
}

function corps(frame: FrameHd) {
  switch (frame.famille) {
    case "compteurs":
      return <Compteurs />;
    case "edl":
      return <Edl />;
    case "recherche":
      return <RechercheActivite />;
    case "acces":
      return <AccesCourt />;
    case "faq":
      return <FaqCourt />;
    case "intro":
      return <IntroDossier />;
    case "fil":
      return <FilCourt />;
    case "modale":
      return <ModaleAjout />;
    case "messages":
    case "candidature":
      return <ListeCourte titre={frame.titre} />;
    case "recap":
      return <Recap />;
    default:
      return <ListeCourte titre={frame.titre} />;
  }
}

function Compteurs() {
  const navigate = useNavigate();
  const session = useSession();
  const bien = session.biens[0];
  const [faits, setFaits] = useState(() => lireSet("hublify.portail.compteurs"));
  const basculer = (nom: string) => {
    const suivant = new Set(faits);
    if (suivant.has(nom)) suivant.delete(nom);
    else suivant.add(nom);
    setFaits(suivant);
    ecrireSet("hublify.portail.compteurs", suivant);
  };
  return (
    <Ecran className="bg-[#f4f7f4]">
      <Entete
        titre="Relevé de compteur"
        surRetour={() => void navigate({ to: "/espace", hash: "etapes" })}
      />
      <p className="text-[12px] text-[#3d5c4a]">{bien?.adresse ?? "12 rue des Lilas · Appt. 4"}</p>
      <h2 className="font-display text-[28px] font-semibold text-[#1f4d38]">
        Relevés de compteurs
      </h2>
      <ul className="space-y-3">
        {COMPTEURS.map((nom) => {
          const on = faits.has(nom);
          return (
            <li key={nom}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => basculer(nom)}
                className={`flex w-full items-center justify-between rounded-[16px] px-4 py-3 text-left shadow-[var(--portail-ombre)] ${
                  on ? "bg-[#e7f0ea]" : "bg-white"
                }`}
              >
                <span>
                  <span className="block text-[15px] font-semibold text-[#1f4d38]">{nom}</span>
                  <span className="text-[12px] text-[#5d6b62]">
                    {nom === "EDF" ? "Dernier relevé : 5560 kW" : "Dernier relevé :"}
                  </span>
                </span>
                <span
                  className={`grid size-6 place-items-center rounded-full border ${
                    on ? "border-[#1f4d38] bg-[#1f4d38] text-white" : "border-[#c5d0c8]"
                  }`}
                >
                  {on ? "✓" : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className="h-12 rounded-[16px] bg-white text-left text-[15px] font-semibold text-[#1f4d38] shadow-[var(--portail-ombre)]"
        onClick={() => {
          const nom = `Relevé ${faits.size + 1}`;
          basculer(nom);
          toastOk("Relevé ajouté.");
        }}
      >
        + Ajouter un relevé
      </button>
      <Bouton
        onClick={() => {
          toastOk("Relevés enregistrés.");
          void navigate({ to: "/espace", hash: "f-362-3064" });
        }}
      >
        Valider
      </Bouton>
      <p className="text-center text-[12px] text-[#667085]">
        Votre avancée est enregistrée automatiquement.
      </p>
    </Ecran>
  );
}

function Edl() {
  const navigate = useNavigate();
  const session = useSession();
  const bien = session.biens[0];
  const [faits, setFaits] = useState(() => lireSet("hublify.portail.edl"));
  const basculer = (id: string) => {
    const suivant = new Set(faits);
    if (suivant.has(id)) suivant.delete(id);
    else suivant.add(id);
    setFaits(suivant);
    ecrireSet("hublify.portail.edl", suivant);
    toastOk("Pièce mise à jour.");
  };
  return (
    <Ecran>
      <Entete
        titre="État des lieux"
        surRetour={() => void navigate({ to: "/espace", hash: "etapes" })}
      />
      <p className="text-[12px] text-[#1f4d38]">{bien?.adresse ?? "Adresse du logement"}</p>
      <h2 className="font-display text-[28px] font-semibold text-[#1f4d38]">Vérifier les lieux</h2>
      <p className="text-[13px] leading-relaxed text-[#3d5c4a]">
        Vous pouvez vérifier l'état des lieux et faire des remarques. Vous disposez de 48 h pour
        valider, après ce délai le document est validé.
      </p>
      <ul className="space-y-3">
        {PIECES.map((p) => {
          const on = faits.has(p.id);
          return (
            <li key={p.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => basculer(p.id)}
                className={`flex w-full items-center justify-between rounded-[16px] px-4 py-3 text-left shadow-[var(--portail-ombre)] ${
                  on ? "bg-[#e7f0ea]" : "bg-white"
                }`}
              >
                <span>
                  <span className="block font-semibold text-[#1f4d38]">{p.nom}</span>
                  <span className="text-[12px] text-[#5d6b62]">{p.detail}</span>
                </span>
                <span
                  className={`grid size-6 place-items-center rounded-full border ${
                    on ? "border-[#1f4d38] bg-[#1f4d38] text-white" : "border-[#c5d0c8]"
                  }`}
                >
                  {on ? "✓" : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className="h-[52px] rounded-[26px] bg-[#1f4d38] text-[16px] font-semibold text-white"
        onClick={() => {
          toastOk("État des lieux validé.");
          void navigate({ to: "/espace/logement", hash: "edl" });
        }}
      >
        Valider l'état des lieux
      </button>
    </Ecran>
  );
}

function RechercheActivite() {
  const navigate = useNavigate();
  const [filtre, setFiltre] = useState("Activités");
  const offres = [
    { nom: "Restaurant Le Suquet", prix: "77 €" },
    { nom: "Croisière baie de Cannes", prix: "124 €" },
    { nom: "Location bateau", prix: "234 €" },
  ];
  return (
    <Ecran>
      <Entete
        titre="Rechercher une activité"
        surRetour={() => void navigate({ to: "/espace", hash: "etapes" })}
      />
      <p className="rounded-[16px] bg-white px-4 py-3 text-center text-[14px] shadow-[var(--portail-ombre)]">
        Cannes, France
      </p>
      <div className="flex gap-2">
        {["filtre", "Restaurants", "services", "Activités"].map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filtre === f}
            onClick={() => setFiltre(f)}
            className={`h-9 rounded-full px-3 text-[12px] font-semibold ${
              filtre === f ? "bg-[#5591A9] text-white" : "bg-white text-black"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <ul className="space-y-2">
        {offres.map((o) => (
          <li key={o.nom}>
            <button
              type="button"
              className="flex w-full justify-between rounded-[16px] bg-white px-4 py-3 text-left shadow-[var(--portail-ombre)]"
              onClick={() => void navigate({ to: "/espace", hash: "autour-resultats" })}
            >
              <span className="font-semibold">{o.nom}</span>
              <span>{o.prix}</span>
            </button>
          </li>
        ))}
      </ul>
    </Ecran>
  );
}

function AccesCourt() {
  const navigate = useNavigate();
  const session = useSession();
  const bien = session.biens[0];
  return (
    <Ecran>
      <Entete
        titre="Fiche d'accès"
        surRetour={() => void navigate({ to: "/espace", hash: "etapes" })}
      />
      <h2 className="text-center font-display text-[22px] font-semibold">
        {bien?.nom ?? "Appartement Colette"}
      </h2>
      <section className="space-y-2 rounded-[16px] bg-white p-4 text-center shadow-[var(--portail-ombre)]">
        <p className="font-semibold">Wi-Fi</p>
        <p className="text-[14px]">Réseau du logement</p>
        <p className="font-semibold">Code d'accès</p>
        <p className="text-[14px]">Fiche d'accès</p>
        <p className="font-semibold">Adresse</p>
        <p className="text-[14px]">{bien?.adresse ?? "Cannes"}</p>
        <Bouton onClick={() => void navigate({ to: "/espace" })}>OK</Bouton>
        <Bouton variante="ligne" onClick={() => void navigate({ to: "/espace/messages" })}>
          Gestionnaire de mon logement
        </Bouton>
      </section>
    </Ecran>
  );
}

function FaqCourt() {
  const navigate = useNavigate();
  return (
    <Ecran>
      <Entete
        titre="J'ai un problème"
        surRetour={() => void navigate({ to: "/espace", hash: "etapes" })}
      />
      <p className="text-[14px] leading-relaxed">
        Électricité, plomberie : les gestes autonomes sont dans la FAQ. Sinon, contactez le
        gestionnaire.
      </p>
      <Bouton onClick={() => void navigate({ to: "/espace/logement", hash: "faq" })}>
        Ouvrir la FAQ
      </Bouton>
    </Ecran>
  );
}

export function IntroDossier({ onContinuer }: { onContinuer?: () => void }) {
  const navigate = useNavigate();
  return (
    <Ecran>
      <Entete titre="Dossier" surRetour={() => void navigate({ to: "/espace", hash: "etapes" })} />
      <h2 className="text-center text-[16px] font-semibold">
        Constituez et partagez votre dossier de location en deux étapes
      </h2>
      <section className="space-y-2 rounded-[16px] bg-white p-4 text-[14px] shadow-[var(--portail-ombre)]">
        <p className="font-semibold">1. Je dépose mes pièces</p>
        <p>Les pièces nécessaires et rien que celles-là.</p>
        <ul className="list-disc pl-5">
          <li>Pièce d'identité</li>
          <li>Justificatif de situation d'hébergement</li>
          <li>Justificatif de situation professionnelle</li>
          <li>Avis d'imposition</li>
          <li>Justificatif de ressources</li>
        </ul>
        <p className="font-semibold">2. Je partage mon dossier en sécurité</p>
        <p>Vous créez un lien par destinataire, avec une date d'expiration.</p>
      </section>
      <Bouton
        onClick={() => {
          if (onContinuer) onContinuer();
          else void navigate({ to: "/espace/precheckin", hash: "formulaire" });
        }}
      >
        Continuer
      </Bouton>
    </Ecran>
  );
}

function FilCourt() {
  const navigate = useNavigate();
  const session = useSession();
  const conv = session.conversations[0];
  const nom = conv?.nom ?? GESTIONNAIRE_PORTAIL.nom;
  return (
    <Ecran className="bg-[#efeae2]">
      <Entete titre={nom} surRetour={() => void navigate({ to: "/espace/messages" })} />
      <ul className="space-y-2">
        <li className="ml-auto max-w-[80%] rounded-[12px] bg-[#d9fdd3] px-3 py-2 text-[14px]">
          Bonjour, je confirme le créneau.
        </li>
        <li className="max-w-[80%] rounded-[12px] bg-white px-3 py-2 text-[14px]">
          {conv?.extrait ?? "Message du gestionnaire."}
        </li>
      </ul>
      <Bouton
        onClick={() =>
          void navigate({ to: "/espace/messages", hash: `fil-${conv?.id ?? "gestionnaire"}` })
        }
      >
        Ouvrir la conversation
      </Bouton>
    </Ecran>
  );
}

function ModaleAjout() {
  const navigate = useNavigate();
  return (
    <Ecran>
      <Entete titre="Ajouter" surRetour={() => void navigate({ to: "/espace", hash: "etapes" })} />
      <Bouton onClick={() => void navigate({ to: "/espace/messages", hash: "nouveau" })}>
        Nouveau contact
      </Bouton>
      <Bouton
        variante="ligne"
        onClick={() => void navigate({ to: "/espace/calendrier", hash: "note" })}
      >
        Note du calendrier
      </Bouton>
    </Ecran>
  );
}

function ListeCourte({ titre }: { titre: string }) {
  const navigate = useNavigate();
  const session = useSession();
  return (
    <Ecran>
      <Entete titre={titre} surRetour={() => void navigate({ to: "/espace", hash: "etapes" })} />
      <ul className="divide-y divide-[#f2f4f7] overflow-hidden rounded-[16px] bg-white">
        {session.conversations.slice(0, 6).map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-3 py-3 text-left"
              onClick={() => void navigate({ to: "/espace/messages", hash: `fil-${c.id}` })}
            >
              <span className="grid size-11 place-items-center rounded-full bg-[#dfe5e7] text-[12px] font-semibold">
                {c.initiales}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{c.nom}</span>
                <span className="block truncate text-[13px] text-[#667085]">{c.extrait}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Ecran>
  );
}

function Recap() {
  const navigate = useNavigate();
  const session = useSession();
  const resa = session.reservationsDossier[0];
  return (
    <Ecran>
      <Entete
        titre="Récapitulatif du séjour"
        surRetour={() => void navigate({ to: "/espace", hash: "etapes" })}
      />
      <section className="rounded-[16px] bg-white p-4 shadow-[var(--portail-ombre)]">
        <p className="text-[14px] font-normal">
          {resa ? `${resa.occupant} · ${resa.arrivee} → ${resa.depart}` : "Aucun séjour en cours"}
        </p>
      </section>
      <Bouton onClick={() => void navigate({ to: "/espace/logement" })}>Voir le logement</Bouton>
    </Ecran>
  );
}
