import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileText,
  Plus,
  ShieldCheck,
  User,
} from "lucide-react";
import { useAuth } from "@/auth/auth-context";
import { BtnNavy, BtnOutline, Champ } from "@/components/documents/ui";
import { ScrollHint } from "@/components/layout/ScrollHint";
import {
  messageCompte,
  profilCarteTVerifie,
  useCompteEntreprise,
  type CompteEntreprise,
} from "@/data/compte-gestionnaire";
import { DOCS_PROFIL, PAIEMENTS_PROFIL, PROFIL_GESTIONNAIRE } from "@/data/documents-mo1";
import {
  chargerProfilDistant,
  sauverDocumentsProfilDistants,
  sauverIdentiteDistante,
  type DocumentProfil,
} from "@/data/profil-remote";
import { formatJourFr, versIsoJour } from "@/data/reservations-mo1";
import { confirmer, telechargerBase64, telechargerPdf, toastErreur, toastOk } from "@/lib/feedback";
import { cn } from "@/lib/utils";

const CHAMP =
  "mt-1 h-11 w-full rounded-card border border-line bg-white px-3 text-sm text-ink outline-none focus:border-ink md:h-9";

export function CompteGestionnaire() {
  const auth = useAuth();
  const { compte, sauver } = useCompteEntreprise();
  const [brouillon, setBrouillon] = useState<CompteEntreprise>(compte);
  const [prenom, setPrenom] = useState(auth?.prenom ?? PROFIL_GESTIONNAIRE.prenom);
  const [nom, setNom] = useState(auth?.nom ?? PROFIL_GESTIONNAIRE.nom);
  const [email] = useState(auth?.email ?? PROFIL_GESTIONNAIRE.email);
  const [tel1, setTel1] = useState(PROFIL_GESTIONNAIRE.telephone1);
  const [tel2, setTel2] = useState(PROFIL_GESTIONNAIRE.telephone2);
  const [naissance, setNaissance] = useState(PROFIL_GESTIONNAIRE.naissance);
  const [docs, setDocs] = useState<DocumentProfil[]>([]);
  const [droitsOuverts, setDroitsOuverts] = useState(false);
  const [touche, setTouche] = useState(false);

  useEffect(() => {
    if (!touche) setBrouillon(compte);
  }, [compte, touche]);

  useEffect(() => {
    let vivant = true;
    void chargerProfilDistant().then((res) => {
      if (!vivant || !res.ok) return;
      const { identite, documents } = res.profil;
      setPrenom(identite.prenom || prenom);
      setNom(identite.nom || nom);
      setTel1(identite.telephone1);
      setTel2(identite.telephone2);
      setNaissance(identite.naissance ? formatJourFr(identite.naissance) : "");
      setDocs(documents);
    });
    return () => {
      vivant = false;
    };
    // Hydratation unique : les setters locaux ne doivent pas relancer la lecture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nomComplet = `${prenom} ${nom}`.trim();
  const aRecto = docs.some((d) => /recto/i.test(d.titre));
  const aVerso = docs.some((d) => /verso/i.test(d.titre));
  const verifie = profilCarteTVerifie({
    detenteurCarteT: brouillon.detenteurCarteT,
    numeroAgrement: brouillon.numeroAgrement,
    recto: aRecto,
    verso: aVerso,
  });

  const majDocs = (liste: DocumentProfil[]) => {
    setDocs(liste);
    void sauverDocumentsProfilDistants({ data: { documents: liste } }).then((res) => {
      if (!res.ok) toastErreur("Document non enregistré : la base est injoignable.");
    });
  };

  const deposerPiece = (cote: "recto" | "verso", fichier: File) => {
    if (fichier.size > 4 * 1024 * 1024) {
      toastErreur("Fichier trop volumineux (4 Mo max).");
      return;
    }
    const lecteur = new FileReader();
    lecteur.onload = () => {
      const brut = String(lecteur.result ?? "");
      const base64 = brut.includes(",") ? brut.slice(brut.indexOf(",") + 1) : brut;
      const titre = cote === "recto" ? "Carte d'identité — recto" : "Carte d'identité — verso";
      const doc: DocumentProfil = {
        id: `cni-${cote}`,
        titre,
        statut: "En attente",
        fichier: { nom: fichier.name, mime: fichier.type || "image/jpeg", base64 },
      };
      const sans = docs.filter((d) => d.titre !== titre);
      majDocs([...sans, doc]);
      toastOk(`${titre} ajoutée.`);
    };
    lecteur.readAsDataURL(fichier);
  };

  const euros = (valeur: string) => Number(valeur.replace(/[^\d]/g, "")) || 0;
  const totalPaye = PAIEMENTS_PROFIL.filter((p) => p.statut === "Payé").reduce(
    (s, p) => s + euros(p.montant),
    0,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className="rounded-card border border-line bg-white p-5">
        <h2 className="text-lg text-ink">Votre profil gestionnaire</h2>
        <p className="text-sm text-ink-muted">Gérez vos informations personnelles et préférences</p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-16 items-center justify-center rounded-full bg-surface-soft text-ink-subtle">
              <User className="size-8" />
            </span>
            <div>
              <p className="flex flex-wrap items-center gap-2 text-base text-ink">
                {nomComplet || "Gestionnaire"}
                {verifie && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-chip-success px-2 py-0.5 text-xs text-chip-success-fg">
                    <BadgeCheck className="size-3.5" /> Profil vérifié
                  </span>
                )}
              </p>
              <p className="text-sm text-ink-muted">{brouillon.offreCommerciale}</p>
              <p className="text-xs text-ink-subtle">{PROFIL_GESTIONNAIRE.id}</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-ink-muted">
              La carte d'identité est requise avant d'activer les paiements. Déposez le recto et le
              verso, en photo ou depuis vos fichiers.
            </p>
            <Piece cote="recto" present={aRecto} onFichier={(f) => deposerPiece("recto", f)} />
            <Piece cote="verso" present={aVerso} onFichier={(f) => deposerPiece("verso", f)} />
          </div>
        </div>
      </section>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!prenom.trim() || !nom.trim()) {
            toastErreur("Le prénom et le nom sont obligatoires.");
            return;
          }
          const erreur = messageCompte(brouillon);
          if (erreur) {
            toastErreur(erreur);
            return;
          }
          const naissanceIso = versIsoJour(naissance.trim());
          if (naissance.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(naissanceIso)) {
            toastErreur("Date de naissance attendue au format JJ/MM/AAAA.");
            return;
          }
          sauver(brouillon);
          setTouche(false);
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
              toastOk(
                "Entreprise enregistrée sur cet appareil. L'identité n'a pas rejoint la base.",
              );
              return;
            }
            toastOk(verifie ? "Profil vérifié et enregistré." : "Profil enregistré.");
          });
        }}
      >
        <Bloc
          icone={<User className="size-4" />}
          titre="Informations personnelles de l'utilisateur principal"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Champ label="Nom" value={nom} onChange={setNom} />
            <Champ label="Prénom" value={prenom} onChange={setPrenom} />
          </div>
          <label className="block text-xs text-ink-muted">
            E-mail
            <input value={email} readOnly className={cn(CHAMP, "bg-surface-soft")} />
          </label>
          <p className="text-xs text-ink-subtle">
            L'adresse sert d'identifiant de connexion. Sa modification passe par le support.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Champ label="Téléphone 1" value={tel1} onChange={setTel1} />
            <Champ label="Téléphone 2 (optionnel)" value={tel2} onChange={setTel2} />
          </div>
          <Champ label="Date de naissance" value={naissance} onChange={setNaissance} />
        </Bloc>

        <Bloc icone={<Building2 className="size-4" />} titre="Informations de l'entreprise">
          <label className="block text-xs text-ink-muted">
            Type d'offre commerciale
            <input
              value={brouillon.offreCommerciale}
              onChange={(e) => {
                setTouche(true);
                setBrouillon({ ...brouillon, offreCommerciale: e.target.value });
              }}
              className={CHAMP}
            />
          </label>
          <label className="block text-xs text-ink-muted">
            Nom / Raison sociale
            <input
              value={brouillon.raisonSociale}
              onChange={(e) => {
                setTouche(true);
                setBrouillon({ ...brouillon, raisonSociale: e.target.value });
              }}
              placeholder="Raison sociale de l'entreprise"
              className={CHAMP}
            />
          </label>
          <label className="block text-xs text-ink-muted">
            SIRET
            <input
              value={brouillon.siret}
              onChange={(e) => {
                setTouche(true);
                setBrouillon({ ...brouillon, siret: e.target.value });
              }}
              inputMode="numeric"
              placeholder="14 chiffres"
              className={CHAMP}
            />
          </label>
          <label className="block text-xs text-ink-muted">
            Adresse de l'entreprise
            <input
              value={brouillon.adresse}
              onChange={(e) => {
                setTouche(true);
                setBrouillon({ ...brouillon, adresse: e.target.value });
              }}
              className={CHAMP}
            />
          </label>
          <label className="flex min-h-11 items-start gap-2 text-sm text-ink">
            <input
              type="checkbox"
              className="mt-1"
              checked={brouillon.detenteurCarteT}
              onChange={(e) => {
                setTouche(true);
                setBrouillon({ ...brouillon, detenteurCarteT: e.target.checked });
              }}
            />
            Professionnel habilité à signer des baux (carte T ou agence immobilière)
          </label>
          <label className="block text-xs text-ink-muted">
            Détenteur carte de gestion — numéro d'agrément
            <input
              value={brouillon.numeroAgrement}
              onChange={(e) => {
                setTouche(true);
                setBrouillon({ ...brouillon, numeroAgrement: e.target.value });
              }}
              placeholder="CPI …"
              className={CHAMP}
            />
          </label>
          {brouillon.detenteurCarteT && !verifie && (
            <p className="text-xs text-ink-body">
              Le profil passe à « vérifié » lorsque le numéro d'agrément du détenteur de la carte T
              est renseigné et que le recto et le verso de la pièce d'identité sont déposés.
            </p>
          )}
          <p className="text-xs text-ink-subtle">
            Hublify ne se substitue pas au détenteur de la carte professionnelle. Assurance,
            garantie financière et conditions d'exercice restent celles de votre agrément.
          </p>
        </Bloc>

        <Bloc icone={<ShieldCheck className="size-4" />} titre="Mes autorisations tierces">
          {brouillon.equipeQuittee ? (
            <p className="text-sm text-ink-body">Vous avez quitté cette équipe.</p>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-body">
                Vous faites partie de la team mate de {brouillon.equipeHote} —{" "}
                <button
                  type="button"
                  className="underline decoration-line underline-offset-2"
                  onClick={() => setDroitsOuverts((v) => !v)}
                >
                  voir vos droits
                </button>
              </p>
              <button
                type="button"
                className="h-11 rounded-card border border-line px-3 text-xs text-ink md:h-9"
                onClick={() => {
                  void confirmer({
                    titre: `Quitter l'équipe de ${brouillon.equipeHote} ?`,
                    description:
                      "La sortie est notée sur cet appareil. Les droits déjà posés dans Team mate ne sont pas réécrits d'ici.",
                    libelleConfirmer: "Partir de cette team",
                    danger: true,
                  }).then((ok) => {
                    if (!ok) return;
                    const suivant = { ...brouillon, equipeQuittee: true };
                    setBrouillon(suivant);
                    sauver(suivant);
                    toastOk("Vous avez quitté l'équipe.");
                  });
                }}
              >
                Partir de cette team
              </button>
            </div>
          )}
          {droitsOuverts && (
            <div className="rounded-card bg-surface-soft p-3 text-sm text-ink-body">
              <p>
                Les droits sont validés par le profil gestionnaire. Un accès personnalisé part de
                tout restreint : on coche ensuite les catégories à ouvrir.
              </p>
              <ul className="mt-2 list-disc pl-5">
                <li>Financier</li>
                <li>Calendrier</li>
                <li>Messagerie</li>
                <li>Documents</li>
              </ul>
              <Link to="/team" className="mt-2 inline-flex text-sm text-ink underline">
                Ouvrir Team mate pour assigner ces droits
              </Link>
            </div>
          )}
        </Bloc>

        <Bloc icone={<CreditCard className="size-4" />} titre="Gestion des paiements">
          <label className="block text-xs text-ink-muted">
            Titulaire du RIB
            <input
              value={brouillon.titulaireRib}
              onChange={(e) => {
                setTouche(true);
                setBrouillon({ ...brouillon, titulaireRib: e.target.value });
              }}
              className={CHAMP}
            />
          </label>
          <label className="block text-xs text-ink-muted">
            Ajouter votre RIB — IBAN
            <input
              value={brouillon.iban}
              onChange={(e) => {
                setTouche(true);
                setBrouillon({ ...brouillon, iban: e.target.value });
              }}
              placeholder="FR76 …"
              className={CHAMP}
              autoComplete="off"
            />
          </label>
        </Bloc>

        <BtnNavy type="submit" className="h-11 px-5">
          Enregistrer
        </BtnNavy>
      </form>

      <details className="rounded-card border border-line bg-white p-5">
        <summary className="cursor-pointer text-sm font-medium text-ink">
          Historique et documents déjà au dossier
        </summary>
        <div className="mt-4 space-y-4">
          <ul className="divide-y divide-surface-soft text-sm">
            {DOCS_PROFIL.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 py-2">
                <span className="text-ink">{d.titre}</span>
                <span className="text-xs text-ink-muted">{d.statut}</span>
              </li>
            ))}
            {docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 py-2">
                <span className="inline-flex items-center gap-2 text-ink">
                  {d.statut === "Vérifié" ? (
                    <CheckCircle2 className="size-4 text-chip-success-fg" />
                  ) : (
                    <Clock className="size-4 text-chip-warning-fg" />
                  )}
                  {d.titre}
                </span>
                <button
                  type="button"
                  aria-label={`Voir ${d.titre}`}
                  className="flex size-11 items-center justify-center md:size-8"
                  onClick={() => {
                    if (d.fichier) {
                      telechargerBase64(d.fichier.nom, d.fichier.mime, d.fichier.base64);
                      return;
                    }
                    void telechargerPdf(d.titre, [`Statut : ${d.statut}`]);
                  }}
                >
                  <Eye className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          <ScrollHint>
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-xs text-ink-subtle">
                <tr>
                  <th className="px-2 py-2 font-medium">Date</th>
                  <th className="px-2 py-2 font-medium">Montant</th>
                  <th className="px-2 py-2 font-medium">Méthode</th>
                  <th className="px-2 py-2 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {PAIEMENTS_PROFIL.map((p) => (
                  <tr key={p.booking} className="border-t border-surface-soft">
                    <td className="px-2 py-2">{p.date}</td>
                    <td className="px-2 py-2">{p.montant}</td>
                    <td className="px-2 py-2">{p.methode}</td>
                    <td className="px-2 py-2">{p.statut}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollHint>
          <p className="text-sm text-ink">Total payé : {totalPaye.toLocaleString("fr-FR")} €</p>
          <BtnOutline
            onClick={() => {
              void telechargerPdf("Rapport gestionnaire Hublify", [
                `Gestionnaire : ${nomComplet}`,
                `SIRET : ${brouillon.siret || "—"}`,
                `Agrément : ${brouillon.numeroAgrement || "—"}`,
                `Total payé : ${totalPaye.toLocaleString("fr-FR")} EUR`,
              ]);
            }}
          >
            <FileText className="size-4" /> Générer un rapport
          </BtnOutline>
        </div>
      </details>
    </div>
  );
}

