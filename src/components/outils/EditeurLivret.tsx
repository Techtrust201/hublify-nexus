import {
  Bold,
  Camera,
  ChevronLeft,
  Download,
  Eye,
  Italic,
  Link2,
  Monitor,
  Plus,
  Smartphone,
  Trash2,
  Underline,
} from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import type { LivretAccueil, PageLivret } from "@/data/livrets";
import { pageRenseignee } from "@/data/livrets";
import { useSession } from "@/data/session";
import { choisirFichierComplet, telechargerDemo } from "@/lib/feedback";
import { cn } from "@/lib/utils";

const COULEURS = ["#E5E7EB", "#D1D5DB", "#99A1AF", "#4A5565", "#1E2939", "#99E0B6", "#FFF7DE", "#F87159"];

export type RolePage = "accueil" | "bienvenue" | "pratique" | "acces" | "texte";

export function rolePage(nom: string): RolePage {
  const n = nom.toLowerCase();
  if (n.includes("accueil") || n.includes("entête") || n.includes("entete") || n.includes("bann")) {
    return "accueil";
  }
  if (n.includes("bienvenue")) return "bienvenue";
  if (n.includes("accès") || n.includes("acces")) return "acces";
  if (
    n.includes("pratique") ||
    n.includes("horaire") ||
    n.includes("règle") ||
    n.includes("regle") ||
    n.includes("quartier") ||
    n.includes("équip")
  ) {
    return "pratique";
  }
  if (n.includes("wifi") || n.includes("wi-fi")) return "acces";
  return "texte";
}

