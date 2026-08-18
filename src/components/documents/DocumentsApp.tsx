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
import { useMemo, useState, type ReactNode } from "react";
import {
  ACTIVITE_RECENTE,
  ALERTES_DOCS,
  DOCS_MO1,
  PRESTATIONS_PHOTOS,
  type DocMo1,
  type OngletResident,
  type VueDocuments,
} from "@/data/documents-mo1";
import { cn } from "@/lib/utils";
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

export function DocumentsApp() {
  const [vue, setVue] = useState<VueDocuments>("hub");
  const [recherche, setRecherche] = useState("");
  const [alerte, setAlerte] = useState(0);
  const [quittance, setQuittance] = useState(false);
  const [avis, setAvis] = useState(false);
  const [fiche, setFiche] = useState(false);
  const [photos, setPhotos] = useState<string | null>(null);
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  const [logementFiltre, setLogementFiltre] = useState("Tous");
  const [typeFiltre, setTypeFiltre] = useState("Tous");
  const [onglet, setOnglet] = useState<OngletResident>("locataires");
  const [selection, setSelection] = useState<string[]>([]);

  const logements = useMemo(
    () => [...new Set(DOCS_MO1.map((d) => d.logement))].sort(),
    [],
  );

  const docsFiltres = useMemo(() => {
    let list =
      vue === "etats"
        ? DOCS_MO1.filter((d) => d.filtre === "États des lieux")
        : vue === "fiches"
          ? DOCS_MO1.filter((d) => d.filtre === "Fiches accès")
          : DOCS_MO1.filter((d) => d.vue === vue);
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
  }, [vue, onglet, typeFiltre, logementFiltre, recherche]);

  const aller = (v: VueDocuments) => {
    setVue(v);
    setRecherche("");
    setTypeFiltre("Tous");
    setLogementFiltre("Tous");
    setSelection([]);
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
              <BtnOutline>
                <Upload className="size-3" /> Importer
              </BtnOutline>
            </>
          }
          onFiche={() => setFiche(true)}
          onPhotos={(t) => setPhotos(t)}
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
            <div className="flex border-b border-[#f3f4f6]">
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
                    "inline-flex h-[46px] items-center gap-2 px-5 text-sm",
                    onglet === k
                      ? "border-b-2 border-[#1e2939] text-[#1e2939]"
                      : "text-[#6a7282]",
                  )}
                >
                  {label}
                  <span className="rounded bg-[#f3f4f6] px-1.5 text-[10px] text-[#6a7282]">{n}</span>
                </button>
              ))}
            </div>
          }
          actionsEntete={
            <>
              <BtnOutline onClick={() => setQuittance(true)}>
                <FileText className="size-3" /> Quittance
              </BtnOutline>
              <BtnOutline>
                <Upload className="size-3" /> Importer
              </BtnOutline>
            </>
          }
          onFiche={() => setFiche(true)}
          onPhotos={(t) => setPhotos(t)}
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
            <BtnOutline>
              <Upload className="size-3" /> Importer
            </BtnOutline>
          }
          onFiche={() => setFiche(true)}
          onPhotos={(t) => setPhotos(t)}
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
            <BtnOutline>
              <Upload className="size-3" /> Importer
            </BtnOutline>
          }
          onFiche={() => setFiche(true)}
          onPhotos={(t) => setPhotos(t)}
        />
      )}

      <GenerateQuittanceDialog ouvert={quittance} onClose={() => setQuittance(false)} />
      <GenerateAvisDialog ouvert={avis} onClose={() => setAvis(false)} />
      <FicheInterventionDialog ouvert={fiche} onClose={() => setFiche(false)} />
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
  };
  return (
    <p className="mb-4 flex items-center gap-2 text-xs text-[#99a1af]">
      <span>Tableau de bord</span>
      <ChevronRight className="size-3" />
      {vue === "hub" ? (
        <span className="text-[#6a7282]">Documents</span>
      ) : (
        <>
          <button type="button" onClick={onHub} className="hover:underline">
            Documents
          </button>
          <ChevronRight className="size-3" />
          <span className="text-[#6a7282]">{labels[vue]}</span>
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
}: {
  recherche: string;
  onRecherche: (v: string) => void;
  alerte: number;
  onAlerte: (n: number) => void;
  onAcceder: (v: VueDocuments) => void;
}) {
  const a = ALERTES_DOCS[alerte];
  const cartes = [
    {
      titre: "Documents Logements",
      desc: "Bail, quittances, diagnostics, fiches intervention, syndic…",
      n: 10,
      icone: Home,
      vue: "logements" as const,
    },
    {
      titre: "Résidents & Prestataires",
      desc: "Dossiers locataires, voyageurs, contrats et factures prestataires",
      n: 20,
      icone: Users,
      vue: "residents" as const,
    },
    {
      titre: "États des lieux",
      desc: "Créer, comparer et archiver les états des lieux d'entrée et de sortie",
      n: 34,
      icone: FileText,
      vue: "etats" as const,
    },
    {
      titre: "Documents Propriétaires",
      desc: "CNI, justificatifs de domicile, RIB, attestations de propriété",
      n: 4,
      icone: User,
      vue: "proprio" as const,
    },
    {
      titre: "Fiches d'accès",
      desc: "Codes, instructions et contacts d'urgence par logement",
      n: 8,
      icone: Lock,
      vue: "fiches" as const,
    },
    {
      titre: "Inventaire des prestations",
      desc: "Photos et preuves des interventions réalisées par logement",
      n: 4,
      icone: Camera,
      vue: "inventaire-presta" as const,
    },
  ];

  return (
    <div className="space-y-4">
      <label className="flex h-[50px] items-center gap-3 rounded-[10px] border border-[#e5e7eb] bg-white px-5">
        <Search className="size-4 text-[#99a1af]" />
        <input
          value={recherche}
          onChange={(e) => onRecherche(e.target.value)}
          placeholder="Rechercher un document, un logement, un locataire…"
          className="h-full w-full bg-transparent text-sm text-[#1e2939] outline-none placeholder:text-[#d1d5dc]"
        />
      </label>

      <button
        type="button"
        onClick={() => onAcceder("logements")}
        className="flex w-full items-center gap-4 rounded-2xl border border-[#d1d5dc] bg-white px-5 py-4 text-left"
      >
        <span className="flex size-10 items-center justify-center rounded-[14px] bg-[#f3f4f6]">
          <AlertTriangle className="size-[18px] text-[#4a5565]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-[#1e2939]">{a.titre}</span>
          <span className="block text-xs font-medium text-[#99a1af]">{a.detail}</span>
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
              className={cn(
                "size-2 rounded-full",
                i === alerte ? "bg-[#1e2939]" : "bg-[#d1d5dc]",
              )}
            />
          ))}
          <ChevronRight className="size-3.5 text-[#99a1af]" />
        </span>
      </button>

      <div className="grid gap-4 md:grid-cols-3">
        {cartes.map((c) => (
          <article
            key={c.titre}
            className="flex flex-col rounded-2xl border border-[#e5e7eb] bg-white p-5"
          >
            <div className="flex items-start justify-between">
              <span className="flex size-10 items-center justify-center rounded-[14px] bg-[#f3f4f6]">
                <c.icone className="size-5 text-[#4a5565]" />
              </span>
              <div className="text-right">
                <p className="text-2xl leading-8 text-[#1e2939]">{c.n}</p>
                <p className="text-[10px] text-[#99a1af]">documents</p>
              </div>
            </div>
            <h2 className="mt-4 text-sm font-medium text-[#1e2939]">{c.titre}</h2>
            <p className="mt-1 text-xs text-[#6a7282]">{c.desc}</p>
            <button
              type="button"
              onClick={() => onAcceder(c.vue)}
              className="mt-4 inline-flex items-center gap-1 text-xs text-[#4a5565]"
            >
              Accéder <ArrowRight className="size-2.5" />
            </button>
          </article>
        ))}
      </div>

      <section className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
        <header className="flex items-center gap-3 border-b border-[#f3f4f6] px-5 py-4">
          <span className="flex size-8 items-center justify-center rounded-[10px] bg-[#f3f4f6]">
            <Clock className="size-3.5 text-[#4a5565]" />
          </span>
          <div>
            <p className="text-sm text-[#1e2939]">Activité récente</p>
            <p className="text-[10px] text-[#99a1af]">Derniers documents consultés ou modifiés</p>
          </div>
        </header>
        <ul>
          {ACTIVITE_RECENTE.filter(
            (a) =>
              !recherche.trim() || a.titre.toLowerCase().includes(recherche.trim().toLowerCase()),
          ).map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 border-b border-[#f3f4f6] px-5 py-3.5 last:border-b-0"
            >
              <span className="flex size-8 items-center justify-center rounded-[10px] bg-[#f3f4f6]">
                <FileText className="size-3.5 text-[#4a5565]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[#1e2939]">{a.titre}</p>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-[#99a1af]">
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px]",
                      a.statut === "Créé"
                        ? "bg-[#1e2939] text-white"
                        : "border border-[#e5e7eb] text-[#6a7282]",
                    )}
                  >
                    {a.statut}
                  </span>
                  {a.detail}
                </p>
              </div>
              <button type="button" className="text-[#99a1af]" aria-label="Voir">
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
  onFiche,
  onPhotos,
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
  onFiche: () => void;
  onPhotos: (t: string) => void;
}) {
  const toggle = (id: string) =>
    onSelection(selection.includes(id) ? selection.filter((x) => x !== id) : [...selection, id]);
  const tous = () =>
    onSelection(selection.length === docs.length ? [] : docs.map((d) => d.id));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onRetour}
            className="mt-1 flex size-8 items-center justify-center rounded-[10px] border border-[#e5e7eb] text-[#4a5565]"
            aria-label="Retour"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <div>
            <h2 className="text-lg text-[#1e2939]">{titre}</h2>
            <p className="text-xs text-[#99a1af]">{sousTitre}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">{actionsEntete}</div>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
        {onglets}
        {bandeau && (
          <p className="border-b border-[#f3f4f6] bg-[#f9fafb]/60 px-5 py-2.5 text-xs text-[#99a1af]">
            {bandeau}
          </p>
        )}
        <div className="space-y-2 border-b border-[#f3f4f6] p-4">
          <div className="flex gap-2">
            <BtnOutline onClick={onFiltres}>
              <Home className="size-2.5" /> Tous
            </BtnOutline>
            <label className="flex h-[34px] flex-1 items-center gap-2 rounded-[10px] border border-[#e5e7eb] px-3">
              <Search className="size-3 text-[#99a1af]" />
              <input
                value={recherche}
                onChange={(e) => onRecherche(e.target.value)}
                placeholder="Rechercher un document…"
                className="h-full w-full bg-transparent text-xs text-[#1e2939] outline-none placeholder:text-[#99a1af]"
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

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-b border-[#f3f4f6] text-[#6a7282]">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={docs.length > 0 && selection.length === docs.length}
                    onChange={tous}
                    aria-label="Tout sélectionner"
                  />
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
                <tr key={d.id} className="border-b border-[#f3f4f6] last:border-b-0">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selection.includes(d.id)}
                      onChange={() => toggle(d.id)}
                      aria-label={d.titre}
                    />
                  </td>
                  <td className="px-2 py-3">
                    <span className="inline-flex items-center gap-2 text-sm text-[#1e2939]">
                      <span className="flex size-7 items-center justify-center rounded-[8px] bg-[#f3f4f6]">
                        <FileText className="size-3 text-[#4a5565]" />
                      </span>
                      {d.titre}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <BadgeType>{d.type}</BadgeType>
                  </td>
                  <td className="px-2 py-3 text-[#4a5565]">{d.logement}</td>
                  <td className="px-2 py-3 text-[#4a5565]">{d.date}</td>
                  <td className="px-2 py-3 text-[#4a5565]">{d.taille}</td>
                  <td className="px-2 py-3 text-[#4a5565]">{d.modifiePar}</td>
                  <td className="px-2 py-3">
                    {d.photos > 0 ? (
                      <button
                        type="button"
                        onClick={() => onPhotos(d.titre)}
                        className="inline-flex items-center gap-1 text-[#4a5565]"
                      >
                        <Camera className="size-3" /> {d.photos}
                      </button>
                    ) : (
                      <span className="text-[#99a1af]">—</span>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          d.titre.includes("intervention") ? onFiche() : onPhotos(d.titre)
                        }
                        className="flex size-7 items-center justify-center rounded-[8px] text-[#4a5565]"
                        aria-label="Voir"
                      >
                        <Eye className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        className="flex size-7 items-center justify-center rounded-[8px] text-[#4a5565]"
                        aria-label="Télécharger"
                      >
                        <Download className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        className="flex size-7 items-center justify-center rounded-[8px] text-[#4a5565]"
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
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f3f4f6] px-4 py-3">
          <div className="flex flex-wrap gap-2">
            <BtnOutline disabled={selection.length === 0}>
              <Trash2 className="size-3" /> Supprimer ({selection.length})
            </BtnOutline>
            <BtnOutline>Extraire la liste</BtnOutline>
            <BtnOutline>Envoyer</BtnOutline>
          </div>
          <p className="text-xs text-[#99a1af]">{docs.length} documents</p>
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
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onRetour}
            className="mt-1 flex size-8 items-center justify-center rounded-[10px] border border-[#e5e7eb] text-[#4a5565]"
            aria-label="Retour"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <div>
            <h2 className="text-lg text-[#1e2939]">Inventaire des prestations</h2>
            <p className="text-xs text-[#99a1af]">
              Photos de preuve déposées par les prestataires après intervention
            </p>
          </div>
        </div>
        <BtnNavy>
          <Camera className="size-3" /> Nouvelle prestation
        </BtnNavy>
      </div>
      <p className="mb-4 flex items-start gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-5 py-3 text-xs text-[#6a7282]">
        <FileText className="mt-0.5 size-3.5 shrink-0 text-[#99a1af]" />
        Chaque prestataire (ménage, plombier, jardinier…) dépose ici les photos de preuve de
        l'intervention réalisée.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {PRESTATIONS_PHOTOS.map((p) => (
          <article key={p.id} className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
            <div className="flex items-start justify-between p-4">
              <div>
                <p className="text-sm text-[#1e2939]">{p.titre}</p>
                <p className="text-xs text-[#99a1af]">{p.lieu}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded border border-[#e5e7eb] bg-[#f9fafb] px-2 py-0.5 text-[10px] text-[#4a5565]">
                {p.statut}
              </span>
            </div>
            <div className="flex items-center gap-2 border-t border-[#f3f4f6] px-4 py-2.5 text-xs text-[#6a7282]">
              <span className="flex size-6 items-center justify-center rounded-full bg-[#e5e7eb] text-[10px]">
                {p.initiales}
              </span>
              Déposé par <span className="text-[#1e2939]">{p.deposant}</span>
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
                  className="aspect-square rounded-[8px] bg-[#f3f4f6]"
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
