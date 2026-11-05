import { useDroit } from "@/auth/auth-context";
import { useNavigate } from "@tanstack/react-router";
import {
  Building2,
  Copy,
  Download,
  Eye,
  Home,
  Pencil,
  Plus,
  SlidersHorizontal,
  Star,
  Trash2,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { AlerteLieu } from "@/components/patrimoine/AlerteLieu";
import { ContratGestionDialog } from "@/components/patrimoine/ContratGestionDialog";
import { ConfigLieuDialog } from "@/components/patrimoine/ConfigLieuDialog";
import { FicheLieuDialog } from "@/components/patrimoine/FicheLieuDialog";
import { BtnNavy, BtnOutline } from "@/components/documents/ui";
import { ScrollHint } from "@/components/layout/ScrollHint";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { type LogementPatrimoine } from "@/data/documents-mo1";
import type { ImmeubleSession } from "@/data/etat-session";
import {
  USAGES,
  accesVide,
  alertesLieu,
  ficheEffective,
  ficheVierge,
  libelleCourt,
  libelleUsage,
  patchBienDepuisFiche,
  useFichesLieu,
  type AccesSaisie,
  type UsageLieu,
} from "@/data/patrimoine-fiche";
import { chargerAccesLieux, sauverAccesLieu } from "@/data/session-remote";
import { ajouterBien, idNouveau, poserCollection, retirerBien, useSession } from "@/data/session";
import { copierTexte, confirmer, telechargerDemo, toastErreur, toastOk } from "@/lib/feedback";
import {
  exporterAnnonces,
  ficheDepuisOccupation,
  importerAnnonces,
  type OccupationLieu,
} from "@/lib/gestionnaire-planning";
import { cn } from "@/lib/utils";

type FiltreStatut = "tous" | "loué" | "libre" | "en travaux";

function initialesDe(nom: string) {
  return nom
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function Etoiles({ note }: { note: number }) {
  const pleines = Math.round(note);
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-body">
      <span className="inline-flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn("size-2.5", i < pleines ? "fill-ink text-ink" : "text-line-strong")}
          />
        ))}
      </span>
      {note.toFixed(1)}
    </span>
  );
}

