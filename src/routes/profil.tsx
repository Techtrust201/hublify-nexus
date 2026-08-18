import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Mail,
  Pencil,
  Phone,
  Send,
  Star,
  User,
} from "lucide-react";
import { useState } from "react";
import { BtnNavy, BtnOutline, Champ } from "@/components/documents/ui";
import { AppShell } from "@/components/layout/AppShell";
import { telechargerDemo, toastOk } from "@/lib/feedback";
import {
  DOCS_PROFIL,
  PAIEMENTS_PROFIL,
  PROFIL_GESTIONNAIRE,
} from "@/data/documents-mo1";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [{ title: "Profil gestionnaire — Hublify" }],
  }),
  component: PageProfil,
});

function PageProfil() {
  const [onglet, setOnglet] = useState<"info" | "edition">("info");
  const [prenom, setPrenom] = useState(PROFIL_GESTIONNAIRE.prenom);
  const [nom, setNom] = useState(PROFIL_GESTIONNAIRE.nom);
  const [email, setEmail] = useState(PROFIL_GESTIONNAIRE.email);
  const [tel1, setTel1] = useState(PROFIL_GESTIONNAIRE.telephone1);
  const [tel2, setTel2] = useState(PROFIL_GESTIONNAIRE.telephone2);
  const [naissance, setNaissance] = useState(PROFIL_GESTIONNAIRE.naissance);
  const [enregistre, setEnregistre] = useState(false);

  const nomComplet = `${prenom} ${nom}`;

  return (
    <AppShell titre="Votre profil gestionnaire">
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setOnglet("info")}
          className={cn(
            "h-11 rounded-card px-4 text-sm",
            onglet === "info"
              ? "bg-ink text-white"
              : "bg-surface-soft text-ink",
          )}
        >
          Informations Profil Gestionnaire
        </button>
        <button
          type="button"
          onClick={() => setOnglet("edition")}
          className={cn(
            "h-11 rounded-card px-4 text-sm",
            onglet === "edition"
              ? "bg-ink text-white"
              : "bg-surface-soft text-ink",
          )}
        >
          Mon Profil Gestionnaire (Édition)
        </button>
      </div>

      {onglet === "info" ? (
        <div className="space-y-4">
          <h2 className="text-2xl text-ink">Informations profils</h2>

          <section className="rounded-card border border-line bg-white p-6">
            <div className="flex flex-col gap-6 sm:flex-row">
              <span className="flex size-32 shrink-0 items-center justify-center rounded-full bg-line text-ink-subtle">
                <User className="size-16" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg text-ink">{nomComplet}</h3>
                    <p className="mt-1 flex items-center gap-2 text-sm text-ink-muted">
                      <span className="inline-flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "size-4",
                              i < PROFIL_GESTIONNAIRE.note
                                ? "fill-star text-star"
                                : "text-line-strong",
                            )}
                          />
                        ))}
                      </span>
                      {PROFIL_GESTIONNAIRE.id}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOnglet("edition")}
                    className="flex size-9 items-center justify-center rounded-card text-ink-body"
                    aria-label="Éditer"
                  >
                    <Pencil className="size-5" />
                  </button>
                </div>
                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-ink-muted">Nom, Prénom</dt>
                    <dd className="mt-1 text-sm text-ink">{nomComplet}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-ink-muted">Date de naissance</dt>
                    <dd className="mt-1 text-sm text-ink">{naissance}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-ink-muted">Email</dt>
                    <dd className="mt-1 text-sm text-ink">{email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-ink-muted">Téléphone 1</dt>
                    <dd className="mt-1 text-sm text-ink">{tel1}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-ink-muted">Téléphone 2</dt>
                    <dd className="mt-1 text-sm text-ink">{tel2}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          <section className="rounded-card border border-line bg-white p-6">
            <h3 className="text-lg text-ink">À propos de {prenom}</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {PROFIL_GESTIONNAIRE.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-surface-soft px-4 py-2 text-sm text-ink-body"
                >
                  {t}
                </span>
              ))}
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_389px]">
            <div className="space-y-4">
              <section className="rounded-card border border-line bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg text-ink">Documents obligatoires</h3>
                  <BtnNavy>
                    <Send className="size-4" /> Envoyer un document
                  </BtnNavy>
                </div>
                <ul className="mt-4 divide-y divide-surface-soft text-sm">
                  {DOCS_PROFIL.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-3 py-3">
                      <span className="flex items-center gap-2 text-ink">
                        {d.statut === "Vérifié" ? (
                          <CheckCircle2 className="size-5 text-chip-success-fg" />
                        ) : (
                          <Clock className="size-5 text-chip-warning-fg" />
                        )}
                        {d.titre}
                      </span>
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-xs",
                            d.statut === "Vérifié"
                              ? "bg-chip-success text-chip-success-fg"
                              : "bg-chip-warning text-chip-warning-fg",
                          )}
                        >
                          {d.statut}
                        </span>
                        <button type="button" aria-label="Voir" className="text-ink-body">
                          <Eye className="size-4" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-card border border-line bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg text-ink">Historique des paiements</h3>
                  <div className="flex gap-2">
                    <span className="h-9 w-32 rounded-card border border-line bg-white" />
                    <span className="h-9 w-20 rounded-card border border-line bg-white" />
                  </div>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="text-xs text-ink-subtle">
                      <tr>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Montant</th>
                        <th className="px-4 py-3 font-medium">Méthode</th>
                        <th className="px-4 py-3 font-medium">Booking</th>
                        <th className="px-4 py-3 font-medium">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PAIEMENTS_PROFIL.map((p) => (
                        <tr key={p.booking} className="border-t border-surface-soft">
                          <td className="px-4 py-3 text-ink">{p.date}</td>
                          <td className="px-4 py-3 font-medium text-ink">{p.montant}</td>
                          <td className="px-4 py-3 text-ink-body">{p.methode}</td>
                          <td className="px-4 py-3 text-ink-body">{p.booking}</td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs",
                                p.statut === "Payé"
                                  ? "bg-chip-success text-chip-success-fg"
                                  : "bg-chip-warning text-chip-warning-fg",
                              )}
                            >
                              {p.statut === "Payé" ? (
                                <CheckCircle2 className="size-3" />
                              ) : (
                                <Clock className="size-3" />
                              )}
                              {p.statut}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <div className="space-y-4">
              <section className="rounded-card border border-line bg-white p-6">
                <h3 className="text-lg text-ink">Résumé financier</h3>
                <div className="mt-4 space-y-3">
                  <div className="rounded-card bg-chip-success p-4">
                    <p className="text-sm text-chip-success-fg">Total payé</p>
                    <p className="mt-1 text-2xl text-ink">3,410 €</p>
                  </div>
                  <div className="rounded-card bg-chip-warning p-4">
                    <p className="text-sm text-chip-warning-fg">En attente</p>
                    <p className="mt-1 text-2xl text-ink">1,280 €</p>
                  </div>
                  <div className="rounded-card bg-chip-danger p-4">
                    <p className="text-sm text-chip-danger-fg">Échoué</p>
                    <p className="mt-1 text-2xl text-ink">0 €</p>
                  </div>
                </div>
              </section>

              <section className="rounded-card border border-line bg-white p-6">
                <h3 className="text-lg text-ink">Actions rapides</h3>
                <div className="mt-4 flex flex-col gap-3">
                  <BtnNavy
                    className="h-10 w-full justify-center"
                    onClick={() => toastOk("Document envoyé (démo).")}
                  >
                    <Send className="size-4" /> Envoyer un document
                  </BtnNavy>
                  <BtnOutline
                    className="h-10 w-full justify-center"
                    onClick={() => telechargerDemo("rapport-gestionnaire-hublify.txt")}
                  >
                    <FileText className="size-4" /> Générer un rapport
                  </BtnOutline>
                  <BtnOutline
                    className="h-10 w-full justify-center"
                    onClick={() => telechargerDemo("documents-gestionnaire-hublify.txt")}
                  >
                    <Download className="size-4" /> Télécharger les documents
                  </BtnOutline>
                </div>
              </section>

              <section className="rounded-card border border-line bg-white p-6">
                <h3 className="text-lg text-ink">Contact</h3>
                <ul className="mt-4 space-y-4 text-sm">
                  <li className="flex items-start gap-3">
                    <Mail className="mt-0.5 size-5 text-ink-body" />
                    <div>
                      <p className="text-xs text-ink-muted">Email</p>
                      <p className="text-ink">{email}</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Phone className="mt-0.5 size-5 text-ink-body" />
                    <div>
                      <p className="text-xs text-ink-muted">Téléphone principal</p>
                      <p className="text-ink">{tel1}</p>
                    </div>
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      ) : (
        <form
          className="mx-auto max-w-xl space-y-4 rounded-card border border-line bg-white p-6"
          onSubmit={(e) => {
            e.preventDefault();
            setEnregistre(true);
            setOnglet("info");
            toastOk("Profil enregistré.");
          }}
        >
          <div className="flex items-center gap-3">
            <span className="flex size-14 items-center justify-center rounded-full bg-line text-ink-subtle">
              <User className="size-7" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.3px] text-ink-muted">
                {PROFIL_GESTIONNAIRE.role}
              </p>
              <p className="text-base text-ink">{nomComplet}</p>
              <p className="text-xs text-ink-muted">{email}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Prénom" value={prenom} onChange={setPrenom} />
            <Champ label="Nom" value={nom} onChange={setNom} />
          </div>
          <Champ label="Email" value={email} onChange={setEmail} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Téléphone 1" value={tel1} onChange={setTel1} />
            <Champ label="Téléphone 2" value={tel2} onChange={setTel2} />
          </div>
          <Champ label="Date de naissance" value={naissance} onChange={setNaissance} />
          <BtnNavy type="submit">Enregistrer</BtnNavy>
          {enregistre && <p className="text-xs text-ink-subtle">Profil enregistré.</p>}
        </form>
      )}
    </AppShell>
  );
}
