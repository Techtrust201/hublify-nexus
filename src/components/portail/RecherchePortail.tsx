import { useNavigate } from "@tanstack/react-router";
import { MapPin, Search, Star } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bouton,
  Carte,
  Champ,
  Ecran,
  Entete,
  PastillesVerif,
  champClasse,
} from "@/components/portail/chrome";
import {
  basculerFavori,
  ecrireBrouillonCandidature,
  lireFavoris,
} from "@/components/portail/etat-local";
import {
  ACTIVITES_DEMO,
  AIDE_TYPE_BAIL,
  ANNONCES_DEMO,
  filtrerActivites,
  filtrerAnnonces,
  type Annonce,
  type NatureBien,
  type RegimeLocation,
  type TypeService,
} from "@/lib/portail-mobile";
import { formatMontant } from "@/data/reservations-mo1";
import { toastOk } from "@/lib/feedback";

const SERVICES: TypeService[] = ["Tout", "Taxi", "Boat", "Jet ski", "Parapente", "Restaurant"];
const NATURES: Array<NatureBien | ""> = [
  "",
  "appartement",
  "villa",
  "maison",
  "jardin",
  "garage",
  "bateau",
];
const REGIMES: Array<{ id: RegimeLocation | ""; label: string }> = [
  { id: "", label: "Tous" },
  { id: "meuble", label: "Meublé" },
  { id: "vide", label: "Vide" },
  { id: "saisonnier", label: "Saisonnier" },
  { id: "etudiant", label: "Étudiant" },
  { id: "mobilite", label: "Mobilité" },
  { id: "evenement", label: "Événement" },
  { id: "travaux", label: "Travaux" },
];