function BadgeStatut({ statut }: { statut: string }) {
  if (statut === "loué" || statut === "actif") {
    return <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs text-white">{statut}</span>;
  }
  if (statut === "libre") {
    return (
      <span className="rounded-full border border-line px-2.5 py-0.5 text-xs text-ink">
        {statut}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-surface-soft px-2.5 py-0.5 text-xs text-ink-body">
      {statut}
    </span>
  );
}

export function PatrimoineApp({
  logementCible,
  edition,
}: {
  logementCible?: string;
  /** Force l'édition (aperçu). À défaut, le droit « mod-biens » décide. */
  edition?: boolean;
}) {
  const navigate = useNavigate();
  const session = useSession();
  const peutModDroit = useDroit("mod-biens");
  const peutMod = edition ?? peutModDroit;
  const { fiches, typesPerso, sauver, retirer, ajouterType } = useFichesLieu();
  const [selLog, setSelLog] = useState<string[]>([]);
  const [selImm, setSelImm] = useState<string[]>([]);
  const [ficheId, setFicheId] = useState<string | null>(null);
  const [sectionFiche, setSectionFiche] = useState<"welcome" | "cles" | null>(null);
  const [contratOuvert, setContratOuvert] = useState(false);
  const immeubles = session.immeubles;
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>("tous");
  const [filtreUsage, setFiltreUsage] = useState<"tous" | UsageLieu>("tous");
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  const [creerConfig, setCreerConfig] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);
  const [ajouterImm, setAjouterImm] = useState(false);
  const [nomImm, setNomImm] = useState("");
  const [adresseImm, setAdresseImm] = useState("");
  const [configs, setConfigs] = useState<Record<string, AccesSaisie>>({});

  // Le bien porte toute sa fiche : plus de fusion par nom avec un jeu de maquette.
  const logements = useMemo<LogementPatrimoine[]>(() => {
    const nomImmeuble = new Map(session.immeubles.map((i) => [i.id, i.nom]));
    return session.biens.map((b) => ({
      id: b.id,
      nom: b.nom,
      typologie: b.typologie || "Logement",
      surface: b.surface || "—",
      meuble: b.meuble ?? true,
      proprietaire: b.proprietaire || "—",
      initiales: b.initiales || initialesDe(b.nom) || "??",
      immeuble: (b.immeubleId ? nomImmeuble.get(b.immeubleId) : undefined) ?? "—",
      adresse: b.adresse || "—",
      note: b.note ?? 5,
      statut: b.statut ?? "libre",
    }));
  }, [session.biens, session.immeubles]);

  const fichesEffectives = useMemo(() => {
    const map = new Map<string, ReturnType<typeof ficheEffective>>();
    for (const b of session.biens) map.set(b.id, ficheEffective(b, fiches));
    return map;
  }, [session.biens, fiches]);

  const visibles = logements.filter((l) => {
    if (filtreStatut !== "tous" && l.statut !== filtreStatut) return false;
    if (filtreUsage === "tous") return true;
    return fichesEffectives.get(l.id)?.usage === filtreUsage;
  });
  const bienFiche = session.biens.find((b) => b.id === ficheId) ?? null;

  // Les codes d'accès sont chiffrés en base : ils arrivent par le serveur, pas
  // par le rendu initial.
  useEffect(() => {
    let vivant = true;
    void chargerAccesLieux().then((res) => {
      if (!vivant || !res.ok) return;
      const parBien: Record<string, AccesSaisie> = {};
      for (const a of res.acces) {
        parBien[a.bienId] = {
          codeCles: a.codeCles,
          wifi: a.wifi,
          wifiMdp: a.wifiMdp,
          alarme: a.alarme,
          consignes: a.consignes,
        };
      }
      setConfigs(parBien);
    });
    return () => {
      vivant = false;
    };
  }, []);

  useEffect(() => {
    if (!logementCible) return;
    const match = logements.find(
      (l) =>
        l.id === logementCible ||
        session.biens.some(
          (b) => b.id === logementCible && b.nom.toLowerCase() === l.nom.toLowerCase(),
        ),
    );
    if (!match) return;
    setSelLog([match.id]);
    requestAnimationFrame(() => {
      const desktop = window.matchMedia("(min-width: 768px)").matches;
      const el = document.getElementById(
        desktop ? `lieu-table-${match.id}` : `lieu-mobile-${match.id}`,
      );
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }, [logementCible, logements, session.biens]);

  const ouvrirFiche = (id: string, section: "welcome" | "cles" | null = null) => {
    setSectionFiche(section);
    setFicheId(id);
  };

  const gestionnaires = useMemo(() => {
    const noms = new Set<string>();
    for (const m of session.membres) {
      const nom = `${m.prenom} ${m.nom}`.trim();
      if (nom) noms.add(nom);
    }
    for (const l of logements) {
      if (l.proprietaire && l.proprietaire !== "—") noms.add(l.proprietaire);
    }
    return [...noms];
  }, [session.membres, logements]);

  const alertesDe = (id: string, nom: string) => {
    const fiche = fichesEffectives.get(id);
    if (!fiche) return [];
    return alertesLieu({
      nom,
      fiche,
      codeCles: configs[id]?.codeCles ?? "",
      edl: session.edl,
      documents: session.documents,
    });
  };

  const majImmeubles = (maj: (liste: ImmeubleSession[]) => ImmeubleSession[]) =>
    poserCollection("immeubles", maj);

  const enregistrerConfig = (saisie: {
    id: string | null;
    nom: string;
    adresse: string;
    typologie: string;
    proprietaire: string;
    fiche: ReturnType<typeof ficheEffective>;
  }) => {
    if (!saisie.nom) {
      toastErreur("Donnez un nom au lieu.");
      return;
    }
    const homonyme = logements.some(
      (l) => l.nom.toLowerCase() === saisie.nom.toLowerCase() && l.id !== saisie.id,
    );
    if (homonyme) {
      toastErreur("Un lieu porte déjà ce nom.");
      return;
    }
    if (saisie.id) {
      const bien = session.biens.find((b) => b.id === saisie.id);
      if (!bien) return;
      const patch = patchBienDepuisFiche(bien, saisie);
      sauver(saisie.id, saisie.fiche);
      poserCollection("biens", (liste) =>
        liste.map((b) => (b.id === saisie.id ? { ...b, ...patch, id: b.id } : b)),
      );
      setConfigId(null);
      toastOk("Lieu enregistré.");
      return;
    }
    const id = idNouveau("bien");
    const patch = patchBienDepuisFiche({ statut: "libre", meuble: true }, saisie);
    ajouterBien({ id, baseNuit: 100, ...patch });
    sauver(id, saisie.fiche);
    setCreerConfig(false);
    toastOk(`${saisie.nom} ajouté au parc.`);
  };

  const supprimerLogements = async (ids: string[]) => {
    if (!peutMod) return;
    // Le bien est référencé en base : la suppression emporte ce qui en dépend.
    const resas = session.reservationsDossier.filter((r) => ids.includes(r.bienId)).length;
    const missions = session.missions.filter((m) => ids.includes(m.bienId)).length;
    const ok = await confirmer({
      titre: ids.length > 1 ? "Retirer ces lieux du parc ?" : "Retirer ce lieu du parc ?",
      description:
        resas + missions > 0
          ? `Cette suppression emporte aussi ${resas} réservation(s) et ${missions} mission(s) rattachées. Elle est définitive.`
          : "Le lieu disparaît du parc et des listes de sélection.",
      libelleConfirmer: "Retirer",
      danger: true,
    });
    if (!ok) return;
    ids.forEach((id) => retirerBien(id));
    retirer(ids);
    setSelLog([]);
    toastOk(ids.length > 1 ? `${ids.length} lieux retirés.` : "Lieu retiré.");
  };

  const supprimerImmeubles = async (ids: string[]) => {
    if (!peutMod || ids.length === 0) return;
    const ok = await confirmer({
      titre: ids.length > 1 ? "Retirer ces immeubles ?" : "Retirer cet immeuble ?",
      description: "Les logements rattachés restent dans le parc, sans immeuble de référence.",
      libelleConfirmer: "Retirer",
      danger: true,
    });
    if (!ok) return;
    majImmeubles((liste) => liste.filter((i) => !ids.includes(i.id)));
    setSelImm((s) => s.filter((id) => !ids.includes(id)));
    toastOk(ids.length > 1 ? `${ids.length} immeubles retirés.` : "Immeuble retiré.");
  };

  const occupationDe = (meuble: boolean, statut: string, type: string): OccupationLieu => {
    if (statut === "en travaux") return "Travaux";
    if (type.toLowerCase().includes("événement")) return "Événement";
    return meuble ? "Meublé" : "Vide";
  };

  const exporterAnnonce = () => {
    telechargerDemo(
      "annonces-hublify.csv",
      exporterAnnonces(
        visibles.map((l) => ({
          nom: l.nom,
          type: l.typologie,
          occupation: occupationDe(l.meuble, l.statut, l.typologie),
          adresse: l.adresse,
          note: l.note,
        })),
      ),
    );
  };

  const exporterNotation = () => {
    const lignes = ["Nom;Note", ...visibles.map((l) => `${l.nom};${l.note.toFixed(1)}`)];
    telechargerDemo("notations-hublify.csv", lignes.join("\n"));
    toastOk("Notation extraite du parc Hublify. Les notes OTA ne sont pas lues sans API.");
  };

  const importerAnnonce = async (fichier: File) => {
    const { lignes, ignorees } = importerAnnonces(await fichier.text());
    let ajoutees = 0;
    for (const ligne of lignes) {
      if (session.biens.some((b) => b.nom.toLowerCase() === ligne.nom.toLowerCase())) continue;
      const fiche = ficheDepuisOccupation(ligne.type, ligne.occupation);
      ajouterBien({
        id: idNouveau("bien"),
        nom: ligne.nom,
        baseNuit: 100,
        typologie: fiche.typologie,
        statut: fiche.statut,
        meuble: fiche.meuble,
        note: ligne.note,
        initiales: initialesDe(ligne.nom) || "??",
        ...(ligne.adresse ? { adresse: ligne.adresse } : {}),
      });
      ajoutees += 1;
    }
    toastOk(
      `${ajoutees} annonce${ajoutees > 1 ? "s" : ""} importée${ajoutees > 1 ? "s" : ""}${ignorees ? `, ${ignorees} ligne${ignorees > 1 ? "s" : ""} ignorée${ignorees > 1 ? "s" : ""}` : ""}.`,
    );
  };

  const exporterLogements = () => {
    const lignes = [
      "Nom;Typologie;Adresse;Statut;Proprietaire",
      ...visibles.map((l) => `${l.nom};${l.typologie};${l.adresse};${l.statut};${l.proprietaire}`),
    ];
    telechargerDemo("lieux-hublify.csv", lignes.join("\n"));
  };

  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="text-4xl font-normal text-ink">Lieux</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-ink-subtle">
          Gérez votre patrimoine immobilier : logements, immeubles, lieux d'événements
        </p>
        {peutMod && (
          <div className="mt-4 flex flex-col items-stretch justify-center gap-2 sm:flex-row">
            <BtnNavy className="h-11 px-5 text-sm md:h-10" onClick={() => setCreerConfig(true)}>
              <Plus className="size-3.5" /> Ajouter un lieu ou logement
            </BtnNavy>
            <BtnNavy className="h-11 px-5 text-sm md:h-10" onClick={() => setContratOuvert(true)}>
              <Plus className="size-3.5" /> Ajouter un contrat de gestion
            </BtnNavy>
          </div>
        )}
      </div>

      <section className="@container mb-4 overflow-hidden rounded-card border border-line bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-soft px-5 py-4">
          <p className="flex items-center gap-2 text-sm text-ink">
            <Home className="size-4" />
            Lieux et logements
            <span className="rounded bg-surface-soft px-1.5 text-xs text-ink-subtle">
              {visibles.length}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            <BtnOutline onClick={() => setFiltresOuverts((v) => !v)}>
              <SlidersHorizontal className="size-3" /> Filtres
            </BtnOutline>
            {peutMod && (
              <BtnOutline disabled={selLog.length === 0} onClick={() => supprimerLogements(selLog)}>
                <Trash2 className="size-3" /> Supprimer
              </BtnOutline>
            )}
            <BtnOutline onClick={exporterLogements}>
              <Download className="size-3" /> Exporter
            </BtnOutline>
            <BtnOutline onClick={exporterAnnonce}>
              <Download className="size-3" /> Annonce
            </BtnOutline>
            <BtnOutline onClick={exporterNotation}>
              <Star className="size-3" /> Notation
            </BtnOutline>
            {peutMod && (
              <label className="inline-flex h-11 cursor-pointer items-center rounded-card border border-line px-3 text-sm text-ink-body md:h-9">
                Importer
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={(e) => {
                    const fichier = e.target.files?.[0];
                    e.target.value = "";
                    if (fichier) void importerAnnonce(fichier);
                  }}
                />
              </label>
            )}
            {peutMod && (
              <BtnNavy onClick={() => setCreerConfig(true)}>
                <Plus className="size-3" /> Ajouter
              </BtnNavy>
            )}
          </div>
        </header>
        {filtresOuverts && (
          <div className="border-b border-surface-soft px-5 py-3">
            <label className="text-xs text-ink-muted">
              Statut
              <select
                value={filtreStatut}
                onChange={(e) => setFiltreStatut(e.target.value as FiltreStatut)}
                className="ml-2 h-11 rounded-card border border-line bg-white px-2 text-sm text-ink md:h-9"
              >
                <option value="tous">Tous</option>
                <option value="loué">Loué</option>
                <option value="libre">Libre</option>
                <option value="en travaux">En travaux</option>
              </select>
            </label>
            <label className="text-xs text-ink-muted">
              Mode
              <select
                value={filtreUsage}
                onChange={(e) => setFiltreUsage(e.target.value as "tous" | UsageLieu)}
                className="ml-2 h-11 rounded-card border border-line bg-white px-2 text-sm text-ink md:h-9"
              >
                <option value="tous">Tous</option>
                {USAGES.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        <div className="divide-y divide-surface-soft @min-[920px]:hidden">
          {visibles.map((l) => (
            <article
              key={l.id}
              id={`lieu-mobile-${l.id}`}
              className={cn("px-4 py-4", selLog.includes(l.id) && "bg-surface")}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-ink">{l.nom}</p>
                  <p className="text-xs text-ink-muted">
                    {libelleCourt(l.typologie)} · {l.surface}
                  </p>
                  <p className="mt-1 text-xs text-ink-subtle">{l.adresse}</p>
                </div>
                <span className="flex items-center gap-1">
                  <AlerteLieu
                    nom={l.nom}
                    alertes={alertesDe(l.id, l.nom)}
                    onCompleter={(section) => ouvrirFiche(l.id, section)}
                  />
                  <BadgeStatut statut={l.statut} />
                </span>
              </div>
              <label className="mt-2 flex min-h-11 items-center gap-2 text-xs text-ink-muted">
                <input
                  type="checkbox"
                  checked={selLog.includes(l.id)}
                  onChange={() =>
                    setSelLog((s) =>
                      s.includes(l.id) ? s.filter((x) => x !== l.id) : [...s, l.id],
                    )
                  }
                  aria-label={`Sélectionner ${l.nom}`}
                />
                Sélectionner
              </label>
              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => ouvrirFiche(l.id)}
                  className="inline-flex h-11 items-center justify-center rounded-card border border-line text-xs font-medium text-ink-body"
                >
                  Configurer
                </button>
                <button
                  type="button"
                  onClick={() => setConfigId(l.id)}
                  className="inline-flex h-11 items-center justify-center rounded-card border border-line text-xs font-medium text-ink-body"
                >
                  Fiche config
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void navigate({
                      to: "/documents",
                      search: { vue: "logements", logement: l.nom },
                    })
                  }
                  className="inline-flex h-11 items-center justify-center rounded-card border border-line text-xs font-medium text-ink-body"
                >
                  Voir docs
                </button>
              </div>
            </article>
          ))}
        </div>
        <ScrollHint className="hidden @min-[920px]:block">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-b border-surface-soft text-ink-subtle">
              <tr>
                <th className="w-12 px-4 py-3" />
                <th className="px-2 py-3 font-medium">Logement</th>
                <th className="px-2 py-3 font-medium">Propriétaire</th>
                <th className="px-2 py-3 font-medium">Immeuble</th>
                <th className="px-2 py-3 font-medium">Adresse</th>
                <th className="px-2 py-3 font-medium">Notation</th>
                <th className="px-2 py-3 font-medium">Statut</th>
                <th className="px-2 py-3 font-medium">Documents</th>
                <th className="px-2 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((l) => (
                <tr
                  key={l.id}
                  id={`lieu-table-${l.id}`}
                  data-lieu={l.id}
                  className={cn(
                    "border-b border-surface-soft last:border-b-0",
                    selLog.includes(l.id) && "bg-surface",
                  )}
                >
                  <td className="px-4 py-4">
                    <label className="flex min-h-11 items-center md:min-h-0">
                      <input
                        type="checkbox"
                        checked={selLog.includes(l.id)}
                        onChange={() =>
                          setSelLog((s) =>
                            s.includes(l.id) ? s.filter((x) => x !== l.id) : [...s, l.id],
                          )
                        }
                        aria-label={`Sélectionner ${l.nom}`}
                      />
                    </label>
                  </td>
                  <td className="px-2 py-4">
                    <div className="flex items-start gap-2">
                      <span className="mt-1 flex size-7 items-center justify-center rounded-[8px] bg-surface-soft">
                        <Home className="size-3 text-ink-body" />
                      </span>
                      <div>
                        <p className="text-sm text-ink">{l.nom}</p>
                        <p className="text-[11px] text-ink-muted">
                          {libelleCourt(l.typologie)} · {l.surface}
                        </p>
                        <span className="mt-0.5 inline-block rounded border border-line px-1.5 text-[10px] text-ink-subtle">
                          {libelleUsage(
                            fichesEffectives.get(l.id)?.usage ?? (l.meuble ? "meublé" : "vide"),
                          )}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-4">
                    <span className="inline-flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-line text-[10px] text-ink-body">
                        {l.initiales}
                      </span>
                      {l.proprietaire}
                    </span>
                  </td>
                  <td className="px-2 py-4 text-ink-body">{l.immeuble}</td>
                  <td className="px-2 py-4 text-ink-body">{l.adresse}</td>
                  <td className="px-2 py-4">
                    <span className="inline-flex items-center gap-1">
                      <AlerteLieu
                        nom={l.nom}
                        alertes={alertesDe(l.id, l.nom)}
                        onCompleter={(section) => ouvrirFiche(l.id, section)}
                      />
                      <Etoiles note={l.note} />
                    </span>
                  </td>
                  <td className="px-2 py-4">
                    <BadgeStatut statut={l.statut} />
                  </td>
                  <td className="px-2 py-4">
                    <BtnOutline
                      className="h-[30px]"
                      onClick={() =>
                        void navigate({
                          to: "/documents",
                          search: { vue: "logements", logement: l.nom },
                        })
                      }
                    >
                      <Eye className="size-2.5" /> Voir docs
                    </BtnOutline>
                  </td>
                  <td className="px-2 py-4">
                    <div className="flex justify-end gap-1 text-ink-body">
                      <button
                        type="button"
                        aria-label={`Configurer ${l.nom}`}
                        onClick={() => ouvrirFiche(l.id)}
                        className="flex size-6 items-center justify-center rounded hover:bg-surface-soft"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Fiche config ${l.nom}`}
                        onClick={() => setConfigId(l.id)}
                        className="flex size-6 items-center justify-center rounded hover:bg-surface-soft"
                      >
                        <SlidersHorizontal className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Copier l'adresse de ${l.nom}`}
                        onClick={() => copierTexte(l.adresse, "Adresse copiée.")}
                        className="flex size-6 items-center justify-center rounded hover:bg-surface-soft"
                      >
                        <Copy className="size-3.5" />
                      </button>
                      {peutMod && (
                        <button
                          type="button"
                          aria-label={`Supprimer ${l.nom}`}
                          onClick={() => supprimerLogements([l.id])}
                          className="flex size-6 items-center justify-center rounded hover:bg-surface-soft"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollHint>
        {visibles.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-ink-muted">
            {filtreStatut === "tous"
              ? "Aucun lieu dans le parc. Utilisez « Ajouter » pour en créer un."
              : `Aucun lieu au statut « ${filtreStatut} ».`}
          </p>
        )}
        <p className="px-5 py-3 text-xs text-ink-muted">{visibles.length} logements</p>
      </section>

      <section className="@container overflow-hidden rounded-card border border-line bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-soft px-5 py-4">
          <p className="flex items-center gap-2 text-sm text-ink">
            <Building2 className="size-4" />
            Immeubles
            <span className="rounded-full bg-surface-soft px-2 py-0.5 text-xs text-ink-subtle">
              Bientôt disponible
            </span>
            <span className="rounded bg-surface-soft px-1.5 text-xs text-ink-subtle">
              {immeubles.length}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {peutMod && (
              <BtnOutline
                disabled={selImm.length === 0}
                onClick={() => void supprimerImmeubles(selImm)}
              >
                <Trash2 className="size-3" /> Supprimer
              </BtnOutline>
            )}
            <BtnOutline
              onClick={() => {
                const lignes = [
                  "Nom;Adresse;Logements;Proprietaire;Statut",
                  ...immeubles.map(
                    (i) => `${i.nom};${i.adresse};${i.logements};${i.proprietaire};${i.statut}`,
                  ),
                ];
                telechargerDemo("immeubles-hublify.csv", lignes.join("\n"));
              }}
            >
              <Download className="size-3" /> Exporter
            </BtnOutline>
            {peutMod && (
              <BtnNavy onClick={() => setAjouterImm(true)}>
                <Plus className="size-3" /> Ajouter
              </BtnNavy>
            )}
          </div>
        </header>
        <div className="divide-y divide-surface-soft @min-[740px]:hidden">
          {immeubles.map((i) => (
            <article key={i.id} className="px-4 py-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-ink">{i.nom}</p>
                  <p className="text-xs text-ink-muted">
                    {i.logements} logements · {i.proprietaire}
                  </p>
                  <p className="mt-1 text-xs text-ink-subtle">{i.adresse}</p>
                </div>
                <BadgeStatut statut={i.statut} />
              </div>
              <label className="mt-2 flex min-h-11 items-center gap-2 text-xs text-ink-muted">
                <input
                  type="checkbox"
                  checked={selImm.includes(i.id)}
                  onChange={() =>
                    setSelImm((s) =>
                      s.includes(i.id) ? s.filter((x) => x !== i.id) : [...s, i.id],
                    )
                  }
                  aria-label={`Sélectionner ${i.nom}`}
                />
                Sélectionner
              </label>
              <div className={cn("mt-3 grid gap-2", peutMod ? "grid-cols-2" : "grid-cols-1")}>
                <button
                  type="button"
                  onClick={() => copierTexte(i.adresse, "Adresse copiée.")}
                  className="inline-flex h-11 items-center justify-center rounded-card border border-line text-xs font-medium text-ink-body"
                >
                  Copier l'adresse
                </button>
                {peutMod && (
                  <button
                    type="button"
                    onClick={() => void supprimerImmeubles([i.id])}
                    className="inline-flex h-11 items-center justify-center rounded-card border border-line text-xs font-medium text-ink-body"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
        <ScrollHint className="hidden @min-[740px]:block">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="border-b border-surface-soft text-ink-subtle">
              <tr>
                <th className="w-12 px-4 py-3" />
                <th className="px-2 py-3 font-medium">Immeuble</th>
                <th className="px-2 py-3 font-medium">Propriétaire</th>
                <th className="px-2 py-3 font-medium">Logements</th>
                <th className="px-2 py-3 font-medium">Adresse</th>
                <th className="px-2 py-3 font-medium">Statut</th>
                <th className="px-2 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {immeubles.map((i) => (
                <tr key={i.id} className="border-b border-surface-soft last:border-b-0">
                  <td className="px-4 py-4">
                    <label className="flex min-h-11 items-center md:min-h-0">
                      <input
                        type="checkbox"
                        checked={selImm.includes(i.id)}
                        onChange={() =>
                          setSelImm((s) =>
                            s.includes(i.id) ? s.filter((x) => x !== i.id) : [...s, i.id],
                          )
                        }
                        aria-label={`Sélectionner ${i.nom}`}
                      />
                    </label>
                  </td>
                  <td className="px-2 py-4">
                    <span className="inline-flex items-center gap-2 text-sm text-ink">
                      <span className="flex size-7 items-center justify-center rounded-[8px] bg-surface-soft">
                        <Building2 className="size-3 text-ink-body" />
                      </span>
                      {i.nom}
                    </span>
                  </td>
                  <td className="px-2 py-4">
                    <span className="inline-flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-line text-[10px]">
                        {i.initiales}
                      </span>
                      {i.proprietaire}
                    </span>
                  </td>
                  <td className="px-2 py-4">
                    <span className="inline-flex items-center gap-1 text-ink-body">
                      <Home className="size-3" /> {i.logements} logements
                    </span>
                  </td>
                  <td className="px-2 py-4 text-ink-body">{i.adresse}</td>
                  <td className="px-2 py-4">
                    <BadgeStatut statut={i.statut} />
                  </td>
                  <td className="px-2 py-4">
                    <div className="flex justify-end gap-1 text-ink-body">
                      <button
                        type="button"
                        aria-label={`Copier l'adresse de ${i.nom}`}
                        onClick={() => copierTexte(i.adresse, "Adresse copiée.")}
                        className="flex size-6 items-center justify-center rounded hover:bg-surface-soft"
                      >
                        <Copy className="size-3.5" />
                      </button>
                      {peutMod && (
                        <button
                          type="button"
                          aria-label={`Supprimer ${i.nom}`}
                          onClick={() => void supprimerImmeubles([i.id])}
                          className="flex size-6 items-center justify-center rounded hover:bg-surface-soft"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollHint>
        {immeubles.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-ink-muted">
            Aucun immeuble. Utilisez « Ajouter » pour en créer un.
          </p>
        )}
        <p className="px-5 py-3 text-xs text-ink-muted">{immeubles.length} immeubles</p>
      </section>

      <FicheLieuDialog
        ouvert={Boolean(bienFiche)}
        bien={bienFiche}
        fiche={
          bienFiche
            ? (fichesEffectives.get(bienFiche.id) ?? ficheEffective(bienFiche, fiches))
            : ficheVierge()
        }
        acces={ficheId ? (configs[ficheId] ?? accesVide()) : accesVide()}
        immeubles={session.immeubles}
        gestionnaires={gestionnaires}
        typesPerso={typesPerso}
        peutMod={peutMod}
        section={sectionFiche}
        onFermer={() => setFicheId(null)}
        onAjouterType={ajouterType}
        onEnregistrer={(saisie) => {
          if (!ficheId || !bienFiche) return;
          const patch = patchBienDepuisFiche(bienFiche, {
            nom: saisie.nom,
            typologie: saisie.typologie,
            adresse: saisie.adresse,
            proprietaire: saisie.proprietaire,
            fiche: saisie.fiche,
          });
          sauver(ficheId, saisie.fiche);
          poserCollection("biens", (liste) =>
            liste.map((b) => (b.id === ficheId ? { ...b, ...patch, id: b.id } : b)),
          );
          void sauverAccesLieu({ data: { bienId: ficheId, ...saisie.acces } }).then((res) => {
            if (!res.ok) {
              toastErreur(
                res.raison === "non_configure"
                  ? "Fiche enregistrée. Les codes ne le sont pas : le chiffrement n'est pas configuré."
                  : "Fiche enregistrée. Les codes ne le sont pas : la base est injoignable.",
              );
            } else {
              toastOk("Lieu enregistré.");
            }
            setConfigs((c) => ({ ...c, [ficheId]: saisie.acces }));
          });
          setFicheId(null);
        }}
      />

      <ContratGestionDialog
        ouvert={contratOuvert}
        logements={logements}
        gestionnaires={gestionnaires}
        onFermer={() => setContratOuvert(false)}
        onEnregistrer={(bienId, mandat) => {
          const bien = session.biens.find((b) => b.id === bienId);
          if (!bien) return;
          const actuelle = ficheEffective(bien, fiches);
          sauver(bienId, {
            ...actuelle,
            gestionnaire: mandat.gestionnaire,
            mandat,
            accesProprietaire: mandat.signe
              ? { financier: false, calendrier: false, messagerie: false, documents: false }
              : actuelle.accesProprietaire,
          });
          poserCollection("biens", (liste) =>
            liste.map((b) =>
              b.id === bienId
                ? {
                    ...b,
                    proprietaire: mandat.proprietaire,
                    initiales: initialesDe(mandat.proprietaire),
                  }
                : b,
            ),
          );
          setContratOuvert(false);
          toastOk(
            mandat.signe
              ? "Mandat signé. L'accès se limite au gestionnaire en charge."
              : "Contrat de gestion enregistré.",
          );
        }}
      />

      <ConfigLieuDialog
        ouvert={creerConfig || Boolean(configId)}
        bien={configId ? (session.biens.find((b) => b.id === configId) ?? null) : null}
        fiches={fiches}
        immeubles={session.immeubles}
        onFermer={() => {
          setCreerConfig(false);
          setConfigId(null);
        }}
        onEnregistrer={enregistrerConfig}
      />

      <Dialog open={ajouterImm} onOpenChange={(o) => !o && setAjouterImm(false)}>
        <DialogContent className="max-w-md">
          <DialogTitle>Ajouter un immeuble</DialogTitle>
          <DialogDescription>Regroupe plusieurs logements à la même adresse.</DialogDescription>
          <label className="mt-3 block text-xs text-ink-muted">
            Nom
            <input
              value={nomImm}
              onChange={(e) => setNomImm(e.target.value)}
              className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
            />
          </label>
          <label className="mt-3 block text-xs text-ink-muted">
            Adresse
            <input
              value={adresseImm}
              onChange={(e) => setAdresseImm(e.target.value)}
              className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
            />
          </label>
          <BtnNavy
            className="mt-4 w-full justify-center"
            onClick={() => {
              const nom = nomImm.trim();
              if (!nom) {
                toastErreur("Donnez un nom à l'immeuble.");
                return;
              }
              majImmeubles((liste) => [
                {
                  id: idNouveau("imm"),
                  nom,
                  proprietaire: "Vous",
                  initiales: initialesDe(nom) || "??",
                  logements: 0,
                  adresse: adresseImm.trim() || "—",
                  statut: "actif" as const,
                },
                ...liste,
              ]);
              setNomImm("");
              setAdresseImm("");
              setAjouterImm(false);
              toastOk("Immeuble ajouté.");
            }}
          >
            Enregistrer
          </BtnNavy>
        </DialogContent>
      </Dialog>
    </div>
  );
}
