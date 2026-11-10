import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { deposerFichier } from "@/lib/documents.functions";
import { preparerFichier } from "@/lib/fichiers-client";
import { useAuth, useDroit } from "@/auth/auth-context";
import { Bouton, Carte, Champ, Ecran, Entete, champClasse } from "@/components/portail/chrome";
import { usePortailDonnees } from "@/components/portail/etat-portail";
import { useAncre } from "@/components/portail/use-ancre";
import {
  ajouterCandidature,
  idNouveau,
  oublierEtatsLocaux,
  ouvrirConversationProspect,
  upsertDossierLocation,
  upsertPartageDossier,
  useSession,
  validerCandidature,
} from "@/data/session";
import { formatMontant } from "@/data/reservations-mo1";
import {
  PIECES_DOSSIER_DEFAUT,
  dossierArchiveSeuleLigne,
  totalCandidature,
  type GarantDossier,
  type PieceDossier,
} from "@/data/v1-metier";
import { GESTIONNAIRE_PORTAIL, JUSTIFICATIFS_REVENUS, resumeFamille } from "@/lib/portail-mobile";
import { oublierEtatMetierLocal } from "@/components/portail/etat-local";
import { authClient } from "@/lib/auth-client";
import { signalerDeconnexion } from "@/lib/fin-session";
import { toastErreur, toastOk } from "@/lib/feedback";

const AVANT_DERNIER: PieceDossier = {
  id: "piece-avis-avant",
  titre: "Avant-dernier avis d'imposition",
  type: "fiscal",
  present: false,
  aide: "L'avis précédent le dernier, pas seulement le plus récent.",
};

function avecAvantDernier(pieces: PieceDossier[]) {
  return pieces.some((p) => p.id === AVANT_DERNIER.id) ? pieces : [...pieces, AVANT_DERNIER];
}

export function DossierPortail() {
  const ancre = useAncre();
  if (ancre === "pieces") return <PiecesDossier />;
  return <Profil />;
}

function Profil() {
  const navigate = useNavigate();
  const auth = useAuth();
  const uiMode = auth?.roleId === "prestataire" ? "prestataire" : "résident";
  return (
    <Ecran>
      <Entete titre="" surRetour={() => void navigate({ to: "/espace" })} />
      <span className="mx-auto grid size-24 place-items-center rounded-full bg-[var(--portail-sarcelle)] text-2xl font-semibold text-white">
        {(auth?.prenom?.[0] ?? "H").toUpperCase()}
        {(auth?.nom?.[0] ?? "").toUpperCase()}
      </span>
      <h1 className="text-center font-display text-[22px] font-semibold text-[var(--portail-encre)]">
        {auth?.prenom} {auth?.nom}
      </h1>
      <div className="w-full space-y-3 text-[14px] font-normal text-black">
        <p className="text-[16px] font-semibold">Mon profil</p>
        <p>
          <span className="block text-[12px] font-semibold">Nom</span>
          {auth?.nom}
        </p>
        <p>
          <span className="block text-[12px] font-semibold">Email</span>
          {auth?.email}
        </p>
        <p className="text-[12px] font-semibold">Mode {uiMode}</p>
        <p className="text-[16px] font-semibold">Contact supplémentaire et garants</p>
        <div className="grid grid-cols-2 gap-3 text-[12px] font-semibold">
          <p>
            Contact supplémentaire
            <span className="mt-1 block font-normal">{auth?.email}</span>
          </p>
          <p>
            Garant
            <span className="mt-1 block font-normal">{GESTIONNAIRE_PORTAIL.nom}</span>
          </p>
        </div>
        <p className="text-[16px] font-semibold">À propos de moi</p>
        <p className="min-h-[66px] rounded-[16px] bg-white px-4 py-3 text-[12px] font-semibold shadow-[var(--portail-ombre)]">
          Profil Hublify. Les droits d'accès au dossier sont validés ici, pas par le demandeur.
        </p>
        <p className="text-[16px] font-semibold">Mon historique de location</p>
        <p className="rounded-[16px] bg-white px-4 py-3 text-[14px] font-normal shadow-[var(--portail-ombre)]">
          Séjours et quittances du compte
        </p>
      </div>
      <Bouton onClick={() => void navigate({ to: "/espace/dossier", hash: "pieces" })}>
        Constituer mon dossier de location
      </Bouton>
      <Bouton variante="ligne" onClick={() => void navigate({ to: "/espace/contacts" })}>
        Contact supplémentaire et garants
      </Bouton>
      <Bouton
        variante="ghost"
        onClick={() => void navigate({ to: "/espace/documents", hash: "historique" })}
      >
        Mon historique de location
      </Bouton>
      <Bouton
        variante="ligne"
        onClick={() => {
          signalerDeconnexion();
          void authClient.signOut().then(() => {
            oublierEtatsLocaux(null);
            oublierEtatMetierLocal();
            toastOk("Vous êtes déconnecté.");
            window.location.href = "/connexion";
          });
        }}
      >
        Se déconnecter
      </Bouton>
    </Ecran>
  );
}

