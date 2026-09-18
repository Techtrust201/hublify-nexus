import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Clock, Eye, Mail, Percent } from "lucide-react";
import { useState, useEffect } from "react";
import { ApercuDocumentDialog } from "@/components/documents/ApercuDocument";
import { BtnNavy, BtnOutline } from "@/components/documents/ui";
import { AppShell } from "@/components/layout/AppShell";
import { EcranAttente } from "@/components/layout/EcranAttente";
import { ScrollHint } from "@/components/layout/ScrollHint";
import { ajouterDocument } from "@/data/documents-store";
import type { DocMo1 } from "@/data/documents-mo1";
import { formatMontant } from "@/data/reservations-mo1";
import {
  idNouveau,
  modifierCandidature,
  ouvrirConversationProspect,
  upsertDossierLocation,
  useSession,
  useSessionChargee,
  validerCandidature,
  validerDepartDossier,
} from "@/data/session";
import { dossierArchiveSeuleLigne } from "@/data/v1-metier";
import { completerDossiersCanon } from "@/data/etat-canon";
import { telechargerPdf, toastErreur, toastOk } from "@/lib/feedback";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dossiers/$occupantId")({
  head: () => ({ meta: [{ title: "Dossier locataire — Hublify" }] }),
  component: PageDossierLocataire,
});