export function EditeurLivret({
  livret,
  pageActive,
  verrouille,
  onRetour,
  onPage,
  onChange,
  onEnregistrer,
}: {
  livret: LivretAccueil;
  pageActive: PageLivret;
  verrouille: boolean;
  onRetour: () => void;
  onPage: (id: string) => void;
  onChange: (recette: (l: LivretAccueil) => LivretAccueil) => void;
  onEnregistrer: () => void;
}) {
  const session = useSession();
  const [mobile, setMobile] = useState(false);
  const zone = useRef<HTMLTextAreaElement>(null);
  const role = rolePage(pageActive.nom);
  const biens = session.biens.map((b) => b.nom);
  const lieux = biens.includes(livret.logement) || !livret.logement ? biens : [livret.logement, ...biens];

  const majPage = (partiel: Partial<PageLivret>) => {
    onChange((l) => ({
      ...l,
      modifieLe: new Date().toISOString().slice(0, 10),
      pages: l.pages.map((p) => (p.id === pageActive.id ? { ...p, ...partiel } : p)),
    }));
  };
  const majLivret = (partiel: Partial<LivretAccueil>) => {
    onChange((l) => ({ ...l, ...partiel, modifieLe: new Date().toISOString().slice(0, 10) }));
  };

  const telecharger = () => {
    telechargerDemo(
      `${livret.nom || "livret"}.txt`,
      [
        livret.nom,
        livret.logement,
        pageActive.nom,
        pageActive.titre,
        pageActive.sousTitre,
        pageActive.texte,
        livret.contact ?? "",
        livret.wifiNom ?? "",
        livret.wifiCode ?? "",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={onRetour}
            className="inline-flex items-center gap-1 text-xs text-ink-muted"
          >
            <ChevronLeft className="size-3.5" /> Outils / Livret d'accueil
          </button>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-medium text-ink">
              {livret.famille === "fiche" ? "Fiche d'accès" : "Livret d'accueil"}
            </h2>
            <span className="rounded-full bg-gest-jaune px-2 py-0.5 text-[11px] font-medium text-ink">
              Brouillon
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            Construisez des modèles de livret d'accueil pour chacun de vos biens.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMobile(false)}
            className="inline-flex h-10 items-center gap-1.5 rounded-bouton border border-line bg-white px-3 text-sm text-ink"
          >
            <Eye className="size-3.5" /> Aperçu du document
          </button>
          <button
            type="button"
            onClick={onEnregistrer}
            disabled={verrouille}
            className="inline-flex h-10 items-center gap-1.5 rounded-bouton bg-ink px-4 text-sm font-medium text-white disabled:opacity-40"
          >
            Enregistrer
          </button>
        </div>
      </div>

      <label className="block text-xs text-ink-muted">
        Renommez ce livret
        <input
          value={livret.nom}
          disabled={verrouille}
          onChange={(e) => majLivret({ nom: e.target.value })}
          className="mt-1 h-10 w-full max-w-md rounded-card border border-line bg-white px-3 text-sm text-ink outline-none"
        />
      </label>

      <div className="grid items-start gap-3 xl:grid-cols-[240px_minmax(0,1fr)_minmax(280px,360px)]">
        <aside className="space-y-3 rounded-card border border-line bg-white p-3 shadow-[var(--shadow-carte)]">
          <p className="text-sm font-medium text-ink">Contenu du livret</p>
          <ul className="space-y-1">
            {livret.pages.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onPage(p.id)}
                  aria-current={p.id === pageActive.id ? "page" : undefined}
                  className={cn(
                    "flex w-full items-start justify-between gap-2 rounded-card px-2 py-2 text-left",
                    p.id === pageActive.id ? "bg-surface text-ink" : "text-ink-body hover:bg-surface",
                  )}
                >
                  <span>
                    <span className="block text-sm">{p.nom}</span>
                    <span className="block text-[11px] text-ink-muted">{detailPage(rolePage(p.nom))}</span>
                  </span>
                  <span
                    className={cn(
                      "mt-1 size-4 shrink-0 rounded-full border",
                      pageRenseignee(p) ? "border-transparent bg-gest-vert" : "border-line",
                    )}
                    aria-hidden
                  />
                </button>
              </li>
            ))}
          </ul>
          <p className="px-1 text-[11px] leading-relaxed text-ink-muted">
            Vous pouvez personnaliser la page d'accueil du livret. Téléchargez une photo, un logo
            ou un document si votre livret est déjà créé.
          </p>
          <div>
            <p className="mb-1 text-sm font-medium text-ink">Assignation lieu</p>
            <ul className="space-y-1">
              {lieux.map((nom) => (
                <li key={nom} className="flex items-center justify-between gap-2 rounded-card border border-line px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => majLivret({ logement: nom })}
                    className={cn(
                      "min-w-0 flex-1 truncate text-left text-xs",
                      livret.logement === nom ? "font-medium text-ink" : "text-ink-body",
                    )}
                  >
                    {nom}
                  </button>
                  {livret.logement === nom ? (
                    <button
                      type="button"
                      aria-label={`Retirer ${nom} du livret`}
                      disabled={verrouille}
                      onClick={() => majLivret({ logement: "" })}
                      className="text-ink-muted"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
            <label className="mt-2 block text-[11px] text-ink-muted">
              <span className="sr-only">Logement assigné</span>
              <span className="flex h-9 items-center gap-1 rounded-card border border-line px-2">
                <Plus className="size-3" />
                <input
                  aria-label="Logement assigné"
                  value={livret.logement}
                  disabled={verrouille}
                  onChange={(e) => majLivret({ logement: e.target.value })}
                  placeholder="Ajouter"
                  className="w-full bg-transparent text-sm text-ink outline-none"
                />
              </span>
            </label>
          </div>
        </aside>

        <section className="rounded-card border border-line bg-white p-4 shadow-[var(--shadow-carte)]">
          <h3 className="text-center text-sm font-medium text-ink">{titreFormulaire(role, pageActive.nom)}</h3>
          <p className="mt-1 text-center text-[11px] text-ink-muted">{detailPage(role)}</p>
          {role === "accueil" && (
            <div className="mt-4 space-y-3">
              <ZoneImage
                libelle="Image de couverture"
                nom={livret.couvertureNom}
                disabled={verrouille}
                onChoisir={(nom) => majLivret({ couvertureNom: nom })}
              />
              <Champ label="Titre principal" value={pageActive.titre} disabled={verrouille} onChange={(titre) => majPage({ titre })} />
              <Champ label="Sous titre" value={pageActive.sousTitre} disabled={verrouille} onChange={(sousTitre) => majPage({ sousTitre })} />
              <Champ label="Votre logo personnalisé" value={livret.logo} disabled={verrouille} onChange={(logo) => majLivret({ logo })} />
              <div>
                <p className="text-xs text-ink-muted">Couleur de fond générale</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {COULEURS.map((couleur) => (
                    <button
                      key={couleur}
                      type="button"
                      aria-label={`Couleur ${couleur}`}
                      aria-pressed={livret.couleurFond.toLowerCase() === couleur.toLowerCase()}
                      disabled={verrouille}
                      onClick={() => majLivret({ couleurFond: couleur })}
                      className={cn(
                        "size-5 rounded-full border",
                        livret.couleurFond.toLowerCase() === couleur.toLowerCase()
                          ? "border-ink"
                          : "border-transparent",
                      )}
                      style={{ background: couleur }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="mt-4">
            <BarreStyle
              disabled={verrouille}
              onAppliquer={(avant, apres) => {
                const el = zone.current;
                const debut = el?.selectionStart ?? pageActive.texte.length;
                const fin = el?.selectionEnd ?? debut;
                const selection = pageActive.texte.slice(debut, fin) || "texte";
                majPage({
                  texte: `${pageActive.texte.slice(0, debut)}${avant}${selection}${apres}${pageActive.texte.slice(fin)}`,
                });
              }}
            />
            <textarea
              ref={zone}
              aria-label="Texte d'introduction"
              value={pageActive.texte}
              disabled={verrouille}
              onChange={(e) => majPage({ texte: e.target.value })}
              className="mt-1 h-40 w-full rounded-card border border-line px-3 py-2 text-sm text-ink outline-none"
            />
          </div>
          {role === "bienvenue" && (
            <Champ
              label="Coordonnées de contact"
              value={livret.contact ?? ""}
              disabled={verrouille}
              onChange={(contact) => majLivret({ contact })}
            />
          )}
        </section>

        <section className="rounded-card border border-line bg-white p-3 shadow-[var(--shadow-carte)]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex gap-1">
              <button
                type="button"
                aria-pressed={!mobile}
                onClick={() => setMobile(false)}
                className={cn(
                  "inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs",
                  mobile ? "text-ink-body" : "bg-surface text-ink",
                )}
              >
                <Monitor className="size-3.5" /> Aperçu
              </button>
              <button
                type="button"
                aria-pressed={mobile}
                onClick={() => setMobile(true)}
                className={cn(
                  "inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs",
                  mobile ? "bg-ink text-white" : "text-ink-body",
                )}
              >
                <Smartphone className="size-3.5" /> Mobile
              </button>
            </div>
            <button type="button" aria-label="Télécharger l'aperçu" onClick={telecharger} className="text-ink">
              <Download className="size-4" />
            </button>
          </div>
          <Apercu livret={livret} page={pageActive} role={role} mobile={mobile} />
        </section>
      </div>
    </div>
  );
}

function detailPage(role: RolePage) {
  if (role === "accueil") return "Logo, entête et bannière";
  if (role === "bienvenue") return "Mot d'accueil et présentation";
  if (role === "pratique") return "Horaires, adresse, contact";
  if (role === "acces") return "Informations d'accès";
  return "Page du livret";
}

function titreFormulaire(role: RolePage, nom: string) {
  if (role === "accueil") return "Page d'accueil du livret";
  return nom;
}

function Champ({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (valeur: string) => void;
}) {
  return (
    <label className="mt-3 block text-xs text-ink-muted">
      {label}
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-10 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
      />
    </label>
  );
}

function ZoneImage({
  libelle,
  nom,
  disabled,
  onChoisir,
}: {
  libelle: string;
  nom?: string | undefined;
  disabled: boolean;
  onChoisir: (nom: string) => void;
}) {
  return (
    <div>
      <p className="text-xs text-ink-muted">{libelle}</p>
      <button
        type="button"
        disabled={disabled}
        onClick={() => choisirFichierComplet((fichier) => onChoisir(fichier.nom))}
        className="mt-1 flex h-24 w-full items-center justify-center gap-2 rounded-card bg-surface text-sm text-ink-body"
      >
        <Camera className="size-5" />
        {nom || "Choisir une image"}
      </button>
    </div>
  );
}

function BarreStyle({
  disabled,
  onAppliquer,
}: {
  disabled: boolean;
  onAppliquer: (avant: string, apres: string) => void;
}) {
  const appliquer = (avant: string, apres: string) => {
    if (!disabled) onAppliquer(avant, apres);
  };
  return (
    <div className="flex gap-2 text-sm text-ink">
      <BoutonStyle label="Gras" disabled={disabled} onClick={() => appliquer("**", "**")}>
        <Bold className="size-3.5" />
      </BoutonStyle>
      <BoutonStyle label="Italique" disabled={disabled} onClick={() => appliquer("_", "_")}>
        <Italic className="size-3.5" />
      </BoutonStyle>
      <BoutonStyle label="Souligné" disabled={disabled} onClick={() => appliquer("<u>", "</u>")}>
        <Underline className="size-3.5" />
      </BoutonStyle>
      <BoutonStyle label="Lien" disabled={disabled} onClick={() => appliquer("[", "](https://)")}>
        <Link2 className="size-3.5" />
      </BoutonStyle>
    </div>
  );
}

function BoutonStyle({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className="p-1">
      {children}
    </button>
  );
}

function Apercu({
  livret,
  page,
  role,
  mobile,
}: {
  livret: LivretAccueil;
  page: PageLivret;
  role: RolePage;
  mobile: boolean;
}) {
  return (
    <div className={cn("rounded-card bg-[#D1D5DB] p-3 text-ink", mobile && "mx-auto max-w-[240px]")}>
      <div className="flex items-center gap-3 rounded-card bg-[#C4C8CE] p-3">
        <span className="flex size-12 items-center justify-center rounded-card border border-line bg-white text-[10px]">
          {livret.logo || "Logo"}
        </span>
        <p className="text-lg font-medium">{role === "accueil" ? page.titre || "Titre principal" : "Image de couverture"}</p>
      </div>
      {role === "accueil" && (
        <>
          <p className="mt-2 text-sm">{page.sousTitre || "Sous titre"}</p>
          <p className="mt-4 text-center text-lg font-medium">Aperçu dynamique</p>
        </>
      )}
      {role === "bienvenue" && <p className="mt-4 text-center text-lg font-medium">Aperçu dynamique</p>}
      <div className="mt-3 min-h-24 rounded-card border border-ink/30 bg-white/40 p-3 text-sm whitespace-pre-line">
        {page.texte || "Texte"}
      </div>
      {role === "bienvenue" && (
        <div className="mt-3 grid grid-cols-2 gap-1 text-[10px]">
          <Puce>{livret.logement || "Nom du logement"}</Puce>
          <Puce>{livret.contact || "Contact"}</Puce>
        </div>
      )}
      {role === "pratique" && (
        <div className="mt-3 space-y-2 text-[10px]">
          <div className="flex gap-2">
            <Puce>Arrivée {livret.arrivee || "à partir de 16 h"}</Puce>
            <Puce>Départ {livret.depart || "avant 10 h"}</Puce>
          </div>
          <Puce>Wi-Fi {livret.wifiNom || "Nom"} · {livret.wifiCode || "Code"}</Puce>
          <Puce>Rappel des règles</Puce>
        </div>
      )}
      {role === "acces" && (
        <div className="mt-3 space-y-2 text-[10px]">
          <Puce>{livret.logement || "Adresse du logement"}</Puce>
          <Puce>Plan</Puce>
          <div className="flex gap-2">
            <Puce>{livret.boiteNom || "Nom boîte à clé"}</Puce>
            <Puce>{livret.boiteCode || "Code"}</Puce>
          </div>
        </div>
      )}
    </div>
  );
}

function Puce({ children }: { children: ReactNode }) {
  return <span className="inline-flex rounded border border-ink/20 bg-white/70 px-2 py-1">{children}</span>;
}
