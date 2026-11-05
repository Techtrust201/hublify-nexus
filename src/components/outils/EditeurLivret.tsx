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
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { LivretAccueil, PageLivret } from "@/data/livrets";
import { pageRenseignee } from "@/data/livrets";
import { useSession } from "@/data/session";
import { choisirFichierComplet, telechargerDemo } from "@/lib/feedback";
import { geocoderAdresseLivret } from "@/lib/plan-osm.functions";
import { urlIntegrerOsm } from "@/lib/plan-osm";
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
  const adresseLogement =
    session.biens
      .find((b) => b.nom.toLowerCase() === livret.logement.trim().toLowerCase())
      ?.adresse?.trim() ?? "";

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

      <div className="grid items-start gap-3 xl:grid-cols-[200px_minmax(0,1fr)_622px]">
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
          <Apercu
            livret={livret}
            page={pageActive}
            role={role}
            mobile={mobile}
            adresse={adresseLogement}
          />
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

/** Largeur du canevas d'aperçu mesurée sur les frames 297:13745, 302:15377 et 302:16629. */
const LARGEUR_APERCU = 598;

function Apercu({
  livret,
  page,
  role,
  mobile,
  adresse,
}: {
  livret: LivretAccueil;
  page: PageLivret;
  role: RolePage;
  mobile: boolean;
  adresse: string;
}) {
  const contenu =
    role === "accueil" ? (
      <ApercuAccueil livret={livret} page={page} />
    ) : role === "pratique" ? (
      <ApercuPratique livret={livret} page={page} />
    ) : role === "acces" ? (
      <ApercuAcces livret={livret} page={page} adresse={adresse} />
    ) : (
      <ApercuTexte livret={livret} page={page} role={role} />
    );
  return (
    <div className={cn("overflow-hidden", mobile && "mx-auto w-[240px]")}>
      <div
        style={
          mobile ? { zoom: 240 / LARGEUR_APERCU, width: LARGEUR_APERCU } : { width: LARGEUR_APERCU }
        }
      >
        {contenu}
      </div>
    </div>
  );
}

function Boite({
  left,
  top,
  width,
  height,
  children,
  className,
  fond = false,
}: {
  left: number;
  top: number;
  width: number;
  height: number;
  children?: ReactNode;
  className?: string;
  fond?: boolean;
}) {
  return (
    <div
      className={cn(
        "absolute box-border flex items-center justify-center overflow-hidden border border-[#525252] px-2 text-center text-[13px] leading-tight text-[#1b1b1b]",
        fond ? "bg-[#D9D9D9]" : "bg-transparent",
        className,
      )}
      style={{ left, top, width, height }}
    >
      {children}
    </div>
  );
}

function BandeCouverture({ logo, libelle }: { logo: string; libelle: string }) {
  return (
    <div
      className="absolute top-0 left-0 bg-[#D9D9D9]"
      style={{ width: LARGEUR_APERCU, height: 180 }}
    >
      <Boite left={18} top={14} width={94} height={85}>
        {logo || "Logo"}
      </Boite>
      <p
        className="absolute text-[26px] leading-none font-medium text-[#1b1b1b]"
        style={{ left: 150, top: 74 }}
      >
        {libelle}
      </p>
    </div>
  );
}

/** Frame 297:13745 — bandeau, logo et rectangle d'introduction aux positions mesurées. */
function ApercuAccueil({ livret, page }: { livret: LivretAccueil; page: PageLivret }) {
  return (
    <div
      data-testid="apercu-livret"
      className="relative border border-[#525252] bg-[#D9D9D9] text-[#1b1b1b]"
      style={{ width: LARGEUR_APERCU, height: 671 }}
    >
      <Boite
        left={24}
        top={71}
        width={294}
        height={45}
        className="justify-start px-[18px] text-left text-xs"
      >
        {page.titre || "Titre principal"}
      </Boite>
      <Boite left={137} top={145} width={182} height={39} className="text-xs">
        {page.sousTitre || "Sous titre"}
      </Boite>
      <p className="absolute text-[13px] leading-none" style={{ left: 392, top: 118 }}>
        Image de Couverture
      </p>
      <div className="absolute right-0 left-0 h-px bg-black" style={{ top: 236 }} />
      <Boite left={26} top={261} width={94} height={85}>
        {livret.logo || "Logo"}
      </Boite>
      <p className="absolute text-[28px] leading-none font-medium" style={{ left: 183, top: 296 }}>
        Aperçu dynamique
      </p>
      <Boite
        left={91}
        top={373}
        width={427}
        height={180}
        className="items-start justify-start p-3 text-left text-xs whitespace-pre-line"
      >
        {page.texte}
      </Boite>
    </div>
  );
}

