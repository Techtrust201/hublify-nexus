import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronRight, FileText, Home, KeyRound, Plus, Users } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/auth/auth-context";
import { AppShell } from "@/components/layout/AppShell";
import { nuitsEntre } from "@/data/reservations-mo1";
import {
  ajouterBien,
  ajouterMission,
  ajouterNotif,
  ajouterReservation,
  idNouveau,
  useSession,
} from "@/data/session";
import { toastErreur, toastOk } from "@/lib/feedback";
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

function PageDebuter() {
  const navigate = useNavigate();
  const session = useSession();
  const auth = useAuth();
  const [etape, setEtape] = useState(1);
  const [bienId, setBienId] = useState("");
  const [voyageur, setVoyageur] = useState("Léa Moreau");
  const [email, setEmail] = useState("lea.moreau@email.fr");
  const [telephone, setTelephone] = useState("+33 6 12 34 56 78");
  const [arrivee, setArrivee] = useState("2026-03-12");
  const [depart, setDepart] = useState("2026-03-16");
  const [missionTitre, setMissionTitre] = useState("Ménage de bienvenue");
  const [missionHeure, setMissionHeure] = useState("10:00");
  const [nouveauBien, setNouveauBien] = useState("");

  const bien = session.biens.find((b) => b.id === bienId) ?? session.biens[0];

  const creer = () => {
    if (!bien) {
      toastErreur("Ajoutez un bien avant de créer une réservation.");
      return;
    }
    if (!voyageur.trim() || !email.trim() || !telephone.trim() || !arrivee || !depart) {
      toastErreur("Renseignez le voyageur, le contact et les dates.");
      return;
    }
    if (depart <= arrivee) {
      toastErreur("Le départ doit être après l'arrivée.");
      return;
    }
    const id = idNouveau("r");
    const initiales = voyageur
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
    const nuits = Math.max(1, nuitsEntre(arrivee, depart));
    ajouterReservation({
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
    });
    ajouterMission({
      id: idNouveau("ms"),
      bienId: bien.id,
      date: arrivee,
      titre: missionTitre.trim() || "Ménage de bienvenue",
      type: "Menage",
      emoji: "🧹",
      heure: missionHeure,
      assigne: "Amélie Dubois",
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

  return (
    <AppShell titre="Je débute" sousTitre="Trois étapes pour lancer votre première location">
      <div className="mx-auto max-w-[720px]">
        <section className="mb-4 rounded-card border border-line bg-white p-5">
          <h2 className="text-sm font-medium text-ink">Ma fiche</h2>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-ink-muted">Nom</dt>
              <dd className="text-ink">{auth ? `${auth.prenom} ${auth.nom}` : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Téléphone</dt>
              <dd className="text-ink">+33 6 12 45 78 90</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">E-mail</dt>
              <dd className="text-ink">{auth?.email ?? "—"}</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/profil"
              className="inline-flex h-9 items-center rounded-card bg-accent-teal px-4 text-sm font-medium text-white"
            >
              Je remplis ma fiche
            </Link>
            <p className="inline-flex items-center gap-1 text-xs text-ink-muted">
              <FileText className="size-3.5" /> Mes documents reçus : pièce d'identité, RIB
            </p>
          </div>
        </section>

        <ol className="mb-6 flex flex-wrap gap-2">
          {ETAPES.map((e) => (
            <li key={e.n} className="flex min-w-0 flex-1 basis-full items-center gap-2 sm:basis-0">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                  etape >= e.n ? "bg-ink text-white" : "bg-surface-soft text-ink-muted",
                )}
              >
                {etape > e.n ? <Check className="size-3.5" /> : e.n}
              </span>
              <span className={cn("min-w-0 text-xs", etape >= e.n ? "text-ink" : "text-ink-muted")}>
                {e.titre}
              </span>
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
                Séjour direct sur {bien?.nom ?? "votre bien"}. Les dates s’affichent ensuite dans le
                planning.
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
                Un ménage le jour de l’arrivée, assigné à Amélie Dubois — comme dans la maquette.
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
                    (!voyageur.trim() || !email.trim() || !telephone.trim() || !arrivee || !depart)
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
      </div>
    </AppShell>
  );
}
