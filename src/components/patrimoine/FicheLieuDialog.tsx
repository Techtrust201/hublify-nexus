import { useEffect, useState } from "react";
import { deposerFichier, lireFichier, retirerFichier } from "@/lib/documents.functions";
import { preparerFichier, urlDepuisBase64 } from "@/lib/fichiers-client";
import { MapPin, Minus, Plus, Trash2 } from "lucide-react";
import { BtnNavy, BtnOutline } from "@/components/documents/ui";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  EQUIPEMENTS,
  GROUPES_TYPES,
  LITS,
  PLATEFORMES_OTA,
  SERVICES,
  STATIONNEMENT,
  TEXTE_LEGAL_MEUBLE,
  TYPES_LIEU,
  USAGES,
  annoncePublable,
  estLitDouble,
  exporterAnnonce,
  importerAnnonce,
  libelleUsage,
  montantLoyer,
  typeCanonique,
  type AccesSaisie,
  type ChoixRegle,
  type EspaceFiche,
  type FicheLieu,
  type LitFiche,
  type ResumeBien,
} from "@/data/patrimoine-fiche";
import { telechargerDemo, toastErreur, toastOk } from "@/lib/feedback";
import { cn } from "@/lib/utils";

const CHAMP =
  "mt-1 h-11 w-full rounded-card border border-line bg-white px-3 text-sm text-ink outline-none focus:border-ink md:h-9";

type BienOuvert = ResumeBien & { id: string; adresse?: string };

type Brouillon = {
  nom: string;
  typologie: string;
  adresse: string;
  proprietaire: string;
  fiche: FicheLieu;
  acces: AccesSaisie;
};

function creerBrouillon(bien: BienOuvert, fiche: FicheLieu, acces: AccesSaisie): Brouillon {
  return {
    nom: bien.nom,
    typologie: typeCanonique(bien.typologie),
    adresse: bien.adresse && bien.adresse !== "—" ? bien.adresse : "",
    proprietaire: bien.proprietaire && bien.proprietaire !== "—" ? bien.proprietaire : "",
    fiche,
    acces,
  };
}

