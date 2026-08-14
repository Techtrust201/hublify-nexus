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
            "h-9 rounded-[10px] px-4 text-sm",
            onglet === "info"
              ? "bg-[#1e2939] text-white"
              : "bg-[#f3f4f6] text-[#1e2939]",
          )}
        >
          Informations Profil Gestionnaire
        </button>
        <button
          type="button"
          onClick={() => setOnglet("edition")}
          className={cn(
            "h-9 rounded-[10px] px-4 text-sm",
            onglet === "edition"
              ? "bg-[#1e2939] text-white"
              : "bg-[#f3f4f6] text-[#1e2939]",
          )}
        >
          Mon Profil Gestionnaire (Édition)
        </button>
      </div>

      {onglet === "info" ? (
        <div className="space-y-4">
          <h2 className="text-2xl text-[#1e2939]">Informations profils</h2>

          <section className="rounded-[10px] border border-[#e5e7eb] bg-white p-6">
            <div className="flex flex-col gap-6 sm:flex-row">
              <span className="flex size-32 shrink-0 items-center justify-center rounded-full bg-[#e5e7eb] text-[#6a7282]">
                <User className="size-16" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg text-[#1e2939]">{nomComplet}</h3>
                    <p className="mt-1 flex items-center gap-2 text-sm text-[#99a1af]">
                      <span className="inline-flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "size-4",
                              i < PROFIL_GESTIONNAIRE.note
                                ? "fill-[#facc15] text-[#facc15]"
                                : "text-[#d1d5dc]",
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
                    className="flex size-9 items-center justify-center rounded-[10px] text-[#4a5565]"
                    aria-label="Éditer"
                  >
                    <Pencil className="size-5" />
                  </button>
                </div>
                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-[#99a1af]">Nom, Prénom</dt>
                    <dd className="mt-1 text-sm text-[#1e2939]">{nomComplet}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-[#99a1af]">Date de naissance</dt>
                    <dd className="mt-1 text-sm text-[#1e2939]">{naissance}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-[#99a1af]">Email</dt>
                    <dd className="mt-1 text-sm text-[#1e2939]">{email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-[#99a1af]">Téléphone 1</dt>
                    <dd className="mt-1 text-sm text-[#1e2939]">{tel1}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-[#99a1af]">Téléphone 2</dt>
                    <dd className="mt-1 text-sm text-[#1e2939]">{tel2}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          <section className="rounded-[10px] border border-[#e5e7eb] bg-white p-6">
            <h3 className="text-lg text-[#1e2939]">À propos de {prenom}</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {PROFIL_GESTIONNAIRE.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-[#f3f4f6] px-4 py-2 text-sm text-[#4a5565]"
                >
                  {t}
                </span>
              ))}
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_389px]">
            <div className="space-y-4">
              <section className="rounded-[10px] border border-[#e5e7eb] bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg text-[#1e2939]">Documents obligatoires</h3>
                  <BtnNavy>
                    <Send className="size-4" /> Envoyer un document
                  </BtnNavy>
                </div>
                <ul className="mt-4 divide-y divide-[#f3f4f6] text-sm">
                  {DOCS_PROFIL.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-3 py-3">
                      <span className="flex items-center gap-2 text-[#1e2939]">
                        {d.statut === "Vérifié" ? (
                          <CheckCircle2 className="size-5 text-[#00a63e]" />
                        ) : (
                          <Clock className="size-5 text-[#f54900]" />
                        )}
                        {d.titre}
                      </span>
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-xs",
                            d.statut === "Vérifié"
                              ? "bg-[#dcfce7] text-[#008236]"
                              : "bg-[#ffedd4] text-[#ca3500]",
                          )}
                        >
                          {d.statut}
                        </span>
                        <button type="button" aria-label="Voir" className="text-[#4a5565]">
                          <Eye className="size-4" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-[10px] border border-[#e5e7eb] bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg text-[#1e2939]">Historique des paiements</h3>
                  <div className="flex gap-2">
                    <span className="h-9 w-32 rounded-[10px] border border-[#e5e7eb] bg-white" />
                    <span className="h-9 w-20 rounded-[10px] border border-[#e5e7eb] bg-white" />
                  </div>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="text-xs text-[#6a7282]">
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
                        <tr key={p.booking} className="border-t border-[#f3f4f6]">
                          <td className="px-4 py-3 text-[#1e2939]">{p.date}</td>
                          <td className="px-4 py-3 font-medium text-[#1e2939]">{p.montant}</td>
                          <td className="px-4 py-3 text-[#4a5565]">{p.methode}</td>
                          <td className="px-4 py-3 text-[#4a5565]">{p.booking}</td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs",
                                p.statut === "Payé"
                                  ? "bg-[#dcfce7] text-[#008236]"
                                  : "bg-[#ffedd4] text-[#ca3500]",
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
              <section className="rounded-[10px] border border-[#e5e7eb] bg-white p-6">
                <h3 className="text-lg text-[#1e2939]">Résumé financier</h3>
                <div className="mt-4 space-y-3">
                  <div className="rounded-[10px] bg-[#dcfce7] p-4">
                    <p className="text-sm text-[#008236]">Total payé</p>
                    <p className="mt-1 text-2xl text-[#1e2939]">3,410 €</p>
                  </div>
                  <div className="rounded-[10px] bg-[#ffedd4] p-4">
                    <p className="text-sm text-[#ca3500]">En attente</p>
                    <p className="mt-1 text-2xl text-[#1e2939]">1,280 €</p>
                  </div>
                  <div className="rounded-[10px] bg-[#ffe2e2] p-4">
                    <p className="text-sm text-[#c10007]">Échoué</p>
                    <p className="mt-1 text-2xl text-[#1e2939]">0 €</p>
                  </div>
                </div>
              </section>

              <section className="rounded-[10px] border border-[#e5e7eb] bg-white p-6">
                <h3 className="text-lg text-[#1e2939]">Actions rapides</h3>
                <div className="mt-4 flex flex-col gap-3">
                  <BtnNavy className="h-10 w-full justify-center">
                    <Send className="size-4" /> Envoyer un document
                  </BtnNavy>
                  <BtnOutline className="h-10 w-full justify-center">
                    <FileText className="size-4" /> Générer un rapport
                  </BtnOutline>
                  <BtnOutline className="h-10 w-full justify-center">
                    <Download className="size-4" /> Télécharger les documents
                  </BtnOutline>
                </div>
              </section>

              <section className="rounded-[10px] border border-[#e5e7eb] bg-white p-6">
                <h3 className="text-lg text-[#1e2939]">Contact</h3>
                <ul className="mt-4 space-y-4 text-sm">
                  <li className="flex items-start gap-3">
                    <Mail className="mt-0.5 size-5 text-[#4a5565]" />
                    <div>
                      <p className="text-xs text-[#99a1af]">Email</p>
                      <p className="text-[#1e2939]">{email}</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Phone className="mt-0.5 size-5 text-[#4a5565]" />
                    <div>
                      <p className="text-xs text-[#99a1af]">Téléphone principal</p>
                      <p className="text-[#1e2939]">{tel1}</p>
                    </div>
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      ) : (
        <form
          className="mx-auto max-w-xl space-y-4 rounded-[10px] border border-[#e5e7eb] bg-white p-6"
          onSubmit={(e) => {
            e.preventDefault();
            setEnregistre(true);
            setOnglet("info");
          }}
        >
          <div className="flex items-center gap-3">
            <span className="flex size-14 items-center justify-center rounded-full bg-[#e5e7eb] text-[#6a7282]">
              <User className="size-7" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.3px] text-[#99a1af]">
                {PROFIL_GESTIONNAIRE.role}
              </p>
              <p className="text-base text-[#1e2939]">{nomComplet}</p>
              <p className="text-xs text-[#99a1af]">{email}</p>
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
          {enregistre && <p className="text-xs text-[#6a7282]">Profil enregistré.</p>}
        </form>
      )}
    </AppShell>
  );
}
