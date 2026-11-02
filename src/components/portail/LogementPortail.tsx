import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/auth/auth-context";
import { Bouton, Carte, Champ, Ecran, Entete, champClasse } from "@/components/portail/chrome";
import { ecrireEdl, ecrireRdv, lireEdl, lireRdv } from "@/components/portail/etat-local";
import { useAncre } from "@/components/portail/use-ancre";
import { chargerAccesLieux } from "@/data/session-remote";
import { ajouterNotif, idNouveau, upsertDossierLocation, useSession } from "@/data/session";
import { PIECES_DOSSIER_DEFAUT } from "@/data/v1-metier";
import { FAQ_LOGEMENT, GESTIONNAIRE_PORTAIL, fenetreEdl } from "@/lib/portail-mobile";
import { toastErreur, toastOk } from "@/lib/feedback";

export function LogementPortail() {
  const ancre = useAncre();
  if (ancre === "faq") return <FaqPortail />;
  if (ancre === "depart") return <Depart />;
  if (ancre === "edl") return <ValidationEdl />;
  if (ancre === "rdv") return <RendezVous />;
  return <FicheLogement />;
}

function FicheLogement() {
  const navigate = useNavigate();
  const session = useSession();
  const bien = session.biens[0];
  const nom = bien?.nom ?? "Appartement Colette";
  const adresse = bien?.adresse ?? "8 rue Lycklama, 06400 Cannes";
  return (
    <Ecran>
      <Entete titre="Mon logement" />
      <Carte className="space-y-2">
        <p className="text-base font-semibold text-[#1d2939]">{nom}</p>
        <p className="text-sm text-[#667085]">{adresse}</p>
        <p className="text-xs text-[#667085]">{session.parametrage.consignesArrivee}</p>
        <button
          type="button"
          className="text-sm font-medium text-[#5090A8]"
          onClick={() => void navigate({ to: "/espace", hash: "acces" })}
        >
          Fiche d'accès
        </button>
      </Carte>
      <Bouton onClick={() => void navigate({ to: "/espace/logement", hash: "depart" })}>
        Je déclare mon départ du logement
      </Bouton>
      <Bouton
        variante="ligne"
        onClick={() => void navigate({ to: "/espace/logement", hash: "faq" })}
      >
        J'ai un problème dans mon logement
      </Bouton>
      <Bouton
        variante="ghost"
        onClick={() => void navigate({ to: "/espace/documents", hash: "location" })}
      >
        Bail, quittances et archives
      </Bouton>
    </Ecran>
  );
}

export function FaqPortail() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const hits = FAQ_LOGEMENT.filter(
    (f) =>
      !q.trim() ||
      f.question.toLowerCase().includes(q.toLowerCase()) ||
      f.reponse.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <Ecran>
      <Entete
        titre="J'ai un problème dans mon logement"
        surRetour={() => void navigate({ to: "/espace/logement" })}
      />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Électricité, plomberie…"
        className={champClasse}
        aria-label="Rechercher dans la FAQ"
      />
      <ul className="space-y-3">
        {hits.map((f) => (
          <li key={f.id} className="rounded-[22px] bg-white p-4">
            <p className="text-sm font-medium text-[#1d2939]">{f.question}</p>
            <p className="mt-1 text-xs leading-relaxed text-[#667085]">{f.reponse}</p>
          </li>
        ))}
      </ul>
      {hits.length === 0 && (
        <p className="text-sm text-[#344054]">Aucune solution autonome pour cette recherche.</p>
      )}
      <Bouton onClick={() => void navigate({ to: "/espace/messages" })}>
        Contacter {GESTIONNAIRE_PORTAIL.nom}
      </Bouton>
    </Ecran>
  );
}

function Depart() {
  const navigate = useNavigate();
  const auth = useAuth();
  const session = useSession();
  const [depart, setDepart] = useState("");
  return (
    <Ecran>
      <Entete
        titre="Déclarer mon départ"
        sousTitre="La date est validée par le gestionnaire. Les documents de sortie sont générés ensuite."
        surRetour={() => void navigate({ to: "/espace/logement" })}
      />
      <Carte>
        <Champ label="Date de départ précise">
          <input
            type="date"
            className={champClasse}
            value={depart}
            onChange={(e) => setDepart(e.target.value)}
          />
        </Champ>
        <div className="mt-3">
          <Bouton
            onClick={() => {
              if (!depart) {
                toastErreur("Choisissez une date de départ.");
                return;
              }
              const existant = session.dossiersLocation.find(
                (d) => d.email.toLowerCase() === (auth?.email ?? "").toLowerCase(),
              );
              upsertDossierLocation({
                id: existant?.id ?? idNouveau("dos"),
                occupantId: existant?.occupantId ?? session.occupants[0]?.id ?? "o",
                occupantNom:
                  existant?.occupantNom || `${auth?.prenom ?? ""} ${auth?.nom ?? ""}`.trim(),
                email: auth?.email ?? "",
                statut: existant?.statut ?? "complet",
                pieces: existant?.pieces ?? PIECES_DOSSIER_DEFAUT,
                garants: existant?.garants ?? [],
                dureeAccesMois: existant?.dureeAccesMois ?? 24,
                departDeclare: depart,
                departValide: false,
                ...(existant?.archiveLe ? { archiveLe: existant.archiveLe } : {}),
              });
              ajouterNotif({
                titre: "Départ déclaré",
                detail: `${auth?.prenom ?? ""} ${auth?.nom ?? ""} · ${depart}`,
                href: "/espace/logement",
              });
              toastOk(
                "Demande envoyée. Le gestionnaire valide la date avant génération des documents.",
              );
              setDepart("");
            }}
          >
            Envoyer au gestionnaire
          </Bouton>
        </div>
      </Carte>
    </Ecran>
  );
}

