import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronRight, Home, KeyRound, Users } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { BIENS_MO1 } from "@/data/reservations-mo1";
import { ajouterMission, ajouterNotif, ajouterReservation, idNouveau } from "@/data/session";
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
  const [etape, setEtape] = useState(1);
  const [bienId, setBienId] = useState(BIENS_MO1[0]?.id ?? "suzette");
  const [voyageur, setVoyageur] = useState("Léa Moreau");
  const [arrivee, setArrivee] = useState("2026-03-12");
  const [depart, setDepart] = useState("2026-03-16");
  const [missionTitre, setMissionTitre] = useState("Ménage de bienvenue");
  const [missionHeure, setMissionHeure] = useState("10:00");

  const bien = BIENS_MO1.find((b) => b.id === bienId) ?? BIENS_MO1[0]!;

  const creer = () => {
    if (!voyageur.trim() || !arrivee || !depart) {
      toastErreur("Renseignez le voyageur et les dates.");
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
    ajouterReservation({
      dossier: {
        id,
        bienId: bien.id,
        occupant: voyageur.trim(),
        initiales: initiales || "??",
        email: `${voyageur.trim().toLowerCase().replace(/\s+/g, ".")}@email.fr`,
        telephone: "+33 6 00 00 00 00",
        arrivee,
        depart,
        heureArrivee: "16:00",
        heureDepart: "10:00",
        plateforme: "Direct",
        voyageurs: 2,
        adultes: 2,
        enfants: 0,
        montant: 4 * 180,
        paye: 0,
        statut: "Confirmé",
        couleur: "#4f8ef7",
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
      href: "/reservations",
    });
    toastOk("Logement, réservation et mission enregistrés.");
    void navigate({ to: "/reservations" });
  };

  return (
    <AppShell titre="Je débute" sousTitre="Trois étapes pour lancer votre première location">
      <div className="mx-auto max-w-[720px]">
        <ol className="mb-6 flex gap-2">
          {ETAPES.map((e) => (
            <li key={e.n} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs font-medium",
                  etape >= e.n ? "bg-ink text-white" : "bg-surface-soft text-ink-muted",
                )}
              >
                {etape > e.n ? <Check className="size-3.5" /> : e.n}
              </span>
              <span className={cn("text-xs", etape >= e.n ? "text-ink" : "text-ink-muted")}>
                {e.titre}
              </span>
              {e.n < 3 && <ChevronRight className="ml-auto size-3.5 text-line-strong" />}
            </li>
          ))}
        </ol>

        <div className="rounded-card border border-line bg-white p-6">
          {etape === 1 && (
            <>
              <h2 className="text-base font-medium text-ink">Choisissez le logement</h2>
              <p className="mt-1 text-xs text-ink-subtle">
                Dans cette démo, les 4 biens de la maquette sont déjà créés. Sélectionnez celui que
                vous pilotez.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {BIENS_MO1.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBienId(b.id)}
                    className={cn(
                      "rounded-card border px-4 py-3 text-left",
                      bienId === b.id
                        ? "border-ink bg-surface"
                        : "border-line hover:bg-surface",
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
                Séjour direct sur {bien.nom}. Les dates s’affichent ensuite dans le planning.
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
                <li>Logement : {bien.nom}</li>
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
              <Link to="/outils" className="text-xs text-ink-subtle hover:underline">
                Retour aux outils
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setEtape((n) => n - 1)}
                className="text-xs text-ink-subtle hover:underline"
              >
                Étape précédente
              </button>
            )}
            {etape < 3 ? (
              <button
                type="button"
                onClick={() => setEtape((n) => n + 1)}
                className="inline-flex h-9 items-center rounded-card bg-ink px-4 text-xs font-medium text-white"
              >
                Continuer
              </button>
            ) : (
              <button
                type="button"
                onClick={creer}
                className="inline-flex h-9 items-center gap-1 rounded-card bg-ink px-4 text-xs font-medium text-white"
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
