import { Copy, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EspaceRedaction } from "@/components/documents/EspaceRedaction";
import {
  dupliquerLivret,
  ecrireLivretsLocaux,
  lireLivretsLocaux,
  LIVRETS_INITIAUX,
  livretRenomme,
  pageRenseignee,
  type LivretAccueil,
  type PageLivret,
} from "@/data/livrets";
import { formatDateLongue } from "@/data/reservations-mo1";
import { choisirFichierComplet, confirmer, toastOk } from "@/lib/feedback";
import { cn } from "@/lib/utils";

export function LivretApp() {
  const [livrets, setLivrets] = useState<LivretAccueil[]>(LIVRETS_INITIAUX);
  const [pret, setPret] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [pageId, setPageId] = useState<string | null>(null);

  useEffect(() => {
    setLivrets(lireLivretsLocaux());
    setPret(true);
  }, []);

  useEffect(() => {
    if (pret) ecrireLivretsLocaux(livrets);
  }, [livrets, pret]);

  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return livrets;
    return livrets.filter((l) =>
      `${l.nom} ${l.reference} ${l.logement} ${l.famille}`.toLowerCase().includes(q),
    );
  }, [livrets, recherche]);

  const courant = livrets.find((l) => l.id === ouvert) ?? null;
  const pageActive = courant?.pages.find((p) => p.id === pageId) ?? courant?.pages[0] ?? null;

  const maj = (id: string, recette: (l: LivretAccueil) => LivretAccueil) => {
    setLivrets((listeActuelle) => listeActuelle.map((l) => (l.id === id ? recette(l) : l)));
  };

  const ouvrir = (livret: LivretAccueil) => {
    setOuvert(livret.id);
    setPageId(livret.pages[0]?.id ?? null);
  };

  if (courant && pageActive) {
    return (
      <Editeur
        livret={courant}
        pageActive={pageActive}
        onRetour={() => setOuvert(null)}
        onPage={setPageId}
        onChange={(recette) => maj(courant.id, recette)}
      />
    );
  }

  return (
    <section className="rounded-card border border-line bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-ink">Modèles</h2>
          <p className="mt-1 max-w-xl text-xs text-ink-muted">
            Une fois le livret créé, vous pouvez le modifier, le dupliquer et l'adapter à un
            logement. La fiche d'accès reprend codes, Wi-Fi et contact.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => importer((livret) => setLivrets((l) => [livret, ...l]))}
            className="inline-flex h-11 items-center rounded-card border border-line px-3 text-sm text-ink-body md:h-9"
          >
            Importer
          </button>
          <button
            type="button"
            onClick={() => setLivrets((l) => [creer("livret"), ...l])}
            className="inline-flex h-11 items-center gap-1 rounded-card bg-accent-teal px-3 text-sm font-medium text-white md:h-9"
          >
            <Plus className="size-3.5" /> Livret
          </button>
          <button
            type="button"
            onClick={() => setLivrets((l) => [creer("fiche"), ...l])}
            className="inline-flex h-11 items-center gap-1 rounded-card border border-line px-3 text-sm text-ink md:h-9"
          >
            <Plus className="size-3.5" /> Fiche d'accès
          </button>
        </div>
      </div>
      <label className="mt-4 flex h-11 max-w-md items-center gap-2 rounded-card border border-line px-3 text-sm md:h-9">
        <Search className="size-4 text-ink-muted" aria-hidden />
        <span className="sr-only">Rechercher</span>
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un livret ou une fiche"
          className="w-full bg-transparent text-ink outline-none"
        />
      </label>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-ink-muted">
              {["Référence", "Nom", "Type", "Logement", "Modifié", "Actions"].map((col) => (
                <th key={col} className="px-2 py-2 font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {liste.map((livret) => (
              <tr key={livret.id} className="border-b border-surface-soft">
                <td className="px-2 py-3 text-ink-muted">#{livret.reference}</td>
                <td className="px-2 py-3 font-medium text-ink">{livret.nom}</td>
                <td className="px-2 py-3 text-ink-body">
                  {livret.famille === "fiche" ? "Fiche d'accès" : "Livret d'accueil"}
                </td>
                <td className="px-2 py-3 text-ink-body">{livret.logement}</td>
                <td className="px-2 py-3 text-ink-body">
                  {formatDateLongue(livret.modifieLe)}
                  <span className="mt-0.5 block text-xs text-ink-muted">{livret.modifiePar}</span>
                </td>
                <td className="px-2 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => ouvrir(livret)}
                      className="h-11 rounded-card px-2 text-sm font-medium text-ink md:h-8"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const copie = dupliquerLivret(livret);
                        setLivrets((l) => [copie, ...l]);
                        toastOk("Modèle dupliqué.");
                      }}
                      className="inline-flex h-11 items-center gap-1 rounded-card px-2 text-sm text-ink-body md:h-8"
                    >
                      <Copy className="size-3.5" /> Dupliquer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void (async () => {
                          const ok = await confirmer({
                            titre: `Retirer « ${livret.nom} » ?`,
                            description: "Le modèle disparaît de cette liste.",
                            libelleConfirmer: "Retirer",
                            danger: true,
                          });
                          if (!ok) return;
                          setLivrets((l) => l.filter((x) => x.id !== livret.id));
                          toastOk("Modèle retiré.");
                        })();
                      }}
                      className="h-11 rounded-card px-2 text-sm text-ink-muted md:h-8"
                    >
                      Retirer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {liste.length === 0 && (
              <tr>
                <td colSpan={6} className="px-2 py-8 text-center text-sm text-ink-muted">
                  Aucun modèle pour cette recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Editeur({
  livret,
  pageActive,
  onRetour,
  onPage,
  onChange,
}: {
  livret: LivretAccueil;
  pageActive: PageLivret;
  onRetour: () => void;
  onPage: (id: string) => void;
  onChange: (recette: (l: LivretAccueil) => LivretAccueil) => void;
}) {
  const majPage = (partiel: Partial<PageLivret>) => {
    onChange((l) => ({
      ...l,
      modifieLe: new Date().toISOString().slice(0, 10),
      pages: l.pages.map((p) => (p.id === pageActive.id ? { ...p, ...partiel } : p)),
    }));
  };

  return (
    <div className="space-y-3">
      <button type="button" onClick={onRetour} className="text-sm font-medium text-ink-body">
        ← Tous les modèles
      </button>
      <label className="block max-w-xl text-xs text-ink-muted">
        Renommez ce livret
        <input
          value={livret.nom}
          onChange={(e) => onChange((l) => livretRenomme(l, e.target.value))}
          className="mt-1 h-11 w-full rounded-card border border-line px-3 text-sm text-ink outline-none md:h-9"
        />
      </label>
      <EspaceRedaction
        titre={livret.nom}
        badge={livret.famille === "fiche" ? "Fiche d'accès" : "Livret"}
        sousTitre={`${livret.logement} · #${livret.reference}`}
        pages={livret.pages.map((p) => ({
          id: p.id,
          label: p.nom,
          detail: pageRenseignee(p) ? "Renseignée" : "À compléter",
          fait: pageRenseignee(p),
        }))}
        pageActive={pageActive.id}
        onPage={onPage}
        unite="pages renseignées"
        onAjouter={() => {
          const id = `page-${Date.now().toString(36)}`;
          onChange((l) => ({
            ...l,
            pages: [...l.pages, { id, nom: "Nouvelle page", titre: "", sousTitre: "", texte: "" }],
          }));
          onPage(id);
        }}
        libelleAjouter="Ajouter une page"
        pied={
          <p className="mt-4 rounded-card bg-surface px-3 py-2 text-[11px] leading-relaxed text-ink-muted">
            Personnalisez la première page, le logo et le texte d'introduction. L'aperçu à droite
            suit la couleur de fond.
          </p>
        }
        apercu={
          <article style={{ background: livret.couleurFond }} className="rounded-card p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.4px] text-ink-muted">
              {livret.logo || "Logo"}
            </p>
            <h3 className="mt-6 font-display text-2xl text-ink">{pageActive.titre || "Titre"}</h3>
            <p className="mt-1 text-sm text-ink-body">{pageActive.sousTitre || "Sous-titre"}</p>
            <p className="mt-4 text-sm leading-relaxed text-ink">
              {pageActive.texte || "Texte d'introduction"}
            </p>
          </article>
        }
      />
      <div className="grid gap-3 rounded-card border border-line bg-white p-4 sm:grid-cols-2">
        <label className="block text-xs text-ink-muted">
          Nom de la page
          <input
            value={pageActive.nom}
            onChange={(e) => majPage({ nom: e.target.value })}
            className="mt-1 h-11 w-full rounded-card border border-line px-3 text-sm text-ink outline-none md:h-9"
          />
        </label>
        <label className="block text-xs text-ink-muted">
          Logo
          <input
            value={livret.logo}
            onChange={(e) => onChange((l) => ({ ...l, logo: e.target.value }))}
            className="mt-1 h-11 w-full rounded-card border border-line px-3 text-sm text-ink outline-none md:h-9"
          />
        </label>
        <label className="block text-xs text-ink-muted">
          Titre principal
          <input
            value={pageActive.titre}
            onChange={(e) => majPage({ titre: e.target.value })}
            className="mt-1 h-11 w-full rounded-card border border-line px-3 text-sm text-ink outline-none md:h-9"
          />
        </label>
        <label className="block text-xs text-ink-muted">
          Sous-titre
          <input
            value={pageActive.sousTitre}
            onChange={(e) => majPage({ sousTitre: e.target.value })}
            className="mt-1 h-11 w-full rounded-card border border-line px-3 text-sm text-ink outline-none md:h-9"
          />
        </label>
        <label className="block text-xs text-ink-muted sm:col-span-2">
          Texte d'introduction
          <textarea
            value={pageActive.texte}
            onChange={(e) => majPage({ texte: e.target.value })}
            className="mt-1 h-28 w-full rounded-card border border-line px-3 py-2 text-sm text-ink outline-none"
          />
        </label>
        <label className="flex items-center gap-3 text-xs text-ink-muted">
          Couleur de fond
          <input
            type="color"
            value={couleurValide(livret.couleurFond)}
            onChange={(e) => onChange((l) => ({ ...l, couleurFond: e.target.value }))}
            className={cn(
              "h-11 w-16 cursor-pointer rounded-card border border-line bg-white md:h-9",
            )}
          />
        </label>
      </div>
    </div>
  );
}

function couleurValide(valeur: string) {
  return /^#[0-9a-fA-F]{6}$/.test(valeur) ? valeur : "#f7f6f2";
}

function creer(famille: "livret" | "fiche"): LivretAccueil {
  const maintenant = new Date();
  const id = `${famille}-${maintenant.getTime().toString(36)}`;
  return {
    id,
    nom: famille === "fiche" ? "Nouvelle fiche d'accès" : "Nouveau livret d'accueil",
    reference:
      famille === "fiche" ? `ACC${id.slice(-4).toUpperCase()}` : `LIV${id.slice(-4).toUpperCase()}`,
    famille,
    logement: "",
    modifiePar: "Équipe Hublify",
    modifieLe: maintenant.toISOString().slice(0, 10),
    couleurFond: famille === "fiche" ? "#f0f3fc" : "#f7f6f2",
    logo: "Hublify",
    pages: [
      {
        id: "accueil",
        nom: famille === "fiche" ? "Accès" : "Page d'accueil",
        titre: "",
        sousTitre: "",
        texte: "",
      },
    ],
  };
}

function importer(onCree: (livret: LivretAccueil) => void) {
  choisirFichierComplet((fichier) => {
    const livret = creer("livret");
    livret.nom = fichier.nom.replace(/\.[^.]+$/, "");
    const texte =
      fichier.mime.startsWith("text/") || fichier.nom.endsWith(".txt")
        ? decoder(fichier.base64)
        : `Pièce jointe importée : ${fichier.nom}`;
    livret.pages[0] = {
      ...livret.pages[0]!,
      titre: livret.nom,
      texte,
    };
    onCree(livret);
    toastOk("Modèle importé. Vous pouvez le modifier.");
  });
}

function decoder(base64: string) {
  try {
    const binaire = atob(base64);
    const octets = Uint8Array.from(binairesVersOctets(binaire));
    return new TextDecoder().decode(octets).slice(0, 4000);
  } catch {
    return "";
  }
}

function* binairesVersOctets(binaire: string) {
  for (let i = 0; i < binaire.length; i += 1) yield binaire.charCodeAt(i);
}
