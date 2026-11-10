import { ChevronLeft, FileText, Home, Mail, Phone, UserRound } from "lucide-react";
import type { ProfilInterlocuteur as ProfilVue } from "@/data/profil-interlocuteur";
import { libelleAssigne } from "@/data/messagerie-mo1";
import { SITUATIONS_LOCATAIRE } from "@/data/proposition-bail";

export function ProfilInterlocuteur({
  profil,
  situation,
  onSituation,
  onRetour,
  onProposerBail,
}: {
  profil: ProfilVue;
  situation: string;
  onSituation: (valeur: string) => void;
  onRetour: () => void;
  onProposerBail?: () => void;
}) {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[color-mix(in_srgb,var(--surface)_35%,white)]">
      <header className="flex items-center gap-3 border-b border-surface-soft bg-white px-4 py-3">
        <button
          type="button"
          onClick={onRetour}
          className="flex size-11 items-center justify-center rounded-card border border-line text-ink-body"
          aria-label="Retour à la conversation"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Profil</p>
          <h2 className="truncate text-sm text-ink">{profil.nom}</h2>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <article className="rounded-card border border-line bg-white p-4">
          <div className="flex items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-line text-sm text-ink-body">
              {profil.initiales}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base text-ink">{profil.nom}</p>
                <span className="rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] text-ink-subtle">
                  {profil.badge}
                </span>
              </div>
              {profil.bienNom && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
                  <Home className="size-3.5 shrink-0" aria-hidden />
                  <span>
                    {profil.bienNom}
                    {profil.adresse ? ` · ${profil.adresse}` : ""}
                  </span>
                </p>
              )}
              <p className="mt-2 text-xs leading-relaxed text-ink-body">{profil.extrait}</p>
            </div>
          </div>
        </article>

        <article className="rounded-card border border-line bg-white p-4">
          <h3 className="text-xs text-ink">Coordonnées</h3>
          <dl className="mt-3 space-y-2 text-xs">
            <Ligne icon={Mail} libelle="E-mail" valeur={profil.email ?? "Non renseigné"} />
            <Ligne icon={Phone} libelle="Téléphone" valeur={profil.telephone ?? "Non renseigné"} />
            <Ligne
              icon={UserRound}
              libelle="Assigné à"
              valeur={profil.assigne ? libelleAssigne(profil.assigne) : "Personne pour le moment"}
            />
          </dl>
        </article>

        {profil.peutProposerBail && (
          <article className="rounded-card border border-line bg-white p-4">
            <h3 className="text-xs text-ink">Demande et situation</h3>
            <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
              <div>
                <dt className="text-ink-muted">Période souhaitée</dt>
                <dd className="mt-1 text-ink">{profil.periode ?? "Non précisée"}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Loyer mensuel</dt>
                <dd className="mt-1 text-ink">{profil.loyer ?? "Non précisé"}</dd>
              </div>
            </dl>
            <label className="mt-4 block text-[11px] text-ink-muted">
              Situation à la date de prise d’effet du bail
              <select
                value={situation}
                onChange={(e) => onSituation(e.target.value)}
                className="mt-1 h-11 w-full rounded-card border border-line bg-white px-3 text-xs text-ink"
              >
                <option value="">Choisir une situation</option>
                {SITUATIONS_LOCATAIRE.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            {onProposerBail && (
              <button
                type="button"
                onClick={onProposerBail}
                className="mt-4 inline-flex h-11 items-center rounded-card bg-ink px-3 text-xs font-medium text-white"
              >
                Proposer un bail
              </button>
            )}
          </article>
        )}

        <article className="rounded-card border border-line bg-white p-4">
          <h3 className="text-xs text-ink">Documents liés</h3>
          {profil.documents.length === 0 ? (
            <p className="mt-2 text-xs text-ink-muted">Aucun document lié à cette conversation.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {profil.documents.map((d) => (
                <li key={`${d.nom}-${d.date}`} className="flex items-center gap-2 text-xs text-ink">
                  <FileText className="size-3.5 text-ink-body" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{d.nom}</span>
                  <span className="text-[10px] text-ink-muted">{d.date}</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-card border border-line bg-white p-4">
          <h3 className="text-xs text-ink">Messages automatiques déjà déclenchés</h3>
          {profil.evenements.length === 0 ? (
            <p className="mt-2 text-xs text-ink-muted">Aucun déclencheur pour ce fil.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {profil.evenements.map((evt) => (
                <li key={evt} className="text-xs leading-relaxed text-ink-body">
                  {evt}
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
}

function Ligne({
  icon: Icone,
  libelle,
  valeur,
}: {
  icon: typeof Mail;
  libelle: string;
  valeur: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icone className="mt-0.5 size-3.5 shrink-0 text-ink-muted" aria-hidden />
      <div>
        <dt className="text-ink-muted">{libelle}</dt>
        <dd className="text-ink">{valeur}</dd>
      </div>
    </div>
  );
}