export function FicheLieuDialog({
  ouvert,
  bien,
  fiche,
  acces,
  immeubles,
  gestionnaires,
  typesPerso,
  peutMod,
  section,
  onFermer,
  onEnregistrer,
  onAjouterType,
}: {
  ouvert: boolean;
  bien: BienOuvert | null;
  fiche: FicheLieu;
  acces: AccesSaisie;
  immeubles: { id: string; nom: string }[];
  gestionnaires: string[];
  typesPerso: string[];
  peutMod: boolean;
  section: "welcome" | "cles" | null;
  onFermer: () => void;
  onEnregistrer: (brouillon: Brouillon) => void;
  onAjouterType: (nom: string) => void;
}) {
  const [onglet, setOnglet] = useState<"infos" | "immeuble" | "photos" | "integrations">("infos");
  const [brouillon, setBrouillon] = useState<Brouillon | null>(null);
  const [cle, setCle] = useState("");
  const [typeLibre, setTypeLibre] = useState("");
  const [apercu, setApercu] = useState(false);
  const [colleOta, setColleOta] = useState("");
  const [plateforme, setPlateforme] = useState<string>(PLATEFORMES_OTA[0]);
  const [compteOta, setCompteOta] = useState("");
  const [apercus, setApercus] = useState<Record<string, string>>({});

  if (ouvert && bien && cle !== `${bien.id}:${section ?? ""}`) {
    setCle(`${bien.id}:${section ?? ""}`);
    setBrouillon(creerBrouillon(bien, fiche, acces));
    setOnglet("infos");
    setApercu(false);
  }
  if (!ouvert && cle) setCle("");

  useEffect(() => {
    if (!ouvert || !section) return;
    const id = section === "welcome" ? "section-welcome" : "section-cles";
    document.getElementById(id)?.scrollIntoView({ block: "center" });
  }, [ouvert, section, cle]);

  const photosIds = brouillon?.fiche.photos.map((p) => p.id).join("|") ?? "";
  useEffect(() => {
    if (!ouvert || !photosIds) return;
    let vivant = true;
    for (const id of photosIds.split("|")) {
      void lireFichier({ data: { id } }).then((res) => {
        if (!vivant || !res.ok) return;
        const url = urlDepuisBase64(res.fichier.mime, res.fichier.base64);
        setApercus((actuel) => {
          const precedent = actuel[id];
          if (precedent?.startsWith("blob:")) URL.revokeObjectURL(precedent);
          return { ...actuel, [id]: url };
        });
      });
    }
    return () => {
      vivant = false;
    };
  }, [ouvert, photosIds]);

  const maj = (patch: Partial<Brouillon>) => setBrouillon((b) => (b ? { ...b, ...patch } : b));
  const majFiche = (patch: Partial<FicheLieu>) =>
    setBrouillon((b) => (b ? { ...b, fiche: { ...b.fiche, ...patch } } : b));

  const basculer = (
    liste: string[],
    valeur: string,
    cleListe: "equipements" | "stationnement" | "services",
  ) => {
    const suivant = liste.includes(valeur) ? liste.filter((x) => x !== valeur) : [...liste, valeur];
    majFiche({ [cleListe]: suivant });
  };

  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onFermer()}>
      <DialogContent className="flex max-h-[92dvh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <div className="shrink-0 space-y-3 px-6 pb-3 pt-6">
          <p className="text-xs text-ink-muted">Bien immo / créer un logement</p>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-2xl font-medium text-ink">Lieu ou logement</DialogTitle>
              <DialogDescription>Ajouter ou modifier une information.</DialogDescription>
            </div>
          </div>
        </div>
        {brouillon && (
          <form
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            onSubmit={(e) => {
              e.preventDefault();
              if (!peutMod) return;
              if (!brouillon.nom.trim()) {
                toastErreur("Donnez un nom au lieu.");
                return;
              }
              const blocage = annoncePublable(brouillon.fiche);
              if (blocage) {
                toastErreur(blocage);
                return;
              }
              onEnregistrer(brouillon);
            }}
          >
            <div className="mx-6 flex shrink-0 flex-wrap rounded-[14px] border border-line bg-white p-1">
              {(
                [
                  ["infos", "Informations"],
                  ["immeuble", "Immeuble"],
                  ["photos", "Photos & médias"],
                  ["integrations", "Intégrations"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setOnglet(id)}
                  aria-pressed={onglet === id}
                  className={cn(
                    "h-11 flex-1 rounded-[10px] px-3 text-sm md:h-9",
                    onglet === id ? "bg-surface-soft font-medium text-ink" : "text-ink-body",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-4">
              {onglet === "infos" && (
                <div className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs text-ink-muted">
                      Nom du lieu, logement — ce nom sera public
                      <input
                        value={brouillon.nom}
                        onChange={(e) => maj({ nom: e.target.value })}
                        className={CHAMP}
                      />
                    </label>
                    <label className="block text-xs text-ink-muted">
                      Mode
                      <select
                        value={brouillon.fiche.usage}
                        onChange={(e) => majFiche({ usage: e.target.value as FicheLieu["usage"] })}
                        className={CHAMP}
                      >
                        {USAGES.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="block text-xs text-ink-muted">
                    Type
                    <select
                      value={
                        TYPES_LIEU.includes(brouillon.typologie) ||
                        typesPerso.includes(brouillon.typologie)
                          ? brouillon.typologie
                          : brouillon.typologie
                      }
                      onChange={(e) => maj({ typologie: e.target.value })}
                      className={CHAMP}
                    >
                      {GROUPES_TYPES.map((g) => (
                        <optgroup key={g.id} label={g.label}>
                          {g.items.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                      {typesPerso.length > 0 && (
                        <optgroup label="Ajoutés à la liste">
                          {typesPerso.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {!TYPES_LIEU.includes(brouillon.typologie) &&
                        !typesPerso.includes(brouillon.typologie) && (
                          <option value={brouillon.typologie}>{brouillon.typologie}</option>
                        )}
                    </select>
                  </label>
                  {brouillon.typologie.startsWith("Château") && (
                    <p className="text-xs text-ink-muted">Rare, haut de gamme.</p>
                  )}
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="block min-w-0 flex-1 text-xs text-ink-muted">
                      Ajouter à la liste
                      <input
                        value={typeLibre}
                        onChange={(e) => setTypeLibre(e.target.value)}
                        placeholder="Autre type de lieu"
                        className={CHAMP}
                      />
                    </label>
                    <BtnOutline
                      className="h-11 md:h-9"
                      onClick={() => {
                        if (!typeLibre.trim()) return;
                        onAjouterType(typeLibre);
                        maj({ typologie: typeLibre.trim() });
                        setTypeLibre("");
                      }}
                    >
                      <Plus className="size-3" /> Ajouter
                    </BtnOutline>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <label className="block text-xs text-ink-muted">
                      Adresse
                      <input
                        value={brouillon.adresse}
                        onChange={(e) => maj({ adresse: e.target.value })}
                        className={CHAMP}
                      />
                    </label>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(brouillon.adresse || brouillon.nom)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 items-center gap-1 self-end rounded-card border border-line px-3 text-xs text-ink-body md:h-9"
                    >
                      <MapPin className="size-3.5" /> Carte
                    </a>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="block text-xs text-ink-muted">
                      Étage
                      <input
                        value={brouillon.fiche.etage}
                        onChange={(e) => majFiche({ etage: e.target.value })}
                        className={CHAMP}
                      />
                    </label>
                    <label className="block text-xs text-ink-muted">
                      Numéro de porte
                      <input
                        value={brouillon.fiche.porte}
                        onChange={(e) => majFiche({ porte: e.target.value })}
                        className={CHAMP}
                      />
                    </label>
                    <label className="block text-xs text-ink-muted">
                      Ascenseur O/N
                      <select
                        value={brouillon.fiche.ascenseur}
                        onChange={(e) =>
                          majFiche({ ascenseur: e.target.value as FicheLieu["ascenseur"] })
                        }
                        className={CHAMP}
                      >
                        <option value="">—</option>
                        <option value="O">Oui</option>
                        <option value="N">Non</option>
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs text-ink-muted">
                      Propriétaire
                      <input
                        value={brouillon.proprietaire}
                        onChange={(e) => maj({ proprietaire: e.target.value })}
                        className={CHAMP}
                      />
                    </label>
                    <label className="block text-xs text-ink-muted">
                      Assigner un gestionnaire principal
                      <input
                        value={brouillon.fiche.gestionnaire}
                        onChange={(e) => majFiche({ gestionnaire: e.target.value })}
                        list="gestionnaires-fiche"
                        className={CHAMP}
                      />
                      <datalist id="gestionnaires-fiche">
                        {gestionnaires.map((g) => (
                          <option key={g} value={g} />
                        ))}
                      </datalist>
                    </label>
                  </div>

                  <fieldset className="space-y-3 rounded-card border border-line p-4">
                    <legend className="px-1 text-sm text-ink">{TEXTE_LEGAL_MEUBLE.titre}</legend>
                    <p className="text-sm text-ink-body">{TEXTE_LEGAL_MEUBLE.principe}</p>
                    <p className="text-sm text-ink-body">
                      <span className="font-medium text-ink">Qui est concerné. </span>
                      {TEXTE_LEGAL_MEUBLE.concerne}
                    </p>
                    <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={brouillon.fiche.meubleTourisme}
                        onChange={(e) => majFiche({ meubleTourisme: e.target.checked })}
                      />
                      Proposé en meublé de tourisme
                    </label>
                    <label className="block text-xs text-ink-muted">
                      Numéro d'enregistrement en mairie
                      <input
                        value={brouillon.fiche.enregistrementMairie}
                        onChange={(e) => majFiche({ enregistrementMairie: e.target.value })}
                        placeholder="Obligatoire pour publier une annonce touristique"
                        className={CHAMP}
                      />
                    </label>
                  </fieldset>

                  <label className="block text-xs text-ink-muted">
                    Numéro DPE — optionnel
                    <input
                      value={brouillon.fiche.numeroDpe}
                      onChange={(e) => majFiche({ numeroDpe: e.target.value })}
                      className={CHAMP}
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs text-ink-muted">
                      Surface (m²)
                      <input
                        inputMode="decimal"
                        value={brouillon.fiche.surfaceM2}
                        onChange={(e) => majFiche({ surfaceM2: e.target.value })}
                        className={CHAMP}
                      />
                    </label>
                    <label className="block text-xs text-ink-muted">
                      Année de construction
                      <input
                        inputMode="numeric"
                        value={brouillon.fiche.anneeConstruction}
                        onChange={(e) => majFiche({ anneeConstruction: e.target.value })}
                        className={CHAMP}
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <Stepper
                      label="Pièces"
                      value={brouillon.fiche.pieces}
                      onChange={(pieces) => majFiche({ pieces })}
                    />
                    <Stepper
                      label="Chambres"
                      value={brouillon.fiche.chambres}
                      onChange={(chambres) => majFiche({ chambres })}
                    />
                    <Stepper
                      label="Salles de bain"
                      value={brouillon.fiche.sallesDeBain}
                      onChange={(sallesDeBain) => majFiche({ sallesDeBain })}
                    />
                  </div>

                  <fieldset
                    id="section-cles"
                    className="space-y-3 rounded-card border border-line p-4"
                  >
                    <legend className="px-1 text-sm text-ink">Gestion des clés</legend>
                    <div className="flex flex-wrap items-end gap-4">
                      <Stepper
                        label="Nombre maximum de clés"
                        value={brouillon.fiche.nombreCles}
                        onChange={(nombreCles) => majFiche({ nombreCles })}
                      />
                      <label className="block text-xs text-ink-muted">
                        Arrivée
                        <input
                          type="time"
                          value={brouillon.fiche.heureArrivee}
                          onChange={(e) => majFiche({ heureArrivee: e.target.value })}
                          className={CHAMP}
                        />
                      </label>
                      <label className="block text-xs text-ink-muted">
                        Départ
                        <input
                          type="time"
                          value={brouillon.fiche.heureDepart}
                          onChange={(e) => majFiche({ heureDepart: e.target.value })}
                          className={CHAMP}
                        />
                      </label>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block text-xs text-ink-muted">
                        Code boîte à clés
                        <input
                          value={brouillon.acces.codeCles}
                          onChange={(e) =>
                            maj({ acces: { ...brouillon.acces, codeCles: e.target.value } })
                          }
                          className={CHAMP}
                        />
                      </label>
                      <label className="block text-xs text-ink-muted">
                        Code alarme
                        <input
                          value={brouillon.acces.alarme}
                          onChange={(e) =>
                            maj({ acces: { ...brouillon.acces, alarme: e.target.value } })
                          }
                          className={CHAMP}
                        />
                      </label>
                      <label className="block text-xs text-ink-muted">
                        Nom du Wi-Fi
                        <input
                          value={brouillon.acces.wifi}
                          onChange={(e) =>
                            maj({ acces: { ...brouillon.acces, wifi: e.target.value } })
                          }
                          className={CHAMP}
                        />
                      </label>
                      <label className="block text-xs text-ink-muted">
                        Code du Wi-Fi
                        <input
                          value={brouillon.acces.wifiMdp}
                          onChange={(e) =>
                            maj({ acces: { ...brouillon.acces, wifiMdp: e.target.value } })
                          }
                          className={CHAMP}
                        />
                      </label>
                    </div>
                    <label className="block text-xs text-ink-muted">
                      Consignes d'accès
                      <textarea
                        value={brouillon.acces.consignes}
                        onChange={(e) =>
                          maj({ acces: { ...brouillon.acces, consignes: e.target.value } })
                        }
                        className="mt-1 h-20 w-full rounded-card border border-line px-3 py-2 text-sm text-ink outline-none"
                      />
                    </label>
                  </fieldset>

                  <fieldset className="space-y-3 rounded-card border border-line p-4">
                    <legend className="px-1 text-sm text-ink">Choix du type de loyer</legend>
                    <div className="flex flex-wrap gap-4 text-sm text-ink">
                      {(
                        [
                          ["forfaitaire", "Forfaitaire"],
                          ["classique", "Classique (loyer + charges)"],
                        ] as const
                      ).map(([id, label]) => (
                        <label key={id} className="flex min-h-11 items-center gap-2">
                          <input
                            type="radio"
                            name="type-loyer"
                            checked={brouillon.fiche.typeLoyer === id}
                            onChange={() => majFiche({ typeLoyer: id })}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="block text-xs text-ink-muted">
                        {brouillon.fiche.typeLoyer === "forfaitaire"
                          ? "Montant forfaitaire (€)"
                          : "Loyer hors charges (€)"}
                        <input
                          inputMode="decimal"
                          value={brouillon.fiche.loyerHorsCharges}
                          placeholder="650"
                          onChange={(e) => majFiche({ loyerHorsCharges: e.target.value })}
                          className={CHAMP}
                        />
                      </label>
                      <label className="block text-xs text-ink-muted">
                        Charges (€)
                        <input
                          inputMode="decimal"
                          value={brouillon.fiche.charges}
                          placeholder="50"
                          disabled={brouillon.fiche.typeLoyer === "forfaitaire"}
                          onChange={(e) => majFiche({ charges: e.target.value })}
                          className={CHAMP}
                        />
                      </label>
                      <label className="block text-xs text-ink-muted">
                        Tarif nuit (€)
                        <input
                          inputMode="decimal"
                          value={brouillon.fiche.tarifNuit}
                          placeholder="95"
                          onChange={(e) => majFiche({ tarifNuit: e.target.value })}
                          className={CHAMP}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-ink-muted">
                      {montantLoyer(brouillon.fiche).libelle}. Le tarif nuit ne modifie pas tout
                      seul les règles de loyer.
                    </p>
                  </fieldset>

                  <label id="section-welcome" className="block text-xs text-ink-muted">
                    Description
                    <textarea
                      value={brouillon.fiche.description}
                      onChange={(e) => majFiche({ description: e.target.value })}
                      className="mt-1 h-28 w-full rounded-card border border-line px-3 py-2 text-sm text-ink outline-none"
                    />
                  </label>
                  <label className="block text-xs text-ink-muted">
                    Livret d'accueil
                    <textarea
                      value={brouillon.fiche.welcomeBookTexte}
                      onChange={(e) =>
                        majFiche({
                          welcomeBookTexte: e.target.value,
                          welcomeBook: e.target.value.trim().length > 0,
                        })
                      }
                      placeholder="Livret d'accueil : arrivée, Wi-Fi, règles de vie"
                      className="mt-1 h-24 w-full rounded-card border border-line px-3 py-2 text-sm text-ink outline-none"
                    />
                  </label>

                  {EQUIPEMENTS.map((groupe) => (
                    <Cases
                      key={groupe.id}
                      titre={groupe.label}
                      items={groupe.items}
                      choisis={brouillon.fiche.equipements}
                      onToggle={(item) =>
                        basculer(brouillon.fiche.equipements, item, "equipements")
                      }
                    />
                  ))}
                  <label className="block text-xs text-ink-muted">
                    Autre équipement
                    <input
                      value={brouillon.fiche.equipementAutre}
                      onChange={(e) => majFiche({ equipementAutre: e.target.value })}
                      className={CHAMP}
                    />
                  </label>

                  <Espaces
                    espaces={brouillon.fiche.espaces}
                    parking={brouillon.fiche.parkingExterieur}
                    onChange={(espaces) => majFiche({ espaces })}
                    onParking={(parkingExterieur) => majFiche({ parkingExterieur })}
                  />

                  <Cases
                    titre="Stationnement et accès"
                    items={STATIONNEMENT}
                    choisis={brouillon.fiche.stationnement}
                    onToggle={(item) =>
                      basculer(brouillon.fiche.stationnement, item, "stationnement")
                    }
                  />
                  <Cases
                    titre="Services"
                    items={SERVICES}
                    choisis={brouillon.fiche.services}
                    onToggle={(item) => basculer(brouillon.fiche.services, item, "services")}
                  />
                  <label className="block text-xs text-ink-muted">
                    Autre service
                    <input
                      value={brouillon.fiche.serviceAutre}
                      onChange={(e) => majFiche({ serviceAutre: e.target.value })}
                      className={CHAMP}
                    />
                  </label>

                  <fieldset className="space-y-3 rounded-card border border-line p-4">
                    <legend className="px-1 text-sm text-ink">Règles et options</legend>
                    <Tri
                      label="Animaux"
                      valeur={brouillon.fiche.animaux}
                      oui="Acceptés"
                      non="Refusés"
                      onChange={(animaux) => majFiche({ animaux })}
                    />
                    <Tri
                      label="Fêtes / événements"
                      valeur={brouillon.fiche.fetes}
                      oui="Autorisés"
                      non="Refusés"
                      onChange={(fetes) => majFiche({ fetes })}
                    />
                    <Tri
                      label="Tabac"
                      valeur={brouillon.fiche.fumeur}
                      oui="Fumeur autorisé"
                      non="Non-fumeur"
                      onChange={(fumeur) => majFiche({ fumeur })}
                    />
                    <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={brouillon.fiche.longueDuree}
                        onChange={(e) => majFiche({ longueDuree: e.target.checked })}
                      />
                      Séjours longue durée acceptés
                    </label>
                    <label className="flex min-h-11 items-start gap-2 text-sm text-ink">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={brouillon.fiche.camerasExterieures}
                        onChange={(e) => majFiche({ camerasExterieures: e.target.checked })}
                      />
                      Caméras de sécurité extérieures — à déclarer obligatoirement
                    </label>
                    <label className="block text-xs text-ink-muted">
                      Autre règle
                      <input
                        value={brouillon.fiche.regleAutre}
                        onChange={(e) => majFiche({ regleAutre: e.target.value })}
                        className={CHAMP}
                      />
                    </label>
                  </fieldset>

                  <Droits fiche={brouillon.fiche} onChange={(patch) => majFiche(patch)} />
                </div>
              )}

              {onglet === "immeuble" && (
                <label className="block text-xs text-ink-muted">
                  Rattacher à un immeuble
                  <select
                    value={brouillon.fiche.immeubleId ?? ""}
                    onChange={(e) => majFiche({ immeubleId: e.target.value || null })}
                    className={CHAMP}
                  >
                    <option value="">Aucun immeuble</option>
                    {immeubles.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nom}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-ink-subtle">
                    L'immeuble se crée depuis l'onglet Immeubles. Le logement y reste rattaché.
                  </p>
                </label>
              )}

              {onglet === "photos" && (
                <div className="space-y-3">
                  <label className="block text-xs text-ink-muted">
                    Photos du logement — 4 fichiers, 500 Ko chacun
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="mt-2 block w-full text-sm text-ink"
                      onChange={(e) => {
                        const fichiers = Array.from(e.target.files ?? []);
                        e.target.value = "";
                        const bienId = bien?.id;
                        if (!bienId) return;
                        void (async () => {
                          let nombre = brouillon.fiche.photos.length;
                          for (const fichier of fichiers) {
                            if (nombre >= 4) {
                              toastErreur("Quatre photos maximum.");
                              return;
                            }
                            const prepare = await preparerFichier(fichier, "patrimoine");
                            if (!prepare.ok) {
                              toastErreur(prepare.erreur);
                              continue;
                            }
                            const res = await deposerFichier({
                              data: {
                                contexte: "patrimoine",
                                refId: bienId,
                                cote: "",
                                nom: prepare.fichier.nom,
                                mime: prepare.fichier.mime,
                                base64: prepare.fichier.base64,
                              },
                            });
                            if (!res.ok) {
                              toastErreur(res.erreur);
                              continue;
                            }
                            const apercu = URL.createObjectURL(fichier);
                            setApercus((actuel) => ({ ...actuel, [res.fichier.id]: apercu }));
                            setBrouillon((b) =>
                              b
                                ? {
                                    ...b,
                                    fiche: {
                                      ...b.fiche,
                                      photos: [
                                        ...b.fiche.photos,
                                        { id: res.fichier.id, nom: res.fichier.nom },
                                      ].slice(0, 4),
                                    },
                                  }
                                : b,
                            );
                            nombre += 1;
                            toastOk("Photo enregistrée.");
                          }
                        })();
                      }}
                    />
                  </label>
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {brouillon.fiche.photos.map((p) => (
                      <li key={p.id} className="relative">
                        {apercus[p.id] ? (
                          <img
                            src={apercus[p.id]}
                            alt={p.nom}
                            className="h-28 w-full rounded-card object-cover"
                          />
                        ) : (
                          <span className="flex h-28 items-center justify-center rounded-card bg-surface-soft px-2 text-center text-xs text-ink-muted">
                            {p.nom}
                          </span>
                        )}
                        <button
                          type="button"
                          aria-label={`Retirer ${p.nom}`}
                          className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-full bg-white/90"
                          onClick={() => {
                            void retirerFichier({ data: { id: p.id } });
                            setApercus((actuel) => {
                              const url = actuel[p.id];
                              if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
                              const suivant = { ...actuel };
                              delete suivant[p.id];
                              return suivant;
                            });
                            majFiche({
                              photos: brouillon.fiche.photos.filter((x) => x.id !== p.id),
                            });
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {onglet === "integrations" && (
                <div className="space-y-4">
                  <p className="text-sm text-ink-body">
                    Intégrer cette annonce dans un compte déjà créé sur un OTA : l'annonce est
                    importée ici, sans appel à la plateforme.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs text-ink-muted">
                      Plateforme
                      <select
                        value={plateforme}
                        onChange={(e) => setPlateforme(e.target.value)}
                        className={CHAMP}
                      >
                        {PLATEFORMES_OTA.map((p) => (
                          <option key={p}>{p}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-xs text-ink-muted">
                      Compte OTA
                      <input
                        value={compteOta}
                        onChange={(e) => setCompteOta(e.target.value)}
                        className={CHAMP}
                      />
                    </label>
                  </div>
                  <label className="block text-xs text-ink-muted">
                    Coller l'annonce ou un export JSON
                    <textarea
                      value={colleOta}
                      onChange={(e) => setColleOta(e.target.value)}
                      className="mt-1 h-28 w-full rounded-card border border-line px-3 py-2 text-sm text-ink outline-none"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <BtnOutline
                      onClick={() => {
                        const relu = importerAnnonce(colleOta);
                        if (relu.erreur || !relu.fiche) {
                          toastErreur(relu.erreur ?? "Import impossible.");
                          return;
                        }
                        const importee = relu.fiche;
                        setBrouillon((b) =>
                          b
                            ? {
                                ...b,
                                nom: relu.nom?.trim() || b.nom,
                                typologie: relu.typologie
                                  ? typeCanonique(relu.typologie)
                                  : b.typologie,
                                adresse: relu.adresse ?? b.adresse,
                                fiche: {
                                  ...b.fiche,
                                  ...importee,
                                  photos: b.fiche.photos,
                                  ota: {
                                    plateforme,
                                    compte: compteOta.trim(),
                                    importeLe: new Date().toISOString().slice(0, 10),
                                  },
                                  notationExtraite:
                                    relu.notation ?? importee.notationExtraite ?? null,
                                },
                              }
                            : b,
                        );
                        toastOk(
                          relu.notation != null
                            ? `Annonce importée. Notation extraite : ${relu.notation.toFixed(1)}.`
                            : "Annonce importée. Aucune notation exploitable dans le texte.",
                        );
                      }}
                    >
                      Importer l'annonce
                    </BtnOutline>
                    <BtnOutline
                      onClick={() => {
                        telechargerDemo(
                          `annonce-${brouillon.nom || "lieu"}.json`,
                          exporterAnnonce({
                            version: 1,
                            nom: brouillon.nom,
                            typologie: brouillon.typologie,
                            adresse: brouillon.adresse,
                            fiche: brouillon.fiche,
                          }),
                        );
                      }}
                    >
                      Exporter l'annonce
                    </BtnOutline>
                    <BtnOutline onClick={() => setApercu((v) => !v)}>
                      {apercu ? "Masquer l'annonce" : "Visualiser l'annonce"}
                    </BtnOutline>
                  </div>
                  {brouillon.fiche.ota && (
                    <p className="text-xs text-ink-muted">
                      Dernier import {brouillon.fiche.ota.plateforme}
                      {brouillon.fiche.ota.compte
                        ? ` · compte ${brouillon.fiche.ota.compte}`
                        : ""}{" "}
                      · {brouillon.fiche.ota.importeLe}
                      {brouillon.fiche.notationExtraite != null &&
                        ` · notation ${brouillon.fiche.notationExtraite.toFixed(1)}`}
                    </p>
                  )}
                  <p className="text-xs text-ink-subtle">
                    L'extraction de notation lit le texte importé. Aucune API OTA n'est branchée en
                    V1.
                  </p>
                  {apercu && (
                    <article className="rounded-card border border-line bg-surface p-4">
                      <p className="text-xs uppercase tracking-wide text-ink-muted">
                        Aperçu Hublify
                      </p>
                      <h3 className="mt-1 text-lg text-ink">{brouillon.nom || "Sans nom"}</h3>
                      <p className="text-sm text-ink-body">
                        {brouillon.typologie} · {libelleUsage(brouillon.fiche.usage)}
                        {brouillon.fiche.surfaceM2 ? ` · ${brouillon.fiche.surfaceM2} m²` : ""}
                      </p>
                      <p className="mt-2 text-sm text-ink-body">
                        {brouillon.fiche.description || "Pas encore de description."}
                      </p>
                      {brouillon.fiche.notationExtraite != null && (
                        <p className="mt-2 text-sm text-ink">
                          Notation {brouillon.fiche.notationExtraite.toFixed(1)} / 5
                        </p>
                      )}
                    </article>
                  )}
                </div>
              )}
            </div>

            <div className="flex shrink-0 justify-end gap-2 border-t border-line bg-white px-6 py-3">
              <BtnOutline onClick={onFermer}>Annuler</BtnOutline>
              {peutMod && <BtnNavy type="submit">Enregistrer</BtnNavy>}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <p className="text-xs text-ink-muted">{label}</p>
      <div className="mt-1 inline-flex items-center gap-2">
        <button
          type="button"
          aria-label={`Diminuer ${label}`}
          className="flex size-11 items-center justify-center rounded-full bg-ink text-white md:size-8"
          onClick={() => onChange(Math.max(0, value - 1))}
        >
          <Minus className="size-3.5" />
        </button>
        <span className="w-6 text-center text-sm text-ink">{value}</span>
        <button
          type="button"
          aria-label={`Augmenter ${label}`}
          className="flex size-11 items-center justify-center rounded-full bg-ink text-white md:size-8"
          onClick={() => onChange(Math.min(40, value + 1))}
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function Cases({
  titre,
  items,
  choisis,
  onToggle,
}: {
  titre: string;
  items: readonly string[];
  choisis: string[];
  onToggle: (item: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm text-ink">{titre}</legend>
      <div className="mt-2 grid gap-1 sm:grid-cols-2">
        {items.map((item) => (
          <label key={item} className="flex min-h-11 items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={choisis.includes(item)}
              onChange={() => onToggle(item)}
            />
            {item}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Tri({
  label,
  valeur,
  oui,
  non,
  onChange,
}: {
  label: string;
  valeur: ChoixRegle;
  oui: string;
  non: string;
  onChange: (v: ChoixRegle) => void;
}) {
  return (
    <fieldset>
      <legend className="text-xs text-ink-muted">{label}</legend>
      <div className="mt-1 flex flex-wrap gap-3 text-sm text-ink">
        {(
          [
            ["non-précisé", "Non précisé"],
            ["oui", oui],
            ["non", non],
          ] as const
        ).map(([id, libelle]) => (
          <label key={id} className="flex min-h-11 items-center gap-2">
            <input
              type="radio"
              name={label}
              checked={valeur === id}
              onChange={() => onChange(id)}
            />
            {libelle}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Espaces({
  espaces,
  parking,
  onChange,
  onParking,
}: {
  espaces: EspaceFiche[];
  parking: number;
  onChange: (espaces: EspaceFiche[]) => void;
  onParking: (n: number) => void;
}) {
  const ajouter = () => {
    const espace: EspaceFiche = {
      id: `esp-${Date.now()}`,
      nom: espaces.length === 0 ? "Chambre" : "Pièce",
      description: "",
      lits: [],
    };
    onChange([...espaces, espace]);
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink">Couchages</p>
        <BtnOutline onClick={ajouter}>
          <Plus className="size-3" /> Ajouter une pièce
        </BtnOutline>
      </div>
      {espaces.map((espace) => (
        <div key={espace.id} className="space-y-2 rounded-card border border-line p-3">
          <div className="flex gap-2">
            <input
              value={espace.nom}
              aria-label="Nom de la pièce"
              onChange={(e) =>
                onChange(
                  espaces.map((x) => (x.id === espace.id ? { ...x, nom: e.target.value } : x)),
                )
              }
              className="h-11 flex-1 rounded-card border border-line px-3 text-sm text-ink md:h-9"
            />
            <button
              type="button"
              aria-label={`Retirer ${espace.nom}`}
              className="flex size-11 items-center justify-center md:size-9"
              onClick={() => onChange(espaces.filter((x) => x.id !== espace.id))}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
          <textarea
            value={espace.description}
            aria-label={`Description ${espace.nom}`}
            onChange={(e) =>
              onChange(
                espaces.map((x) =>
                  x.id === espace.id ? { ...x, description: e.target.value } : x,
                ),
              )
            }
            className="h-16 w-full rounded-card border border-line px-3 py-2 text-sm text-ink outline-none"
          />
          {espace.lits.map((lit) => (
            <LitLigne
              key={lit.id}
              lit={lit}
              onChange={(suivant) =>
                onChange(
                  espaces.map((x) =>
                    x.id === espace.id
                      ? { ...x, lits: x.lits.map((l) => (l.id === lit.id ? suivant : l)) }
                      : x,
                  ),
                )
              }
              onRetirer={() =>
                onChange(
                  espaces.map((x) =>
                    x.id === espace.id ? { ...x, lits: x.lits.filter((l) => l.id !== lit.id) } : x,
                  ),
                )
              }
            />
          ))}
          <BtnOutline
            onClick={() => {
              const lit: LitFiche = {
                id: `lit-${Date.now()}`,
                type: "Lit double",
                quantite: 1,
                configurations: ["", ""],
              };
              onChange(
                espaces.map((x) => (x.id === espace.id ? { ...x, lits: [...x.lits, lit] } : x)),
              );
            }}
          >
            <Plus className="size-3" /> Ajouter un couchage
          </BtnOutline>
        </div>
      ))}
      <Stepper label="Places de parking extérieur" value={parking} onChange={onParking} />
    </div>
  );
}

function LitLigne({
  lit,
  onChange,
  onRetirer,
}: {
  lit: LitFiche;
  onChange: (lit: LitFiche) => void;
  onRetirer: () => void;
}) {
  return (
    <div className="space-y-2 rounded-card bg-surface-soft p-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Type de lit"
          value={lit.type}
          onChange={(e) => {
            const type = e.target.value;
            onChange({
              ...lit,
              type,
              configurations: estLitDouble(type) ? (lit.configurations ?? ["", ""]) : null,
            });
          }}
          className="h-11 flex-1 rounded-card border border-line bg-white px-2 text-sm text-ink md:h-9"
        >
          {LITS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <Stepper
          label="Quantité"
          value={lit.quantite}
          onChange={(quantite) => onChange({ ...lit, quantite: Math.max(1, quantite) })}
        />
        <button type="button" aria-label="Retirer le couchage" onClick={onRetirer}>
          <Trash2 className="size-4" />
        </button>
      </div>
      {estLitDouble(lit.type) && (
        <div className="grid gap-2 sm:grid-cols-2">
          {([0, 1] as const).map((index) => (
            <label key={index} className="block text-xs text-ink-muted">
              Configuration {index + 1}
              <input
                value={lit.configurations?.[index] ?? ""}
                placeholder={index === 0 ? "140 × 190" : "160 × 200"}
                onChange={(e) => {
                  const configurations: [string, string] = [
                    lit.configurations?.[0] ?? "",
                    lit.configurations?.[1] ?? "",
                  ];
                  configurations[index] = e.target.value;
                  onChange({ ...lit, configurations });
                }}
                className={CHAMP}
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function Droits({
  fiche,
  onChange,
}: {
  fiche: FicheLieu;
  onChange: (patch: Partial<FicheLieu>) => void;
}) {
  const signe = Boolean(fiche.mandat?.signe);
  const categories = [
    ["financier", "Financier"],
    ["calendrier", "Calendrier"],
    ["messagerie", "Messagerie"],
    ["documents", "Documents"],
  ] as const;
  return (
    <fieldset className="space-y-2 rounded-card border border-line p-4">
      <legend className="px-1 text-sm text-ink">Droits d'accès</legend>
      {signe ? (
        <p className="text-sm text-ink-body">
          Mandat signé{fiche.mandat?.reference ? ` · ${fiche.mandat.reference}` : ""}. L'accès
          propriétaire se limite à la vision « gestionnaire en charge »
          {fiche.mandat?.gestionnaire ? ` : ${fiche.mandat.gestionnaire}` : ""}. Le gestionnaire
          ouvre les catégories ci-dessous.
        </p>
      ) : (
        <p className="text-sm text-ink-body">
          Sans mandat signé, le propriétaire conserve sa fiche. Un mandat signé bascule la vision
          sur le seul gestionnaire en charge.
        </p>
      )}
      <div className="grid gap-1 sm:grid-cols-2">
        {categories.map(([id, label]) => (
          <label key={id} className="flex min-h-11 items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={fiche.accesProprietaire[id]}
              onChange={(e) =>
                onChange({
                  accesProprietaire: { ...fiche.accesProprietaire, [id]: e.target.checked },
                })
              }
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
