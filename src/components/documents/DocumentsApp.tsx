import {
  AlertTriangle,
  ArrowRight,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileText,
  Home,
  Lock,
  Search,
  Trash2,
  Upload,
  User,
  Users,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ACTIVITE_RECENTE,
  ALERTES_DOCS,
  PRESTATIONS_PHOTOS,
  type DocMo1,
  type OngletResident,
  type VueDocuments,
} from "@/data/documents-mo1";
import {
  choisirFichierComplet,
  confirmer,
  exporterFichier,
  telechargerDemo,
  telechargerPdf,
  toastOk,
} from "@/lib/feedback";
import { ScrollHint } from "@/components/layout/ScrollHint";
import { cn } from "@/lib/utils";
import { ajouterDocument, retirerDocuments, useDocuments } from "@/data/documents-store";
import {
  FicheInterventionDialog,
  FiltreLogementDialog,
  GenerateAvisDialog,
  GenerateQuittanceDialog,
  PhotosPreuvesDialog,
} from "./Dialogs";
import { BadgeType, BtnNavy, BtnOutline, Chip } from "./ui";

const FILTRES_LOGEMENT = [
  "Tous",
  "Bail",
  "Quittances",
  "États des lieux",
  "Inventaire",
  "Diagnostics",
  "Fiches intervention",
  "Syndic / Copro",
  "Fiches accès",
];

const FILTRES_LOCATAIRES = [
  "Tous",
  "Bail",
  "Quittances",
  "Dossiers",
  "États des lieux",
  "Attestations",
];

const FILTRES_PROPRIO = [
  "Tous",
  "Pièce d'identité",
  "Justificatifs",
  "Attestations",
  "RIB",
  "Contrats",
];

