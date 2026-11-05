import { Minus, Plus } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { BienSession, ImmeubleSession } from "@/data/etat-session";
import {
  GROUPES_TYPES,
  USAGES,
  ficheEffective,
  ficheVierge,
  type FicheLieu,
  type UsageLieu,
} from "@/data/patrimoine-fiche";
import { cn } from "@/lib/utils";

const CHAUFFAGES = ["", "Électrique", "Gaz", "Fioul", "Pompe à chaleur", "Bois", "Collectif"];
const ETATS = ["", "Neuf", "Bon état", "À rafraîchir", "À rénover"];
const DPE = ["", "A", "B", "C", "D", "E", "F", "G"];

export type EnregistrementConfig = {
  id: string | null;
  nom: string;
  adresse: string;
  typologie: string;
  proprietaire: string;
  fiche: FicheLieu;
};

export function ConfigLieuDialog({
  ouvert,
  bien,
  fiches,
  immeubles,
  onFermer,
  onEnregistrer,
}: {
  ouvert: boolean;
  bien: BienSession | null;
  fiches: Record<string, FicheLieu>;
  immeubles: ImmeubleSession[];
  onFermer: () => void;
  onEnregistrer: (saisie: EnregistrementConfig) => void;
}) {
  const [onglet, setOnglet] = useState<"infos" | "photos" | "charges">("infos");
  const [nom, setNom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [typologie, setTypologie] = useState("Appartement (T1, T2, T3, T4, T5 et plus)");
  const [proprietaire, setProprietaire] = useState("");
  const [fiche, setFiche] = useState<FicheLieu>(ficheVierge());

  useEffect(() => {
    if (!ouvert) return;
    setOnglet("infos");
    if (!bien) {
      setNom("");
      setAdresse("");
      setTypologie("Appartement (T1, T2, T3, T4, T5 et plus)");
      setProprietaire("");
      setFiche(ficheVierge());
      return;
    }
    const actuelle = ficheEffective(bien, fiches);
    setNom(bien.nom);
    setAdresse(bien.adresse ?? "");
    setTypologie(bien.typologie || "Appartement (T1, T2, T3, T4, T5 et plus)");
    setProprietaire(bien.proprietaire ?? "");
    setFiche({
      ...actuelle,
      surfaceM2: actuelle.surfaceM2 || (bien.surface && bien.surface !== "—" ? bien.surface : ""),
    });
  }, [ouvert, bien, fiches]);

  const maj = (partiel: Partial<FicheLieu>) => setFiche((f) => ({ ...f, ...partiel }));

  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onFermer()}>
      <DialogContent className="max-h-[92vh] max-w-3xl gap-0 overflow-y-auto p-0">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <p className="text-xs text-ink-muted">Bien immo / créer un logement</p>
            <DialogTitle className="text-lg font-medium text-ink">Lieu ou Logement</DialogTitle>
            <DialogDescription>Ajouter ou modifier une information</DialogDescription>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onFermer}
              className="h-11 rounded-card border border-line px-4 text-sm text-ink-body md:h-9"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() =>
                onEnregistrer({
                  id: bien?.id ?? null,
                  nom: nom.trim(),
                  adresse: adresse.trim(),
                  typologie,
                  proprietaire: proprietaire.trim(),
                  fiche,
                })
              }
              className="h-11 rounded-card bg-ink px-4 text-sm font-medium text-white md:h-9"
            >
              Enregistrer
            </button>
          </div>
        </div>

        <div className="flex gap-1 border-b border-line px-5">
          {(
            [
              ["infos", "Informations"],
              ["photos", "Photos & Médias"],
              ["charges", "Charges Immeubles"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={onglet === id}
              onClick={() => setOnglet(id)}
              className={cn(
                "h-11 border-b-2 px-3 text-sm",
                onglet === id
                  ? "border-ink font-medium text-ink"
                  : "border-transparent text-ink-subtle",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {onglet === "infos" && (
          <div className="space-y-4 px-5 py-5">
            <Champ label="Nom du lieu / logement">
              <input value={nom} onChange={(e) => setNom(e.target.value)} className={INPUT} />
            </Champ>
            <div className="grid gap-3 sm:grid-cols-2">
              <Champ label="Type">
                <select
                  value={typologie}
                  onChange={(e) => setTypologie(e.target.value)}
                  className={INPUT}
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
                </select>
              </Champ>
              <Champ label="Type d'utilisation">
                <select
                  value={fiche.usage}
                  onChange={(e) => maj({ usage: e.target.value as UsageLieu })}
                  className={INPUT}
                >
                  {USAGES.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.id === "meublé" ? "Location" : u.label}
                    </option>
                  ))}
                </select>
              </Champ>
            </div>
            <Champ label="Adresse">
              <input
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Saisir l'adresse du logement"
                className={INPUT}
              />
            </Champ>
            <fieldset className="rounded-card border border-line p-4">
              <legend className="px-1 text-sm text-ink">Propriétaires</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                <Champ label="Propriétaire principal">
                  <input
                    value={proprietaire}
                    onChange={(e) => setProprietaire(e.target.value)}
                    className={INPUT}
                  />
                </Champ>
                <Champ label="E-mail">
                  <input
                    value={fiche.proprietaireEmail}
                    onChange={(e) => maj({ proprietaireEmail: e.target.value })}
                    className={INPUT}
                  />
                </Champ>
                <Champ label="Téléphone">
                  <input
                    value={fiche.proprietaireTel}
                    onChange={(e) => maj({ proprietaireTel: e.target.value })}
                    className={INPUT}
                  />
                </Champ>
              </div>
            </fieldset>
            <fieldset className="rounded-card border border-line p-4">
              <legend className="px-1 text-sm text-ink">Données du bien</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                <Champ label="Surface totale (m²)">
                  <input
                    inputMode="decimal"
                    value={fiche.surfaceM2}
                    onChange={(e) => maj({ surfaceM2: e.target.value })}
                    className={INPUT}
                  />
                </Champ>
                <Pas
                  label="Nombre d'étages"
                  valeur={fiche.nombreEtages}
                  onChange={(nombreEtages) => maj({ nombreEtages })}
                />
                <Champ label="Classement énergétique">
                  <select
                    value={fiche.classementEnergetique}
                    onChange={(e) => maj({ classementEnergetique: e.target.value })}
                    className={INPUT}
                  >
                    {DPE.map((d) => (
                      <option key={d || "vide"} value={d}>
                        {d || "Non classé"}
                      </option>
                    ))}
                  </select>
                </Champ>
              </div>
            </fieldset>
            <fieldset className="rounded-card border border-line p-4">
              <legend className="px-1 text-sm text-ink">Équipements</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <Pas
                  label="Places de parking"
                  valeur={fiche.placesParking}
                  onChange={(placesParking) => maj({ placesParking })}
                />
                <Pas
                  label="Nombre d'ascenseurs"
                  valeur={fiche.nombreAscenseurs}
                  onChange={(nombreAscenseurs) => maj({ nombreAscenseurs })}
                />
              </div>
            </fieldset>
            <fieldset className="rounded-card border border-line p-4">
              <legend className="px-1 text-sm text-ink">Caractéristiques techniques</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <Champ label="Type de chauffage">
                  <select
                    value={fiche.typeChauffage}
                    onChange={(e) => maj({ typeChauffage: e.target.value })}
                    className={INPUT}
                  >
                    {CHAUFFAGES.map((c) => (
                      <option key={c || "vide"} value={c}>
                        {c || "Choisir"}
                      </option>
                    ))}
                  </select>
                </Champ>
                <Champ label="État général">
                  <select
                    value={fiche.etatGeneral}
                    onChange={(e) => maj({ etatGeneral: e.target.value })}
                    className={INPUT}
                  >
                    {ETATS.map((c) => (
                      <option key={c || "vide"} value={c}>
                        {c || "Choisir"}
                      </option>
                    ))}
                  </select>
                </Champ>
              </div>
            </fieldset>
            <fieldset className="rounded-card border border-line bg-surface-soft p-4">
              <legend className="px-1 text-sm text-ink">Options</legend>
              <label className="flex items-start gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={fiche.appelLoyerAuto}
                  onChange={(e) => maj({ appelLoyerAuto: e.target.checked })}
                  className="mt-1"
                />
                Envoyer automatiquement l'appel de loyer
              </label>
              <label className="mt-3 flex items-start gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={fiche.revisionAnnuelle}
                  onChange={(e) => maj({ revisionAnnuelle: e.target.checked })}
                  className="mt-1"
                />
                Révision annuelle du loyer en cas de bail longue durée
              </label>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Champ label="Indice">
                  <input
                    value={fiche.indiceRevision}
                    onChange={(e) => maj({ indiceRevision: e.target.value })}
                    placeholder="IRL"
                    className={INPUT}
                  />
                </Champ>
                <Champ label="Commentaire">
                  <input
                    value={fiche.commentaireCharges}
                    onChange={(e) => maj({ commentaireCharges: e.target.value })}
                    className={INPUT}
                  />
                </Champ>
              </div>
            </fieldset>
          </div>
        )}

        {onglet === "photos" && (
          <div className="space-y-3 px-5 py-5">
            <p className="text-sm text-ink-muted">
              Les photos sont enregistrées par leur nom. Le fichier reste dans les documents du
              logement.
            </p>
            <button
              type="button"
              onClick={() =>
                maj({
                  photos: [
                    ...fiche.photos,
                    { id: `ph-${Date.now()}`, nom: `Photo ${fiche.photos.length + 1}` },
                  ],
                })
              }
              className="h-11 rounded-card border border-line px-4 text-sm text-ink md:h-9"
            >
              Ajouter une photo
            </button>
            <ul className="divide-y divide-surface-soft rounded-card border border-line">
              {fiche.photos.length === 0 && (
                <li className="px-4 py-6 text-sm text-ink-muted">Aucune photo pour ce lieu.</li>
              )}
              {fiche.photos.map((p) => (
                <li key={p.id} className="flex items-center gap-2 px-3 py-2">
                  <input
                    aria-label={`Nom de ${p.nom}`}
                    value={p.nom}
                    onChange={(e) =>
                      maj({
                        photos: fiche.photos.map((x) =>
                          x.id === p.id ? { ...x, nom: e.target.value } : x,
                        ),
                      })
                    }
                    className={cn(INPUT, "flex-1")}
                  />
                  <button
                    type="button"
                    onClick={() => maj({ photos: fiche.photos.filter((x) => x.id !== p.id) })}
                    className="h-11 rounded-card border border-line px-3 text-xs md:h-9"
                  >
                    Retirer
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {onglet === "charges" && (
          <div className="space-y-4 px-5 py-5">
            <Champ label="Charges">
              <input
                value={fiche.charges}
                onChange={(e) => maj({ charges: e.target.value })}
                placeholder="Montant mensuel"
                className={INPUT}
              />
            </Champ>
            <Champ label="Immeuble">
              <select
                value={fiche.immeubleId ?? ""}
                onChange={(e) => maj({ immeubleId: e.target.value || null })}
                className={INPUT}
              >
                <option value="">Aucun immeuble</option>
                {immeubles.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nom}
                  </option>
                ))}
              </select>
            </Champ>
            <Champ label="Loyer hors charges">
              <input
                value={fiche.loyerHorsCharges}
                onChange={(e) => maj({ loyerHorsCharges: e.target.value })}
                className={INPUT}
              />
            </Champ>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const INPUT =
  "mt-1 h-11 w-full rounded-card border border-line bg-white px-3 text-sm text-ink outline-none md:h-9";

function Champ({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs text-ink-muted">
      {label}
      {children}
    </label>
  );
}

function Pas({
  label,
  valeur,
  onChange,
}: {
  label: string;
  valeur: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <p className="text-xs text-ink-muted">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          aria-label={`Diminuer ${label}`}
          onClick={() => onChange(Math.max(0, valeur - 1))}
          className="flex size-9 items-center justify-center rounded-full bg-ink text-white"
        >
          <Minus className="size-3" />
        </button>
        <span className="w-8 text-center text-sm text-ink">{valeur}</span>
        <button
          type="button"
          aria-label={`Augmenter ${label}`}
          onClick={() => onChange(valeur + 1)}
          className="flex size-9 items-center justify-center rounded-full bg-ink text-white"
        >
          <Plus className="size-3" />
        </button>
      </div>
    </div>
  );
}