function Bloc({
  titre,
  icone,
  children,
}: {
  titre: string;
  icone: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-card border border-line bg-white p-5">
      <h2 className="flex items-center gap-2 text-sm font-medium text-ink">
        {icone} {titre}
      </h2>
      {children}
    </section>
  );
}

function Piece({
  cote,
  present,
  onFichier,
}: {
  cote: "recto" | "verso";
  present: boolean;
  onFichier: (fichier: File) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-ink">
        {cote === "recto" ? "Recto" : "Verso"}
        {present ? " · déposé" : ""}
      </span>
      <label className="inline-flex h-11 cursor-pointer items-center gap-1 rounded-card border border-line px-3 text-xs text-ink md:h-9">
        <Camera className="size-3.5" /> Photo
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => {
            const fichier = e.target.files?.[0];
            e.target.value = "";
            if (fichier) onFichier(fichier);
          }}
        />
      </label>
      <label className="inline-flex h-11 cursor-pointer items-center gap-1 rounded-card border border-line px-3 text-xs text-ink md:h-9">
        <Download className="size-3.5" /> Fichier
        <input
          type="file"
          accept="image/*,.pdf"
          className="sr-only"
          onChange={(e) => {
            const fichier = e.target.files?.[0];
            e.target.value = "";
            if (fichier) onFichier(fichier);
          }}
        />
      </label>
      {!present && cote === "recto" && <Plus className="size-3 text-ink-muted" aria-hidden />}
    </div>
  );
}
