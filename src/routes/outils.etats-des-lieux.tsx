import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Camera, ChevronLeft, Columns2, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ajouterDocument } from "@/data/documents-store";

import {
  pairesComparaison,
  piecesModele,
  type DossierEdl,
  type EtatPiece,
  type PieceEdl,
} from "@/data/edl-mo1";
import { formatDateLongue } from "@/data/reservations-mo1";
import { poserCollection, useSession } from "@/data/session";
import { choisirFichierComplet, confirmer, exporterFichier, toastOk } from "@/lib/feedback";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/outils/etats-des-lieux")({
  head: () => ({
    meta: [{ title: "États des lieux — Hublify" }],
  }),
  component: PageEdl,
});

type Filtre = "Tous" | "Entrée" | "Sortie" | "Comparer";

function PageEdl() {
  const navigate = useNavigate();
  const session = useSession();
  const [filtre, setFiltre] = useState<Filtre>("Tous");
  const tousDossiers = session.edl;
  const setTousDossiers = (maj: Parameters<typeof poserCollection<"edl">>[1]) =>
    poserCollection("edl", maj);
  const [dossierId, setDossierId] = useState<string | null>(null);
  const [pieceId, setPieceId] = useState<string | null>(null);
  const [logementCompare, setLogementCompare] = useState<string | null>(null);
  const [creer, setCreer] = useState(false);
  const logements = session.biens.length ? session.biens.map((b) => b.nom) : ["Suzette"];
  const [form, setForm] = useState({
    logement: logements[0] ?? "Suzette",
    type: "Entrée" as DossierEdl["type"],
    occupant: "",
    date: "2026-03-05",
  });
  const dossier = tousDossiers.find((d) => d.id === dossierId) ?? null;
  const piece = dossier?.pieces.find((p) => p.id === pieceId) ?? null;
  const paires = useMemo(() => pairesComparaison(tousDossiers), [tousDossiers]);
  const paire = paires.find((p) => p.logement === logementCompare) ?? null;

  const dossiers = useMemo(
    () =>
      filtre === "Tous" || filtre === "Comparer"
        ? tousDossiers
        : tousDossiers.filter((d) => d.type === filtre),
    [filtre, tousDossiers],
  );

  const majPiece = (mut: (p: PieceEdl) => PieceEdl) => {
    if (!dossierId || !pieceId) return;
    setTousDossiers((liste) =>
      liste.map((d) =>
        d.id !== dossierId
          ? d
          : { ...d, pieces: d.pieces.map((p) => (p.id === pieceId ? mut(p) : p)) },
      ),
    );
  };

  const archiver = async (id: string) => {
    const d = tousDossiers.find((x) => x.id === id);
    if (!d) return;
    const ok = await confirmer({
      titre: `Archiver l'état des lieux ${d.type} de ${d.logement} ?`,
      description:
        "Le dossier quitte la liste de travail et devient un document dans Documents → États des lieux.",
      libelleConfirmer: "Archiver",
    });
    if (!ok) return;
    ajouterDocument({
      id: `edl-arch-${d.id}`,
      titre: `EDL ${d.type} — ${d.logement} (${d.occupant})`,
      type: "EDL",
      filtre: "États des lieux",
      logement: d.logement,
      date: formatDateLongue(d.date),
      taille: "PDF",
      modifiePar: "Vous",
      photos: d.pieces.reduce((n, p) => n + p.photos.length, 0),
      vue: "logements",
    });
    setTousDossiers((liste) => liste.filter((x) => x.id !== id));
    if (dossierId === id) {
      setDossierId(null);
      setPieceId(null);
    }
    toastOk("Dossier archivé. Ouverture de Documents → États des lieux.");
    void navigate({ to: "/documents", search: { vue: "etats" } });
  };

  const creerDossier = () => {
    const id = `edl-${Date.now()}`;
    const nouveau: DossierEdl = {
      id,
      logement: form.logement,
      type: form.type,
      occupant: form.occupant.trim() || "Occupant à préciser",
      date: form.date,
      pieces: piecesModele(id),
    };
    setTousDossiers((liste) => [nouveau, ...liste]);
    setCreer(false);
    setFiltre("Tous");
    setDossierId(id);
    setPieceId(null);
    toastOk("État des lieux créé. Complétez chaque pièce puis archivez.");
  };

  return (
    <AppShell titre="États des lieux" sousTitre="Entrée, sortie, salon, cuisine, chambre">
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-line">
        {(["Tous", "Entrée", "Sortie", "Comparer"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => {
              setFiltre(f);
              setDossierId(null);
              setPieceId(null);
              setLogementCompare(f === "Comparer" ? (paires[0]?.logement ?? null) : null);
            }}
            className={cn(
              "h-11 shrink-0 border-b-2 px-4 text-sm font-medium md:h-[46px]",
              filtre === f
                ? "border-ink bg-tab-active text-ink-deep"
                : "border-transparent text-ink-subtle",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {filtre === "Comparer" && paire && (
        <Comparaison
          paire={paire}
          logements={paires.map((p) => p.logement)}
          onLogement={setLogementCompare}
        />
      )}

      {filtre === "Comparer" && !paire && (
        <div className="rounded-card border border-line bg-white p-5">
          <p className="text-sm text-ink-body">
            Aucune paire entrée / sortie à comparer. Créez les deux dossiers pour un même logement.
          </p>
          <button
            type="button"
            onClick={() => {
              setFiltre("Tous");
              setCreer(true);
            }}
            className="mt-3 inline-flex h-11 items-center rounded-card bg-accent-teal px-3 text-xs font-medium text-white md:h-9"
          >
            Créer un état des lieux
          </button>
        </div>
      )}

      {filtre !== "Comparer" && !dossier && (
        <section className="overflow-hidden rounded-card border border-line bg-white">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-soft px-5 py-4">
            <div>
              <h2 className="text-sm font-medium text-ink">Dossiers</h2>
              <p className="text-xs text-ink-muted">
                Créer, comparer et archiver les états des lieux
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setCreer(true)}
                className="inline-flex h-11 items-center gap-1 rounded-card bg-accent-teal px-3 text-xs font-medium text-white md:h-9"
              >
                <Plus className="size-3" /> Créer
              </button>
              <Link
                to="/documents"
                search={{ vue: "etats" }}
                className="inline-flex h-11 items-center text-xs font-medium text-accent-teal md:h-9"
              >
                Documents archivés
              </Link>
            </div>
          </header>
          <ul>
            {dossiers.map((d) => (
              <li key={d.id}>
                <div className="flex items-stretch border-b border-surface-soft last:border-b-0">
                  <button
                    type="button"
                    onClick={() => {
                      setDossierId(d.id);
                      setPieceId(null);
                    }}
                    className="flex min-w-0 flex-1 items-center justify-between gap-3 px-5 py-4 text-left hover:bg-surface"
                  >
                    <span>
                      <span className="block text-sm text-ink">{d.logement}</span>
                      <span className="text-xs text-ink-muted">
                        {d.type} · {d.occupant} · {formatDateLongue(d.date)}
                      </span>
                    </span>
                    <span className="rounded border border-line px-2 py-0.5 text-xs text-ink-subtle">
                      {d.pieces.length} pièces
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => archiver(d.id)}
                    className="flex min-h-11 min-w-11 shrink-0 items-center justify-center px-4 text-xs font-medium text-ink-muted hover:bg-surface hover:text-ink"
                    aria-label={`Archiver ${d.logement} ${d.type}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {filtre !== "Comparer" && dossier && !piece && (
        <div>
          <button
            type="button"
            onClick={() => setDossierId(null)}
            className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm text-ink-body md:min-h-0"
          >
            <ChevronLeft className="size-4" /> Retour aux dossiers
          </button>
          <h2 className="text-lg text-ink">
            {dossier.logement} — {dossier.type}
          </h2>
          <p className="text-xs text-ink-muted">
            {dossier.occupant} · {formatDateLongue(dossier.date)}
          </p>
          <div className="mt-2">
            <button
              type="button"
              onClick={() => archiver(dossier.id)}
              className="inline-flex h-11 items-center rounded-card border border-line px-3 text-xs font-medium text-ink-body md:h-9"
            >
              Archiver ce dossier
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {dossier.pieces.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPieceId(p.id)}
                className="rounded-card border border-line bg-white p-4 text-left hover:bg-surface"
              >
                <p className="text-sm font-medium text-ink">{p.nom}</p>
                <p className={cn("mt-1 text-xs", classeEtat(p.etat))}>{libelleEtat(p.etat)}</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-ink-muted">
                  <Camera className="size-3" /> {p.photos.length} photos
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {filtre !== "Comparer" && dossier && piece && (
        <FichePiece
          piece={piece}
          logement={dossier.logement}
          occupant={dossier.occupant}
          date={dossier.date}
          onRetour={() => setPieceId(null)}
          onPhoto={() => {
            choisirFichierComplet((fichier) => {
              majPiece((p) => ({
                ...p,
                photos: [
                  ...p.photos,
                  {
                    id: `ph-${Date.now()}`,
                    legend: fichier.nom,
                    mime: fichier.mime,
                    base64: fichier.base64,
                  },
                ],
              }));
              toastOk(`Photo ajoutée : ${fichier.nom}`);
            });
          }}
          onValider={() => {
            majPiece((p) => ({ ...p, etat: "ok" }));
            toastOk(`${piece.nom} validé.`);
            setPieceId(null);
          }}
          onPoint={(id) => {
            majPiece((p) => ({
              ...p,
              points: p.points.map((pt) =>
                pt.id === id ? { ...pt, etat: etatSuivant(pt.etat) } : pt,
              ),
            }));
          }}
        />
      )}

      <Dialog
        open={creer && !dossierId}
        onOpenChange={(o) => {
          if (!o) setCreer(false);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogTitle>Nouvel état des lieux</DialogTitle>
          <DialogDescription>
            Créez un dossier d'entrée ou de sortie, puis renseignez chaque pièce.
          </DialogDescription>
          <label className="mt-3 block text-xs text-ink-muted">
            Logement
            <select
              value={form.logement}
              onChange={(e) => setForm((f) => ({ ...f, logement: e.target.value }))}
              className="mt-1 h-11 w-full rounded-card border border-line bg-white px-3 text-sm text-ink md:h-9"
            >
              {logements.map((nom) => (
                <option key={nom}>{nom}</option>
              ))}
            </select>
          </label>
          <label className="mt-3 block text-xs text-ink-muted">
            Type
            <select
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({ ...f, type: e.target.value as DossierEdl["type"] }))
              }
              className="mt-1 h-11 w-full rounded-card border border-line bg-white px-3 text-sm text-ink md:h-9"
            >
              <option>Entrée</option>
              <option>Sortie</option>
            </select>
          </label>
          <label className="mt-3 block text-xs text-ink-muted">
            Occupant
            <input
              value={form.occupant}
              onChange={(e) => setForm((f) => ({ ...f, occupant: e.target.value }))}
              className="mt-1 h-11 w-full rounded-card border border-line px-3 text-sm text-ink outline-none md:h-9"
              placeholder="Nom du locataire ou voyageur"
            />
          </label>
          <label className="mt-3 block text-xs text-ink-muted">
            Date
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="mt-1 h-11 w-full rounded-card border border-line px-3 text-sm text-ink outline-none md:h-9"
            />
          </label>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreer(false)}
              className="h-11 rounded-card border border-line px-4 text-sm md:h-9"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={creerDossier}
              className="h-11 rounded-card bg-accent-teal px-4 text-sm font-medium text-white md:h-9"
            >
              Créer le dossier
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Comparaison({
  paire,
  logements,
  onLogement,
}: {
  paire: { logement: string; entree: DossierEdl; sortie: DossierEdl };
  logements: string[];
  onLogement: (nom: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Columns2 className="size-4 text-ink-muted" />
        <label className="text-xs text-ink-muted">
          Logement
          <select
            value={paire.logement}
            onChange={(e) => onLogement(e.target.value)}
            className="ml-2 h-9 rounded-card border border-line bg-white px-2 text-sm text-ink"
          >
            {logements.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <p className="text-xs text-ink-muted">
          Entrée {formatDateLongue(paire.entree.date)} · Sortie{" "}
          {formatDateLongue(paire.sortie.date)}
        </p>
      </div>
      {paire.entree.pieces.map((entree) => {
        const sortie = paire.sortie.pieces.find((p) => p.nom === entree.nom);
        if (!sortie) return null;
        return (
          <section key={entree.id} className="rounded-card border border-line bg-white p-4">
            <h2 className="text-sm font-medium text-ink">{entree.nom}</h2>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <ColonneCompare titre="Entrée" piece={entree} />
              <ColonneCompare titre="Sortie" piece={sortie} />
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ColonneCompare({ titre, piece }: { titre: string; piece: PieceEdl }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">{titre}</p>
      <p className={cn("mt-1 text-sm", classeEtat(piece.etat))}>{libelleEtat(piece.etat)}</p>
      <p className="mt-1 text-xs text-ink-body">{piece.commentaire}</p>
      <ul className="mt-2 space-y-1">
        {piece.points.map((pt) => (
          <li key={pt.id} className="flex justify-between text-xs">
            <span className="text-ink-body">{pt.libelle}</span>
            <span className={classeEtat(pt.etat)}>{libelleEtat(pt.etat)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FichePiece({
  piece,
  logement,
  occupant,
  date,
  onRetour,
  onPhoto,
  onValider,
  onPoint,
}: {
  piece: PieceEdl;
  logement: string;
  occupant: string;
  date: string;
  onRetour: () => void;
  onPhoto: () => void;
  onValider: () => void;
  onPoint: (id: string) => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onRetour}
        className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm text-ink-body md:min-h-0"
      >
        <ChevronLeft className="size-4" /> Retour aux pièces
      </button>
      <article className="rounded-card border border-line bg-white p-5">
        <p className="text-xs text-ink-muted">{logement}</p>
        <h2 className="mt-1 text-lg text-ink">{piece.nom}</h2>
        <p className={cn("mt-2 text-sm", classeEtat(piece.etat))}>{libelleEtat(piece.etat)}</p>
        <p className="mt-3 text-sm text-ink-body">{piece.commentaire}</p>
        <ul className="mt-4 space-y-2">
          {piece.points.map((pt) => (
            <li
              key={pt.id}
              className="flex items-center justify-between rounded-card border border-surface-soft px-3 py-2 text-sm"
            >
              <span className="text-ink">{pt.libelle}</span>
              <button
                type="button"
                onClick={() => onPoint(pt.id)}
                className={cn(
                  "min-h-11 rounded-card px-2 text-xs font-medium md:min-h-0",
                  classeEtat(pt.etat),
                )}
              >
                {libelleEtat(pt.etat)}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-ink-muted">
          Touchez un état pour le faire passer de bon à usure, puis à réparer.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {piece.photos.map((ph) => (
            <button
              key={ph.id}
              type="button"
              onClick={() =>
                exporterFichier(
                  {
                    nom: ph.base64 ? ph.legend : `Photo ${piece.nom} — ${ph.legend}`,
                    ...(ph.mime ? { mime: ph.mime } : {}),
                    ...(ph.base64 ? { base64: ph.base64 } : {}),
                  },
                  {
                    extra: [
                      `Légende : ${ph.legend}`,
                      `Pièce : ${piece.nom}`,
                      `Logement : ${logement}`,
                      `Locataire : ${occupant}`,
                      `Date : ${date}`,
                    ],
                    adresse: logement,
                    logement,
                    locataire: occupant,
                    piece: piece.nom,
                    legende: ph.legend,
                    date,
                  },
                )
              }
              className="flex aspect-square flex-col items-center justify-center gap-1 overflow-hidden rounded-card border border-dashed border-line bg-surface text-xs text-ink-muted"
            >
              {ph.base64 && (ph.mime?.startsWith("image/") ?? false) ? (
                <img
                  src={`data:${ph.mime};base64,${ph.base64}`}
                  alt={ph.legend}
                  className="h-full w-full object-cover"
                />
              ) : (
                <>
                  <Camera className="size-4" />
                  {ph.legend}
                </>
              )}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onPhoto}
            className="h-11 rounded-card border border-line px-4 text-sm text-ink-body md:h-9"
          >
            Ajouter une photo
          </button>
          <button
            type="button"
            onClick={onValider}
            className="h-11 rounded-card bg-accent-teal px-4 text-sm font-medium text-white md:h-9"
          >
            Valider la pièce
          </button>
        </div>
      </article>
    </div>
  );
}

function etatSuivant(etat: EtatPiece): EtatPiece {
  if (etat === "ok") return "usure";
  if (etat === "usure") return "a_reparer";
  return "ok";
}

function libelleEtat(etat: EtatPiece) {
  if (etat === "ok") return "Bon état";
  if (etat === "usure") return "Usure normale";
  return "À réparer";
}

function classeEtat(etat: EtatPiece) {
  if (etat === "ok") return "text-ink-body";
  if (etat === "usure") return "text-ink-subtle";
  return "text-danger-loyer";
}
