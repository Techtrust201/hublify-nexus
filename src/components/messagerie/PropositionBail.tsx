import { Check, ChevronLeft, Circle, Eye, Home, Info, Save } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import {
  SITUATIONS_LOCATAIRE,
  TYPES_BAIL,
  aideTypeBail,
  progressionBail,
  type BrouillonBail,
} from "@/data/proposition-bail";
import { cn } from "@/lib/utils";

function dateLongue(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const date = new Date(`${iso}T12:00:00`);
  const texte = date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

export function PropositionBail({
  bienNom,
  adresse,
  redacteur,
  brouillon,
  onChange,
  onRetour,
  onApercu,
  onEnregistrer,
  onPreparerSignature,
  className,
}: {
  bienNom: string;
  adresse: string;
  redacteur: string;
  brouillon: BrouillonBail;
  onChange: (brouillon: BrouillonBail) => void;
  onRetour: () => void;
  onApercu: () => void;
  onEnregistrer: () => void;
  onPreparerSignature: () => void;
  className?: string;
}) {
  const bilan = useMemo(() => progressionBail(brouillon), [brouillon]);
  const [onglet, setOnglet] = useState<"soussignes" | "renseignes">("soussignes");
  const aide = aideTypeBail(brouillon.typeBailId);
  const periodeInvalide = Boolean(
    brouillon.debut && brouillon.fin && brouillon.fin <= brouillon.debut,
  );

  const maj = (partiel: Partial<BrouillonBail>) => onChange({ ...brouillon, ...partiel });

  const aller = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className={cn("flex min-h-0 min-w-0 flex-1 flex-col bg-white", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-surface-soft px-4 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={onRetour}
            className="flex size-11 shrink-0 items-center justify-center rounded-card border border-line text-ink-body"
            aria-label="Retour à la conversation"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-medium text-ink">Rédiger proposition de Bail</h2>
              <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] text-ink-subtle">
                Brouillon
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-ink">
              <Home className="size-3.5" aria-hidden />
              {bienNom}
            </p>
            <p className="text-[11px] text-ink-muted">
              {adresse} · Rédacteur : {redacteur}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onApercu}
            className="inline-flex h-11 items-center gap-1.5 rounded-card border border-line px-3 text-xs text-ink-body"
          >
            <Eye className="size-3.5" />
            Aperçu du document
          </button>
          <button
            type="button"
            onClick={onEnregistrer}
            className="inline-flex h-11 items-center gap-1.5 rounded-card bg-ink px-3 text-xs font-medium text-white"
          >
            <Save className="size-3.5" />
            Enregistrer
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-soft px-4 py-3">
        <p className="flex items-center gap-3 text-xs text-ink-body">
          <span>
            {bilan.faites} pièce{bilan.faites > 1 ? "s" : ""} sur {bilan.total} renseignée
            {bilan.faites === 0 || bilan.faites > 1 ? "s" : ""}
          </span>
          <span
            className="h-1.5 w-40 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={bilan.pourcentage}
            aria-label="Avancement de la rédaction"
          >
            <span className="block h-full bg-ink" style={{ width: `${bilan.pourcentage}%` }} />
          </span>
          <span>{bilan.pourcentage} %</span>
        </p>
        <p className="text-[11px] text-ink-muted">Brouillon conservé sur cet appareil</p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <nav
          aria-label="Pièces du bail"
          className="border-b border-line lg:w-[230px] lg:shrink-0 lg:border-b-0 lg:border-r"
        >
          <p className="flex items-center justify-between px-4 py-3 text-xs text-ink">
            Rédaction
            <span className="text-[11px] text-ink-muted">{bilan.total}</span>
          </p>
          <ol className="flex gap-2 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:overflow-visible lg:px-2">
            {bilan.pieces.map((piece) => (
              <li key={piece.id}>
                <button
                  type="button"
                  onClick={() => aller(`piece-${piece.id}`)}
                  className="flex min-h-11 w-full items-center gap-2 rounded-card px-2 text-left text-xs text-ink-body hover:bg-surface"
                >
                  <span className="min-w-0 flex-1 truncate">{piece.libelle}</span>
                  {piece.fait ? (
                    <Check
                      className="size-3.5 shrink-0 text-chip-success-fg"
                      aria-label="Renseigné"
                    />
                  ) : (
                    <Circle className="size-3.5 shrink-0 text-line-strong" aria-hidden />
                  )}
                </button>
              </li>
            ))}
          </ol>
          <p className="hidden px-4 pb-4 text-[11px] text-ink-muted lg:block">Un bail précis</p>
        </nav>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <div className="flex gap-4 border-b border-surface-soft">
            <button
              type="button"
              onClick={() => setOnglet("soussignes")}
              className={cn(
                "border-b-2 pb-2 text-sm",
                onglet === "soussignes"
                  ? "border-ink text-ink"
                  : "border-transparent text-ink-muted",
              )}
            >
              Soussignés
            </button>
            <button
              type="button"
              onClick={() => setOnglet("renseignes")}
              className={cn(
                "border-b-2 pb-2 text-sm",
                onglet === "renseignes"
                  ? "border-ink text-ink"
                  : "border-transparent text-ink-muted",
              )}
            >
              Renseignés
            </button>
          </div>

          {onglet === "renseignes" ? (
            <ul className="space-y-2 text-xs">
              {bilan.pieces.map((piece) => (
                <li
                  key={piece.id}
                  className="flex items-center justify-between rounded-card border border-line px-3 py-2"
                >
                  <span>{piece.libelle}</span>
                  <span className={piece.fait ? "text-chip-success-fg" : "text-ink-muted"}>
                    {piece.fait ? "Renseigné" : "À compléter"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-4">
              <Bloc id="piece-type" numero="01" titre="Type de Bail">
                <fieldset>
                  <legend className="text-[11px] text-ink-muted">
                    Choisissez le type de bail que vous désirez conclure
                  </legend>
                  <div className="mt-2 space-y-2">
                    {TYPES_BAIL.map((type) => (
                      <label key={type.id} className="flex items-start gap-2 text-xs text-ink">
                        <input
                          type="radio"
                          name="type-bail"
                          className="mt-0.5"
                          checked={brouillon.typeBailId === type.id}
                          onChange={() => maj({ typeBailId: type.id })}
                        />
                        <span>{type.libelle}</span>
                      </label>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] text-ink-muted">
                    Aide : Comment choisir le type de bail
                  </p>
                  {aide && (
                    <p className="mt-1 flex gap-2 text-[11px] leading-relaxed text-ink-subtle">
                      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      {aide}
                    </p>
                  )}
                </fieldset>
              </Bloc>

              <Bloc id="piece-soussignes" numero="02" titre="Le Bailleur">
                <label className="block text-[11px] text-ink-muted">
                  Entre : nom, prénom ou adresse du bailleur relié au logement
                  <input
                    value={brouillon.bailleur}
                    onChange={(e) => maj({ bailleur: e.target.value })}
                    className="mt-1 h-11 w-full rounded-card border border-line bg-surface px-3 text-xs text-ink"
                  />
                </label>
                <label className="mt-3 block text-[11px] text-ink-muted">
                  Ou mandataire
                  <select
                    value={brouillon.mandataire}
                    onChange={(e) => maj({ mandataire: e.target.value })}
                    className="mt-1 h-11 w-full rounded-card border border-line bg-white px-3 text-xs text-ink"
                  >
                    <option value={redacteur}>{redacteur}</option>
                    <option value="Clément Dubois">Clément Dubois</option>
                    <option value="Emily Smith">Emily Smith</option>
                  </select>
                </label>
              </Bloc>

              <Bloc id="piece-soussignes-locataire" numero="03" titre="Le Locataire Principal">
                <label className="block text-[11px] text-ink-muted">
                  Nom, prénom et date de naissance reliés au prospect et à la demande
                  <input
                    value={brouillon.locataire}
                    onChange={(e) => maj({ locataire: e.target.value })}
                    className="mt-1 h-11 w-full rounded-card border border-line bg-surface px-3 text-xs text-ink"
                  />
                </label>
                <label className="mt-3 block text-[11px] text-ink-muted">
                  Situation à la date de prise d’effet du bail
                  <select
                    value={brouillon.situation}
                    onChange={(e) => maj({ situation: e.target.value })}
                    className="mt-1 h-11 w-full rounded-card border border-line bg-white px-3 text-xs text-ink"
                  >
                    {SITUATIONS_LOCATAIRE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </Bloc>

              <Bloc id="piece-periode" numero="04" titre="Période de location">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
                  <label className="block text-[11px] text-ink-muted">
                    Date proposée
                    <input
                      type="date"
                      value={brouillon.debut}
                      onChange={(e) => maj({ debut: e.target.value })}
                      className="mt-1 h-11 w-full rounded-card border border-line px-3 text-xs text-ink"
                    />
                    <span className="mt-1 block text-ink">{dateLongue(brouillon.debut)}</span>
                  </label>
                  <span className="hidden pb-8 text-xs text-ink-muted sm:block">Au</span>
                  <label className="block text-[11px] text-ink-muted">
                    Au
                    <input
                      type="date"
                      value={brouillon.fin}
                      onChange={(e) => maj({ fin: e.target.value })}
                      className="mt-1 h-11 w-full rounded-card border border-line px-3 text-xs text-ink"
                    />
                    <span className="mt-1 block text-ink">{dateLongue(brouillon.fin)}</span>
                  </label>
                </div>
                {periodeInvalide && (
                  <p className="mt-2 text-[11px] text-chip-danger-fg" role="alert">
                    La date de fin doit être postérieure à la date de début.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => aller("piece-loyer")}
                  className="mt-3 inline-flex h-11 items-center rounded-card border border-line px-3 text-xs text-ink-body"
                >
                  Étape suivante : Loyer
                </button>
              </Bloc>

              <Bloc id="piece-loyer" numero="05" titre="Loyer et charges">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Champ
                    libelle="Loyer mensuel (€)"
                    value={brouillon.loyer}
                    onChange={(loyer) => maj({ loyer })}
                  />
                  <Champ
                    libelle="Charges (€)"
                    value={brouillon.charges}
                    onChange={(charges) => maj({ charges })}
                  />
                </div>
              </Bloc>

              <Bloc id="piece-caution" numero="06" titre="Caution et garantie">
                <Champ
                  libelle="Montant de la caution (€)"
                  value={brouillon.caution}
                  onChange={(caution) => maj({ caution })}
                />
              </Bloc>

              <Bloc id="piece-conditions" numero="07" titre="Conditions divers">
                <label className="block text-[11px] text-ink-muted">
                  Clauses particulières
                  <textarea
                    value={brouillon.conditions}
                    onChange={(e) => maj({ conditions: e.target.value })}
                    rows={3}
                    className="mt-1 w-full rounded-card border border-line px-3 py-2 text-xs text-ink outline-none"
                  />
                </label>
              </Bloc>

              <Bloc
                id="piece-premier"
                numero="08"
                titre="1er Loyer"
                detail="Loyer d’entrée dans les lieux"
              >
                <Champ
                  libelle="Premier loyer (€)"
                  value={brouillon.premierLoyer}
                  onChange={(premierLoyer) => maj({ premierLoyer })}
                />
              </Bloc>

              <p className="text-[11px] text-ink-muted">
                Les locataires secondaires ou colocataires se rajoutent après la signature du bail
                principal.
              </p>
            </div>
          )}

          <article className="rounded-card border border-line p-4">
            <h3 className="text-sm text-ink">Préparer la signature</h3>
            <p className="mt-1 text-[11px] text-ink-muted">
              Relisez les constats et vérifiez avant la signature.
            </p>
            <p className="mt-3 rounded-card bg-chip-warning px-3 py-2 text-[11px] text-chip-warning-fg">
              Avant signature : {bilan.total - bilan.faites} pièce
              {bilan.total - bilan.faites > 1 ? "s" : ""} à renseigner, compléter et clés à
              vérifier, signataires à confirmer.
            </p>
            <p className="mt-3 text-[11px] text-chip-success-fg">
              Brouillon enregistré · aucune signature demandée
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onEnregistrer}
                className="inline-flex h-11 items-center gap-1.5 rounded-card border border-line px-3 text-xs text-ink-body"
              >
                <Save className="size-3.5" />
                Enregistrer le brouillon
              </button>
              <button
                type="button"
                onClick={onPreparerSignature}
                className="inline-flex h-11 items-center gap-1.5 rounded-card bg-ink px-3 text-xs font-medium text-white"
              >
                Préparer la signature
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function Bloc({
  id,
  numero,
  titre,
  detail,
  children,
}: {
  id: string;
  numero: string;
  titre: string;
  detail?: string;
  children: ReactNode;
}) {
  return (
    <article id={id} className="scroll-mt-4 rounded-card border border-line p-4">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-surface text-[11px] text-ink">
          {numero}
        </span>
        <div>
          <h3 className="text-sm text-ink">{titre}</h3>
          {detail && <p className="text-[11px] text-ink-muted">{detail}</p>}
        </div>
      </div>
      {children}
    </article>
  );
}

function Champ({
  libelle,
  value,
  onChange,
}: {
  libelle: string;
  value: string;
  onChange: (valeur: string) => void;
}) {
  return (
    <label className="block text-[11px] text-ink-muted">
      {libelle}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        className="mt-1 h-11 w-full rounded-card border border-line px-3 text-xs text-ink outline-none"
      />
    </label>
  );
}