/** Frame 302:15377 — horaires, Wi-Fi, description et règles en grille. */
function ApercuPratique({ livret, page }: { livret: LivretAccueil; page: PageLivret }) {
  const description = page.texte.trim() || "Description des éléments inclus";
  return (
    <div
      data-testid="apercu-livret"
      className="relative bg-white text-[#1b1b1b]"
      style={{ width: LARGEUR_APERCU, height: 653 }}
    >
      <BandeCouverture logo={livret.logo} libelle="Image de couverture" />
      <Boite left={58} top={212} width={203} height={56} fond>
        <span>
          Arrivée
          <span className="mt-0.5 block">{livret.arrivee || "à Partir de 00h00"}</span>
        </span>
      </Boite>
      <Boite left={356} top={215} width={203} height={56} fond>
        <span>
          Départ
          <span className="mt-0.5 block">{livret.depart || "Avant 00h00"}</span>
        </span>
      </Boite>
      <Boite left={58} top={293} width={111} height={39} fond>
        Wifi
      </Boite>
      <Boite left={58} top={338} width={198} height={39} fond>
        {livret.wifiNom || "Nom"}
      </Boite>
      <Boite left={281} top={338} width={198} height={39} fond>
        {livret.wifiCode || "Code"}
      </Boite>
      <Boite
        left={58}
        top={406}
        width={501}
        height={118}
        fond
        className="items-start justify-start p-3 text-left text-xs whitespace-pre-line"
      >
        {description}
      </Boite>
      <Boite left={58} top={535} width={501} height={118} fond>
        Rappel des règles de base
      </Boite>
    </div>
  );
}

/** Frame 302:16629 — adresse du logement et plan OpenStreetMap. */
function ApercuAcces({
  livret,
  page,
  adresse,
}: {
  livret: LivretAccueil;
  page: PageLivret;
  adresse: string;
}) {
  return (
    <div
      data-testid="apercu-livret"
      className="relative bg-[#D9D9D9] text-[#1b1b1b]"
      style={{ width: LARGEUR_APERCU, height: 672 }}
    >
      <BandeCouverture logo={livret.logo} libelle="Image de couverture" />
      <Boite left={57} top={203} width={476} height={29} className="px-2 text-[11px]">
        {adresse || "Adresse du logement voir descriptif dans le paramétrage du logement"}
      </Boite>
      <div
        className="absolute overflow-hidden border border-[#525252]"
        style={{ left: 58, top: 251, width: 475, height: 164 }}
      >
        <PlanLogement adresse={adresse} />
      </div>
      <Boite
        left={58}
        top={420}
        width={473}
        height={63}
        className="items-start justify-start px-3 text-left text-xs whitespace-pre-line"
      >
        {page.texte || "Texte"}
      </Boite>
      <Boite left={58} top={510} width={136} height={29} className="text-[11px]">
        {livret.boiteNom || "Nom boîte à clé"}
      </Boite>
      <Boite left={208} top={510} width={122} height={29} className="text-[11px]">
        {livret.boiteCode || "Code boîte à clé"}
      </Boite>
    </div>
  );
}

function ApercuTexte({
  livret,
  page,
  role,
}: {
  livret: LivretAccueil;
  page: PageLivret;
  role: RolePage;
}) {
  return (
    <div
      data-testid="apercu-livret"
      className="relative bg-[#D9D9D9] text-[#1b1b1b]"
      style={{ width: LARGEUR_APERCU, height: 420 }}
    >
      <BandeCouverture logo={livret.logo} libelle="Image de couverture" />
      <Boite
        left={58}
        top={210}
        width={482}
        height={120}
        className="items-start justify-start p-3 text-left text-xs whitespace-pre-line"
      >
        {page.texte || "Texte"}
      </Boite>
      {role === "bienvenue" ? (
        <>
          <Boite left={58} top={348} width={220} height={36} fond className="text-[11px]">
            {livret.logement || "Nom du logement"}
          </Boite>
          <Boite left={292} top={348} width={220} height={36} fond className="text-[11px]">
            {livret.contact || "Contact"}
          </Boite>
        </>
      ) : null}
    </div>
  );
}

function PlanLogement({ adresse }: { adresse: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    const propre = adresse.trim();
    if (!propre) {
      setSrc(null);
      return;
    }
    let ignore = false;
    setSrc(null);
    geocoderAdresseLivret({ data: { adresse: propre } })
      .then((res) => {
        if (!ignore) setSrc(res.point ? urlIntegrerOsm(res.point) : "");
      })
      .catch(() => {
        if (!ignore) setSrc("");
      });
    return () => {
      ignore = true;
    };
  }, [adresse]);

  if (!src) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[#1b1b1b]">MAP</div>
    );
  }
  return (
    <iframe
      title="Plan du logement"
      src={src}
      className="h-full w-full border-0"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