export function DocumentsApp({
  vue,
  onVue,
  logement,
}: {
  vue: VueDocuments;
  onVue: (v: VueDocuments) => void;
  logement?: string;
}) {
  const navigate = useNavigate();
  const [recherche, setRecherche] = useState("");
  const [alerte, setAlerte] = useState(0);
  const [quittance, setQuittance] = useState(false);
  const [avis, setAvis] = useState(false);
  const [fiche, setFiche] = useState<DocMo1 | null>(null);
  const [photos, setPhotos] = useState<string | null>(null);
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  const [logementFiltre, setLogementFiltre] = useState(logement ?? "Tous");
  const [typeFiltre, setTypeFiltre] = useState("Tous");
  const [onglet, setOnglet] = useState<OngletResident>("locataires");
  const [selection, setSelection] = useState<string[]>([]);
  const documents = useDocuments();

  const logements = useMemo(
    () => [...new Set(documents.map((d) => d.logement))].sort(),
    [documents],
  );

  // Arrivée depuis « Voir docs » d'un lieu : on applique le filtre demandé.
  useEffect(() => {
    if (logement) {
      setLogementFiltre(logement);
      setFiltresOuverts(true);
    }
  }, [logement]);

  const docsFiltres = useMemo(() => {
    let list = [...documents];
    if (vue === "etats") list = list.filter((d) => d.filtre === "États des lieux");
    else if (vue === "fiches") list = list.filter((d) => d.filtre === "Fiches accès");
    else list = list.filter((d) => d.vue === vue);
    if (vue === "residents") list = list.filter((d) => d.occupant === onglet);
    if (typeFiltre !== "Tous") list = list.filter((d) => d.filtre === typeFiltre);
    if (logementFiltre !== "Tous") list = list.filter((d) => d.logement === logementFiltre);
    const q = recherche.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (d) =>
          d.titre.toLowerCase().includes(q) ||
          d.logement.toLowerCase().includes(q) ||
          d.modifiePar.toLowerCase().includes(q),
      );
    }
    return list;
  }, [vue, onglet, typeFiltre, logementFiltre, recherche, documents]);

  const aller = (v: VueDocuments, opts?: { garderRecherche?: boolean }) => {
    onVue(v);
    if (!opts?.garderRecherche) setRecherche("");
    setTypeFiltre("Tous");
    setLogementFiltre("Tous");
    setSelection([]);
  };

  const importerDoc = () => {
    choisirFichierComplet((fichier) => {
      const vueCible: DocMo1["vue"] =
        vue === "residents" || vue === "proprio" || vue === "logements" ? vue : "logements";
      const filtre =
        vue === "etats"
          ? "États des lieux"
          : vue === "fiches"
            ? "Fiches accès"
            : typeFiltre !== "Tous"
              ? typeFiltre
              : "Bail";
      const ligne: DocMo1 = {
        id: `imp-${Date.now()}`,
        titre: fichier.nom,
        type: "Import",
        filtre,
        logement: logementFiltre === "Tous" ? "—" : logementFiltre,
        date: new Date().toLocaleDateString("fr-FR"),
        taille: fichier.taille,
        modifiePar: "Vous",
        photos: 0,
        vue: vueCible,
        fichier: { nom: fichier.nom, mime: fichier.mime, base64: fichier.base64 },
        ...(vue === "residents" ? { occupant: onglet } : {}),
      };
      ajouterDocument(ligne);
      toastOk(`Document ajouté : ${fichier.nom}`);
      if (vue === "hub") aller("logements");
    });
  };

  const voirDoc = (d: DocMo1) => {
    if (d.titre.toLowerCase().includes("intervention")) {
      setFiche(d);
      return;
    }
    exporterFichier(d.fichier ?? { nom: d.titre }, {
      adresse: d.logement,
      logement: d.logement,
      date: d.date,
      extra: [`Type : ${d.type}`, `Logement : ${d.logement}`, `Date : ${d.date}`],
    });
  };

  const supprimerDocs = async (ids: string[]) => {
    if (ids.length === 0) return;
    const ok = await confirmer({
      titre: ids.length > 1 ? `Retirer ${ids.length} documents ?` : "Retirer ce document ?",
      description:
        "Les documents disparaissent de la GED. Les fichiers déjà téléchargés restent sur votre poste.",
      libelleConfirmer: "Retirer",
      danger: true,
    });
    if (!ok) return;
    retirerDocuments(ids);
    setSelection([]);
    toastOk(ids.length > 1 ? `${ids.length} documents retirés.` : "Document retiré.");
  };

  const extraireListe = (docs: DocMo1[]) => {
    const source = selection.length ? docs.filter((d) => selection.includes(d.id)) : docs;
    const lignes = [
      "Titre;Type;Logement;Date;Taille",
      ...source.map((d) => `${d.titre};${d.type};${d.logement};${d.date};${d.taille}`),
    ];
    telechargerDemo("documents-hublify.csv", lignes.join("\n"));
  };

  const envoyerListe = (docs: DocMo1[]) => {
    const source = selection.length ? docs.filter((d) => selection.includes(d.id)) : docs;
    const corps = source.map((d) => `${d.titre} — ${d.logement} (${d.date})`).join("\n");
    window.location.href = `mailto:?subject=${encodeURIComponent("Documents Hublify")}&body=${encodeURIComponent(corps)}`;
    toastOk("E-mail prêt à envoyer.");
  };

  return (
    <div>
      <FilAriane vue={vue} onHub={() => aller("hub")} />

      {vue === "hub" && (
        <Hub
          recherche={recherche}
          onRecherche={setRecherche}
          alerte={alerte}
          onAlerte={setAlerte}
          onAcceder={aller}
          docs={documents}
          onOuvrirDoc={(d) => {
            const cible: VueDocuments =
              d.filtre === "États des lieux"
                ? "etats"
                : d.filtre === "Fiches accès"
                  ? "fiches"
                  : d.vue;
            aller(cible, { garderRecherche: true });
          }}
          onOuvrirCarte={(c) => {
            if (c.href) void navigate({ to: c.href });
            else if (c.vue) aller(c.vue);
          }}
        />
      )}

      {vue === "logements" && (
        <ListeDocs
          titre="Documents Logements"
          sousTitre="Tous les documents liés à vos logements"
          filtres={FILTRES_LOGEMENT}
          docs={docsFiltres}
          recherche={recherche}
          onRecherche={setRecherche}
          typeFiltre={typeFiltre}
          onType={setTypeFiltre}
          selection={selection}
          onSelection={setSelection}
          onFiltres={() => setFiltresOuverts(true)}
          onRetour={() => aller("hub")}
          actionsEntete={
            <>
              <BtnOutline onClick={() => setQuittance(true)}>
                <FileText className="size-3" /> Quittance
              </BtnOutline>
              <BtnOutline onClick={() => setAvis(true)}>
                <FileText className="size-3" /> Avis d'échéance
              </BtnOutline>
              <BtnOutline onClick={importerDoc}>
                <Upload className="size-3" /> Importer
              </BtnOutline>
            </>
          }
          onVoir={voirDoc}
          onPhotos={(t) => setPhotos(t)}
          onSupprimer={supprimerDocs}
          onExtraire={() => extraireListe(docsFiltres)}
          onEnvoyer={() => envoyerListe(docsFiltres)}
        />
      )}

      {vue === "residents" && (
        <ListeDocs
          titre="Résidents & Prestataires"
          sousTitre="Documents par type d'occupant"
          filtres={
            onglet === "locataires"
              ? FILTRES_LOCATAIRES
              : onglet === "voyageurs"
                ? ["Tous", "Contrats", "Factures", "Dossiers", "États des lieux", "Attestations"]
                : ["Tous", "Contrats", "Factures", "Devis", "Attestations", "Preuves"]
          }
          docs={docsFiltres}
          recherche={recherche}
          onRecherche={setRecherche}
          typeFiltre={typeFiltre}
          onType={setTypeFiltre}
          selection={selection}
          onSelection={setSelection}
          onFiltres={() => setFiltresOuverts(true)}
          onRetour={() => aller("hub")}
          bandeau={
            onglet === "locataires"
              ? "Bail, quittances, dossiers et états des lieux de vos locataires"
              : onglet === "voyageurs"
                ? "Contrats de séjour, factures et états des lieux des voyageurs"
                : "Contrats, factures et preuves déposées par les prestataires"
          }
          onglets={
            <div className="flex overflow-x-auto border-b border-surface-soft">
              {(
                [
                  ["locataires", "Locataires", 7],
                  ["voyageurs", "Voyageurs", 5],
                  ["prestataires", "Prestataires", 8],
                ] as const
              ).map(([k, label, n]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setOnglet(k);
                    setTypeFiltre("Tous");
                    setSelection([]);
                  }}
                  className={cn(
                    "inline-flex h-[46px] shrink-0 items-center gap-2 px-5 text-sm",
                    onglet === k ? "border-b-2 border-ink text-ink" : "text-ink-subtle",
                  )}
                >
                  {label}
                  <span className="rounded bg-surface-soft px-1.5 text-[10px] text-ink-subtle">
                    {n}
                  </span>
                </button>
              ))}
            </div>
          }
          actionsEntete={
            <>
              <BtnOutline onClick={() => setQuittance(true)}>
                <FileText className="size-3" /> Quittance
              </BtnOutline>
              <BtnOutline onClick={importerDoc}>
                <Upload className="size-3" /> Importer
              </BtnOutline>
            </>
          }
          onVoir={voirDoc}
          onPhotos={(t) => setPhotos(t)}
          onSupprimer={supprimerDocs}
          onExtraire={() => extraireListe(docsFiltres)}
          onEnvoyer={() => envoyerListe(docsFiltres)}
        />
      )}

      {vue === "proprio" && (
        <ListeDocs
          titre="Documents Propriétaires"
          sousTitre="Pièces d'identité, justificatifs, attestations"
          filtres={FILTRES_PROPRIO}
          docs={docsFiltres}
          recherche={recherche}
          onRecherche={setRecherche}
          typeFiltre={typeFiltre}
          onType={setTypeFiltre}
          selection={selection}
          onSelection={setSelection}
          onFiltres={() => setFiltresOuverts(true)}
          onRetour={() => aller("hub")}
          actionsEntete={
            <BtnOutline onClick={importerDoc}>
              <Upload className="size-3" /> Importer
            </BtnOutline>
          }
          onVoir={voirDoc}
          onPhotos={(t) => setPhotos(t)}
          onSupprimer={supprimerDocs}
          onExtraire={() => extraireListe(docsFiltres)}
          onEnvoyer={() => envoyerListe(docsFiltres)}
        />
      )}

      {vue === "inventaire-presta" && (
        <InventairePresta onRetour={() => aller("hub")} onPhotos={(t) => setPhotos(t)} />
      )}

      {(vue === "etats" || vue === "fiches") && (
        <ListeDocs
          titre={vue === "etats" ? "États des lieux" : "Fiches d'accès"}
          sousTitre={
            vue === "etats"
              ? "Créer, comparer et archiver les états des lieux d'entrée et de sortie"
              : "Codes, instructions et contacts d'urgence par logement"
          }
          filtres={vue === "etats" ? ["Tous", "États des lieux"] : ["Tous", "Fiches accès"]}
          docs={docsFiltres}
          recherche={recherche}
          onRecherche={setRecherche}
          typeFiltre={typeFiltre}
          onType={setTypeFiltre}
          selection={selection}
          onSelection={setSelection}
          onFiltres={() => setFiltresOuverts(true)}
          onRetour={() => aller("hub")}
          actionsEntete={
            <>
              {vue === "etats" && (
                <BtnOutline onClick={() => void navigate({ to: "/outils/etats-des-lieux" })}>
                  Ouvrir l'outil
                </BtnOutline>
              )}
              <BtnOutline onClick={importerDoc}>
                <Upload className="size-3" /> Importer
              </BtnOutline>
            </>
          }
          onVoir={voirDoc}
          onPhotos={(t) => setPhotos(t)}
          onSupprimer={supprimerDocs}
          onExtraire={() => extraireListe(docsFiltres)}
          onEnvoyer={() => envoyerListe(docsFiltres)}
        />
      )}

      {vue === "factures" && (
        <section className="overflow-hidden rounded-card border border-line bg-white">
          <header className="flex items-center justify-between border-b border-surface-soft px-5 py-4">
            <div>
              <p className="text-sm text-ink">Factures et comptabilité</p>
              <p className="text-xs text-ink-muted">Téléchargez les lots et exports comptables</p>
            </div>
            <button type="button" onClick={() => aller("hub")} className="text-xs text-ink-body">
              Retour
            </button>
          </header>
          <ul>
            {[
              { id: "f1", titre: "Facture gestion — mars 2026", montant: "1 280 €" },
              { id: "f2", titre: "Quittance groupée — Suzette", montant: "850 €" },
              { id: "f3", titre: "Export comptable Q1", montant: "—" },
            ].map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between border-b border-surface-soft px-5 py-3 last:border-b-0"
              >
                <span className="text-sm text-ink">{f.titre}</span>
                <button
                  type="button"
                  className="text-xs font-medium text-accent-teal"
                  onClick={() =>
                    void telechargerPdf(f.titre, [f.titre, `Montant : ${f.montant}`], {
                      extra: [f.titre, `Montant : ${f.montant}`],
                    })
                  }
                >
                  Télécharger
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <GenerateQuittanceDialog
        ouvert={quittance}
        onClose={() => setQuittance(false)}
        onCree={(doc) => {
          ajouterDocument(doc);
          aller("logements");
        }}
      />
      <GenerateAvisDialog
        ouvert={avis}
        onClose={() => setAvis(false)}
        onCree={(doc) => {
          ajouterDocument(doc);
          aller("logements");
        }}
      />
      <FicheInterventionDialog
        ouvert={fiche !== null}
        onClose={() => setFiche(null)}
        {...(fiche ? { titre: fiche.titre, logement: fiche.logement, date: fiche.date } : {})}
      />
      <PhotosPreuvesDialog
        ouvert={photos !== null}
        onClose={() => setPhotos(null)}
        titre={photos ?? ""}
      />
      <FiltreLogementDialog
        ouvert={filtresOuverts}
        onClose={() => setFiltresOuverts(false)}
        logements={logements}
        valeur={logementFiltre}
        onChange={setLogementFiltre}
      />
    </div>
  );
}

function FilAriane({ vue, onHub }: { vue: VueDocuments; onHub: () => void }) {
  const labels: Record<VueDocuments, string> = {
    hub: "Documents",
    logements: "Documents Logements",
    residents: "Résidents & Prestataires",
    proprio: "Documents Propriétaires",
    "inventaire-presta": "Inventaire des prestations",
    etats: "États des lieux",
    fiches: "Fiches d'accès",
    factures: "Factures et comptabilité",
  };
  return (
    <p className="mb-4 flex items-center gap-2 text-xs text-ink-muted">
      <span>Tableau de bord</span>
      <ChevronRight className="size-3" />
      {vue === "hub" ? (
        <span className="text-ink-subtle">Documents</span>
      ) : (
        <>
          <button
            type="button"
            onClick={onHub}
            className="inline-flex min-h-6 items-center hover:underline"
          >
            Documents
          </button>
          <ChevronRight className="size-3" />
          <span className="text-ink-subtle">{labels[vue]}</span>
        </>
      )}
    </p>
  );
}

function Hub({
  recherche,
  onRecherche,
  alerte,
  onAlerte,
  onAcceder,
  onOuvrirCarte,
  docs,
  onOuvrirDoc,
}: {
  recherche: string;
  onRecherche: (v: string) => void;
  alerte: number;
  onAlerte: (n: number) => void;
  onAcceder: (v: VueDocuments) => void;
  onOuvrirCarte: (c: { vue?: VueDocuments; href?: "/outils/etats-des-lieux" }) => void;
  docs: DocMo1[];
  onOuvrirDoc: (d: DocMo1) => void;
}) {
  const a = ALERTES_DOCS[alerte] ?? ALERTES_DOCS[0]!;
  const q = recherche.trim().toLowerCase();
  const hits = q
    ? docs.filter(
        (d) =>
          d.titre.toLowerCase().includes(q) ||
          d.logement.toLowerCase().includes(q) ||
          d.type.toLowerCase().includes(q),
      )
    : [];
  const nb = (pred: (d: DocMo1) => boolean) => docs.filter(pred).length;
  const cartes: Array<{
    titre: string;
    desc: string;
    n: number;
    icone: typeof Home;
    vue?: VueDocuments;
    href?: "/outils/etats-des-lieux";
  }> = [
    {
      titre: "Documents Logements",
      desc: "Bail, factures, quittances…",
      n: nb((d) => d.vue === "logements"),
      icone: Home,
      vue: "logements",
    },
    {
      titre: "Résidents & Prestataires",
      desc: "Dossiers locataires, voyageurs, contrats et factures prestataires",
      n: nb((d) => d.vue === "residents"),
      icone: Users,
      vue: "residents",
    },
    {
      titre: "États des lieux, Inventaire",
      desc: "Créer, comparer et archiver les états des lieux d'entrée et de sortie",
      n: nb((d) => d.filtre === "États des lieux"),
      icone: FileText,
      href: "/outils/etats-des-lieux",
      vue: "etats",
    },
    {
      titre: "Documents Propriétaires",
      desc: "CNI, justificatifs de domicile, RIB, attestations de propriété",
      n: nb((d) => d.vue === "proprio"),
      icone: User,
      vue: "proprio",
    },
    {
      titre: "Fiches d'accès",
      desc: "Codes, instructions et contacts d'urgence par logement",
      n: nb((d) => d.filtre === "Fiches accès"),
      icone: Lock,
      vue: "fiches",
    },
    {
      titre: "Factures et comptabilité",
      desc: "Factures propriétaires, lots comptables et exports",
      n: nb((d) => d.vue === "factures"),
      icone: FileText,
      vue: "factures",
    },
    {
      titre: "Inventaire des prestations",
      desc: "Photos et preuves des interventions réalisées par logement",
      n: nb((d) => d.vue === "inventaire-presta"),
      icone: Camera,
      vue: "inventaire-presta",
    },
  ];
  const cartesVisibles = q
    ? cartes.filter(
        (c) =>
          c.titre.toLowerCase().includes(q) ||
          c.desc.toLowerCase().includes(q) ||
          hits.some((d) =>
            c.vue === "etats"
              ? d.filtre === "États des lieux"
              : c.vue === "fiches"
                ? d.filtre === "Fiches accès"
                : d.vue === c.vue,
          ),
      )
    : cartes;

  return (
    <div className="space-y-4">
      <label className="flex h-[50px] items-center gap-3 rounded-card border border-line bg-white px-5">
        <Search className="size-4 text-ink-muted" />
        <input
          value={recherche}
          onChange={(e) => onRecherche(e.target.value)}
          placeholder="Rechercher un document, un logement, un locataire…"
          className="h-full w-full bg-transparent text-sm text-ink outline-none placeholder:text-line-strong"
        />
      </label>

      {q && (
        <section className="rounded-card border border-line bg-white p-4">
          <p className="text-xs font-medium text-ink">
            {hits.length} document{hits.length > 1 ? "s" : ""} trouvé{hits.length > 1 ? "s" : ""}
          </p>
          {hits.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">
              Aucun document ne correspond à « {recherche} ».
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-surface-soft">
              {hits.slice(0, 8).map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => onOuvrirDoc(d)}
                    className="flex w-full items-center justify-between gap-3 py-2 text-left"
                  >
                    <span>
                      <span className="block text-sm text-ink">{d.titre}</span>
                      <span className="text-xs text-ink-muted">
                        {d.logement} · {d.type}
                      </span>
                    </span>
                    <ArrowRight className="size-3.5 text-ink-muted" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <button
        type="button"
        onClick={() => onAcceder("logements")}
        className="flex w-full items-center gap-4 rounded-2xl border border-line-strong bg-white px-5 py-4 text-left"
      >
        <span className="flex size-10 items-center justify-center rounded-[14px] bg-surface-soft">
          <AlertTriangle className="size-[18px] text-ink-body" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-ink">{a.titre}</span>
          <span className="block text-xs font-medium text-ink-muted">{a.detail}</span>
        </span>
        <span className="flex items-center gap-2">
          {ALERTES_DOCS.map((_, i) => (
            <span
              key={i}
              role="presentation"
              onClick={(e) => {
                e.stopPropagation();
                onAlerte(i);
              }}
              className={cn("size-2 rounded-full", i === alerte ? "bg-ink" : "bg-line-strong")}
            />
          ))}
          <ChevronRight className="size-3.5 text-ink-muted" />
        </span>
      </button>

      <div className="grid gap-4 md:grid-cols-3">
        {cartesVisibles.map((c) => (
          <article
            key={c.titre}
            className="flex flex-col rounded-2xl border border-line bg-white p-5"
          >
            <div className="flex items-start justify-between">
              <span className="flex size-10 items-center justify-center rounded-[14px] bg-surface-soft">
                <c.icone className="size-5 text-ink-body" />
              </span>
              <div className="text-right">
                <p className="text-2xl leading-8 text-ink">{c.n}</p>
                <p className="text-[10px] text-ink-muted">documents</p>
              </div>
            </div>
            <h2 className="mt-4 text-sm font-medium text-ink">{c.titre}</h2>
            <p className="mt-1 text-xs text-ink-subtle">{c.desc}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onOuvrirCarte(c)}
                className="inline-flex min-h-11 items-center gap-1 text-xs text-ink-body md:min-h-0"
              >
                Accéder <ArrowRight className="size-2.5" />
              </button>
              {c.href && c.vue && (
                <button
                  type="button"
                  onClick={() => onAcceder(c.vue!)}
                  className="inline-flex min-h-11 items-center text-xs text-ink-muted hover:text-ink-body md:min-h-0"
                >
                  Liste documents
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      <section className="overflow-hidden rounded-card border border-line bg-white">
        <header className="flex items-center gap-3 border-b border-surface-soft px-5 py-4">
          <span className="flex size-8 items-center justify-center rounded-card bg-surface-soft">
            <Clock className="size-3.5 text-ink-body" />
          </span>
          <div>
            <p className="text-sm text-ink">Activité récente</p>
            <p className="text-[10px] text-ink-muted">Derniers documents consultés ou modifiés</p>
          </div>
        </header>
        <ul>
          {ACTIVITE_RECENTE.filter(
            (a) =>
              !recherche.trim() || a.titre.toLowerCase().includes(recherche.trim().toLowerCase()),
          ).map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 border-b border-surface-soft px-5 py-3.5 last:border-b-0"
            >
              <span className="flex size-8 items-center justify-center rounded-card bg-surface-soft">
                <FileText className="size-3.5 text-ink-body" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">{a.titre}</p>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-ink-muted">
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px]",
                      a.statut === "Créé"
                        ? "bg-ink text-white"
                        : "border border-line text-ink-subtle",
                    )}
                  >
                    {a.statut}
                  </span>
                  {a.detail}
                </p>
              </div>
              <button
                type="button"
                className="-my-3 flex size-11 shrink-0 items-center justify-center text-ink-muted md:my-0 md:size-3.5"
                aria-label={`Voir ${a.titre}`}
                onClick={() => {
                  const nom = a.titre.toLowerCase();
                  if (nom.includes("état des lieux") || nom.includes("etat des lieux")) {
                    onOuvrirCarte({ href: "/outils/etats-des-lieux", vue: "etats" });
                  } else if (nom.includes("fiche")) {
                    onAcceder("fiches");
                  } else if (nom.includes("bail") || nom.includes("quittance")) {
                    onAcceder("residents");
                  } else {
                    onAcceder("logements");
                  }
                  const catalogue = docs.find((d) => d.titre === a.titre);
                  void telechargerPdf(a.titre, [], {
                    ...(catalogue?.logement ? { logement: catalogue.logement } : {}),
                    ...(catalogue?.date ? { date: catalogue.date } : {}),
                    extra: [
                      ...(catalogue
                        ? [
                            `Type : ${catalogue.type}`,
                            `Logement : ${catalogue.logement}`,
                            `Date : ${catalogue.date}`,
                          ]
                        : [a.titre]),
                      a.detail,
                    ],
                  });
                }}
              >
                <Eye className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ListeDocs({
  titre,
  sousTitre,
  filtres,
  docs,
  recherche,
  onRecherche,
  typeFiltre,
  onType,
  selection,
  onSelection,
  onFiltres,
  onRetour,
  actionsEntete,
  onglets,
  bandeau,
  onVoir,
  onPhotos,
  onSupprimer,
  onExtraire,
  onEnvoyer,
}: {
  titre: string;
  sousTitre: string;
  filtres: string[];
  docs: DocMo1[];
  recherche: string;
  onRecherche: (v: string) => void;
  typeFiltre: string;
  onType: (v: string) => void;
  selection: string[];
  onSelection: (ids: string[]) => void;
  onFiltres: () => void;
  onRetour: () => void;
  actionsEntete: ReactNode;
  onglets?: ReactNode;
  bandeau?: string;
  onVoir: (d: DocMo1) => void;
  onPhotos: (t: string) => void;
  onSupprimer: (ids: string[]) => void;
  onExtraire: () => void;
  onEnvoyer: () => void;
}) {
  const toggle = (id: string) =>
    onSelection(selection.includes(id) ? selection.filter((x) => x !== id) : [...selection, id]);
  const tous = () => onSelection(selection.length === docs.length ? [] : docs.map((d) => d.id));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onRetour}
            className="mt-1 flex size-11 items-center justify-center rounded-card border border-line text-ink-body md:size-8"
            aria-label="Retour"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <div>
            <h2 className="text-lg text-ink">{titre}</h2>
            <p className="text-xs text-ink-muted">{sousTitre}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">{actionsEntete}</div>
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-white">
        {onglets}
        {bandeau && (
          <p className="border-b border-surface-soft bg-surface/60 px-5 py-2.5 text-xs text-ink-muted">
            {bandeau}
          </p>
        )}
        <div className="space-y-2 border-b border-surface-soft p-4">
          <div className="flex gap-2">
            <BtnOutline onClick={onFiltres}>
              <Home className="size-2.5" /> Tous
            </BtnOutline>
            <label className="flex h-11 flex-1 items-center gap-2 rounded-card border border-line px-3 md:h-[34px]">
              <Search className="size-3 text-ink-muted" />
              <input
                value={recherche}
                onChange={(e) => onRecherche(e.target.value)}
                placeholder="Rechercher un document…"
                className="h-full w-full bg-transparent text-xs text-ink outline-none placeholder:text-ink-muted"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filtres.map((f) => (
              <Chip key={f} actif={typeFiltre === f} onClick={() => onType(f)}>
                {f}
              </Chip>
            ))}
          </div>
        </div>

        {docs.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-ink-muted">
            Aucun document dans ce filtre. Importez un fichier ou générez une quittance.
          </p>
        )}
        <div className="divide-y divide-surface-soft md:hidden">
          {docs.map((d) => (
            <article key={d.id} className="px-4 py-4">
              <div className="flex items-start justify-between gap-2">
                <label className="flex min-h-11 min-w-0 items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selection.includes(d.id)}
                    onChange={() => toggle(d.id)}
                    aria-label={d.titre}
                  />
                  <span>
                    <span className="block text-sm font-medium text-ink">{d.titre}</span>
                    <span className="block text-xs text-ink-muted">
                      {d.logement} · {d.date}
                    </span>
                  </span>
                </label>
                <BadgeType>{d.type}</BadgeType>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onVoir(d)}
                  className="inline-flex h-11 items-center justify-center rounded-card border border-line text-xs font-medium text-ink-body"
                >
                  Voir
                </button>
                <button
                  type="button"
                  onClick={() =>
                    exporterFichier(d.fichier ?? { nom: d.titre }, {
                      adresse: d.logement,
                      logement: d.logement,
                      date: d.date,
                      extra: [`Type : ${d.type}`, `Logement : ${d.logement}`, `Date : ${d.date}`],
                    })
                  }
                  className="inline-flex h-11 items-center justify-center rounded-card border border-line text-xs font-medium text-ink-body"
                >
                  Télécharger
                </button>
                {d.photos > 0 && (
                  <button
                    type="button"
                    onClick={() => onPhotos(d.titre)}
                    className="col-span-2 inline-flex h-11 items-center justify-center rounded-card border border-line text-xs font-medium text-ink-body"
                  >
                    Photos ({d.photos})
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>

        <ScrollHint className="hidden md:block">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-b border-surface-soft text-ink-subtle">
              <tr>
                <th className="w-12 px-4 py-3">
                  <label className="flex min-h-11 items-center md:min-h-0">
                    <input
                      type="checkbox"
                      checked={docs.length > 0 && selection.length === docs.length}
                      onChange={tous}
                      aria-label="Tout sélectionner"
                    />
                  </label>
                </th>
                <th className="px-2 py-3 font-medium">Référence</th>
                <th className="px-2 py-3 font-medium">Type</th>
                <th className="px-2 py-3 font-medium">Logement</th>
                <th className="px-2 py-3 font-medium">Date</th>
                <th className="px-2 py-3 font-medium">Taille</th>
                <th className="px-2 py-3 font-medium">Modifié par</th>
                <th className="px-2 py-3 font-medium">Photos</th>
                <th className="px-2 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} className="border-b border-surface-soft last:border-b-0">
                  <td className="px-4 py-3">
                    <label className="flex min-h-11 items-center md:min-h-0">
                      <input
                        type="checkbox"
                        checked={selection.includes(d.id)}
                        onChange={() => toggle(d.id)}
                        aria-label={d.titre}
                      />
                    </label>
                  </td>
                  <td className="px-2 py-3">
                    <span className="inline-flex items-center gap-2 text-sm text-ink">
                      <span className="flex size-7 items-center justify-center rounded-[8px] bg-surface-soft">
                        <FileText className="size-3 text-ink-body" />
                      </span>
                      {d.titre}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <BadgeType>{d.type}</BadgeType>
                  </td>
                  <td className="px-2 py-3 text-ink-body">{d.logement}</td>
                  <td className="px-2 py-3 text-ink-body">{d.date}</td>
                  <td className="px-2 py-3 text-ink-body">{d.taille}</td>
                  <td className="px-2 py-3 text-ink-body">{d.modifiePar}</td>
                  <td className="px-2 py-3">
                    {d.photos > 0 ? (
                      <button
                        type="button"
                        onClick={() => onPhotos(d.titre)}
                        className="inline-flex items-center gap-1 text-ink-body"
                      >
                        <Camera className="size-3" /> {d.photos}
                      </button>
                    ) : (
                      <span className="text-ink-muted">—</span>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => onVoir(d)}
                        className="flex size-11 items-center justify-center rounded-[8px] text-ink-body md:size-7"
                        aria-label="Voir"
                      >
                        <Eye className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          exporterFichier(d.fichier ?? { nom: d.titre }, {
                            adresse: d.logement,
                            logement: d.logement,
                            date: d.date,
                            extra: [
                              `Type : ${d.type}`,
                              `Logement : ${d.logement}`,
                              `Date : ${d.date}`,
                            ],
                          })
                        }
                        className="flex size-11 items-center justify-center rounded-[8px] text-ink-body md:size-7"
                        aria-label="Télécharger"
                      >
                        <Download className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onSupprimer([d.id])}
                        className="flex size-11 items-center justify-center rounded-[8px] text-ink-body md:size-7"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollHint>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-surface-soft px-4 py-3">
          <div className="flex flex-wrap gap-2">
            <BtnOutline disabled={selection.length === 0} onClick={() => onSupprimer(selection)}>
              <Trash2 className="size-3" /> Supprimer ({selection.length})
            </BtnOutline>
            <BtnOutline onClick={onExtraire}>Extraire la liste</BtnOutline>
            <BtnOutline onClick={onEnvoyer}>Envoyer</BtnOutline>
          </div>
          <p className="text-xs text-ink-muted">{docs.length} documents</p>
        </footer>
      </div>
    </div>
  );
}

function InventairePresta({
  onRetour,
  onPhotos,
}: {
  onRetour: () => void;
  onPhotos: (t: string) => void;
}) {
  const [prestations, setPrestations] = useState(() => [...PRESTATIONS_PHOTOS]);
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onRetour}
            className="mt-1 flex size-11 items-center justify-center rounded-card border border-line text-ink-body md:size-8"
            aria-label="Retour"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <div>
            <h2 className="text-lg text-ink">Inventaire des prestations</h2>
            <p className="text-xs text-ink-muted">
              Photos de preuve déposées par les prestataires après intervention
            </p>
          </div>
        </div>
        <BtnNavy
          onClick={() => {
            choisirFichierComplet((fichier) => {
              setPrestations((liste) => [
                {
                  id: `pr-${Date.now()}`,
                  titre: fichier.nom.replace(/\.[^.]+$/, ""),
                  lieu: "Nouveau dépôt",
                  statut: "Réalisé" as const,
                  deposant: "Vous",
                  initiales: "VO",
                  photos: 1,
                },
                ...liste,
              ]);
              toastOk(`Prestation ajoutée : ${fichier.nom}`);
              void telechargerPdf(`Photo 1 — ${fichier.nom}`, [], {
                extra: [`Légende : ${fichier.nom}`],
              });
            });
          }}
        >
          <Camera className="size-3" /> Nouvelle prestation
        </BtnNavy>
      </div>
      <p className="mb-4 flex items-start gap-2 rounded-card border border-line bg-white px-5 py-3 text-xs text-ink-subtle">
        <FileText className="mt-0.5 size-3.5 shrink-0 text-ink-muted" />
        Chaque prestataire (ménage, plombier, jardinier…) dépose ici les photos de preuve de
        l'intervention réalisée.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {prestations.map((p) => (
          <article key={p.id} className="overflow-hidden rounded-card border border-line bg-white">
            <div className="flex items-start justify-between p-4">
              <div>
                <p className="text-sm text-ink">{p.titre}</p>
                <p className="text-xs text-ink-muted">{p.lieu}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded border border-line bg-surface px-2 py-0.5 text-[10px] text-ink-body">
                {p.statut}
              </span>
            </div>
            <div className="flex items-center gap-2 border-t border-surface-soft px-4 py-2.5 text-xs text-ink-subtle">
              <span className="flex size-6 items-center justify-center rounded-full bg-line text-[10px]">
                {p.initiales}
              </span>
              Déposé par <span className="text-ink">{p.deposant}</span>
              <button
                type="button"
                onClick={() => onPhotos(p.titre)}
                className="ml-auto inline-flex items-center gap-1"
              >
                <Camera className="size-2.5" /> {p.photos} photos
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1 p-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onPhotos(p.titre)}
                  className="aspect-square rounded-[8px] bg-surface-soft"
                  aria-label={`Photo ${i + 1}`}
                />
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