function Capturer({ label, onFichier }: { label: string; onFichier: (fichier: File) => void }) {
  const photo = useRef<HTMLInputElement>(null);
  const fichier = useRef<HTMLInputElement>(null);
  const prendre = (liste: FileList | null, input: HTMLInputElement) => {
    const item = liste?.[0];
    input.value = "";
    if (item) onFichier(item);
  };
  return (
    <span className="flex flex-wrap justify-center gap-1" aria-label={label}>
      <input
        ref={photo}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => prendre(e.target.files, e.target)}
      />
      <input
        ref={fichier}
        type="file"
        accept="image/*,.pdf"
        className="sr-only"
        onChange={(e) => prendre(e.target.files, e.target)}
      />
      <button
        type="button"
        className="inline-flex min-h-11 items-center px-2 text-xs text-[#5090A8]"
        onClick={() => photo.current?.click()}
      >
        Photo
      </button>
      <button
        type="button"
        className="inline-flex min-h-11 items-center px-2 text-xs text-[#667085]"
        onClick={() => fichier.current?.click()}
      >
        Fichier
      </button>
    </span>
  );
}

function PiecesDossier() {
  const navigate = useNavigate();
  const auth = useAuth();
  const session = useSession();
  const existant = session.dossiersLocation.find(
    (d) => d.email.toLowerCase() === (auth?.email ?? "").toLowerCase(),
  );
  const [pieces, setPieces] = useState<PieceDossier[]>(() =>
    avecAvantDernier(existant?.pieces ?? PIECES_DOSSIER_DEFAUT),
  );
  const piecesRef = useRef(pieces);
  piecesRef.current = pieces;
  const idRef = useRef(existant?.id ?? "");
  if (existant?.id) idRef.current = existant.id;
  const idDossier = () => {
    if (!idRef.current) idRef.current = idNouveau("dos");
    return idRef.current;
  };
  const [garants, setGarants] = useState<GarantDossier[]>(existant?.garants ?? []);
  const [tuto, setTuto] = useState(false);
  const [revenusOuverts, setRevenusOuverts] = useState(false);
  const [garant, setGarant] = useState<GarantDossier>({
    id: "",
    type: "personne",
    nom: "",
    email: "",
    telephone: "",
    organisme: "",
    numeroDossier: "",
  });
  const [dest, setDest] = useState("");
  const [tel, setTel] = useState("");
  const [notePerso, setNotePerso] = useState("");
  const [expire, setExpire] = useState("30");
  const [situationFam, setSituationFam] = useState(existant?.situationFamiliale ?? "");
  const [situationPro, setSituationPro] = useState(existant?.situationProfessionnelle ?? "");
  const [revenus, setRevenus] = useState(String(existant?.revenus ?? ""));
  const [rfr, setRfr] = useState(String(existant?.rfr ?? ""));

  if (dossierArchiveSeuleLigne(existant)) {
    return (
      <Ecran>
        <Entete titre="Archives" surRetour={() => void navigate({ to: "/espace/dossier" })} />
        <p className="text-sm text-[#667085]">
          Archive de plus de 2 ans : seule la ligne d'historique reste visible.
        </p>
      </Ecran>
    );
  }

  const patch = (id: string, partiel: Partial<PieceDossier>) =>
    setPieces((liste) => liste.map((p) => (p.id === id ? { ...p, ...partiel } : p)));

  const persisterPieces = (suivantes: PieceDossier[], statut: "brouillon" | "complet") => {
    const id = idDossier();
    const revenusN = Number(revenus.replace(",", ".")) || 0;
    const rfrN = Number(rfr.replace(",", ".")) || 0;
    const statutGarde =
      existant?.statut === "complet" ||
      existant?.statut === "partage" ||
      existant?.statut === "archive"
        ? existant.statut
        : statut;
    const enregistre = upsertDossierLocation({
      id,
      occupantId: session.occupants[0]?.id ?? id,
      occupantNom: `${auth?.prenom ?? ""} ${auth?.nom ?? ""}`.trim(),
      email: auth?.email ?? "",
      statut: statutGarde,
      pieces: suivantes,
      garants,
      dureeAccesMois: 24,
      situationFamiliale: situationFam,
      situationProfessionnelle: situationPro,
      ...(revenusN ? { revenus: revenusN } : {}),
      ...(rfrN ? { rfr: rfrN } : {}),
    });
    return { id, enregistre };
  };

  const recevoirFichier = (pieceId: string, cote: "" | "recto" | "verso", fichier: File) => {
    void (async () => {
      const prepare = await preparerFichier(fichier, "dossier");
      if (!prepare.ok) {
        toastErreur(prepare.erreur);
        return;
      }
      const dossier = persisterPieces(piecesRef.current, "brouillon");
      const enregistre = await dossier.enregistre;
      if (!enregistre) {
        toastErreur("Le dossier n'a pas pu être enregistré. Réessayez avant d'envoyer la pièce.");
        return;
      }
      const res = await deposerFichier({
        data: {
          contexte: "dossier",
          refId: `${dossier.id}:${pieceId}`,
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
      const suivantes = piecesRef.current.map((p) => {
        if (p.id !== pieceId) return p;
        if (cote === "recto") {
          return {
            ...p,
            rectoNom: res.fichier.nom,
            rectoId: res.fichier.id,
            present: Boolean(p.versoNom || p.versoId),
          };
        }
        if (cote === "verso") {
          return {
            ...p,
            versoNom: res.fichier.nom,
            versoId: res.fichier.id,
            photoNom: res.fichier.nom,
            present: Boolean(p.rectoNom || p.rectoId),
          };
        }
        return { ...p, photoNom: res.fichier.nom, fichierId: res.fichier.id, present: true };
      });
      piecesRef.current = suivantes;
      setPieces(suivantes);
      persisterPieces(suivantes, "brouillon");
      toastOk(`${res.fichier.nom} enregistré.`);
    })();
  };

  const enregistrer = (statut: "brouillon" | "complet") => {
    const { id } = persisterPieces(pieces, statut);
    toastOk(statut === "complet" ? "Dossier enregistré." : "Brouillon enregistré.");
    return id;
  };

  return (
    <Ecran>
      <Entete
        titre="Mon dossier"
        sousTitre="Première connexion : enregistrez vos pièces"
        surRetour={() => void navigate({ to: "/espace/dossier" })}
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-[#667085]">
          Photo ou fichier du téléphone. Cadrez la page entière.
        </p>
        <button type="button" className="text-xs text-[#5090A8]" onClick={() => setTuto((v) => !v)}>
          Tuto
        </button>
      </div>
      {tuto && (
        <Carte className="text-xs leading-relaxed text-[#344054]">
          <ol className="list-decimal space-y-1 pl-4">
            <li>Posez le document à plat, page entière dans le cadre.</li>
            <li>Lumière du jour, sans flash qui brûle le texte.</li>
            <li>Aucun doigt ni ombre sur les mentions.</li>
            <li>Pour l'identité, photographiez le recto puis le verso.</li>
            <li>Pour l'avis d'imposition, le code 2D-DOC doit rester lisible.</li>
          </ol>
        </Carte>
      )}
      <ul className="grid grid-cols-2 gap-3">
        {pieces.map((p) => (
          <li key={p.id} className="rounded-[22px] bg-white p-3 text-sm">
            <p className="text-center text-[13px] font-medium text-[#1d2939]">
              {p.id === "piece-id" ? "*Identité" : p.titre}
              {p.id === "piece-revenus" && (
                <button
                  type="button"
                  aria-label="Justificatif de revenus"
                  className="ml-1 inline-grid size-4 place-items-center rounded-full border border-[#98a2b3] text-[10px]"
                  onClick={() => setRevenusOuverts((v) => !v)}
                >
                  i
                </button>
              )}
            </p>
            <div className="mt-2 rounded-2xl bg-[#f6f1ea] p-2">
              {p.present || p.rectoNom ? (
                <span className="mx-auto mb-1 grid size-10 place-items-center rounded-full border-2 border-[#12b76a] text-lg text-[#12b76a]">
                  ✓
                </span>
              ) : (
                <span className="mx-auto mb-1 grid size-10 place-items-center text-2xl text-[#98a2b3]">
                  +
                </span>
              )}
              {p.id === "piece-id" ? (
                <span className="grid gap-1 text-[10px]">
                  <span>
                    <span className="block text-center font-medium">Recto</span>
                    <Capturer
                      label="Recto"
                      onFichier={(fichier) => recevoirFichier(p.id, "recto", fichier)}
                    />
                  </span>
                  <span>
                    <span className="block text-center font-medium">Verso</span>
                    <Capturer
                      label="Verso"
                      onFichier={(fichier) => recevoirFichier(p.id, "verso", fichier)}
                    />
                  </span>
                </span>
              ) : (
                <Capturer
                  label={p.titre}
                  onFichier={(fichier) => recevoirFichier(p.id, "", fichier)}
                />
              )}
            </div>
            {p.aide && <p className="mt-1 text-center text-[10px] text-[#98a2b3]">{p.aide}</p>}
            {p.id === "piece-revenus" && revenusOuverts && (
              <p className="mt-1 text-[11px] leading-relaxed text-[#667085]">
                {JUSTIFICATIFS_REVENUS}
              </p>
            )}
            {p.type === "fiscal" && (
              <input
                value={p.numero2dDoc ?? ""}
                onChange={(e) => patch(p.id, { numero2dDoc: e.target.value })}
                placeholder="Code 2D-DOC"
                className={`${champClasse} mt-2`}
              />
            )}
          </li>
        ))}
      </ul>
      <Champ label="Situation professionnelle">
        <input
          className={champClasse}
          value={situationPro}
          placeholder="CDI, étudiant, autre…"
          onChange={(e) => setSituationPro(e.target.value)}
        />
      </Champ>
      <Champ label="Situation familiale">
        <input
          className={champClasse}
          value={situationFam}
          onChange={(e) => setSituationFam(e.target.value)}
        />
      </Champ>
      <div className="grid grid-cols-2 gap-2">
        <Champ label="Revenus">
          <input
            className={champClasse}
            inputMode="decimal"
            value={revenus}
            onChange={(e) => setRevenus(e.target.value)}
          />
        </Champ>
        <Champ label="RFR">
          <input
            className={champClasse}
            inputMode="decimal"
            value={rfr}
            onChange={(e) => setRfr(e.target.value)}
          />
        </Champ>
      </div>
      <Carte className="space-y-2">
        <p className="text-sm font-medium">Garants</p>
        {garants.map((g) => (
          <p key={g.id} className="text-sm">
            {g.type === "institutionnel" ? `${g.organisme} · n° ${g.numeroDossier}` : g.nom}
          </p>
        ))}
        <select
          className={champClasse}
          value={garant.type}
          onChange={(e) => setGarant({ ...garant, type: e.target.value as GarantDossier["type"] })}
        >
          <option value="personne">Garant personne physique</option>
          <option value="institutionnel">Garant institutionnel</option>
        </select>
        <input
          className={champClasse}
          value={garant.nom}
          placeholder="Nom"
          onChange={(e) => setGarant({ ...garant, nom: e.target.value })}
        />
        {garant.type === "institutionnel" && (
          <>
            <input
              className={champClasse}
              value={garant.organisme ?? ""}
              placeholder="Nom de l'organisme"
              onChange={(e) => setGarant({ ...garant, organisme: e.target.value })}
            />
            <input
              className={champClasse}
              value={garant.numeroDossier ?? ""}
              placeholder="Numéro de dossier"
              onChange={(e) => setGarant({ ...garant, numeroDossier: e.target.value })}
            />
          </>
        )}
        <Bouton
          variante="ligne"
          onClick={() => {
            if (!garant.nom.trim()) {
              toastErreur("Indiquez le nom du garant.");
              return;
            }
            if (
              garant.type === "institutionnel" &&
              (!garant.organisme?.trim() || !garant.numeroDossier?.trim())
            ) {
              toastErreur("Indiquez l'organisme et le numéro de dossier.");
              return;
            }
            setGarants((liste) => [...liste, { ...garant, id: idNouveau("g") }]);
            setGarant({
              id: "",
              type: "personne",
              nom: "",
              email: "",
              telephone: "",
              organisme: "",
              numeroDossier: "",
            });
            toastOk("Garant ajouté.");
          }}
        >
          Ajouter le garant
        </Bouton>
      </Carte>
      <Bouton onClick={() => enregistrer("complet")}>Enregistrer</Bouton>
      <Carte className="space-y-2">
        <p className="text-sm font-medium">Partager le dossier</p>
        <p className="text-xs text-[#667085]">
          E-mail ou téléphone : si le contact est déjà sur Hublify, le profil arrive dans sa
          messagerie. Sinon il reçoit un lien. Le profil doit encore accepter.
        </p>
        <input
          className={champClasse}
          value={dest}
          placeholder="E-mail"
          onChange={(e) => setDest(e.target.value)}
        />
        <input
          className={champClasse}
          value={tel}
          placeholder="Téléphone"
          onChange={(e) => setTel(e.target.value)}
        />
        <textarea
          className={`${champClasse} h-20 py-2`}
          value={notePerso}
          placeholder="Note personnelle"
          onChange={(e) => setNotePerso(e.target.value)}
        />
        <Champ label="Expiration (jours)">
          <input
            className={champClasse}
            inputMode="numeric"
            value={expire}
            onChange={(e) => setExpire(e.target.value)}
          />
        </Champ>
        <Bouton
          onClick={() => {
            if (!dest.trim() && !tel.trim()) {
              toastErreur("Indiquez un e-mail ou un téléphone.");
              return;
            }
            const id = enregistrer("complet");
            const jours = Math.max(1, Number(expire) || 30);
            const expireLe = new Date();
            expireLe.setDate(expireLe.getDate() + jours);
            const destinataire = dest.trim() || tel.trim();
            upsertPartageDossier({
              id: idNouveau("part"),
              dossierId: id,
              destinataire,
              autorise: null,
              demandeLe: new Date().toISOString().slice(0, 10),
              expireLe: expireLe.toISOString().slice(0, 10),
              ...(!dest.includes("@") ? { lienExterne: destinataire } : {}),
              ...(notePerso.trim() ? { notePersonnelle: notePerso.trim() } : {}),
              ...(tel.trim() ? { telephone: tel.trim() } : {}),
            });
            ouvrirConversationProspect({
              nom: destinataire,
              extrait: notePerso.trim() || `Dossier partagé par ${auth?.prenom ?? "le résident"}`,
              bienNom: session.biens[0]?.nom,
              type: "locataire",
            });
            toastOk("Demande envoyée. Messagerie Prospect à jour. Le profil valide l'accès.");
            setDest("");
          }}
        >
          Demander l'autorisation
        </Bouton>
        {session.partagesDossier.map((p) => (
          <div key={p.id} className="flex items-center justify-between text-xs">
            <span>
              {p.destinataire} ·{" "}
              {p.autorise === true ? "accepté" : p.autorise === false ? "refusé" : "en attente"}
            </span>
            {p.autorise === null && (
              <span className="flex gap-2">
                <button
                  type="button"
                  className="text-[#5090A8]"
                  onClick={() => {
                    upsertPartageDossier({ ...p, autorise: true });
                    toastOk("Partage autorisé par le profil.");
                  }}
                >
                  Oui
                </button>
                <button
                  type="button"
                  onClick={() => {
                    upsertPartageDossier({ ...p, autorise: false });
                    toastOk("Partage refusé.");
                  }}
                >
                  Non
                </button>
              </span>
            )}
          </div>
        ))}
      </Carte>
    </Ecran>
  );
}

export function CandidaturePortail() {
  const session = useSession();
  const auth = useAuth();
  const peutValider = useDroit("mod-reservations");
  const { candidature: brouillon, pret, ecrireCandidature } = usePortailDonnees();
  const dossier =
    session.dossiersLocation.find(
      (d) => d.email.toLowerCase() === (auth?.email ?? "").toLowerCase(),
    ) ?? session.dossiersLocation[0];
  const [bienId, setBienId] = useState(session.biens[0]?.id || "ann-suzette");
  const [arrivee, setArrivee] = useState("");
  const [depart, setDepart] = useState("");
  const [marie, setMarie] = useState(false);
  const [pacse, setPacse] = useState(false);
  const [concubinage, setConcubinage] = useState(false);
  const [colocation, setColocation] = useState(false);
  const [autoriser, setAutoriser] = useState(true);
  const brouillonPose = useRef(false);
  useEffect(() => {
    if (!pret || brouillonPose.current) return;
    brouillonPose.current = true;
    if (brouillon.bienId) setBienId(brouillon.bienId);
    if (brouillon.arrivee) setArrivee(brouillon.arrivee);
    if (brouillon.depart) setDepart(brouillon.depart);
    setMarie(Boolean(brouillon.marie));
    setPacse(Boolean(brouillon.pacse));
    setConcubinage(Boolean(brouillon.concubinage));
    setColocation(Boolean(brouillon.colocation));
    if (brouillon.autoriserDossier === false) setAutoriser(false);
  }, [brouillon, pret]);
  const bien = session.biens.find((b) => b.id === bienId);
  const estimation = useMemo(() => {
    if (!arrivee || !depart || depart <= arrivee) return { prorata: 0, commissions: 0, total: 0 };
    return totalCandidature({
      debut: arrivee,
      fin: depart,
      loyerMensuel: (bien?.baseNuit ?? 22) * 30,
      commission: Math.round((bien?.baseNuit ?? 22) * 2),
    });
  }, [arrivee, bien, depart]);

  const memoriser = () =>
    ecrireCandidature({
      bienId,
      arrivee,
      depart,
      marie,
      pacse,
      concubinage,
      colocation,
      autoriserDossier: autoriser,
    });

  const flags = resumeFamille({ marie, pacse, concubinage, colocation });

  return (
    <Ecran>
      <Entete titre="Proposer ma candidature" />
      {!dossier && session.biens.length > 0 && (
        <p className="text-sm text-[#667085]">
          Enregistrez d'abord le dossier pour joindre les pièces.
        </p>
      )}
      <Carte className="space-y-3">
        {session.biens.length > 0 && (
          <Champ label="Logement">
            <select
              className={champClasse}
              value={bienId}
              onChange={(e) => setBienId(e.target.value)}
            >
              {session.biens.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nom}
                </option>
              ))}
            </select>
          </Champ>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Champ label="Arrivée">
            <input
              type="date"
              className={champClasse}
              value={arrivee}
              onChange={(e) => setArrivee(e.target.value)}
            />
          </Champ>
          <Champ label="Départ">
            <input
              type="date"
              className={champClasse}
              value={depart}
              onChange={(e) => setDepart(e.target.value)}
            />
          </Champ>
        </div>
        <fieldset className="space-y-2 text-sm">
          <legend className="text-xs text-[#667085]">Situation du foyer</legend>
          {(
            [
              ["Marié", marie, setMarie],
              ["Pacsé", pacse, setPacse],
              ["Concubinage", concubinage, setConcubinage],
              ["Colocation", colocation, setColocation],
            ] as const
          ).map(([label, valeur, set]) => (
            <label key={label} className="flex items-center justify-between">
              {label}
              <span className="flex gap-2 text-xs">
                <button
                  type="button"
                  className={valeur ? "font-semibold text-[#5090A8]" : "text-[#98a2b3]"}
                  onClick={() => set(true)}
                >
                  Oui
                </button>
                <button
                  type="button"
                  className={!valeur ? "font-semibold text-[#5090A8]" : "text-[#98a2b3]"}
                  onClick={() => set(false)}
                >
                  Non
                </button>
              </span>
            </label>
          ))}
        </fieldset>
        <label className="flex items-start gap-2 text-xs text-[#344054]">
          <input
            type="checkbox"
            checked={autoriser}
            onChange={(e) => setAutoriser(e.target.checked)}
            className="mt-0.5"
          />
          {autoriser
            ? "J'autorise le contact à accéder au dossier. Je confirme cette certitude."
            : "Je n'autorise pas encore : le gestionnaire me demandera l'autorisation."}
        </label>
        <p className="text-sm">
          {flags} · prorata {formatMontant(estimation.prorata)} + commissions{" "}
          {formatMontant(estimation.commissions)} = {formatMontant(estimation.total)}
        </p>
        <Bouton
          variante="ligne"
          onClick={() => {
            memoriser();
            if (!dossier && session.dossiersLocation.length === 0 && session.biens.length > 0) {
              toastErreur("Enregistrez votre dossier avant de candidater.");
              return;
            }
            if (!arrivee || !depart || depart <= arrivee) {
              toastErreur("Indiquez des dates cohérentes.");
              return;
            }
            if (dossier) {
              ajouterCandidature({
                id: idNouveau("cand"),
                dossierId: dossier.id,
                bienId,
                arrivee,
                depart,
                montant: estimation.total,
                statut: "brouillon",
                commissionIncluse: estimation.commissions,
              });
            }
            toastOk("Brouillon enregistré.");
          }}
        >
          Enregistrer le brouillon
        </Bouton>
        <Bouton
          onClick={() => {
            memoriser();
            if (!arrivee || !depart || depart <= arrivee) {
              toastErreur("Indiquez des dates cohérentes.");
              return;
            }
            if (dossier) {
              ajouterCandidature({
                id: idNouveau("cand"),
                dossierId: dossier.id,
                bienId,
                arrivee,
                depart,
                montant: estimation.total,
                statut: "proposee",
                commissionIncluse: estimation.commissions,
              });
            }
            ouvrirConversationProspect({
              nom: `${auth?.prenom ?? ""} ${auth?.nom ?? ""}`.trim() || "Candidat",
              extrait: `Candidature ${arrivee} → ${depart} · ${flags} · dossier ${autoriser ? "autorisé" : "à confirmer"} · ${formatMontant(estimation.total)}`,
              bienNom: bien?.nom,
              type: "locataire",
            });
            toastOk("Candidature envoyée. Le gestionnaire la voit dans Prospect.");
          }}
        >
          Proposer ma candidature
        </Bouton>
      </Carte>
      <ul className="space-y-2 text-sm">
        {session.candidatures.map((c) => (
          <li key={c.id} className="rounded-2xl bg-white px-3 py-2">
            {c.arrivee} → {c.depart} · {c.statut}
            {peutValider && c.statut === "proposee" && (
              <button
                type="button"
                className="ml-2 text-xs text-[#5090A8]"
                onClick={() => {
                  if (!validerCandidature(c.id)) {
                    toastErreur("Candidature introuvable.");
                    return;
                  }
                  toastOk("Date validée. Les calendriers sont à jour.");
                }}
              >
                Valider la date
              </button>
            )}
          </li>
        ))}
      </ul>
    </Ecran>
  );
}

export function ContactsPortail() {
  const navigate = useNavigate();
  const session = useSession();
  return (
    <Ecran>
      <Entete titre="Contacts" surRetour={() => void navigate({ to: "/espace/dossier" })} />
      <ul className="overflow-hidden rounded-[22px] bg-white shadow-[var(--portail-ombre)]">
        <li>
          <button
            type="button"
            className="flex w-full items-center gap-3 px-4 py-3 text-left"
            onClick={() => void navigate({ to: "/espace/messages" })}
          >
            <span className="grid size-12 place-items-center rounded-full bg-[#e7eef2] text-sm font-semibold">
              YR
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold">
                {GESTIONNAIRE_PORTAIL.nom}
              </span>
              <span className="block truncate text-xs text-[#667085]">
                {GESTIONNAIRE_PORTAIL.societe} · {GESTIONNAIRE_PORTAIL.telephone}
              </span>
            </span>
            <span className="text-xs font-semibold text-[#3b82f6]">Écrire</span>
          </button>
        </li>
      </ul>
      {session.prestataires.map((p) => (
        <Carte key={p.id}>
          <p className="text-sm font-medium">{p.nom}</p>
          <p className="text-xs text-[#667085]">
            {p.categorie} · {p.telephone}
          </p>
          <a href={`mailto:${p.email}`} className="text-xs text-[#5090A8]">
            {p.email}
          </a>
        </Carte>
      ))}
      <Bouton
        variante="ligne"
        onClick={() => void navigate({ to: "/espace/dossier", hash: "pieces" })}
      >
        Ajouter un garant
      </Bouton>
    </Ecran>
  );
}
