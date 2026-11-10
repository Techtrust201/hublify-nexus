import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Check,
  ChevronRight,
  CreditCard,
  FileText,
  HelpCircle,
  Home,
  KeyRound,
  Mail,
  Phone,
  Plus,
  Search,
  Users,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/auth/auth-context";
import { AppShell } from "@/components/layout/AppShell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { nuitsEntre } from "@/data/reservations-mo1";
import {
  ajouterBien,
  ajouterMission,
  ajouterNotif,
  ajouterReservation,
  idNouveau,
  useSession,
} from "@/data/session";
import { chargerProfilDistant } from "@/data/profil-remote";
import { toastErreur, toastOk } from "@/lib/feedback";
import { emailValide, telephoneValide } from "@/lib/saisie";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/outils/debuter")({
  head: () => ({
    meta: [{ title: "Je débute — Hublify" }],
  }),
  component: PageDebuter,
});

const ETAPES = [
  { n: 1, titre: "Le logement", icone: Home },
  { n: 2, titre: "La réservation", icone: Users },
  { n: 3, titre: "La mission", icone: KeyRound },
];

const DOCS_RECUS = [
  "Bail",
  "Dernière quittance de loyer",
  "Reçu de paiement",
  "État des lieux",
  "Inventaire du logement",
];

const FAQ: Array<{ question: string; reponse: string }> = [
  {
    question: "Planifie-t-on des soirées, ou faut-il l'accord du propriétaire ?",
    reponse:
      "Les règles du logement (fêtes, animaux, fumeur) sont dans la fiche du lieu. En cas de doute, écrivez au gestionnaire avant d'inviter.",
  },
  {
    question: "Je reçois une proposition de bail de la part des gestionnaires",
    reponse: "Ouvrez Messagerie : la proposition se lit dans le fil, puis se signe depuis le bail.",
  },
  {
    question: "Le bail signé est envoyé au gestionnaire : paiement des arrhes",
    reponse:
      "Après signature, préparez les arrhes avec « Je procède à un paiement ». Le gestionnaire valide l'encaissement.",
  },
  {
    question: "Je reçois la confirmation du bail au moment d'un premier paiement",
    reponse:
      "La confirmation part lorsque le premier paiement est validé. La quittance se retrouve dans Documents.",
  },
  {
    question: "Je reçois le bail contractuel de mon logement après signature",
    reponse: "Le PDF signé est dans Documents, vue logements, dès que les deux parties ont signé.",
  },
  {
    question: "Quelques jours avant notre arrivée dans ce lieu, que faire ?",
    reponse:
      "Complétez le pré-check-in, vérifiez l'heure d'arrivée et le rendez-vous indiqué dans Messagerie.",
  },
  {
    question: "Comment ajouter mon premier logement ?",
    reponse:
      "Ouvrez Lieux, puis « Ajouter un lieu ou logement ». Le type, l'adresse et le livret d'accueil se renseignent dans la fiche.",
  },
  {
    question: "Comment créer une réservation ?",
    reponse:
      "Depuis Réservations, choisissez le type de séjour, le logement, l'occupant et des dates qui ne se chevauchent pas. Le planning se met à jour aussitôt.",
  },
  {
    question: "Comment assigner une mission de ménage ?",
    reponse:
      "Sur le planning, ouvrez le jour du logement et ajoutez une prestation. Vous pouvez aussi la créer à la fin de ce parcours.",
  },
  {
    question: "Où suivre les paiements et les arrhes ?",
    reponse:
      "La vue générale liste les loyers en attente. Le détail des encaissements, commissions et quittances est dans Analyse.",
  },
  {
    question: "Comment envoyer un bail au locataire ?",
    reponse:
      "Depuis la messagerie, ouvrez la conversation puis la proposition de bail. Le brouillon s'enregistre avant l'envoi pour signature.",
  },
  {
    question: "Que se passe-t-il après la signature du bail ?",
    reponse:
      "Le bail signé rejoint les documents de l'occupant. La caution et le premier loyer se suivent dans Analyse et sur la fiche.",
  },
  {
    question: "Que préparer quelques jours avant l'arrivée ?",
    reponse:
      "Vérifiez le pré-check-in, le livret d'accueil et la mission de ménage. Le code d'accès ne part qu'une fois le dossier complet.",
  },
];

