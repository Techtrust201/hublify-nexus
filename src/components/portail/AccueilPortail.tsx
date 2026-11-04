import { useNavigate } from "@tanstack/react-router";
import { Clock, FileText, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/auth/auth-context";
import { AutourDeMoi, OffreDetail, RechercheBail } from "@/components/portail/RecherchePortail";
import {
  Bouton,
  Carte,
  Ecran,
  Entete,
  Marque,
  champClasse,
  usePortailUi,
} from "@/components/portail/chrome";
import {
  ajouterDecision,
  ecrirePin,
  ecrireWebAuthnId,
  lireDemandes,
  lirePin,
  lireWebAuthnId,
} from "@/components/portail/etat-local";
import { useAncre } from "@/components/portail/use-ancre";
import { useSession } from "@/data/session";
import {
  appliquerDecisionDemande,
  etiquetteJour,
  joursAutour,
  tachesDuJour,
  trierTaches,
  TACHES_DEMO_PRESTATAIRE,
  TACHES_DEMO_RESIDENT,
  type TachePortail,
} from "@/lib/portail-mobile";
import { toastErreur, toastOk } from "@/lib/feedback";

function tachesAffichees(params: {
  vide: boolean;
  prestataire: boolean;
  missions: { id: string; titre: string; date: string; heure: string }[];
  loyers: { id: string; echeance: string; bienNom: string; valide: boolean }[];
  reservations: { id: string; occupant: string; arrivee: string; precheckinStatut?: string }[];
}) {
  if (params.prestataire) {
    if (params.vide || params.missions.length === 0) return TACHES_DEMO_PRESTATAIRE;
    return trierTaches(
      params.missions.map((m) => ({
        id: m.id,
        categorie: "Mission" as const,
        titre: m.titre,
        quand: `${m.date}T${(m.heure || "09:00").slice(0, 5)}:00`,
        heureLabel: m.heure || "09:00",
        route: "/espace/missions" as const,
        hash: "",
      })),
    );
  }
  if (params.vide) return TACHES_DEMO_RESIDENT;
  const finance: TachePortail[] = params.loyers
    .filter((l) => !l.valide)
    .map((l) => ({
      id: l.id,
      categorie: "Finance" as const,
      titre: `Appel de loyer — ${l.echeance} — ${l.bienNom}`,
      quand: "2026-05-01T10:00:00",
      heureLabel: l.echeance,
      route: "/espace/documents" as const,
      hash: "paiement",
    }));
  const checkins: TachePortail[] = params.reservations
    .filter((r) => r.precheckinStatut !== "fait")
    .map((r) => ({
      id: `ck-${r.id}`,
      categorie: "Action" as const,
      titre: `Formulaire de check-in — ${r.occupant}`,
      quand: `${r.arrivee}T10:00:00`,
      heureLabel: r.arrivee,
      route: "/espace/precheckin" as const,
      hash: "",
    }));
  return trierTaches([...finance, ...checkins]);
}

export function AccueilPortail() {
  const ancre = useAncre();
  const ui = usePortailUi();
  const auth = useAuth();
  const session = useSession();
  const vide =
    session.biens.length === 0 && session.missions.length === 0 && session.loyers.length === 0;

  useEffect(() => {
    ui.masquerNav(!ui.demarre && ancre === "");
    return () => ui.masquerNav(false);
  }, [ancre, ui]);

  if (!ui.demarre && ancre === "") return <Demarrage />;
  if (ancre === "taches") return <ToutesLesTaches vide={vide} />;
  if (ancre === "demande") return <DemandeAcces />;
  if (ancre === "intervention") return <Intervention />;
  if (ancre === "acces") return <FicheAcces />;
  if (ancre === "autour") return <AutourDeMoi />;
  if (ancre === "autour-resultats") return <AutourDeMoi resultats />;
  if (ancre === "recherche") return <RechercheBail />;
  if (ancre.startsWith("offre-")) return <OffreDetail id={ancre.slice("offre-".length)} />;

  const taches = tachesAffichees({
    vide,
    prestataire: ui.mode === "prestataire",
    missions: session.missions,
    loyers: session.loyers,
    reservations: session.reservationsDossier,
  });
  const jour = new Date();
  const duJour = tachesDuJour(taches, jour.toISOString().slice(0, 10));
  return (
    <Journee
      prenom={auth?.prenom ?? "Bonjour"}
      nom={auth?.nom ?? ""}
      initiales={`${auth?.prenom?.[0] ?? "H"}${auth?.nom?.[0] ?? ""}`.toUpperCase()}
      taches={ui.mode === "prestataire" ? taches : duJour}
      total={taches.length}
      prestataire={ui.mode === "prestataire"}
      jour={jour}
    />
  );
}

function Demarrage() {
  const ui = usePortailUi();
  const auth = useAuth();
  const proprietaire = auth?.roleId === "proprietaire";
  return (
    <Ecran className="items-center pt-8 text-center">
      <label className="text-xs text-[#667085]">
        Mode
        <select
          className={`${champClasse} mt-1 w-48`}
          value={ui.mode}
          aria-label="Mode du portail"
          onChange={(e) =>
            ui.definirMode(e.target.value === "prestataire" ? "prestataire" : "resident")
          }
        >
          <option value="resident">Mode Résident</option>
          <option value="prestataire">Mode Prestataire</option>
        </select>
      </label>
      {proprietaire && (
        <p className="max-w-[16rem] text-xs text-[#98a2b3]">
          Mode propriétaire : plus tard, même architecture.
        </p>
      )}
      <Marque className="mt-6" />
      <div className="relative mt-4 h-24 w-full" aria-hidden>
        <span className="absolute left-8 top-2 grid size-14 place-items-center rounded-2xl bg-white text-xl shadow-sm">
          📅
        </span>
        <span className="absolute right-10 top-6 grid size-14 place-items-center rounded-2xl bg-white text-xl shadow-sm">
          🔑
        </span>
      </div>
      <h1 className="text-[26px] font-semibold leading-tight text-[#1d2939]">
        Management
        <br />& gestion
      </h1>
      <p className="max-w-[18rem] text-sm leading-relaxed text-[#667085]">
        Cet outil est conçu pour vous aider à gérer vos locations et vos missions.
      </p>
      <div className="mt-4 w-full">
        <Bouton onClick={() => ui.demarrer()}>Let's Start</Bouton>
      </div>
      <p className="text-[11px] text-[#98a2b3]">
        {ui.mode === "prestataire" ? "Mode Prestataire" : "Mode Résident"} · même architecture
      </p>
    </Ecran>
  );
}

function Journee({
  prenom,
  nom,
  initiales,
  taches,
  total,
  prestataire,
  jour,
}: {
  prenom: string;
  nom: string;
  initiales: string;
  taches: TachePortail[];
  total: number;
  prestataire: boolean;
  jour: Date;
}) {
  const navigate = useNavigate();
  const ui = usePortailUi();
  const [selection, setSelection] = useState(jour.toISOString().slice(0, 10));
  const bandeau = joursAutour(jour);
  const visibles = taches.filter((t) => t.quand.slice(0, 10) === selection || taches.length <= 4);
  return (
    <Ecran>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void navigate({ to: "/espace/dossier" })}
          className="grid size-12 place-items-center rounded-full bg-[#5090A8] text-sm font-semibold text-white"
          aria-label="Mon profil"
        >
          {initiales}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-[#667085]">Bonjour !</p>
          <p className="truncate text-lg font-semibold text-[#1d2939]">
            {prenom} {nom}
          </p>
        </div>
        <button
          type="button"
          aria-label="Notifications"
          onClick={ui.ouvrirNotifs}
          className="text-[#344054]"
        >
          <Shield className="sr-only" />
          <span className="text-lg" aria-hidden>
            🔔
          </span>
        </button>
      </div>
      <p className="text-center text-[11px] uppercase tracking-[0.16em] text-[#98a2b3]">
        {prestataire ? "Mode Prestataire" : "Mode Résident"}
      </p>
      <h1 className="text-center text-lg font-semibold text-[#1d2939]">
        {prestataire ? "Ma journée" : "Tâches du jour"}
      </h1>
      <div className="grid grid-cols-5 gap-1.5">
        {bandeau.map((date) => {
          const e = etiquetteJour(date);
          const on = e.iso === selection;
          return (
            <button
              key={e.iso}
              type="button"
              onClick={() => setSelection(e.iso)}
              className={`flex min-w-0 flex-col items-center rounded-2xl px-1 py-2 text-xs ${on ? "bg-[#5090A8] text-white" : "bg-white text-[#344054]"}`}
            >
              <span className="capitalize">{e.mois}</span>
              <span className="text-lg font-semibold">{e.numero}</span>
              <span>{e.semaine}</span>
            </button>
          );
        })}
      </div>
      {taches.length === 0 && (
        <Carte>
          <p className="text-sm text-[#667085]">
            Rien de prévu pour le moment. Les appels de loyer, le check-in et les états des lieux
            s'affichent ici dès qu'ils vous concernent.
          </p>
        </Carte>
      )}
      <ul className="space-y-3">
        {(visibles.length > 0 ? visibles : taches).map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() =>
                void navigate({
                  to: t.route,
                  ...(t.hash ? { hash: t.hash } : {}),
                })
              }
              className="flex w-full items-center gap-3 rounded-[22px] bg-white px-4 py-3 text-left shadow-[0_8px_24px_rgba(70,80,60,0.05)]"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] text-[#98a2b3]">{t.categorie}</span>
                <span className="block truncate text-[15px] font-medium text-[#1d2939]">
                  {t.titre}
                </span>
                <span className="mt-1 flex items-center gap-1 text-[11px] text-[#e11d48]">
                  <Clock className="size-3" /> {t.heureLabel}
                </span>
              </span>
              <span className="grid size-10 place-items-center rounded-xl bg-[#f3f6f6] text-[#5090A8]">
                <FileText className="size-4" />
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Bouton onClick={() => void navigate({ to: "/espace", hash: "taches" })}>
        Tâches en cours
        <span className="ml-2 grid size-5 place-items-center rounded-full bg-white/20 text-xs">
          {total}
        </span>
      </Bouton>
    </Ecran>
  );
}

function ToutesLesTaches({ vide }: { vide: boolean }) {
  const navigate = useNavigate();
  const ui = usePortailUi();
  const session = useSession();
  const taches = tachesAffichees({
    vide,
    prestataire: ui.mode === "prestataire",
    missions: session.missions,
    loyers: session.loyers,
    reservations: session.reservationsDossier,
  });
  const decisions = lireDemandes();
  const visibles = taches.filter((t) => (t.id === "t-acces" ? decisions.length === 0 : true));
  return (
    <Ecran>
      <Entete
        titre="Toutes les tâches en cours"
        surRetour={() => void navigate({ to: "/espace" })}
      />
      <p className="text-center text-xs text-[#98a2b3]">Ordre chronologique</p>
      <ul className="space-y-3">
        {trierTaches(visibles).map((t) => (
          <li key={t.id}>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-[22px] bg-white px-4 py-3 text-left"
              onClick={() => void navigate({ to: t.route, ...(t.hash ? { hash: t.hash } : {}) })}
            >
              <span>
                <span className="block text-sm font-medium text-[#1d2939]">{t.titre}</span>
                <span className="text-xs text-[#e11d48]">{t.heureLabel}</span>
              </span>
              <FileText className="size-4 text-[#5090A8]" />
            </button>
          </li>
        ))}
      </ul>
    </Ecran>
  );
}

function DemandeAcces() {
  const navigate = useNavigate();
  const [faite, setFaite] = useState<string | null>(null);
  const decider = (decision: "autoriser" | "resilier" | "signaler") => {
    const suite = appliquerDecisionDemande(decision);
    ajouterDecision({
      id: `dem-${Date.now()}`,
      decision,
      expireLe: suite.expireLe,
      le: new Date().toISOString(),
    });
    setFaite(decision);
    if (decision === "signaler") toastOk("Demande signalée. Elle ne donne aucun accès.");
    else if (decision === "autoriser")
      toastOk("Accès autorisé pour 72 h. Vous pouvez le résilier à tout moment.");
    else toastOk("Demande résiliée.");
  };
  return (
    <Ecran>
      <Entete
        titre="Accès à vos documents"
        surRetour={() => void navigate({ to: "/espace", hash: "taches" })}
      />
      <Carte className="space-y-3 text-sm leading-relaxed text-[#344054]">
        <p>
          Vous avez reçu de <strong>agence@exemple.fr</strong> (compte gestionnaire) une demande
          d'accès à vos documents. Vous pouvez autoriser cet accès pour 72 h, ou le résilier à tout
          moment.
        </p>
        <p className="text-xs text-[#b54708]">
          L'émetteur vous est inconnu ou la demande vous semble suspecte.
        </p>
        {faite ? (
          <p className="text-sm font-medium text-[#027a48]">Décision enregistrée : {faite}.</p>
        ) : (
          <div className="space-y-2">
            <Bouton onClick={() => decider("autoriser")}>Autoriser 72 h</Bouton>
            <Bouton variante="ligne" onClick={() => decider("resilier")}>
              Résilier la demande
            </Bouton>
            <Bouton variante="ghost" onClick={() => decider("signaler")}>
              Signaler la demande
            </Bouton>
          </div>
        )}
      </Carte>
    </Ecran>
  );
}

function Intervention() {
  const navigate = useNavigate();
  return (
    <Ecran>
      <Entete
        titre="Intervention plomberie"
        surRetour={() => void navigate({ to: "/espace", hash: "taches" })}
      />
      <Carte className="space-y-2 text-sm text-[#344054]">
        <p>
          Date prévue communiquée par le gestionnaire. Une explication sera ajoutée ici dès qu'il la
          rédige.
        </p>
        <p className="text-xs text-[#667085]">En attendant, la FAQ décrit les gestes autonomes.</p>
        <Bouton onClick={() => void navigate({ to: "/espace/logement", hash: "faq" })}>
          J'ai un problème dans mon logement
        </Bouton>
      </Carte>
    </Ecran>
  );
}

function FicheAcces() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const [plusTard, setPlusTard] = useState(false);
  const deverrouiller = () => {
    if (pin.length < 4) {
      toastErreur("Indiquez 4 chiffres.");
      return;
    }
    const attendu = lirePin();
    if (!attendu) {
      ecrirePin(pin);
      setOuvert(true);
      toastOk("Code enregistré pour cette session.");
      return;
    }
    if (pin !== attendu) {
      toastErreur("Code incorrect.");
      return;
    }
    setOuvert(true);
  };
  const biometrie = async () => {
    if (!window.PublicKeyCredential) {
      toastErreur("Ce navigateur n'a pas de déverrouillage biométrique. Utilisez le code.");
      return;
    }
    try {
      const dispo = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!dispo) {
        toastErreur("Aucun capteur détecté. Utilisez le code à 4 chiffres.");
        return;
      }
      const existant = lireWebAuthnId();
      if (!existant) {
        const cred = (await navigator.credentials.create({
          publicKey: {
            challenge: crypto.getRandomValues(new Uint8Array(32)),
            rp: { name: "Hublify" },
            user: {
              id: crypto.getRandomValues(new Uint8Array(16)),
              name: "portail",
              displayName: "Portail Hublify",
            },
            pubKeyCredParams: [{ type: "public-key", alg: -7 }],
            authenticatorSelection: {
              userVerification: "required",
              authenticatorAttachment: "platform",
            },
            timeout: 60000,
          },
        })) as PublicKeyCredential | null;
        if (!cred) return;
        ecrireWebAuthnId(btoa(String.fromCharCode(...new Uint8Array(cred.rawId))));
      }
      setOuvert(true);
      toastOk("Appareil confirmé. Codes visibles pour cette vue.");
    } catch {
      toastErreur("Déverrouillage annulé. Le code reste disponible.");
    }
  };
  return (
    <Ecran>
      <Entete
        titre="Appartement Colette à Cannes"
        sousTitre="Du séjour en cours"
        surRetour={() => void navigate({ to: "/espace" })}
      />
      <Carte className="space-y-3 text-center">
        <p className="text-sm font-semibold">Wi-Fi</p>
        <p className="text-xs text-[#667085]">
          {ouvert ? "Colette-Invite · cannes-2026" : "Nom · ••••••••  Mot de passe · ••••••••"}
        </p>
        <p className="text-sm font-semibold">Code d'accès</p>
        <p className="text-xs text-[#667085]">{ouvert ? "A4281 · fiche d'accès" : "••••••••"}</p>
        <p className="text-sm font-semibold">Adresse</p>
        <p className="text-xs text-[#667085]">
          {ouvert ? "8 rue Lycklama, 06400 Cannes, 1er étage" : "••••••••••••••••"}
        </p>
        {!ouvert && !plusTard && (
          <div className="rounded-2xl bg-[#f6f7f6] p-3 text-left text-xs text-[#344054]">
            <p>
              Merci de remplir les informations de check-in pour votre arrivée, ou de confirmer un
              code.
            </p>
            <div className="mt-2 flex gap-2">
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                inputMode="numeric"
                aria-label="Code à 4 chiffres"
                placeholder="••••"
                className="h-10 w-24 rounded-xl border border-[#e4e7ec] px-3"
              />
              <button
                type="button"
                onClick={deverrouiller}
                className="h-10 rounded-full bg-[#5090A8] px-3 text-xs font-semibold text-white"
              >
                OK
              </button>
            </div>
            <button type="button" onClick={() => void biometrie()} className="mt-2 text-[#5090A8]">
              Déverrouillage de l'appareil
            </button>
            <div className="mt-3 space-y-2">
              <Bouton onClick={() => void navigate({ to: "/espace/precheckin" })}>
                Formulaire de check-in
              </Bouton>
              <button
                type="button"
                className="text-xs text-[#667085]"
                onClick={() => setPlusTard(true)}
              >
                Plus tard
              </button>
            </div>
          </div>
        )}
        {ouvert && <Bouton onClick={() => void navigate({ to: "/espace" })}>OK</Bouton>}
        <Bouton variante="ligne" onClick={() => void navigate({ to: "/espace/messages" })}>
          Gestionnaire de mon logement
        </Bouton>
        <button
          type="button"
          className="text-xs text-[#5090A8]"
          onClick={() => void navigate({ to: "/espace/logement", hash: "faq" })}
        >
          J'ai un problème dans mon logement
        </button>
      </Carte>
      <Bouton onClick={() => void navigate({ to: "/espace", hash: "autour" })}>
        More fun and activities !
      </Bouton>
    </Ecran>
  );
}
