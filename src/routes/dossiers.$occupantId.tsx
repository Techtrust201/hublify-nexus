import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { EcranAttente } from "@/components/layout/EcranAttente";
import { ajouterDocument } from "@/data/documents-store";
import {
  idNouveau,
  modifierCandidature,
  upsertDossierLocation,
  useSession,
  useSessionChargee,
  validerCandidature,
  validerDepartDossier,
} from "@/data/session";
import { formatMontant } from "@/data/reservations-mo1";
import { telechargerPdf, toastOk } from "@/lib/feedback";
import { dossierArchiveSeuleLigne } from "@/data/v1-metier";

export const Route = createFileRoute("/dossiers/$occupantId")({
  head: () => ({ meta: [{ title: "Dossier locataire — Hublify" }] }),
  component: PageDossierLocataire,
});

function PageDossierLocataire() {
  const { occupantId } = Route.useParams();
  const session = useSession();
  const chargee = useSessionChargee();
  const occupant = session.occupants.find((o) => o.id === occupantId);

  if (!occupant) {
    if (!chargee) return <EcranAttente titre="Dossier locataire" />;
    throw notFound();
  }

  const dossier =
    session.dossiersLocation.find((d) => d.occupantId === occupant.id) ??
    session.dossiersLocation.find((d) => d.email.toLowerCase() === occupant.email.toLowerCase());
  const resas = session.reservationsDossier.filter(
    (r) => r.occupant.toLowerCase() === occupant.nom.toLowerCase(),
  );
  const docs = session.documents.filter(
    (d) =>
      d.logement.toLowerCase() === occupant.logement.toLowerCase() ||
      d.titre.toLowerCase().includes(occupant.nom.toLowerCase()),
  );
  const loyers = session.loyers.filter((l) => l.locataire.toLowerCase() === occupant.nom.toLowerCase());
  const historiqueSeul = dossierArchiveSeuleLigne(dossier);
  const candidatures = session.candidatures.filter((c) => !dossier || c.dossierId === dossier.id);

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
            className="mt-2 h-9 rounded-card bg-ink px-3 text-xs font-medium text-white"
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
                vue: "logements",
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
      <section className="mt-4 rounded-card border border-line bg-white p-4">
        <h2 className="text-sm font-medium text-ink">Profil locataire</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs text-ink-muted">Contact</dt>
            <dd>
              <a href={`mailto:${occupant.email}`} className="text-accent-teal">
                {occupant.email}
              </a>
              <span className="block text-ink-body">{occupant.telephone}</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Logement</dt>
            <dd>{occupant.logement}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Situation familiale</dt>
            <dd>{dossier?.situationFamiliale || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Situation professionnelle</dt>
            <dd>{dossier?.situationProfessionnelle || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Revenus</dt>
            <dd>{dossier?.revenus != null ? formatMontant(dossier.revenus) : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">RFR</dt>
            <dd>{dossier?.rfr != null ? formatMontant(dossier.rfr) : "—"}</dd>
          </div>
        </dl>
        {dossier?.aPropos && (
          <p className="mt-3 text-sm text-ink-body">{dossier.aPropos}</p>
        )}
        {dossier && (
          <p className="mt-2 text-xs text-ink-muted">
            Dossier {dossier.statut}
            {dossier.archiveLe
              ? ` · archivé le ${dossier.archiveLe} (accès documents 1 à 2 ans)`
              : ""}
          </p>
        )}
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-card border border-line bg-white p-4">
          <h2 className="text-sm font-medium text-ink">Baux et séjours</h2>
          {resas.map((r) => (
            <p key={r.id} className="mt-2 text-sm">
              {r.type ?? "Séjour"} · {r.arrivee} → {r.depart} · {formatMontant(r.montant)}
            </p>
          ))}
          {resas.length === 0 && <p className="mt-2 text-sm text-ink-muted">Aucun séjour.</p>}
        </section>
        <section className="rounded-card border border-line bg-white p-4">
          <h2 className="text-sm font-medium text-ink">Paiements</h2>
          {loyers.map((l) => (
            <p key={l.id} className="mt-2 text-sm">
              {l.echeance} · {formatMontant(l.montant)} {l.valide ? "validé" : "en attente"}
            </p>
          ))}
          {loyers.length === 0 && <p className="mt-2 text-sm text-ink-muted">Aucun loyer.</p>}
        </section>
        {dossier && (
          <section className="rounded-card border border-line bg-white p-4 lg:col-span-2">
            <h2 className="text-sm font-medium text-ink">Pièces du dossier</h2>
            {dossier.pieces.map((p) => (
              <p key={p.id} className="mt-2 text-sm">
                {p.titre} · {p.present ? "déposée" : "manquante"}
                {p.filigrane ? " · filigranée" : ""}
                {p.numero2dDoc ? ` · 2D-DOC ${p.numero2dDoc}` : ""}
              </p>
            ))}
            {dossier.pieces.length === 0 && (
              <p className="mt-2 text-sm text-ink-muted">Aucune pièce déposée.</p>
            )}
          </section>
        )}
        {session.partagesDossier.filter((p) => !dossier || p.dossierId === dossier.id).length > 0 && (
          <section className="rounded-card border border-line bg-white p-4 lg:col-span-2">
            <h2 className="text-sm font-medium text-ink">Partages et autorisations</h2>
            {session.partagesDossier
              .filter((p) => !dossier || p.dossierId === dossier.id)
              .map((p) => (
                <p key={p.id} className="mt-2 text-sm">
                  {p.destinataire} ·{" "}
                  {p.autorise === true ? "autorisé" : p.autorise === false ? "refusé" : "en attente"}
                  {p.expireLe ? ` · expire ${p.expireLe}` : ""}
                </p>
              ))}
          </section>
        )}
        {!historiqueSeul && (
          <section className="rounded-card border border-line bg-white p-4 lg:col-span-2">
            <h2 className="text-sm font-medium text-ink">Documents</h2>
            {docs.map((d) => (
              <p key={d.id} className="mt-2 text-sm">
                {d.titre}
              </p>
            ))}
            {dossier?.garants.map((g) => (
              <p key={g.id} className="mt-2 text-xs text-ink-muted">
                Garant : {g.type === "institutionnel" ? `${g.organisme} (${g.numeroDossier})` : g.nom}
              </p>
            ))}
          </section>
        )}
        {candidatures.length > 0 && (
          <section className="rounded-card border border-line bg-white p-4 lg:col-span-2">
            <h2 className="text-sm font-medium text-ink">Candidatures</h2>
            {candidatures.map((c) => {
              const bien = session.biens.find((b) => b.id === c.bienId);
              return (
                <div key={c.id} className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <span>
                    {bien?.nom ?? c.bienId} · {c.arrivee} → {c.depart} · {formatMontant(c.montant)} · {c.statut}
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
          className="mt-4 h-9 rounded-card border border-line px-3 text-xs"
        >
          Archiver le dossier
        </button>
      )}
    </AppShell>
  );
}