function isoPlus(jours: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + jours);
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mois}-${jour}`;
}

function PageDebuter() {
  const navigate = useNavigate();
  const session = useSession();
  const auth = useAuth();
  const [etape, setEtape] = useState(1);
  const [telephoneFiche, setTelephoneFiche] = useState("");
  useEffect(() => {
    void chargerProfilDistant().then((res) => {
      if (res.ok) setTelephoneFiche(res.profil.identite.telephone1.trim());
    });
  }, []);
  const [bienId, setBienId] = useState("");
  const [voyageur, setVoyageur] = useState("Léa Moreau");
  const [email, setEmail] = useState("lea.moreau@email.fr");
  const [telephone, setTelephone] = useState("+33 6 12 34 56 78");
  const [arrivee, setArrivee] = useState(() => isoPlus(14));
  const [depart, setDepart] = useState(() => isoPlus(18));
  const [missionTitre, setMissionTitre] = useState("Ménage de bienvenue");
  const [missionHeure, setMissionHeure] = useState("10:00");
  const [prestataireId, setPrestataireId] = useState("");
  const [nouveauBien, setNouveauBien] = useState("");
  const [paiement, setPaiement] = useState(false);
  const [motifPaiement, setMotifPaiement] = useState<"Loyer" | "Arrhes" | "Caution">("Caution");
  const [montantPaiement, setMontantPaiement] = useState("850");

  const bien = session.biens.find((b) => b.id === bienId) ?? session.biens[0];
  const prestataire = session.prestataires.find((p) => p.id === prestataireId);

  const creer = () => {
    if (!bien) {
      toastErreur("Ajoutez un bien avant de créer une réservation.");
      return;
    }
    if (!voyageur.trim() || !arrivee || !depart) {
      toastErreur("Renseignez le voyageur et les dates.");
      return;
    }
    if (!emailValide(email)) {
      toastErreur("Indiquez un e-mail valide pour le voyageur.");
      return;
    }
    if (!telephoneValide(telephone)) {
      toastErreur("Indiquez un téléphone valide pour le voyageur.");
      return;
    }
    if (depart <= arrivee) {
      toastErreur("Le départ doit être après l'arrivée.");
      return;
    }
    if (!prestataire) {
      toastErreur("Choisissez un prestataire.");
      return;
    }
    const id = idNouveau("r");
    const initiales = voyageur
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
    const nuits = Math.max(1, nuitsEntre(arrivee, depart));
    if (
      !ajouterReservation({
        dossier: {
          id,
          bienId: bien.id,
          occupant: voyageur.trim(),
          initiales: initiales || "??",
          email: email.trim(),
          telephone: telephone.trim(),
          arrivee,
          depart,
          heureArrivee: session.parametrage.heureCheckIn || "16:00",
          heureDepart: session.parametrage.heureCheckOut || "10:00",
          plateforme: "Direct",
          voyageurs: 2,
          adultes: 2,
          enfants: 0,
          montant: nuits * (bien.baseNuit || 180),
          paye: 0,
          statut: "Confirmé",
          couleur: "#4f8ef7",
          type: "Location saisonnière",
        },
        calendrier: {
          id: `cal-${id}`,
          bienId: bien.id,
          voyageur: voyageur.trim(),
          arrivee,
          depart,
        },
      })
    ) {
      return;
    }
    ajouterMission({
      id: idNouveau("ms"),
      bienId: bien.id,
      date: arrivee,
      titre: missionTitre.trim() || "Ménage de bienvenue",
      type: "Menage",
      emoji: "🧹",
      heure: missionHeure,
      assigne: prestataire.nom,
      statut: "a_faire",
      description: `Mission créée depuis Je débute pour ${voyageur.trim()} à ${bien.nom}.`,
    });
    ajouterNotif({
      titre: "Parcours Je débute terminé",
      detail: `${voyageur.trim()} · ${bien.nom} · ${arrivee}`,
      href: `/reservations?vue=liste&resa=${encodeURIComponent(id)}`,
    });
    toastOk("Logement, réservation et mission créés.");
    void navigate({ to: "/reservations", search: { vue: "liste", resa: id } });
  };

  const preparerPaiement = () => {
    const montant = Number(montantPaiement.replace(",", "."));
    if (!Number.isFinite(montant) || montant <= 0) {
      toastErreur("Indiquez un montant.");
      return;
    }
    ajouterNotif({
      titre: `Demande de ${motifPaiement.toLowerCase()}`,
      detail: `${montant.toLocaleString("fr-FR")} € à encaisser`,
      href: motifPaiement === "Caution" ? "/outils/baux" : "/documents?vue=residents",
    });
    toastOk(
      motifPaiement === "Caution"
        ? "Prise de caution préparée. Finalisez-la dans le bail."
        : "Demande de paiement préparée.",
    );
    setPaiement(false);
  };

  return (
    <AppShell
      attendDonnees
      titre="Je débute"
      sousTitre="Fiche, documents reçus, puis les étapes pour ouvrir le compte"
    >
      <div className="mx-auto max-w-5xl space-y-4">
        <header>
          <h2 className="text-xl font-medium text-ink">Je débute sur Hublify</h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-subtle">
            Remplissez les informations de base pour accéder au compte, puis enchaînez les étapes
            explicatives.
          </p>
        </header>

        <div className="grid gap-3 lg:grid-cols-3">
          <section className="rounded-card border border-line bg-white p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-surface-soft text-ink-muted">
                <Users className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">
                  {auth ? `${auth.prenom} ${auth.nom}` : "Votre fiche"}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
                  <Phone className="size-3" /> {telephoneFiche || "Téléphone à renseigner"}
                </p>
                <p className="flex items-center gap-1 text-xs text-ink-muted">
                  <Mail className="size-3" /> {auth?.email ?? "—"}
                </p>
              </div>
            </div>
            <Link
              to="/profil"
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-card bg-ink text-sm font-medium text-white md:h-10"
            >
              Je remplis ma fiche
            </Link>
          </section>

          <section className="rounded-card border border-line bg-white p-4">
            <h3 className="text-sm font-medium text-ink">Mes documents reçus</h3>
            <ul className="mt-3 space-y-2">
              {DOCS_RECUS.map((doc) => (
                <li key={doc}>
                  <Link
                    to={doc === "Inventaire du logement" ? "/inventaire" : "/documents"}
                    className="flex items-center gap-2 text-sm text-ink-body hover:text-ink"
                  >
                    <FileText className="size-3.5 text-ink-muted" /> {doc}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-card border border-line bg-white p-4">
            <h3 className="text-sm font-medium text-ink">Actions rapides</h3>
            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={() => setPaiement(true)}
                className="flex w-full items-start gap-2 rounded-card border border-line px-3 py-2 text-left hover:bg-surface"
              >
                <CreditCard className="mt-0.5 size-4 text-ink-muted" />
                <span>
                  <span className="block text-sm text-ink">Je procède à un paiement</span>
                  <span className="block text-[11px] text-ink-muted">Loyer, arrhes ou caution</span>
                </span>
              </button>
              <Link
                to="/patrimoines"
                className="flex items-start gap-2 rounded-card border border-line px-3 py-2 hover:bg-surface"
              >
                <Search className="mt-0.5 size-4 text-ink-muted" />
                <span>
                  <span className="block text-sm text-ink">Je recherche un logement</span>
                  <span className="block text-[11px] text-ink-muted">
                    Parmi les logements du parc, ou avec un ID
                  </span>
                </span>
              </Link>
              <Link
                to="/prestataires"
                className="flex items-start gap-2 rounded-card border border-line px-3 py-2 hover:bg-surface"
              >
                <Wrench className="mt-0.5 size-4 text-ink-muted" />
                <span>
                  <span className="block text-sm text-ink">Je recherche une prestation</span>
                  <span className="block text-[11px] text-ink-muted">
                    Ménage, check-in ou travaux
                  </span>
                </span>
              </Link>
            </div>
          </section>
        </div>

        {paiement && (
          <section className="rounded-card border border-line bg-white p-4">
            <h3 className="text-sm font-medium text-ink">Prise de paiement</h3>
            <p className="mt-1 text-xs text-ink-muted">
              La caution se finalise dans le bail. Ici, vous préparez le montant à encaisser.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["Loyer", "Arrhes", "Caution"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMotifPaiement(m)}
                  className={cn(
                    "h-11 rounded-card border px-3 text-xs md:h-9",
                    motifPaiement === m ? "border-ink bg-ink text-white" : "border-line text-ink",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            <label className="mt-3 block text-xs text-ink-muted">
              Montant (€)
              <input
                value={montantPaiement}
                onChange={(e) => setMontantPaiement(e.target.value)}
                className="mt-1 h-11 w-full max-w-xs rounded-card border border-line px-3 text-sm text-ink outline-none md:h-9"
              />
            </label>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={preparerPaiement}
                className="h-11 rounded-card bg-ink px-4 text-sm font-medium text-white md:h-9"
              >
                Préparer
              </button>
              <button
                type="button"
                onClick={() => setPaiement(false)}
                className="h-11 rounded-card border border-line px-4 text-sm md:h-9"
              >
                Fermer
              </button>
            </div>
          </section>
        )}

        <section className="rounded-card border border-line bg-white p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-ink">
            <Bell className="size-4" /> Messagerie
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="rounded-card border border-line px-3 py-2">
              <p className="text-xs font-medium text-ink">Rappel</p>
              <p className="text-xs text-ink-muted">Date · Heure · Motif à confirmer</p>
            </li>
            <li className="rounded-card border border-sky-100 bg-sky-50 px-3 py-2">
              <p className="text-xs font-medium text-ink">Rendez-vous</p>
              <p className="text-xs text-ink-muted">
                Logement · Adresse · Heure · check-in / check-out
              </p>
            </li>
            <li className="rounded-card border border-line px-3 py-2 text-xs text-ink-body">
              Le gestionnaire du logement vous envoie une proposition de bail
            </li>
            <li>
              <Link to="/messagerie" className="text-xs font-medium text-ink underline">
                Message avec le gestionnaire
              </Link>
            </li>
          </ul>
        </section>

        <section className="rounded-card border border-line bg-white p-4">
          <h3 className="text-sm font-medium text-ink">Étapes pour ouvrir le compte</h3>
          <p className="mt-1 text-xs text-ink-muted">
            Après la fiche, cliquez chaque étape : logement, réservation, première mission.
          </p>
          <ol className="mb-6 mt-4 flex flex-wrap gap-2">
            {ETAPES.map((e) => (
              <li
                key={e.n}
                className="flex min-w-0 flex-1 basis-full items-center gap-2 sm:basis-0"
              >
                <button
                  type="button"
                  aria-pressed={etape === e.n}
                  onClick={() => setEtape(e.n)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                      etape >= e.n ? "bg-ink text-white" : "bg-surface-soft text-ink-muted",
                    )}
                  >
                    {etape > e.n ? <Check className="size-3.5" /> : e.n}
                  </span>
                  <span
                    className={cn("min-w-0 text-xs", etape >= e.n ? "text-ink" : "text-ink-muted")}
                  >
                    {e.titre}
                  </span>
                </button>
                {e.n < 3 && (
                  <ChevronRight className="ml-auto hidden size-3.5 shrink-0 text-line-strong sm:block" />
                )}
              </li>
            ))}
          </ol>

          <div className="rounded-card border border-line bg-white p-6">
            {etape === 1 && (
              <>
                <h2 className="text-base font-medium text-ink">Choisissez le logement</h2>
                <p className="mt-1 text-xs text-ink-subtle">
                  Sélectionnez un logement existant, ou créez-en un si le parc est vide.
                </p>
                {session.biens.length === 0 && (
                  <div className="mt-4 flex gap-2">
                    <input
                      value={nouveauBien}
                      onChange={(e) => setNouveauBien(e.target.value)}
                      placeholder="Nom du logement"
                      // `min-w-0` : sans lui, le champ refuse de descendre sous la
                      // largeur de son texte et pousse le bouton hors de l'écran.
                      className="h-[34px] min-w-0 flex-1 rounded-[8px] border border-line px-3 text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nom = nouveauBien.trim();
                        if (!nom) {
                          toastErreur("Indiquez le nom du logement.");
                          return;
                        }
                        const id = idNouveau("bien");
                        ajouterBien({ id, nom, baseNuit: 180 });
                        setBienId(id);
                        setNouveauBien("");
                        toastOk(`${nom} ajouté.`);
                      }}
                      className="inline-flex h-[34px] items-center gap-1 rounded-card bg-ink px-3 text-xs font-medium text-white"
                    >
                      <Plus className="size-3" /> Créer
                    </button>
                  </div>
                )}
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {session.biens.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      aria-pressed={bienId === b.id}
                      onClick={() => setBienId(b.id)}
                      className={cn(
                        "rounded-card border px-4 py-3 text-left",
                        bienId === b.id ? "border-ink bg-surface" : "border-line hover:bg-surface",
                      )}
                    >
                      <p className="text-sm text-ink">{b.nom}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">{b.adresse}</p>
                    </button>
                  ))}
                </div>
              </>
            )}

            {etape === 2 && (
              <>
                <h2 className="text-base font-medium text-ink">Créer la réservation</h2>
                <p className="mt-1 text-xs text-ink-subtle">
                  Séjour direct sur {bien?.nom ?? "votre bien"}. Les dates s’affichent ensuite dans
                  le planning.
                </p>
                <label className="mt-4 block text-xs text-ink-subtle">
                  Voyageur
                  <input
                    value={voyageur}
                    onChange={(e) => setVoyageur(e.target.value)}
                    className="mt-1 h-[34px] w-full rounded-[8px] border border-line px-3 text-sm outline-none"
                  />
                </label>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs text-ink-subtle">
                    E-mail
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 h-[34px] w-full rounded-[8px] border border-line px-3 text-sm outline-none"
                    />
                  </label>
                  <label className="block text-xs text-ink-subtle">
                    Téléphone
                    <input
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                      className="mt-1 h-[34px] w-full rounded-[8px] border border-line px-3 text-sm outline-none"
                    />
                  </label>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs text-ink-subtle">
                    Arrivée
                    <input
                      type="date"
                      value={arrivee}
                      onChange={(e) => setArrivee(e.target.value)}
                      className="mt-1 h-[34px] w-full rounded-[8px] border border-line px-3 text-sm outline-none"
                    />
                  </label>
                  <label className="block text-xs text-ink-subtle">
                    Départ
                    <input
                      type="date"
                      value={depart}
                      onChange={(e) => setDepart(e.target.value)}
                      className="mt-1 h-[34px] w-full rounded-[8px] border border-line px-3 text-sm outline-none"
                    />
                  </label>
                </div>
              </>
            )}

            {etape === 3 && (
              <>
                <h2 className="text-base font-medium text-ink">Planifier la première mission</h2>
                <p className="mt-1 text-xs text-ink-subtle">
                  Un ménage le jour de l'arrivée, assigné à la personne que vous choisissez.
                </p>
                <label className="mt-4 block text-xs text-ink-subtle">
                  Intitulé
                  <input
                    value={missionTitre}
                    onChange={(e) => setMissionTitre(e.target.value)}
                    className="mt-1 h-[34px] w-full rounded-[8px] border border-line px-3 text-sm outline-none"
                  />
                </label>
                <label className="mt-3 block text-xs text-ink-subtle">
                  Heure
                  <input
                    type="time"
                    value={missionHeure}
                    onChange={(e) => setMissionHeure(e.target.value)}
                    className="mt-1 h-[34px] w-full rounded-[8px] border border-line px-3 text-sm outline-none"
                  />
                </label>
                <p className="mt-4 text-xs text-ink-subtle">Prestataire</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {session.prestataires.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={prestataireId === p.id}
                      onClick={() => setPrestataireId(p.id)}
                      className={cn(
                        "rounded-card border px-4 py-3 text-left",
                        prestataireId === p.id
                          ? "border-ink bg-surface"
                          : "border-line hover:bg-surface",
                      )}
                    >
                      <p className="text-sm text-ink">{p.nom}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">{p.categorie}</p>
                    </button>
                  ))}
                </div>
                <ul className="mt-4 space-y-1 rounded-card bg-surface p-3 text-xs text-ink-body">
                  <li>Logement : {bien?.nom ?? "—"}</li>
                  <li>
                    Séjour : {voyageur} · {arrivee} → {depart}
                  </li>
                  <li>
                    Mission : {missionTitre} · {missionHeure}
                  </li>
                </ul>
              </>
            )}

            <div className="mt-6 flex justify-between">
              {etape === 1 ? (
                <Link
                  to="/outils"
                  className="inline-flex min-h-11 items-center text-xs text-ink-subtle hover:underline md:min-h-0"
                >
                  Retour aux outils
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setEtape((n) => n - 1)}
                  className="inline-flex min-h-11 items-center text-xs text-ink-subtle hover:underline md:min-h-0"
                >
                  Étape précédente
                </button>
              )}
              {etape < 3 ? (
                <button
                  type="button"
                  disabled={etape === 1 && !bienId}
                  onClick={() => {
                    if (etape === 1 && !bienId) {
                      toastErreur("Choisissez un logement pour continuer.");
                      return;
                    }
                    if (
                      etape === 2 &&
                      (!voyageur.trim() ||
                        !email.trim() ||
                        !telephone.trim() ||
                        !arrivee ||
                        !depart)
                    ) {
                      toastErreur("Renseignez le voyageur, le contact et les dates.");
                      return;
                    }
                    setEtape((n) => n + 1);
                  }}
                  className="inline-flex h-11 items-center rounded-card bg-ink px-4 text-xs font-medium text-white disabled:opacity-40 md:h-9"
                >
                  Continuer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={creer}
                  className="inline-flex h-11 items-center gap-1 rounded-card bg-ink px-4 text-xs font-medium text-white md:h-9"
                >
                  <Check className="size-3.5" />
                  Terminer
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-card border border-line bg-white p-4">
          <h3 className="text-sm font-medium text-ink">FAQ — problème dans votre logement ?</h3>
          <p className="mt-1 text-xs text-ink-muted">
            Consultez nos réponses aux questions fréquentes pour trouver une solution rapide.
          </p>
          <Accordion type="single" collapsible className="mt-2">
            {FAQ.map((item) => (
              <AccordionItem key={item.question} value={item.question}>
                <AccordionTrigger className="text-left text-sm font-normal text-ink hover:no-underline">
                  <span className="flex items-start gap-2">
                    <HelpCircle className="mt-0.5 size-4 shrink-0 text-ink-muted" />
                    {item.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-ink-subtle">
                  {item.reponse}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <Link
            to="/prestataires"
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-card bg-ink text-sm font-medium text-white"
          >
            Je recherche une prestation
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
