import { useNavigate } from "@tanstack/react-router";
import { Briefcase, Clock, FileText, Home, UserRound } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/auth/auth-context";
import { AutourDeMoi, OffreDetail, RechercheBail } from "@/components/portail/RecherchePortail";
import { Bouton, Carte, Cloche, Ecran, Entete, usePortailUi } from "@/components/portail/chrome";
import {
  ecrirePin,
  ecrireWebAuthnId,
  lirePin,
  lireWebAuthnId,
} from "@/components/portail/etat-local";
import { usePortailDonnees } from "@/components/portail/etat-portail";
import { useAncre } from "@/components/portail/use-ancre";
import { useSession } from "@/data/session";
import {
  appliquerDecisionDemande,
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
  proprietaire: boolean;
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
  if (params.proprietaire) {
    const finance: TachePortail[] = params.loyers
      .filter((l) => !l.valide)
      .map((l) => ({
        id: l.id,
        categorie: "Finance" as const,
        titre: `Loyer à suivre — ${l.echeance} — ${l.bienNom}`,
        quand: `${l.echeance}T10:00:00`,
        heureLabel: l.echeance,
        route: "/espace/documents" as const,
        hash: "quittances",
      }));
    const sejours: TachePortail[] = params.reservations.map((r) => ({
      id: `sej-${r.id}`,
      categorie: "Action" as const,
      titre: `Séjour — ${r.occupant}`,
      quand: `${r.arrivee}T10:00:00`,
      heureLabel: r.arrivee,
      route: "/espace/calendrier" as const,
      hash: "",
    }));
    const taches = trierTaches([...finance, ...sejours]);
    return taches.length > 0
      ? taches
      : [
          {
            id: "proprio-vide",
            categorie: "Action" as const,
            titre: "Aucun séjour à signaler sur vos biens",
            quand: new Date().toISOString(),
            heureLabel: "Aujourd'hui",
            route: "/espace/documents" as const,
            hash: "",
          },
        ];
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

function isoLocal(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function etiquetteLocale(date: Date) {
  return {
    mois: date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
    numero: String(date.getDate()),
    semaine: date.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", ""),
    iso: isoLocal(date),
  };
}

function heureDouze(iso: string, repli: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return repli;
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function centreFrise(taches: TachePortail[]) {
  const auj = isoLocal(new Date());
  if (taches.some((t) => t.quand.slice(0, 10) === auj)) return new Date();
  const dates = taches
    .map((t) => new Date(t.quand))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  const prochaine = dates.find((d) => isoLocal(d) >= auj);
  return prochaine ?? dates[dates.length - 1] ?? new Date();
}

export function AccueilPortail() {
  const ancre = useAncre();
  const auth = useAuth();
  const session = useSession();
  const vide =
    session.biens.length === 0 && session.missions.length === 0 && session.loyers.length === 0;

  if (ancre === "taches") return <ToutesLesTaches vide={vide} />;
  if (ancre === "demande") return <DemandeAcces />;
  if (ancre === "intervention") return <Intervention />;
  if (ancre === "acces") return <FicheAcces />;
  if (ancre === "autour") return <AutourDeMoi />;
  if (ancre === "autour-resultats") return <AutourDeMoi resultats />;
  if (ancre === "recherche") return <RechercheBail />;
  if (ancre.startsWith("offre-")) return <OffreDetail id={ancre.slice("offre-".length)} />;

  const prestataire = auth?.roleId === "prestataire";
  const taches = tachesAffichees({
    vide,
    prestataire,
    proprietaire: auth?.roleId === "proprietaire",
    missions: session.missions,
    loyers: session.loyers,
    reservations: session.reservationsDossier,
  });
  const duJour = tachesDuJour(taches, isoLocal(new Date()));
  return (
    <Journee
      prenom={auth?.prenom?.trim() || "vous"}
      initiales={`${auth?.prenom?.[0] ?? "H"}${auth?.nom?.[0] ?? ""}`.toUpperCase()}
      taches={prestataire ? taches : duJour}
      total={taches.length}
      prestataire={prestataire}
    />
  );
}

function Journee({
  prenom,
  initiales,
  taches,
  total,
  prestataire,
}: {
  prenom: string;
  initiales: string;
  taches: TachePortail[];
  total: number;
  prestataire: boolean;
}) {
  const navigate = useNavigate();
  const centre = centreFrise(taches);
  const [selection, setSelection] = useState(isoLocal(centre));
  const bandeau = joursAutour(centre);
  const duJour = taches.filter((t) => t.quand.slice(0, 10) === selection);
  const ouvrir = (t: TachePortail) =>
    void navigate({ to: t.route, ...(t.hash ? { hash: t.hash } : {}) });

  if (prestataire) {
    return (
      <Ecran className="gap-5">
        <div className="grid grid-cols-[1fr_auto] items-start">
          <div className="pt-2 text-center">
            <h1 className="font-display text-[32px] font-normal leading-none text-[var(--portail-encre)]">
              Ma Journée
            </h1>
            <p className="mt-1 text-[12px] font-semibold text-black">Mode Prestataire</p>
          </div>
          <Cloche />
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {bandeau.map((date) => {
            const e = etiquetteLocale(date);
            const on = e.iso === selection;
            return (
              <button
                key={e.iso}
                type="button"
                aria-pressed={on}
                onClick={() => setSelection(e.iso)}
                className={`flex h-[78px] flex-col items-center justify-center rounded-2xl text-[11px] capitalize shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${
                  on
                    ? "bg-[var(--portail-sarcelle)] text-white"
                    : "bg-white text-[var(--portail-encre)]"
                }`}
              >
                <span>{e.mois}</span>
                <span className="text-lg font-semibold leading-none">{e.numero}</span>
                <span className="capitalize">{e.semaine}</span>
              </button>
            );
          })}
        </div>
        <ul className="relative ml-2 space-y-3 border-l-2 border-[#1d2939] py-1 pl-5">
          {duJour.length === 0 && (
            <li className="rounded-2xl bg-white px-4 py-3 text-sm text-[var(--portail-encre-douce)] shadow-[var(--portail-ombre)]">
              Rien de prévu ce jour. Choisissez un autre jour ou ouvrez les missions.
            </li>
          )}
          {duJour.map((t, index) => {
            const [titre, ...reste] = t.titre.split(" — ");
            const lieu = reste.join(" — ");
            const actif = index === Math.floor(duJour.length / 2);
            return (
              <li key={t.id} className="relative">
                <span
                  className="absolute -left-[27px] top-5 size-3 rounded-full bg-[#c5c8ce] ring-4 ring-[#e6e3db]"
                  aria-hidden
                />
                <button
                  type="button"
                  onClick={() => ouvrir(t)}
                  className={`w-full rounded-2xl px-4 py-3 text-left shadow-[var(--portail-ombre)] ${
                    actif ? "bg-white" : "bg-[#f3f0f5]"
                  }`}
                >
                  <span className="flex items-center gap-1 text-sm font-semibold text-[var(--portail-lilas)]">
                    <Clock className="size-3.5" fill="currentColor" />
                    {heureDouze(t.quand, t.heureLabel)}
                  </span>
                  <span className="mt-0.5 block text-[15px] font-semibold text-[var(--portail-encre)]">
                    {titre}
                  </span>
                  {lieu && (
                    <span className="block text-sm text-[var(--portail-encre-douce)]">{lieu}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </Ecran>
    );
  }

  return (
    <Ecran className="gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Mon logement"
          onClick={() => void navigate({ to: "/espace/logement" })}
          className="grid size-11 place-items-center text-[var(--portail-encre)]"
        >
          <Home className="size-6" fill="currentColor" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          aria-label="Mon profil"
          onClick={() => void navigate({ to: "/espace/dossier" })}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[var(--portail-sarcelle)] text-sm font-semibold text-white">
            {initiales}
          </span>
          <h1 className="min-w-0 font-display leading-tight text-black">
            <span className="block text-[14px] font-normal">Bonjour !</span>
            <span className="block truncate text-[20px] font-semibold">{prenom}</span>
          </h1>
        </button>
        <Cloche />
      </div>
      {taches.length === 0 && (
        <Carte>
          <p className="text-sm text-[var(--portail-encre-douce)]">
            Rien de prévu pour le moment. Les appels de loyer, le check-in et les états des lieux
            s'affichent ici dès qu'ils vous concernent.
          </p>
        </Carte>
      )}
      <ul className="mt-[200px] space-y-2.5">
        {taches.map((t) => {
          const Icone = t.categorie === "Finance" ? Briefcase : UserRound;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => ouvrir(t)}
                className="flex min-h-[75px] w-full items-center gap-3 rounded-[16px] bg-white px-4 py-3 text-left shadow-[var(--portail-ombre)]"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-[var(--portail-encre-douce)]">
                    {t.categorie === "Finance" ? "Finance" : "Action"}
                  </span>
                  <span className="block truncate text-[15px] font-semibold text-[var(--portail-encre)]">
                    {t.titre}
                  </span>
                  <span className="mt-1 flex items-center gap-2 text-[11px] font-medium text-[var(--portail-corail)]">
                    <Clock className="size-3.5" fill="currentColor" />
                    {heureDouze(t.quand, t.heureLabel)}
                    <span>{t.quand.slice(0, 10).split("-").reverse().join("/")}</span>
                  </span>
                </span>
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f6f1df] text-[var(--portail-encre)]">
                  <Icone className="size-5" fill="currentColor" strokeWidth={1.5} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <Bouton onClick={() => void navigate({ to: "/espace", hash: "taches" })}>
        Tâches en cours
        <span className="ml-2 grid size-6 place-items-center rounded-full bg-white/25 text-xs">
          {total}
        </span>
      </Bouton>
    </Ecran>
  );
}

function ToutesLesTaches({ vide }: { vide: boolean }) {
  const navigate = useNavigate();
  const ui = usePortailUi();
  const auth = useAuth();
  const session = useSession();
  const taches = tachesAffichees({
    vide,
    prestataire: ui.mode === "prestataire",
    proprietaire: auth?.roleId === "proprietaire",
    missions: session.missions,
    loyers: session.loyers,
    reservations: session.reservationsDossier,
  });
  const decisions = usePortailDonnees().demandes;
  const visibles = taches.filter((t) => (t.id === "t-acces" ? decisions.length === 0 : true));
  return (
    <Ecran>
      <Entete
        titre="Toutes les tâches en cours"
        surRetour={() => void navigate({ to: "/espace" })}
      />
      <p className="text-center text-[12px] font-semibold text-black">
        Toutes les tâches par ordre chronologique.
      </p>
      <ul className="space-y-3">
        {trierTaches(visibles).map((t) => (
          <li key={t.id}>
            <button
              type="button"
              className="flex min-h-[66px] w-full items-center gap-3 rounded-[16px] bg-white px-3 py-2 text-left shadow-[var(--portail-ombre)]"
              onClick={() => void navigate({ to: t.route, ...(t.hash ? { hash: t.hash } : {}) })}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f3e8ff] text-black">
                <FileText className="size-4" fill="currentColor" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-normal text-black">{t.titre}</span>
                <span className="text-[12px] font-semibold text-[#7c6bb5]">{t.heureLabel}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Ecran>
  );
}

function DemandeAcces() {
  const navigate = useNavigate();
  const { ajouterDecision } = usePortailDonnees();
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
