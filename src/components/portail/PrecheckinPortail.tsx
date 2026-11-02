import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bouton, Carte, Champ, Ecran, Entete, champClasse } from "@/components/portail/chrome";
import { modifierReservation, useSession } from "@/data/session";
import { toastErreur, toastOk } from "@/lib/feedback";

export function PrecheckinPortail() {
  const navigate = useNavigate();
  const session = useSession();
  const resa = session.reservationsDossier[0];
  const [identite, setIdentite] = useState(resa?.precheckinIdentite || resa?.occupant || "");
  const [nb, setNb] = useState(String(resa?.precheckinNbPersonnes || resa?.voyageurs || 1));
  const [heure, setHeure] = useState(resa?.precheckinHeureArrivee || resa?.heureArrivee || "16:00");
  const [note, setNote] = useState(resa?.precheckinNote || "");
  const [envoye, setEnvoye] = useState(resa?.precheckinStatut === "fait");

  return (
    <Ecran>
      <Entete
        titre="Formulaire de check-in"
        surRetour={() => void navigate({ to: "/espace", hash: "acces" })}
      />
      {!resa && (
        <p className="text-sm text-[#667085]">
          Aucune réservation sur ce compte. Le formulaire reste disponible pour préparer l'arrivée à
          Suzette.
        </p>
      )}
      <Carte className="space-y-3">
        {resa && (
          <p className="text-xs text-[#667085]">
            {resa.occupant} · {resa.arrivee} → {resa.depart}
          </p>
        )}
        <Champ label="Identité">
          <input
            className={champClasse}
            value={identite}
            onChange={(e) => setIdentite(e.target.value)}
          />
        </Champ>
        <Champ label="Nombre de personnes">
          <input
            className={champClasse}
            inputMode="numeric"
            value={nb}
            onChange={(e) => setNb(e.target.value)}
          />
        </Champ>
        <Champ label="Heure d'arrivée">
          <input
            type="time"
            className={champClasse}
            value={heure}
            onChange={(e) => setHeure(e.target.value)}
          />
        </Champ>
        <Champ label="Note">
          <textarea
            className={`${champClasse} h-24 py-2`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Champ>
        <Bouton
          onClick={() => {
            if (!identite.trim()) {
              toastErreur("Indiquez l'identité.");
              return;
            }
            if (resa) {
              modifierReservation(resa.id, {
                precheckinStatut: "fait",
                precheckinIdentite: identite.trim(),
                precheckinNbPersonnes: Number(nb) || resa.voyageurs,
                precheckinHeureArrivee: heure,
                precheckinNote: note.trim(),
              });
            }
            setEnvoye(true);
            toastOk("Pré-checkin envoyé. Le gestionnaire le voit sur la réservation.");
          }}
        >
          Envoyer
        </Bouton>
        {envoye && (
          <p className="text-xs text-[#027a48]">
            Check-in transmis. La fiche d'accès peut être déverrouillée.
          </p>
        )}
      </Carte>
    </Ecran>
  );
}