export function AutourDeMoi({ resultats = false }: { resultats?: boolean }) {
  const navigate = useNavigate();
  const [ville, setVille] = useState("Cannes");
  const [debut, setDebut] = useState("2026-11-13");
  const [fin, setFin] = useState("2026-11-18");
  const [types, setTypes] = useState<TypeService[]>(["Tout"]);
  const [sites, setSites] = useState(true);
  const [carte, setCarte] = useState(false);
  const offres = useMemo(
    () =>
      filtrerActivites({
        activites: ACTIVITES_DEMO,
        ville,
        types,
        inclureSitesGestionnaires: sites,
      }),
    [sites, types, ville],
  );

  const basculerType = (type: TypeService) => {
    if (type === "Tout") {
      setTypes(["Tout"]);
      return;
    }
    setTypes((actuel) => {
      const sansTout = actuel.filter((t) => t !== "Tout");
      return sansTout.includes(type) ? sansTout.filter((t) => t !== type) : [...sansTout, type];
    });
  };

  return (
    <Ecran>
      <Entete
        titre="Autour de moi"
        sousTitre="Recherchez une activité parmi les offres proposées"
        surRetour={() => void navigate({ to: "/espace" })}
      />
      <Carte className="space-y-3">
        <Champ label="Lieu">
          <input className={champClasse} value={ville} onChange={(e) => setVille(e.target.value)} />
        </Champ>
        <div className="grid grid-cols-2 gap-2">
          <Champ label="Du">
            <input
              type="date"
              className={champClasse}
              value={debut}
              onChange={(e) => setDebut(e.target.value)}
            />
          </Champ>
          <Champ label="Au">
            <input
              type="date"
              className={champClasse}
              value={fin}
              onChange={(e) => setFin(e.target.value)}
            />
          </Champ>
        </div>
        <fieldset>
          <legend className="text-xs font-medium text-[#667085]">Type de service</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {SERVICES.map((s) => {
              const on = types.includes(s) || (s === "Tout" && types.includes("Tout"));
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => basculerType(s)}
                  className={`rounded-full px-3 py-1 text-xs ${on ? "bg-[#5090A8] text-white" : "bg-[#f4f6f5] text-[#344054]"}`}
                  aria-pressed={on}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </fieldset>
        <label className="flex items-start gap-2 text-xs text-[#344054]">
          <input
            type="checkbox"
            checked={sites}
            onChange={(e) => setSites(e.target.checked)}
            className="mt-0.5"
          />
          Inclure les sites personnels des gestionnaires inscrits sur leur profil.
        </label>
        <Bouton onClick={() => void navigate({ to: "/espace", hash: "autour-resultats" })}>
          <Search className="mr-2 size-4" /> Rechercher
        </Bouton>
      </Carte>
      {resultats && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[#667085]">
            <span>
              {offres.length} offre{offres.length > 1 ? "s" : ""} · {debut} → {fin}
            </span>
            <button
              type="button"
              className="font-medium text-[#5090A8]"
              onClick={() => setCarte((v) => !v)}
            >
              {carte ? "Liste" : "Carte"}
            </button>
          </div>
          {carte ? (
            <Carte>
              <svg
                viewBox="0 0 320 180"
                className="h-44 w-full"
                role="img"
                aria-label="Carte illustrative de Cannes"
              >
                <rect width="320" height="180" rx="16" fill="#e7f2f4" />
                <path
                  d="M0 120 C 80 90 140 150 220 110 C 260 90 290 100 320 80 L 320 180 L 0 180 Z"
                  fill="#c5e4ea"
                />
                <circle cx="150" cy="78" r="6" fill="#5090A8" />
                <circle cx="190" cy="96" r="6" fill="#5090A8" />
                <circle cx="120" cy="104" r="6" fill="#b54708" />
              </svg>
              <p className="mt-2 text-[11px] text-[#98a2b3]">
                Carte illustrative. Pas de tuiles Google : la géolocalisation reste sur l'appareil.
              </p>
            </Carte>
          ) : null}
          {offres.map((a) => (
            <Carte key={a.id} className="space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-[#1d2939]">{a.nom}</p>
                <span className="flex items-center gap-1 text-xs text-[#b54708]">
                  <Star className="size-3 fill-current" /> {a.note.toLocaleString("fr-FR")}
                </span>
              </div>
              <p className="text-xs text-[#027a48]">{a.reduction}</p>
              <p className="flex items-center gap-1 text-xs text-[#667085]">
                <MapPin className="size-3" /> {a.adresse}
              </p>
              <p className="text-xs text-[#667085]">
                {a.telephone}
                {a.gestionnaire ? ` · ${a.gestionnaire}` : ""}
              </p>
              {a.source === "site-gestionnaire" && (
                <p className="text-[11px] text-[#175cd3]">
                  Aussi publié sur le site du gestionnaire
                </p>
              )}
              <a
                href={a.site}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-[#5090A8]"
              >
                Voir le site
              </a>
            </Carte>
          ))}
          {offres.length === 0 && (
            <p className="text-sm text-[#667085]">Aucune activité pour ces critères.</p>
          )}
        </div>
      )}
    </Ecran>
  );
}

export function RechercheBail() {
  const navigate = useNavigate();
  const [saison, setSaison] = useState(false);
  const [ville, setVille] = useState("Cannes");
  const [debut, setDebut] = useState("2026-11-13");
  const [fin, setFin] = useState("2027-01-18");
  const [regime, setRegime] = useState<RegimeLocation | "">("");
  const [nature, setNature] = useState<NatureBien | "">("");
  const [prixMax, setPrixMax] = useState("");
  const [chambres, setChambres] = useState("1");
  const [noteMin, setNoteMin] = useState("0");
  const [sites, setSites] = useState(true);
  const [lance, setLance] = useState(false);
  const offres = useMemo(
    () =>
      filtrerAnnonces({
        annonces: ANNONCES_DEMO,
        ville,
        debut,
        fin,
        regime: saison ? "saisonnier" : regime,
        nature,
        prixMax: Number(prixMax) || 0,
        chambresMin: Number(chambres) || 0,
        noteMin: Number(noteMin) || 0,
        inclureSitesGestionnaires: sites,
        unite: saison ? "nuit" : regime ? "" : "mois",
      }),
    [chambres, debut, fin, nature, noteMin, prixMax, regime, saison, sites, ville],
  );

  return (
    <Ecran>
      <Entete
        titre={saison ? "Recherche saisonnière" : "Rechercher un bail"}
        surRetour={() => void navigate({ to: "/espace" })}
      />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setSaison(false)}
          className={`h-10 rounded-full text-sm ${saison ? "bg-white text-[#667085]" : "bg-[#5090A8] text-white"}`}
        >
          Bail
        </button>
        <button
          type="button"
          onClick={() => setSaison(true)}
          className={`h-10 rounded-full text-sm ${saison ? "bg-[#5090A8] text-white" : "bg-white text-[#667085]"}`}
        >
          Saisonnière
        </button>
      </div>
      <Carte className="space-y-3">
        <Champ label="Lieu">
          <input className={champClasse} value={ville} onChange={(e) => setVille(e.target.value)} />
        </Champ>
        <div className="grid grid-cols-2 gap-2">
          <Champ label="Du">
            <input
              type="date"
              className={champClasse}
              value={debut}
              onChange={(e) => setDebut(e.target.value)}
            />
          </Champ>
          <Champ label="Au">
            <input
              type="date"
              className={champClasse}
              value={fin}
              onChange={(e) => setFin(e.target.value)}
            />
          </Champ>
        </div>
        <Champ label="Type de bail">
          <select
            className={champClasse}
            value={regime}
            onChange={(e) => setRegime(e.target.value as RegimeLocation | "")}
          >
            {REGIMES.map((r) => (
              <option key={r.label} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </Champ>
        <p className="text-[11px] leading-relaxed text-[#667085]">{AIDE_TYPE_BAIL}</p>
        <Champ label="Nature du bien">
          <select
            className={champClasse}
            value={nature}
            onChange={(e) => setNature(e.target.value as NatureBien | "")}
          >
            {NATURES.map((n) => (
              <option key={n || "tous"} value={n}>
                {n ? n.charAt(0).toUpperCase() + n.slice(1) : "Toutes"}
              </option>
            ))}
          </select>
        </Champ>
        <div className="grid grid-cols-3 gap-2">
          <Champ label="Prix max">
            <input
              className={champClasse}
              inputMode="numeric"
              value={prixMax}
              onChange={(e) => setPrixMax(e.target.value)}
            />
          </Champ>
          <Champ label="Chambres">
            <input
              className={champClasse}
              inputMode="numeric"
              value={chambres}
              onChange={(e) => setChambres(e.target.value)}
            />
          </Champ>
          <Champ label="Note min">
            <input
              className={champClasse}
              inputMode="decimal"
              value={noteMin}
              onChange={(e) => setNoteMin(e.target.value)}
            />
          </Champ>
        </div>
        <label className="flex items-start gap-2 text-xs text-[#344054]">
          <input
            type="checkbox"
            checked={sites}
            onChange={(e) => setSites(e.target.checked)}
            className="mt-0.5"
          />
          Chercher aussi sur les sites des agences liées à leur profil.
        </label>
        <Bouton
          onClick={() => {
            setLance(true);
          }}
        >
          Rechercher
        </Bouton>
      </Carte>
      {lance && (
        <div className="space-y-3">
          <p className="text-xs text-[#667085]">{offres.length} offres pour votre période</p>
          {offres.map((a) => (
            <AnnonceCarte key={a.id} annonce={a} />
          ))}
          {offres.length === 0 && (
            <p className="text-sm text-[#667085]">Aucune offre. Élargissez les filtres.</p>
          )}
        </div>
      )}
    </Ecran>
  );
}

function AnnonceCarte({ annonce }: { annonce: Annonce }) {
  const navigate = useNavigate();
  const [favori, setFavori] = useState(() => lireFavoris().includes(annonce.id));
  return (
    <Carte className="space-y-2">
      <div className="h-28 rounded-2xl bg-[linear-gradient(135deg,#d7efe8,#f6e2d2)]" aria-hidden />
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-[#1d2939]">{annonce.titre}</p>
        <span className="text-xs text-[#b54708]">{annonce.note.toLocaleString("fr-FR")}/5</span>
      </div>
      <PastillesVerif
        professionnel={annonce.professionnelVerifie}
        annonce={annonce.annonceVerifiee}
      />
      <p className="text-sm text-[#1d2939]">
        {formatMontant(annonce.prix)} / {annonce.unite === "mois" ? "mois" : "nuit"} ·{" "}
        {annonce.typeLoyer}
      </p>
      <p className="text-xs text-[#667085]">
        {annonce.chambres} chambre{annonce.chambres > 1 ? "s" : ""} · {annonce.nature} ·{" "}
        {annonce.regime}
      </p>
      {annonce.source === "site-gestionnaire" && (
        <p className="text-[11px] text-[#175cd3]">Annonce reprise du site du gestionnaire</p>
      )}
      <div className="flex gap-3 text-xs">
        <button
          type="button"
          className="font-medium text-[#5090A8]"
          onClick={() => {
            ecrireBrouillonCandidature({
              bienId: annonce.id,
              arrivee: annonce.disponibleDu,
              depart: annonce.disponibleAu,
              marie: false,
              pacse: false,
              concubinage: false,
              colocation: false,
              autoriserDossier: false,
            });
            void navigate({ to: "/espace", hash: `offre-${annonce.id}` });
          }}
        >
          Voir l'offre
        </button>
        <button
          type="button"
          className="text-[#667085]"
          onClick={() => {
            const suivant = basculerFavori(annonce.id);
            setFavori(suivant.includes(annonce.id));
            toastOk(
              suivant.includes(annonce.id)
                ? "Offre enregistrée sur cet appareil."
                : "Offre retirée.",
            );
          }}
        >
          {favori ? "Enregistrée" : "Enregistrer"}
        </button>
        <button
          type="button"
          className="text-[#667085]"
          onClick={() => {
            void navigator.clipboard?.writeText(`${annonce.titre} — ${annonce.siteAnnonceur}`);
            toastOk("Lien de partage copié.");
          }}
        >
          Partager
        </button>
      </div>
    </Carte>
  );
}

export function OffreDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const [bulle, setBulle] = useState(false);
  const annonce = ANNONCES_DEMO.find((a) => a.id === id) ?? ANNONCES_DEMO[0];
  if (!annonce) return null;
  return (
    <Ecran>
      <Entete
        titre={annonce.titre}
        surRetour={() => void navigate({ to: "/espace", hash: "recherche" })}
      />
      <div
        className="h-36 rounded-[22px] bg-[linear-gradient(135deg,#d7efe8,#f8efe4)]"
        aria-hidden
      />
      <PastillesVerif
        professionnel={annonce.professionnelVerifie}
        annonce={annonce.annonceVerifiee}
      />
      <Carte className="space-y-2 text-sm text-[#344054]">
        <p>
          Votre période : {annonce.disponibleDu} → {annonce.disponibleAu}
        </p>
        <p>
          Loyer : {formatMontant(annonce.prix)} / {annonce.unite === "mois" ? "mois" : "nuit"},{" "}
          {annonce.typeLoyer}. Le premier et le dernier loyer sont calculés au prorata de
          l'occupation.
        </p>
        <p>Garantie : {formatMontant(annonce.garantie)}</p>
        <p>
          Frais de dossier {formatMontant(annonce.fraisDossier)} · frais d'état des lieux{" "}
          {formatMontant(annonce.fraisEdl)}
        </p>
        <p className="text-xs text-[#667085]">
          La garantie couvre d'éventuelles dégradations ou sommes impayées et sera restituée à la
          sortie du logement.
        </p>
        <button
          type="button"
          className="text-xs font-medium text-[#5090A8]"
          onClick={() => setBulle((v) => !v)}
        >
          Type de bail
        </button>
        {bulle && <p className="text-xs leading-relaxed text-[#667085]">{AIDE_TYPE_BAIL}</p>}
        <p>{annonce.description}</p>
      </Carte>
      <a
        href={annonce.siteAnnonceur}
        target="_blank"
        rel="noopener noreferrer"
        className="text-center text-xs font-medium text-[#5090A8]"
      >
        Redirection vers l'annonce sur le site de l'annonceur
      </a>
      <Bouton
        onClick={() => {
          ecrireBrouillonCandidature({
            bienId: annonce.id,
            arrivee: annonce.disponibleDu,
            depart: annonce.disponibleAu,
            marie: false,
            pacse: false,
            concubinage: false,
            colocation: false,
            autoriserDossier: true,
          });
          void navigate({ to: "/espace/candidature" });
        }}
      >
        Proposer ma candidature
      </Bouton>
    </Ecran>
  );
}
