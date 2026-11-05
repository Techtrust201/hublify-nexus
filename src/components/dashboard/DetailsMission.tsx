// SOURCE: Hublify V1.0 — panneau En détails (Vue générale, clic mission)

import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, ClipboardList } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth, useDroit } from "@/auth/auth-context";
import { CreatePrestationDialog } from "@/components/dashboard/CreatePrestationDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MissionMo1 } from "@/data/planning-mo1";
import { formatMontant, pourcentagePaiement } from "@/data/reservations-mo1";
import { useFichesLieu } from "@/data/patrimoine-fiche";
import {
  affecterMission,
  ajouterNotif,
  enregistrerEncaissement,
  modifierMission,
  modifierReservation,
  retirerMission,
  useSession,
} from "@/data/session";
import { METHODES_PAIEMENT } from "@/data/v1-metier";
import { confirmer, toastOk } from "@/lib/feedback";
import {
  LIBELLES_ENVOI,
  descriptionVisible,
  ecrireDescription,
  lireMetaPrestation,
  type EnvoiPrestation,
} from "@/lib/gestionnaire-planning";
import { cn, useSessionBool } from "@/lib/utils";

const ENVOIS: EnvoiPrestation[] = ["envoyee", "validee", "refusee", "en_attente"];

function jourFr(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export function DetailsMission({
  mission,
  onFermer,
}: {
  mission: MissionMo1;
  onFermer?: (() => void) | undefined;
}) {
  const session = useSession();
  const auth = useAuth();
  const peutMod = useDroit("mod-missions");
  const peutResa = useDroit("mod-reservations");
  const { fiches } = useFichesLieu();
  const [ouvert, setOuvert] = useSessionBool("hublify.accordeon.en-details", true);
  const [edition, setEdition] = useState(false);
  const [montant, setMontant] = useState("");
  const [methode, setMethode] = useState("Virement");
  const [attribution, setAttribution] = useState("Prestation");
  const [upsellOuvert, setUpsellOuvert] = useState(false);
  const [voirDetail, setVoirDetail] = useState(false);
  const live = session.missions.find((m) => m.id === mission.id);

  useEffect(() => {
    setOuvert(true);
  }, [mission.id, setOuvert]);

  if (!live) return null;
  const meta = lireMetaPrestation(live.description);
  const envoi: EnvoiPrestation = meta.envoi ?? "en_attente";
  const bien = session.biens.find((b) => b.id === live.bienId);
  const bienNom = bien?.nom ?? live.bienId;
  const presta = session.prestataires.find((p) => p.nom === live.assigne);
  const resa =
    (meta.reservationId
      ? session.reservationsDossier.find((r) => r.id === meta.reservationId)
      : undefined) ??
    session.reservationsDossier.find(
      (r) =>
        r.statut !== "Annulé" &&
        r.bienId === live.bienId &&
        r.arrivee <= live.date &&
        r.depart >= live.date,
    );
  const fiche = fiches[live.bienId];
  const couchages =
    fiche?.espaces.flatMap((espace) =>
      espace.lits.map((lit) => ({
        nom: espace.nom || "Chambre",
        detail: lit.configurations?.[0] || `${lit.quantite} × ${lit.type}`,
      })),
    ) ?? [];
  const catalogue = session.parametrage.upsells.filter((u) => u.actif);
  const choisis = resa?.upsellIds ?? [];
  const upsells = catalogue.filter((u) => choisis.includes(u.id));
  const upsellsMontant = upsells.reduce((s, u) => s + u.prix, 0);
  const paye = resa?.paye ?? 0;
  const du = resa?.montant ?? 0;
  const pct = resa ? pourcentagePaiement(resa) : 0;
  const note = meta.note ?? descriptionVisible(live.description);

  const poserMeta = (patch: Partial<typeof meta>, statut?: MissionMo1["statut"]) => {
    const suivant = ecrireDescription(descriptionVisible(live.description), { ...meta, ...patch });
    modifierMission(live.id, {
      description: suivant,
      ...(statut ? { statut } : {}),
    });
  };

  const changerEnvoi = (valeur: EnvoiPrestation) => {
    const statut: MissionMo1["statut"] =
      valeur === "validee" ? "terminee" : valeur === "envoyee" ? "en_cours" : "a_faire";
    poserMeta({ envoi: valeur }, statut);
    toastOk(LIBELLES_ENVOI[valeur]);
  };

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3"
        onClick={() => setOuvert((o) => !o)}
      >
        <span className="flex items-center gap-2 text-sm text-ink">
          <ClipboardList className="size-4" />
          En détails
        </span>
        {ouvert ? (
          <ChevronUp className="size-4 text-ink-muted" />
        ) : (
          <ChevronDown className="size-4 text-ink-muted" />
        )}
      </button>
      {ouvert && (
        <div className="border-t border-surface-soft px-4 pb-4">
          <div className="flex flex-wrap items-center gap-2 py-3">
            <span className="inline-flex h-8 items-center rounded-full bg-surface-soft px-3 text-xs text-ink">
              {bienNom}
            </span>
            <span className="inline-flex h-8 items-center rounded-full bg-[#d9dde3] px-3 text-xs font-medium text-ink">
              {live.assigne || "Équipe"}
            </span>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger className="inline-flex h-8 items-center gap-1 rounded-full bg-ink px-3 text-xs text-white outline-none">
                {LIBELLES_ENVOI[envoi]}
                <ChevronDown className="size-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {ENVOIS.map((id) => (
                  <DropdownMenuItem key={id} onSelect={() => peutMod && changerEnvoi(id)}>
                    {LIBELLES_ENVOI[id]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="inline-flex h-8 items-center rounded-full border border-line px-3 text-xs text-ink-body">
              {resa ? "Réservation" : "Sans réservation"}
            </span>
            <span className="inline-flex h-8 items-center rounded-full border border-line px-3 text-xs text-ink-body">
              {resa?.type === "Location saisonnière" || !resa?.type ? "Saisonnière" : resa.type}
            </span>
            {peutMod && (
              <button
                type="button"
                className="ml-auto inline-flex h-8 items-center rounded-full border border-line px-3 text-xs text-ink-body"
                onClick={async () => {
                  const ok = await confirmer({
                    titre: "Supprimer cette mission ?",
                    description: `${live.titre} disparaît du calendrier.`,
                    libelleConfirmer: "Supprimer",
                    danger: true,
                  });
                  if (!ok) return;
                  retirerMission(live.id);
                  onFermer?.();
                  toastOk("Mission supprimée.");
                }}
              >
                Supprimer
              </button>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Carte
              label="Début"
              valeur={jourFr(resa?.arrivee ?? live.date)}
              extra={resa?.heureArrivee ?? live.heure}
            />
            <Carte
              label="Fin"
              valeur={jourFr(resa?.depart ?? live.date)}
              extra={resa?.heureDepart ?? ""}
            />
            <Carte
              label="Prestataire"
              valeur={live.assigne || "Non assigné"}
              extra={presta?.telephone ? `tél : ${presta.telephone}` : "téléphone non renseigné"}
            />
            <div className="rounded-2xl border border-line p-3">
              <p className="text-xs text-ink-muted">Configuration couchages</p>
              {couchages.length === 0 ? (
                <p className="mt-2 text-xs text-ink-subtle">
                  Aucun couchage.{" "}
                  <Link to="/patrimoines" className="font-medium text-accent-teal">
                    Renseigner la fiche
                  </Link>
                </p>
              ) : (
                <ul className="mt-2 space-y-1 text-xs text-ink">
                  {couchages.slice(0, 4).map((c) => (
                    <li key={`${c.nom}-${c.detail}`}>
                      {c.nom} · {c.detail}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Carte label="Email gestionnaire" valeur={auth?.email ?? "—"} />
            <Carte label="Téléphone gestionnaire" valeur={presta?.telephone || "Non renseigné"} />
          </div>

          <div className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-ink-muted">Paiement de la prestation</p>
              <button
                type="button"
                onClick={() => setVoirDetail((v) => !v)}
                className="inline-flex h-7 items-center rounded-full border border-line px-3 text-xs text-ink-body"
              >
                Détails
              </button>
            </div>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              <Barre
                label={`Caution payée : ${formatMontant(resa?.caution ?? 0)}`}
                pct={resa?.caution ? 100 : 0}
                classe="bg-[#f3b4b4]"
              />
              <Barre
                label={`Loyer payé : ${formatMontant(paye)} / ${formatMontant(du)}`}
                pct={pct}
                classe="bg-gest-barre-verte"
              />
              <Barre
                label={`Upsells payés : ${formatMontant(upsellsMontant)}`}
                pct={upsellsMontant > 0 ? 100 : 0}
                classe="bg-gest-barre-verte"
              />
            </div>
            {resa && (
              <div className="mt-3 grid gap-2 text-xs text-ink-body sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-surface-soft p-3">
                  <p>Paiement de la location : {formatMontant(du)}</p>
                  <p>Frais ménage : {formatMontant(resa.fraisMenage ?? 0)}</p>
                  <p className="mt-2 font-medium">Total location : {formatMontant(du)}</p>
                </div>
                <div className="rounded-xl bg-surface-soft p-3">
                  <p>Frais de gestion facturés</p>
                  <p>Ménage : {formatMontant(resa.fraisMenage ?? 0)}</p>
                  <p>Commission : {formatMontant(resa.commissionMontant ?? 0)}</p>
                </div>
                <div className="rounded-xl bg-surface-soft p-3">
                  <p>Upsells : {formatMontant(upsellsMontant)}</p>
                  <p className="mt-2 font-medium">
                    Total upsells : {formatMontant(upsellsMontant)}
                  </p>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    className="h-10 w-full rounded-gest-primaire bg-gest-primaire text-sm font-medium text-white"
                    onClick={() => toastOk("Demande de paiement enregistrée sur le séjour.")}
                  >
                    Demander un paiement
                  </button>
                </div>
              </div>
            )}
            {voirDetail && resa && (
              <p className="mt-2 text-xs text-ink-muted">
                Séjour {formatMontant(paye)} / {formatMontant(du)} · suppléments{" "}
                {formatMontant(upsellsMontant)}
              </p>
            )}
          </div>

          <div className="mt-4">
            <p className="text-xs text-ink-muted">Upsells</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {upsells.map((u) => (
                <span
                  key={u.id}
                  className="inline-flex h-7 items-center gap-1 rounded-full border border-line px-2 text-xs"
                >
                  {u.nom}
                  {peutResa && resa && (
                    <button
                      type="button"
                      aria-label={`Retirer ${u.nom}`}
                      onClick={() =>
                        modifierReservation(resa.id, {
                          upsellIds: choisis.filter((id) => id !== u.id),
                        })
                      }
                      className="px-1 text-ink-muted"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
              {peutResa && resa && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUpsellOuvert((v) => !v)}
                    className="inline-flex h-7 items-center rounded-full border border-dashed border-line px-3 text-xs text-ink-body"
                  >
                    + Ajouter Upsells
                  </button>
                  {upsellOuvert && (
                    <ul className="absolute z-dropdown mt-1 max-h-48 w-56 overflow-auto rounded-xl border border-line bg-white p-1 shadow-md">
                      {catalogue
                        .filter((u) => !choisis.includes(u.id))
                        .map((u) => (
                          <li key={u.id}>
                            <button
                              type="button"
                              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs hover:bg-surface"
                              onClick={() => {
                                modifierReservation(resa.id, { upsellIds: [...choisis, u.id] });
                                setUpsellOuvert(false);
                              }}
                            >
                              <span>{u.nom}</span>
                              <span>{u.prix} €</span>
                            </button>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {peutResa && resa && (
            <form
              className="mt-4 flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const valeur = Number(montant.replace(",", "."));
                if (!Number.isFinite(valeur) || valeur <= 0) return;
                enregistrerEncaissement(resa.id, resa.paye + valeur, {
                  methode,
                  reference: attribution,
                  ajoutePar: auth ? `${auth.prenom} ${auth.nom}` : "Gestionnaire",
                });
                setMontant("");
                toastOk("Paiement enregistré.");
              }}
            >
              <p className="basis-full text-xs text-ink-muted">
                Ajouter un paiement pour la prestation manuellement
              </p>
              <label className="text-xs text-ink-muted">
                Montant
                <input
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  inputMode="decimal"
                  placeholder="000€"
                  className="mt-1 h-9 w-28 rounded-full border border-line px-3 text-sm text-ink outline-none"
                />
              </label>
              <label className="text-xs text-ink-muted">
                Méthode
                <select
                  value={methode}
                  onChange={(e) => setMethode(e.target.value)}
                  className="mt-1 h-9 rounded-full border border-line bg-white px-3 text-sm text-ink outline-none"
                >
                  {METHODES_PAIEMENT.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-ink-muted">
                Attribution
                <select
                  value={attribution}
                  onChange={(e) => setAttribution(e.target.value)}
                  className="mt-1 h-9 rounded-full border border-line bg-white px-3 text-sm text-ink outline-none"
                >
                  <option>Prestation</option>
                  <option>Séjour</option>
                  <option>Caution</option>
                </select>
              </label>
              <button
                type="submit"
                className="h-9 rounded-full bg-accent-teal px-4 text-xs font-medium text-white"
              >
                Enregistrer paiement
              </button>
            </form>
          )}

          <div className="mt-4 space-y-1 text-xs text-ink-body">
            <p className="font-medium text-ink">Time line</p>
            <p>Ouverture espace locataire : {resa ? jourFr(resa.arrivee) : "—"}</p>
            <p>Transfert du lien de réservation : {resa ? resa.email : "—"}</p>
            <p>Réception et activation le : {resa?.heureArrivee ?? live.heure}</p>
            <p>
              Pré-checkin effectué le :{" "}
              {resa?.precheckinStatut === "fait" ? jourFr(resa.arrivee) : "en attente"}
            </p>
            <p>Mise à jour et transfert des informations : {LIBELLES_ENVOI[envoi]}</p>
          </div>
          {peutMod && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="block text-xs text-ink-muted">
                Note du voyageur
                <textarea
                  key={`${live.id}-voy`}
                  defaultValue={meta.noteVoyageur ?? ""}
                  onBlur={(e) => {
                    if (e.target.value === (meta.noteVoyageur ?? "")) return;
                    poserMeta({ noteVoyageur: e.target.value });
                    toastOk("Note du voyageur enregistrée.");
                  }}
                  rows={3}
                  className="mt-1 w-full rounded-2xl border border-line bg-surface-soft px-3 py-2 text-sm text-ink outline-none"
                />
              </label>
              <label className="block text-xs text-ink-muted">
                Note interne
                <textarea
                  key={`${live.id}-int`}
                  defaultValue={meta.noteInterne ?? note}
                  onBlur={(e) => {
                    if (e.target.value === (meta.noteInterne ?? note)) return;
                    poserMeta({ noteInterne: e.target.value, note: e.target.value });
                    toastOk("Note interne enregistrée.");
                  }}
                  rows={3}
                  className="mt-1 w-full rounded-2xl border border-line bg-surface-soft px-3 py-2 text-sm text-ink outline-none"
                />
              </label>
            </div>
          )}

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="h-9 rounded-full bg-accent-teal px-4 text-xs font-medium text-white"
              onClick={() => {
                poserMeta({ marketplace: true });
                ajouterNotif({
                  titre: "Mission proposée sur la marketplace",
                  detail: live.titre,
                  href: `/missions/${live.id}`,
                });
                toastOk("Mission proposée sur la marketplace.");
              }}
            >
              {meta.marketplace ? "Déjà sur la marketplace" : "Proposer sur le marketplace"}
            </button>
            <button
              type="button"
              className="h-9 rounded-full bg-accent-teal px-4 text-xs font-medium text-white"
              onClick={() => {
                if (presta) affecterMission(live.id, presta.nom);
                poserMeta({ signifiee: true, envoi: "envoyee" }, "en_cours");
                ajouterNotif({
                  titre: "Mission signifiée au prestataire",
                  detail: `${live.titre} · ${live.assigne || "non assigné"}`,
                  href: `/missions/${live.id}`,
                });
                toastOk("Le prestataire est prévenu.");
              }}
            >
              Signifier la mission au prestataire
            </button>
            <button
              type="button"
              onClick={() => setEdition(true)}
              className="h-9 rounded-full bg-accent-teal px-4 text-xs font-medium text-white"
            >
              Éditer la mission
            </button>
          </div>
        </div>
      )}
      <CreatePrestationDialog
        ouvert={edition}
        onFermer={() => setEdition(false)}
        bienId={live.bienId}
        date={live.date}
        mission={live}
      />
    </section>
  );
}

function Carte({ label, valeur, extra }: { label: string; valeur: string; extra?: string }) {
  return (
    <div className="rounded-2xl border border-line p-3">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 text-sm text-ink">{valeur}</p>
      {extra ? <p className="text-xs text-ink-subtle">{extra}</p> : null}
    </div>
  );
}

function Barre({ label, pct, classe }: { label: string; pct: number; classe: string }) {
  return (
    <div className="relative h-8 overflow-hidden rounded-full bg-surface-soft">
      <div
        className={cn("absolute inset-y-0 left-0", classe)}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
      <p className="relative flex h-full items-center px-3 text-xs text-ink">{label}</p>
    </div>
  );
}
