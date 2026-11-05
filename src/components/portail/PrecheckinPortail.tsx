import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { IntroDossier } from "@/components/portail/EcransHd";
import { Bouton, Carte, Champ, Ecran, Entete, champClasse } from "@/components/portail/chrome";
import { useAncre } from "@/components/portail/use-ancre";
import { modifierReservation, useSession } from "@/data/session";
import { deposerFichier, listerFichiers } from "@/lib/documents.functions";
import { preparerFichier } from "@/lib/fichiers-client";
import { toastErreur, toastOk } from "@/lib/feedback";
import { cautionDemandee, type ExtraPrecheckin } from "@/lib/gestionnaire-planning";

export function PrecheckinPortail({ extra }: { extra: ExtraPrecheckin }) {
  const navigate = useNavigate();
  const ancre = useAncre();
  const session = useSession();
  const [introVue, setIntroVue] = useState(() => {
    if (ancre === "formulaire") return true;
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("hublify.precheckin.intro") === "1";
  });
  const resa = session.reservationsDossier[0];
  const [identite, setIdentite] = useState(resa?.precheckinIdentite || resa?.occupant || "");
  const [nb, setNb] = useState(String(resa?.precheckinNbPersonnes || resa?.voyageurs || 1));
  const [heure, setHeure] = useState(resa?.precheckinHeureArrivee || resa?.heureArrivee || "16:00");
  const [note, setNote] = useState(resa?.precheckinNote || "");
  const [envoye, setEnvoye] = useState(resa?.precheckinStatut === "fait");
  const [piece, setPiece] = useState("");
  const [recto, setRecto] = useState("");
  const [verso, setVerso] = useState("");
  const [choisis, setChoisis] = useState<string[]>([]);
  const refPiece = `precheckin:${resa?.id ?? "compte"}`;

  useEffect(() => {
    let ignore = false;
    void listerFichiers({ data: { contexte: "dossier", refId: refPiece } }).then((res) => {
      if (ignore || !res.ok) return;
      const nom = (cote: string) => res.fichiers.find((f) => f.cote === cote)?.nom ?? "";
      setRecto(nom("recto"));
      setVerso(nom("verso"));
      setPiece(nom(""));
    });
    return () => {
      ignore = true;
    };
  }, [refPiece]);

  async function envoyerPiece(fichier: File, cote: "" | "recto" | "verso") {
    const prepare = await preparerFichier(fichier, "dossier");
    if (!prepare.ok) {
      toastErreur(prepare.erreur);
      return;
    }
    const res = await deposerFichier({
      data: {
        contexte: "dossier",
        refId: refPiece,
        cote,
        nom: prepare.fichier.nom,
        mime: prepare.fichier.mime,
        base64: prepare.fichier.base64,
      },
    });
    if (!res.ok) {
      toastErreur(res.erreur);
      return;
    }
    if (cote === "recto") setRecto(res.fichier.nom);
    else if (cote === "verso") setVerso(res.fichier.nom);
    else setPiece(res.fichier.nom);
    toastOk("Pièce enregistrée. Elle reste disponible après rechargement.");
  }
  const caution = cautionDemandee(extra, "voyageur");
  const proposes = session.parametrage.upsells.filter(
    (u) => u.actif && extra.upsellsProposes.includes(u.id),
  );
  const demandePiece = extra.photo || extra.fichier || extra.telephone || extra.rectoVerso;

  if (!introVue) {
    return (
      <IntroDossier
        onContinuer={() => {
          sessionStorage.setItem("hublify.precheckin.intro", "1");
          setIntroVue(true);
        }}
      />
    );
  }

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
        {demandePiece && (
          <div className="space-y-2 text-sm text-[#344054]">
            <p className="text-xs font-medium text-[#101828]">Pièce d'identité</p>
            {extra.rectoVerso && <p className="text-xs text-[#667085]">Recto et verso requis.</p>}
            {extra.rectoVerso && (
              <div className="grid gap-2">
                <label className="block text-xs text-[#667085]">
                  Recto
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    capture="environment"
                    className="mt-1 block min-h-11 w-full text-sm"
                    onChange={(e) => {
                      const fichier = e.target.files?.[0];
                      e.target.value = "";
                      if (fichier) void envoyerPiece(fichier, "recto");
                    }}
                  />
                  {recto && <span className="mt-1 block text-[#027a48]">Enregistré : {recto}</span>}
                </label>
                <label className="block text-xs text-[#667085]">
                  Verso
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="mt-1 block min-h-11 w-full text-sm"
                    onChange={(e) => {
                      const fichier = e.target.files?.[0];
                      e.target.value = "";
                      if (fichier) void envoyerPiece(fichier, "verso");
                    }}
                  />
                  {verso && <span className="mt-1 block text-[#027a48]">Enregistré : {verso}</span>}
                </label>
              </div>
            )}
            {extra.photo && !extra.rectoVerso && (
              <label className="block text-xs text-[#667085]">
                Photo
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="mt-1 block min-h-11 w-full text-sm"
                  onChange={(e) => {
                    const fichier = e.target.files?.[0];
                    e.target.value = "";
                    if (fichier) void envoyerPiece(fichier, "");
                  }}
                />
                {piece && <span className="mt-1 block text-[#027a48]">Enregistrée : {piece}</span>}
              </label>
            )}
            {extra.fichier && (
              <label className="block text-xs text-[#667085]">
                Fichier
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="mt-1 block min-h-11 w-full text-sm"
                  onChange={(e) => {
                    const choisi = e.target.files?.[0];
                    e.target.value = "";
                    if (!choisi) return;
                    const cote = extra.photo && !extra.rectoVerso ? "verso" : "";
                    void envoyerPiece(choisi, cote);
                  }}
                />
                {piece && !(extra.photo && !extra.rectoVerso) && (
                  <span className="mt-1 block text-[#027a48]">Enregistré : {piece}</span>
                )}
              </label>
            )}
            {extra.telephone && (
              <p className="text-xs text-[#667085]">La recherche sur le téléphone est acceptée.</p>
            )}
          </div>
        )}
        {caution.demandee && (
          <p className="text-sm text-[#101828]">Caution à prévoir : {caution.montant} €</p>
        )}
        {extra.codePorteJourArrivee && (
          <p className="text-xs text-[#667085]">
            Le code de la porte sera affiché le jour de l'arrivée.
          </p>
        )}
        {proposes.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#101828]">Services proposés</p>
            {proposes.map((u) => {
              const actif = choisis.includes(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  aria-pressed={actif}
                  onClick={() =>
                    setChoisis((liste) =>
                      actif ? liste.filter((id) => id !== u.id) : [...liste, u.id],
                    )
                  }
                  className="flex w-full items-center justify-between rounded-xl border border-[#eaecf0] px-3 py-2 text-left text-sm"
                >
                  <span>{u.nom}</span>
                  <span className="text-[#667085]">{u.prix.toLocaleString("fr-FR")} €</span>
                </button>
              );
            })}
          </div>
        )}
        <Bouton
          onClick={() => {
            if (!identite.trim()) {
              toastErreur("Indiquez l'identité.");
              return;
            }
            const services = proposes.filter((u) => choisis.includes(u.id)).map((u) => u.nom);
            const complements = [
              note.trim(),
              piece ? `Pièce : ${piece}` : "",
              services.length > 0 ? `Services : ${services.join(", ")}` : "",
              caution.demandee ? `Caution : ${caution.montant} €` : "",
            ].filter(Boolean);
            if (resa) {
              modifierReservation(resa.id, {
                precheckinStatut: "fait",
                precheckinIdentite: identite.trim(),
                precheckinNbPersonnes: Number(nb) || resa.voyageurs,
                precheckinHeureArrivee: heure,
                precheckinNote: complements.join(" · "),
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
