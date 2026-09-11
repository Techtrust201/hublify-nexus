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
  Plus,
  Star,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/auth/auth-context";
import { BtnNavy, BtnOutline, Champ } from "@/components/documents/ui";
import { AppShell } from "@/components/layout/AppShell";
import { ScrollHint } from "@/components/layout/ScrollHint";
import {
  choisirFichierComplet,
  telechargerBase64,
  telechargerPdf,
  toastErreur,
  toastInfo,
  toastOk,
} from "@/lib/feedback";
import { DOCS_PROFIL, PAIEMENTS_PROFIL, PROFIL_GESTIONNAIRE } from "@/data/documents-mo1";
import {
  chargerProfilDistant,
  sauverDocumentsProfilDistants,
  sauverIdentiteDistante,
  type DocumentProfil,
} from "@/data/profil-remote";
import { formatJourFr, versIsoJour } from "@/data/reservations-mo1";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [{ title: "Profil gestionnaire — Hublify" }],
  }),
  component: PageProfil,
});

function PageProfil() {
  const auth = useAuth();
  const [onglet, setOnglet] = useState<"info" | "edition">("info");
  const [prenom, setPrenom] = useState(auth?.prenom ?? PROFIL_GESTIONNAIRE.prenom);
  const [nom, setNom] = useState(auth?.nom ?? PROFIL_GESTIONNAIRE.nom);
  const [email, setEmail] = useState(auth?.email ?? PROFIL_GESTIONNAIRE.email);
  const [tel1, setTel1] = useState(PROFIL_GESTIONNAIRE.telephone1);
  const [tel2, setTel2] = useState(PROFIL_GESTIONNAIRE.telephone2);
  const [naissance, setNaissance] = useState(PROFIL_GESTIONNAIRE.naissance);
  const [docs, setDocs] = useState<DocumentProfil[]>([]);
  const [filtreMethode, setFiltreMethode] = useState("tous");
  const [filtreStatut, setFiltreStatut] = useState("tous");

  // Le profil vit en base : on l'hydrate après montage, le rendu serveur n'a
  // pas encore la session applicative.
  useEffect(() => {
    let vivant = true;
    void chargerProfilDistant().then((res) => {
      if (!vivant || !res.ok) return;
      const { identite, documents } = res.profil;
      setPrenom(identite.prenom);
      setNom(identite.nom);
      setTel1(identite.telephone1);
      setTel2(identite.telephone2);
      setNaissance(identite.naissance ? formatJourFr(identite.naissance) : "");
      setDocs(documents);
    });
    return () => {
      vivant = false;
    };
  }, []);

  const nomComplet = `${prenom} ${nom}`.trim();
  const methodes = Array.from(new Set(PAIEMENTS_PROFIL.map((p) => p.methode)));
  const paiements = PAIEMENTS_PROFIL.filter((p) => {
    if (filtreMethode !== "tous" && p.methode !== filtreMethode) return false;
    if (filtreStatut !== "tous" && p.statut !== filtreStatut) return false;
    return true;
  });
  const euros = (valeur: string) => Number(valeur.replace(/[^\d]/g, "")) || 0;
  // Le résumé suit les filtres du tableau : sinon les deux blocs se contredisent à l'écran.
  const totalPaye = paiements
    .filter((p) => p.statut === "Payé")
    .reduce((s, p) => s + euros(p.montant), 0);
  const totalAttente = paiements
    .filter((p) => p.statut === "En attente")
    .reduce((s, p) => s + euros(p.montant), 0);
  const filtreActif = filtreMethode !== "tous" || filtreStatut !== "tous";

  const majDocs = (liste: DocumentProfil[]) => {
    setDocs(liste);
    void sauverDocumentsProfilDistants({ data: { documents: liste } }).then((res) => {
      if (!res.ok) toastErreur("Document non enregistré : la base est injoignable.");
    });
  };

  const ajouterDocument = () => {
    choisirFichierComplet((fichier) => {
      majDocs([
        ...docs,
        {
          id: `doc-${Date.now()}`,
          titre: fichier.nom,
          statut: "En attente",
          fichier: { nom: fichier.nom, mime: fichier.mime, base64: fichier.base64 },
        },
      ]);
      toastOk(`Document ajouté : ${fichier.nom}`);
    });
  };

  const voirDocument = (d: (typeof docs)[number]) => {
    if (d.fichier) {
      telechargerBase64(d.fichier.nom, d.fichier.mime, d.fichier.base64);
      return;
    }
    void telechargerPdf(d.titre, [`Statut : ${d.statut}`], {
      prenom,
      nom,
      naissance,
      email,
      telephone: tel1,
      identifiant: PROFIL_GESTIONNAIRE.id,
      extra: [`Statut : ${d.statut}`],
    });
  };

  return (
    <AppShell attendDonnees titre={`Votre profil ${auth?.role?.toLowerCase() ?? "gestionnaire"}`}>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setOnglet("info")}
          className={cn(
            "h-11 rounded-card px-4 text-sm",
            onglet === "info" ? "bg-ink text-white" : "bg-surface-soft text-ink",
          )}
        >
          Informations Profil Gestionnaire
        </button>
        <button
          type="button"
          onClick={() => setOnglet("edition")}
          className={cn(
            "h-11 rounded-card px-4 text-sm",
            onglet === "edition" ? "bg-ink text-white" : "bg-surface-soft text-ink",
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
                    className="flex size-11 shrink-0 items-center justify-center rounded-card text-ink-body md:size-9"
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
            <div className="min-w-0 space-y-4">
              <section className="rounded-card border border-line bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg text-ink">Documents obligatoires</h3>
                  <BtnNavy onClick={ajouterDocument}>
                    <Plus className="size-4" /> Ajouter un document
                  </BtnNavy>
                </div>
                <ul className="mt-4 divide-y divide-surface-soft text-sm">
                  {docs.map((d) => (
                    <li
                      key={d.id}
                      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3"
                    >
                      <span className="flex min-w-0 flex-1 basis-40 items-center gap-2 text-ink">
                        {d.statut === "Vérifié" ? (
                          <CheckCircle2 className="size-5 shrink-0 text-chip-success-fg" />
                        ) : (
                          <Clock className="size-5 shrink-0 text-chip-warning-fg" />
                        )}
                        <span className="min-w-0 break-words">{d.titre}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span
                          className={cn(
                            "whitespace-nowrap rounded-full px-3 py-1 text-xs",
                            d.statut === "Vérifié"
                              ? "bg-chip-success text-chip-success-fg"
                              : "bg-chip-warning text-chip-warning-fg",
                          )}
                        >
                          {d.statut}
                        </span>
                        <button
                          type="button"
                          aria-label={`Voir ${d.titre}`}
                          className="flex size-11 shrink-0 items-center justify-center rounded-card text-ink-body md:size-8"
                          onClick={() => voirDocument(d)}
                        >
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
                    <select
                      value={filtreMethode}
                      onChange={(e) => setFiltreMethode(e.target.value)}
                      aria-label="Filtrer par méthode"
                      className="h-9 rounded-card border border-line bg-white px-2 text-xs text-ink outline-none"
                    >
                      <option value="tous">Toutes méthodes</option>
                      {methodes.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <select
                      value={filtreStatut}
                      onChange={(e) => setFiltreStatut(e.target.value)}
                      aria-label="Filtrer par statut"
                      className="h-9 rounded-card border border-line bg-white px-2 text-xs text-ink outline-none"
                    >
                      <option value="tous">Tous statuts</option>
                      <option value="Payé">Payé</option>
                      <option value="En attente">En attente</option>
                    </select>
                  </div>
                </div>
                <ScrollHint className="mt-4">
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
                      {paiements.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-sm text-ink-muted">
                            Aucun paiement pour ces filtres.
                          </td>
                        </tr>
                      ) : (
                        paiements.map((p) => (
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
                        ))
                      )}
                    </tbody>
                  </table>
                </ScrollHint>
              </section>
            </div>

            <div className="min-w-0 space-y-4">
              <section className="rounded-card border border-line bg-white p-6">
                <h3 className="text-lg text-ink">Résumé financier</h3>
                {filtreActif && (
                  <p className="mt-1 text-xs text-ink-muted">Calculé sur les filtres actifs.</p>
                )}
                <div className="mt-4 space-y-3">
                  <div className="rounded-card bg-chip-success p-4">
                    <p className="text-sm text-chip-success-fg">Total payé</p>
                    <p className="mt-1 text-2xl text-ink">{totalPaye.toLocaleString("fr-FR")} €</p>
                  </div>
                  <div className="rounded-card bg-chip-warning p-4">
                    <p className="text-sm text-chip-warning-fg">En attente</p>
                    <p className="mt-1 text-2xl text-ink">
                      {totalAttente.toLocaleString("fr-FR")} €
                    </p>
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
                  <BtnNavy className="h-10 w-full justify-center" onClick={ajouterDocument}>
                    <Plus className="size-4" /> Ajouter un document
                  </BtnNavy>
                  <BtnOutline
                    className="h-10 w-full justify-center"
                    onClick={() => {
                      const extra = [
                        `Gestionnaire : ${nomComplet}`,
                        `E-mail : ${email}`,
                        `Telephone : ${tel1}`,
                        `Total paye : ${totalPaye.toLocaleString("fr-FR")} EUR`,
                        `En attente : ${totalAttente.toLocaleString("fr-FR")} EUR`,
                        ...paiements.map(
                          (p) => `${p.date} — ${p.montant} — ${p.methode} — ${p.statut}`,
                        ),
                      ];
                      void telechargerPdf("Rapport gestionnaire Hublify", extra, {
                        prenom,
                        nom,
                        naissance,
                        email,
                        telephone: tel1,
                        identifiant: PROFIL_GESTIONNAIRE.id,
                        extra,
                      });
                    }}
                  >
                    <FileText className="size-4" /> Générer un rapport
                  </BtnOutline>
                  <BtnOutline
                    className="h-10 w-full justify-center"
                    onClick={() => {
                      const extra = [
                        "Archive documents gestionnaire",
                        ...docs.map((d) => `${d.titre} — ${d.statut}`),
                      ];
                      void telechargerPdf("Documents gestionnaire Hublify", extra, {
                        prenom,
                        nom,
                        naissance,
                        email,
                        telephone: tel1,
                        identifiant: PROFIL_GESTIONNAIRE.id,
                        extra,
                      });
                    }}
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
            if (!prenom.trim() || !nom.trim()) {
              toastErreur("Le prénom et le nom sont obligatoires.");
              return;
            }
            const naissanceIso = versIsoJour(naissance.trim());
            if (naissance.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(naissanceIso)) {
              toastErreur("Date de naissance attendue au format JJ/MM/AAAA.");
              return;
            }
            void sauverIdentiteDistante({
              data: {
                prenom: prenom.trim(),
                nom: nom.trim(),
                telephone1: tel1.trim(),
                telephone2: tel2.trim(),
                naissance: naissanceIso,
              },
            }).then((res) => {
              if (!res.ok) {
                toastErreur("Profil non enregistré : la base est injoignable.");
                return;
              }
              setOnglet("info");
              toastOk("Profil mis à jour.");
            });
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
          <div>
            <label className="block text-xs uppercase tracking-[0.3px] text-ink-muted">Email</label>
            <p className="mt-1 rounded-input border border-line bg-surface-soft px-3 py-2 text-sm text-ink-body">
              {email}
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              L'adresse sert d'identifiant de connexion : sa modification passe par le support.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Téléphone 1" value={tel1} onChange={setTel1} />
            <Champ label="Téléphone 2" value={tel2} onChange={setTel2} />
          </div>
          <Champ label="Date de naissance" value={naissance} onChange={setNaissance} />
          <BtnNavy type="submit">Enregistrer</BtnNavy>
          <p className="text-xs text-ink-subtle">
            Enregistré sur votre compte : ces informations vous suivent sur tous vos appareils.
          </p>
        </form>
      )}
    </AppShell>
  );
}