function ValidationEdl() {
  const navigate = useNavigate();
  const session = useSession();
  const stock = lireEdl();
  const [valideLe, setValideLe] = useState(stock.valideLe);
  const fenetre = fenetreEdl(stock.emisLe);
  const pieces = session.edl[0]?.pieces ?? [
    { id: "sejour", nom: "Séjour", etat: "ok" as const },
    { id: "cuisine", nom: "Cuisine", etat: "ok" as const },
    { id: "chambre", nom: "Chambre", etat: "ok" as const },
    { id: "sdb", nom: "Salle de bain", etat: "ok" as const },
    { id: "wc", nom: "WC", etat: "ok" as const },
  ];
  const heures = Math.floor(fenetre.resteMs / 3600000);
  return (
    <Ecran>
      <Entete
        titre="Valider l'état des lieux"
        sousTitre={
          fenetre.ouvert
            ? `Il reste environ ${heures} h sur les 48 h.`
            : "Le délai de 48 h est passé."
        }
        surRetour={() => void navigate({ to: "/espace" })}
      />
      <ul className="space-y-2">
        {pieces.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm"
          >
            <span>{p.nom}</span>
            <span className="text-xs text-[#667085]">{p.etat === "ok" ? "Bon état" : p.etat}</span>
          </li>
        ))}
      </ul>
      <Bouton
        disabled={!fenetre.ouvert || Boolean(valideLe)}
        onClick={() => {
          const maintenant = new Date().toISOString();
          ecrireEdl({ emisLe: stock.emisLe, valideLe: maintenant });
          setValideLe(maintenant);
          toastOk("État des lieux validé dans le délai de 48 h.");
        }}
      >
        {valideLe ? "Déjà validé" : "Je valide mon EDL"}
      </Bouton>
      <Bouton
        variante="ligne"
        onClick={() => void navigate({ to: "/espace/logement", hash: "rdv" })}
      >
        Je fixe un rendez-vous
      </Bouton>
    </Ecran>
  );
}

function RendezVous() {
  const navigate = useNavigate();
  const existant = lireRdv();
  const [jour, setJour] = useState(existant?.jour ?? "");
  const [heure, setHeure] = useState(existant?.heure ?? "10:00");
  return (
    <Ecran>
      <Entete
        titre={existant ? "Je modifie mon rendez-vous" : "Je fixe un rendez-vous"}
        surRetour={() => void navigate({ to: "/espace" })}
      />
      <Carte className="space-y-3">
        <Champ label="Jour">
          <input
            type="date"
            className={champClasse}
            value={jour}
            onChange={(e) => setJour(e.target.value)}
          />
        </Champ>
        <Champ label="Heure">
          <input
            type="time"
            className={champClasse}
            value={heure}
            onChange={(e) => setHeure(e.target.value)}
          />
        </Champ>
        <Bouton
          onClick={() => {
            if (!jour) {
              toastErreur("Choisissez un jour.");
              return;
            }
            ecrireRdv({ jour, heure });
            toastOk(existant ? "Rendez-vous modifié." : "Rendez-vous proposé au gestionnaire.");
          }}
        >
          {existant ? "Je modifie mon rendez-vous" : "Je fixe un rendez-vous"}
        </Bouton>
      </Carte>
    </Ecran>
  );
}

export function CodesSejour() {
  const session = useSession();
  const bien = session.biens[0];
  const [acces, setAcces] = useState<{ wifi: string; code: string } | null>(null);
  useEffect(() => {
    let vivant = true;
    void chargerAccesLieux().then((res) => {
      if (!vivant || !res.ok) return;
      const ligne = res.acces.find((a) => a.bienId === bien?.id) ?? res.acces[0];
      if (ligne) setAcces({ wifi: `${ligne.wifi} · ${ligne.wifiMdp}`, code: ligne.codeCles });
    });
    return () => {
      vivant = false;
    };
  }, [bien?.id]);
  if (!acces) return null;
  return (
    <p className="text-xs text-[#667085]">
      Accès enregistrés par le gestionnaire : {acces.wifi} · {acces.code}
    </p>
  );
}