function PageDossierLocataire() {
  const { occupantId } = Route.useParams();
  const navigate = useNavigate();
  const session = useSession();
  const chargee = useSessionChargee();
  const occupant = session.occupants.find((o) => o.id === occupantId);
  const [apercu, setApercu] = useState<DocMo1 | null>(null);
  const dossier = occupant
    ? (session.dossiersLocation.find((d) => d.occupantId === occupant.id) ??
      session.dossiersLocation.find((d) => d.email.toLowerCase() === occupant.email.toLowerCase()))
    : undefined;

  useEffect(() => {
    if (!dossier) return;
    const maj = completerDossiersCanon([dossier]).changes[0];
    if (maj) upsertDossierLocation(maj);
  }, [dossier]);

  if (!occupant) {
    if (!chargee) return <EcranAttente titre="Dossier locataire" />;
    throw notFound();
  }
  const resas = session.reservationsDossier.filter(
    (r) => r.occupant.toLowerCase() === occupant.nom.toLowerCase() && r.statut !== "Annulé",
  );
  const nomOccupant = occupant.nom.trim().toLowerCase();
  const docs = session.documents.filter((d) => d.titre.toLowerCase().includes(nomOccupant));
  const loyers = session.loyers.filter((l) => l.locataire.toLowerCase() === occupant.nom.toLowerCase());
  const historiqueSeul = dossierArchiveSeuleLigne(dossier);
  const candidatures = session.candidatures.filter((c) => !dossier || c.dossierId === dossier.id);
  const accord = session.partagesDossier.some(
    (p) => (!dossier || p.dossierId === dossier.id) && p.autorise === true,
  );
  const bien = session.biens.find(
    (b) =>
      b.nom.toLowerCase() === occupant.logement.toLowerCase() ||
      resas.some((r) => r.bienId === b.id),
  );
  const loyerRef = loyers[0]?.montant ?? 0;
  const tauxEffort =
    dossier?.revenus && dossier.revenus > 0 && loyerRef > 0
      ? Math.round((loyerRef / dossier.revenus) * 1000) / 10
      : null;
  const convExistante = session.conversations.find(
    (c) => c.nom.toLowerCase() === occupant.nom.toLowerCase(),
  );

  const ouvrirMessage = () => {
    if (convExistante) {
      void navigate({ to: "/messagerie", search: { conv: convExistante.id } });
      return;
    }
    const id = ouvrirConversationProspect({
      nom: occupant.nom,
      extrait: `Dossier ${occupant.logement}`,
      bienNom: occupant.logement,
      type: "locataire",
    });
    void navigate({ to: "/messagerie", search: { conv: id } });
  };

  const ouvrirApercu = (doc: DocMo1) => {
    if (!accord) {
      toastErreur("Accès documents en attente de l'accord du locataire.");
      return;
    }
    setApercu(doc);
  };

  const pieces = dossier?.pieces ?? [];

  return (
    <AppShell titre={`Dossier · ${occupant.nom}`} sousTitre={occupant.logement}>
      <Link to="/occupants" className="text-xs text-ink-muted hover:text-ink">
        ← Occupants
      </Link>
      {historiqueSeul && (
        <p className="mt-3 rounded-card border border-line bg-surface px-3 py-2 text-xs text-ink-muted">
          Accès documents expiré : seule la ligne d'historique reste visible.
        </p>
      )}
      {dossier?.departDeclare && !dossier.departValide && (
        <section className="mt-4 rounded-card border border-line bg-white p-4">
          <h2 className="text-sm font-medium text-ink">Départ déclaré</h2>
          <p className="mt-1 text-sm text-ink-body">Date demandée : {dossier.departDeclare}</p>
          <button
            type="button"
            className="mt-2 inline-flex h-11 items-center rounded-card bg-ink px-3 text-xs font-medium text-white"
            onClick={() => {
              if (!validerDepartDossier(dossier.id, dossier.departDeclare ?? "")) {
                return;
              }
              const date = new Date().toLocaleDateString("fr-FR");
              ajouterDocument({
                id: idNouveau("doc"),
                titre: `État des lieux de sortie — ${occupant.nom}`,
                type: "États des lieux",
                filtre: "États des lieux",
                logement: occupant.logement,
                date,
                taille: "PDF",
                modifiePar: "Vous",
                photos: 0,
                vue: "logements",
              });
              ajouterDocument({
                id: idNouveau("doc"),
                titre: `Quittance de solde — ${occupant.nom}`,
                type: "Quittances",
                filtre: "Quittances",
                logement: occupant.logement,
                date,
                taille: "PDF",
                modifiePar: "Vous",
                photos: 0,
                vue: "residents",
                occupant: "locataires",
              });
              void telechargerPdf(`Sortie ${occupant.nom}`, [
                `État des lieux de sortie`,
                `Quittance de solde`,
                `Date de départ : ${dossier.departDeclare}`,
                occupant.logement,
              ]);
              toastOk("Départ validé. Documents de sortie et les deux calendriers sont à jour.");
            }}
          >
            Valider et générer les documents de sortie
          </button>
        </section>
      )}
      {dossier?.departValide && dossier.departDeclare && (
        <p className="mt-3 text-xs text-ink-muted">Départ validé le {dossier.departDeclare}.</p>
      )}

      <section className="mt-4 rounded-card border border-line bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg text-ink">{occupant.nom}</p>
            <p className="mt-1 text-sm text-ink-muted">{occupant.logement}</p>
          </div>
          <a href={`mailto:${occupant.email}`} className="break-all text-sm text-accent-teal">
            {occupant.email}
          </a>
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-ink-muted">Nom</dt>
            <dd className="mt-1 text-sm text-ink">{occupant.nom}</dd>
          </div>
          <div>
            <dt className="text-sm text-ink-muted">Téléphone</dt>
            <dd className="mt-1 text-sm text-ink">{occupant.telephone}</dd>
          </div>
          <div>
            <dt className="text-sm text-ink-muted">Situation familiale</dt>
            <dd className="mt-1 text-sm text-ink">{dossier?.situationFamiliale || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-ink-muted">Situation professionnelle</dt>
            <dd className="mt-1 text-sm text-ink">{dossier?.situationProfessionnelle || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-ink-muted">Revenus</dt>
            <dd className="mt-1 text-sm text-ink">
              {dossier?.revenus != null ? formatMontant(dossier.revenus) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-ink-muted">RFR</dt>
            <dd className="mt-1 text-sm text-ink">
              {dossier?.rfr != null ? formatMontant(dossier.rfr) : "—"}
            </dd>
          </div>
        </dl>
        {dossier?.aPropos && (
          <div className="mt-6">
            <h3 className="text-lg text-ink">À propos</h3>
            <p className="mt-3 text-sm leading-6 text-ink-body">{dossier.aPropos}</p>
          </div>
        )}
        {dossier && (
          <p className="mt-4 text-xs text-ink-muted">
            Dossier {dossier.statut}
            {dossier.archiveLe
              ? ` · archivé le ${dossier.archiveLe} (accès documents 1 à 2 ans)`
              : ""}
          </p>
        )}
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]">
        <div className="min-w-0 space-y-4">
          {!historiqueSeul && (
            <section className="rounded-card border border-line bg-white p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg text-ink">Documents</h3>
                {!accord && (
                  <span className="rounded-full bg-chip-warning px-3 py-1 text-xs text-chip-warning-fg">
                    En attente d'accord
                  </span>
                )}
              </div>
              {!accord && (
                <p className="mt-2 text-xs text-ink-muted">
                  Les fichiers restent fermés tant que le locataire n'a pas donné son accord.
                </p>
              )}
              <ul className="mt-4 divide-y divide-surface-soft text-sm">
                {pieces.map((p) => {
                  const statut = p.present ? "Vérifié" : "En attente";
                  return (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3"
                    >
                      <span className="flex min-w-0 flex-1 basis-40 items-center gap-2 text-ink">
                        {p.present ? (
                          <CheckCircle2 className="size-5 shrink-0 text-chip-success-fg" />
                        ) : (
                          <Clock className="size-5 shrink-0 text-chip-warning-fg" />
                        )}
                        <span className="min-w-0 break-words">{p.titre}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span
                          className={cn(
                            "whitespace-nowrap rounded-full px-3 py-1 text-xs",
                            p.present
                              ? "bg-chip-success text-chip-success-fg"
                              : "bg-chip-warning text-chip-warning-fg",
                          )}
                        >
                          {statut}
                        </span>
                        <button
                          type="button"
                          aria-label={`Voir ${p.titre}`}
                          disabled={!accord}
                          className="flex size-11 shrink-0 items-center justify-center rounded-card text-ink-body disabled:opacity-40 md:size-8"
                          onClick={() => {
                            if (!p.present) {
                              toastErreur("Pièce manquante — aperçu indisponible.");
                              return;
                            }
                            ouvrirApercu({
                              id: p.id,
                              titre: p.titre,
                              type: p.type,
                              filtre: "Dossiers",
                              logement: occupant.logement,
                              date: "",
                              taille: "PDF",
                              modifiePar: occupant.nom,
                              photos: 0,
                              vue: "residents",
                              occupant: "locataires",
                            });
                          }}
                        >
                          <Eye className="size-4" />
                        </button>
                      </span>
                    </li>
                  );
                })}
                {docs.map((d) => (
                  <li
                    key={d.id}
                    className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3"
                  >
                    <span className="flex min-w-0 flex-1 basis-40 items-center gap-2 text-ink">
                      <CheckCircle2 className="size-5 shrink-0 text-chip-success-fg" />
                      <button
                        type="button"
                        className="min-w-0 break-words text-left hover:underline"
                        onClick={() => ouvrirApercu(d)}
                      >
                        {d.titre}
                      </button>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="whitespace-nowrap rounded-full bg-chip-success px-3 py-1 text-xs text-chip-success-fg">
                        Vérifié
                      </span>
                      <button
                        type="button"
                        aria-label={`Voir ${d.titre}`}
                        disabled={!accord}
                        className="flex size-11 shrink-0 items-center justify-center rounded-card text-ink-body disabled:opacity-40 md:size-8"
                        onClick={() => ouvrirApercu(d)}
                      >
                        <Eye className="size-4" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
              {pieces.length === 0 && docs.length === 0 && (
                <p className="mt-2 text-sm text-ink-muted">Aucune pièce déposée.</p>
              )}
              {dossier?.garants.map((g) => (
                <p key={g.id} className="mt-3 text-xs text-ink-muted">
                  Garant : {g.type === "institutionnel" ? `${g.organisme} (${g.numeroDossier})` : g.nom}
                </p>
              ))}
            </section>
          )}

          <section className="rounded-card border border-line bg-white p-4 sm:p-6">
            <h3 className="text-lg text-ink">Historique des paiements</h3>
            <div className="mt-4 divide-y divide-surface-soft md:hidden">
              {loyers.map((l) => (
                <div key={l.id} className="py-3">
                  <p className="text-sm text-ink">{l.bienNom}</p>
                  <p className="text-xs text-ink-muted">{l.echeance}</p>
                  <p className="mt-1 text-sm font-medium text-ink">
                    {formatMontant(l.montant)} · {l.valide ? "Payé" : "En attente"}
                  </p>
                </div>
              ))}
              {resas
                .filter((r) => r.paye > 0)
                .map((r) => (
                  <div key={`pay-m-${r.id}`} className="py-3">
                    <p className="text-sm text-ink">
                      Séjour · {r.plateforme}
                    </p>
                    <p className="text-xs text-ink-muted">{r.arrivee}</p>
                    <p className="mt-1 text-sm font-medium text-ink">
                      {formatMontant(r.paye)} · {r.paye >= r.montant ? "Payé" : "Partiel"}
                    </p>
                  </div>
                ))}
            </div>
            <ScrollHint className="mt-4 hidden md:block">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="text-xs text-ink-subtle">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Libellé</th>
                    <th className="px-4 py-3 font-medium">Montant</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {loyers.map((l) => (
                    <tr key={l.id} className="border-t border-surface-soft">
                      <td className="px-4 py-3 text-ink">{l.echeance}</td>
                      <td className="px-4 py-3 text-ink-body">Loyer · {l.bienNom}</td>
                      <td className="px-4 py-3 font-medium text-ink">{formatMontant(l.montant)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs",
                            l.valide
                              ? "bg-chip-success text-chip-success-fg"
                              : "bg-chip-warning text-chip-warning-fg",
                          )}
                        >
                          {l.valide ? "Payé" : "En attente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {resas
                    .filter((r) => r.paye > 0)
                    .map((r) => (
                      <tr key={`pay-${r.id}`} className="border-t border-surface-soft">
                        <td className="px-4 py-3 text-ink">{r.arrivee}</td>
                        <td className="px-4 py-3 text-ink-body">
                          Séjour · {r.plateforme} · {r.id.slice(-6)}
                        </td>
                        <td className="px-4 py-3 font-medium text-ink">{formatMontant(r.paye)}</td>
                        <td className="px-4 py-3">
                          {r.paye >= r.montant ? "Payé" : "Partiel"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </ScrollHint>
            {loyers.length === 0 && resas.every((r) => r.paye <= 0) && (
              <p className="mt-2 text-sm text-ink-muted">Aucun paiement.</p>
            )}
          </section>

          <section className="rounded-card border border-line bg-white p-4 sm:p-6">
            <h3 className="text-lg text-ink">Historique de location</h3>
            <div className="mt-4 divide-y divide-surface-soft md:hidden">
              {resas.map((r) => {
                const bienResa = session.biens.find((b) => b.id === r.bienId);
                return (
                  <div key={`loc-m-${r.id}`} className="py-3">
                    <p className="text-sm text-ink">{bienResa?.nom ?? occupant.logement}</p>
                    <p className="text-xs text-ink-muted">
                      {r.arrivee} → {r.depart} · {r.type ?? "Séjour"}
                    </p>
                    <p className="mt-1 text-sm font-medium text-ink">{formatMontant(r.montant)}</p>
                  </div>
                );
              })}
            </div>
            <ScrollHint className="mt-4 hidden md:block">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="text-xs text-ink-subtle">
                  <tr>
                    <th className="px-4 py-3 font-medium">Période</th>
                    <th className="px-4 py-3 font-medium">Logement</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 text-right font-medium">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {resas.map((r) => {
                    const bienResa = session.biens.find((b) => b.id === r.bienId);
                    return (
                      <tr key={r.id} className="border-t border-surface-soft">
                        <td className="px-4 py-3">
                          {r.arrivee} → {r.depart}
                        </td>
                        <td className="px-4 py-3">{bienResa?.nom ?? occupant.logement}</td>
                        <td className="px-4 py-3">{r.type ?? "Séjour"}</td>
                        <td className="px-4 py-3 text-right">{formatMontant(r.montant)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ScrollHint>
            {resas.length === 0 && <p className="mt-2 text-sm text-ink-muted">Aucun séjour.</p>}
          </section>
        </div>

        <div className="min-w-0 space-y-4">
          <section className="rounded-card border border-line bg-white p-4 sm:p-6">
            <h3 className="text-lg text-ink">Résumé financier</h3>
            <div className="mt-4 space-y-3">
              <div className="rounded-card bg-chip-success p-4">
                <p className="text-sm text-chip-success-fg">Total payé</p>
                <p className="mt-1 text-2xl text-ink">
                  {formatMontant(
                    loyers.filter((l) => l.valide).reduce((s, l) => s + l.montant, 0) +
                      resas.reduce((s, r) => s + r.paye, 0),
                  )}
                </p>
              </div>
              <div className="rounded-card bg-chip-warning p-4">
                <p className="text-sm text-chip-warning-fg">En attente</p>
                <p className="mt-1 text-2xl text-ink">
                  {formatMontant(loyers.filter((l) => !l.valide).reduce((s, l) => s + l.montant, 0))}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-card border border-line bg-white p-4 sm:p-6">
            <h3 className="text-lg text-ink">Actions rapides</h3>
            <div className="mt-4 flex flex-col gap-3">
              <BtnNavy className="h-11 w-full justify-center" onClick={ouvrirMessage}>
                <Mail className="size-4" /> Message
              </BtnNavy>
              <BtnOutline
                className="h-11 w-full justify-center"
                onClick={() => {
                  void navigate({
                    to: "/analyse",
                    search: bien ? { logement: bien.id } : {},
                  });
                }}
              >
                <Percent className="size-4" /> Analyser le loyer
              </BtnOutline>
            </div>
            <div className="mt-4 rounded-card bg-surface p-4">
              <p className="text-xs text-ink-muted">Taux d'effort (seuil ~33 %)</p>
              {tauxEffort == null ? (
                <p className="mt-1 text-sm text-ink-body">Revenus ou loyer manquants.</p>
              ) : (
                <>
                  <p className="mt-1 text-2xl text-ink">{tauxEffort} %</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    Loyer {formatMontant(loyerRef)} / revenus {formatMontant(dossier?.revenus ?? 0)}.{" "}
                    {tauxEffort > 33
                      ? "Au-dessus du seuil habituel."
                      : "Dans l'enveloppe habituelle."}
                  </p>
                </>
              )}
            </div>
          </section>

          {session.partagesDossier.filter((p) => !dossier || p.dossierId === dossier.id).length >
            0 && (
            <section className="rounded-card border border-line bg-white p-4 sm:p-6">
              <h3 className="text-lg text-ink">Partages et autorisations</h3>
              {session.partagesDossier
                .filter((p) => !dossier || p.dossierId === dossier.id)
                .map((p) => (
                  <p key={p.id} className="mt-2 text-sm">
                    {p.destinataire} ·{" "}
                    {p.autorise === true
                      ? "autorisé"
                      : p.autorise === false
                        ? "refusé"
                        : "en attente"}
                    {p.expireLe ? ` · expire ${p.expireLe}` : ""}
                  </p>
                ))}
            </section>
          )}

          {candidatures.length > 0 && (
            <section className="rounded-card border border-line bg-white p-4 sm:p-6">
              <h3 className="text-lg text-ink">Candidatures</h3>
              {candidatures.map((c) => {
                const bienC = session.biens.find((b) => b.id === c.bienId);
                return (
                  <div key={c.id} className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <span>
                      {bienC?.nom ?? c.bienId} · {c.arrivee} → {c.depart} · {formatMontant(c.montant)}{" "}
                      · {c.statut}
                    </span>
                    {c.statut === "proposee" && (
                      <>
                        <button
                          type="button"
                          className="text-xs text-accent-teal"
                          onClick={() => {
                            if (!validerCandidature(c.id)) return;
                            toastOk("Date validée. Les deux calendriers sont à jour.");
                          }}
                        >
                          Valider la date
                        </button>
                        <button
                          type="button"
                          className="text-xs text-ink-muted"
                          onClick={() => {
                            modifierCandidature(c.id, { statut: "refusee" });
                            toastOk("Candidature refusée.");
                          }}
                        >
                          Refuser
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </section>
          )}
        </div>
      </div>

      {dossier && !dossier.archiveLe && (
        <button
          type="button"
          onClick={() => {
            upsertDossierLocation({
              ...dossier,
              statut: "archive",
              archiveLe: new Date().toISOString().slice(0, 10),
            });
            toastOk("Dossier archivé. L'accès documents restera 1 à 2 ans.");
          }}
          className="mt-4 inline-flex h-11 items-center rounded-card border border-line px-3 text-xs"
        >
          Archiver le dossier
        </button>
      )}
      <ApercuDocumentDialog doc={apercu} onFermer={() => setApercu(null)} />
    </AppShell>
  );
}
