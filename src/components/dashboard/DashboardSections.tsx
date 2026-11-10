import { useDroit } from "@/auth/auth-context";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Info,
  LogIn,
  MessageSquare,
  Plus,
  Star,
  Wrench,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import type { CanalMo1, EvenementMo1, LoyerMo1, MessageMo1 } from "@/data/planning-mo1";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { definirRelanceLoyer, useKpiMo1, useSession } from "@/data/session";
import { syntheseLoyers } from "@/lib/kpi";
import { METHODES_PAIEMENT } from "@/data/v1-metier";
import { copierTexte, toastErreur } from "@/lib/feedback";
import { messageRelancePaiement, resteADevoir } from "@/lib/gestionnaire-planning";
import { datesEvenementPourAffichage } from "@/lib/periode-demo";
import { cn, useSessionBool } from "@/lib/utils";

export function KpiCards({
  versImpayes = "/analyse",
  onCheck,
  onInterventions,
}: {
  versImpayes?: "/analyse";
  onCheck?: () => void;
  onInterventions?: () => void;
}) {
  const kpi = useKpiMo1();
  const voirFinances = useDroit("voir-finances");
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {voirFinances && (
        <CarteKpi
          icone={AlertTriangle}
          titre="Paiements en retard"
          titreDanger
          badge={kpi.loyersRetard > 0 ? "Urgent" : "À jour"}
          badgeUrgent={kpi.loyersRetard > 0}
          valeur={String(kpi.loyersRetard)}
          unite="en attente"
          detail={
            <>
              Tout impayé :{" "}
              <span className="text-ink-body">{kpi.impaye.toLocaleString("fr-FR")} €</span>
            </>
          }
          vers={versImpayes}
        />
      )}
      <CarteKpi
        icone={LogIn}
        titre="Check-in / Check-out"
        badge="Aujourd'hui"
        valeur={String(kpi.checkTotal)}
        unite="prévus"
        detail={
          <>
            In : <span className="text-ink-body">{kpi.checkIn}</span>
            {" · Out : "}
            <span className="text-ink-body">{kpi.checkOut}</span>
          </>
        }
        onClick={onCheck}
      />
      <CarteKpi
        icone={Wrench}
        titre="Interventions"
        badge="Aujourd'hui"
        valeur={String(kpi.missionsJour)}
        unite="en cours"
        detail={
          <>
            Ménage : <span className="text-ink-body">{kpi.menage}</span>
            {" · Plomberie : "}
            <span className="text-ink-body">{kpi.plomberie}</span>
          </>
        }
        onClick={onInterventions}
      />
    </div>
  );
}

function CarteKpi({
  icone: Icone,
  titre,
  titreDanger,
  badge,
  badgeUrgent,
  valeur,
  unite,
  detail,
  href,
  vers,
  onClick,
}: {
  icone: typeof AlertTriangle;
  titre: string;
  titreDanger?: boolean;
  badge: string;
  badgeUrgent?: boolean;
  valeur: string;
  unite: string;
  detail: ReactNode;
  href?: string;
  vers?: "/analyse";
  onClick?: (() => void) | undefined;
}) {
  const corps = (
    <div className="min-h-[116px] rounded-gest-carte border border-gest-bordure bg-gest-carte p-4 font-sans shadow-gest-carte">
      <div className="flex items-center justify-between gap-2">
        <p
          className={cn(
            "flex min-w-0 items-center gap-2 font-sans text-sm font-normal leading-5",
            titreDanger ? "text-gest-alerte" : "text-gest-item",
          )}
        >
          <Icone className="size-4 shrink-0" />
          <span className="truncate">{titre}</span>
        </p>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-xs text-ink-subtle",
            badgeUrgent ? "bg-chip-urgent" : "border border-line-strong bg-white",
          )}
        >
          {badge}
        </span>
      </div>
      <p className="mt-2">
        <span className="font-sans text-2xl font-medium leading-8 text-gest-chiffre">
          {valeur}{" "}
        </span>
        <span className="font-sans text-sm font-normal leading-5 text-gest-libelle">{unite}</span>
      </p>
      <p className="mt-1 font-sans text-xs font-normal text-gest-libelle">{detail}</p>
    </div>
  );
  const classe =
    "block rounded-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
  if (vers) {
    return (
      <Link to={vers} search={{ onglet: "revenus" }} hash="paiements-attente" className={classe}>
        {corps}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(classe, "w-full text-left")}>
        {corps}
      </button>
    );
  }
  if (!href) return corps;
  return (
    <a href={href} className={classe}>
      {corps}
    </a>
  );
}

export function MessagesSection({ messages }: { messages: MessageMo1[] }) {
  const session = useSession();
  const [ouvert, setOuvert] = useSessionBool("hublify.accordeon.messages", true);
  const [canal, setCanal] = useState<CanalMo1 | "prospect" | "nouveaux" | "tous">("occupants");
  const prospects = session.conversations.filter((c) => c.section === "prospections");
  const nonLusAuteurs = new Set(
    session.conversations.filter((c) => c.nonLu).map((c) => c.nom.toLowerCase()),
  );
  const filtres =
    canal === "prospect"
      ? []
      : canal === "tous"
        ? messages
        : canal === "nouveaux"
          ? messages.filter((m) => nonLusAuteurs.has(m.auteur.toLowerCase()))
          : messages.filter((m) => m.canal === canal);
  const convDe = (auteur: string) =>
    session.conversations.find((c) => c.nom.toLowerCase() === auteur.toLowerCase());
  const nonLus = session.conversations.filter((c) => c.nonLu).length;

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-surface-soft px-4 py-3">
        <button
          type="button"
          className="flex min-w-0 items-center gap-2 text-sm text-ink"
          onClick={() => setOuvert((o) => !o)}
        >
          <MessageSquare className="size-4 shrink-0" />
          Les Messages
          {nonLus > 0 && (
            <span className="rounded-full bg-ink px-1.5 py-0.5 text-[10px] text-white">
              {nonLus}
            </span>
          )}
        </button>
        <div className="mx-auto flex flex-wrap justify-center gap-1.5">
          {(
            [
              ["nouveaux", "Nouveaux"],
              ["occupants", "Occupants"],
              ["prestataires", "Prestataires"],
              ["team", "Team mate"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setCanal(id);
                setOuvert(true);
              }}
              className={cn(
                "inline-flex h-7 items-center rounded-full border px-3 text-xs font-medium",
                canal === id
                  ? "border-ink bg-surface-soft text-ink"
                  : "border-line-strong bg-white text-ink-body",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setCanal("tous");
            setOuvert(true);
          }}
          className={cn(
            "inline-flex h-7 items-center rounded-full border px-3 text-xs font-medium",
            canal === "tous"
              ? "border-ink bg-surface-soft text-ink"
              : "border-line bg-surface text-ink-body",
          )}
        >
          Tous
        </button>
        <button
          type="button"
          onClick={() => setOuvert((o) => !o)}
          aria-label={ouvert ? "Replier les messages" : "Déplier les messages"}
          className="flex size-8 items-center justify-center"
        >
          {ouvert ? (
            <ChevronUp className="size-4 text-ink-muted" />
          ) : (
            <ChevronDown className="size-4 text-ink-muted" />
          )}
        </button>
      </div>
      {ouvert && (
        <>
          <div className="flex border-b border-surface-soft px-4 py-2">
            <button
              type="button"
              onClick={() => setCanal("prospect")}
              className={cn(
                "inline-flex h-7 items-center rounded-full border px-3 text-xs font-medium",
                canal === "prospect"
                  ? "border-ink bg-surface-soft text-ink"
                  : "border-line-strong text-ink-body",
              )}
            >
              {`Prospect${prospects.length ? ` (${prospects.length})` : ""}`}
            </button>
          </div>
          <ul>
            {canal === "prospect"
              ? prospects.map((c) => (
                  <li key={c.id}>
                    <Link
                      to="/messagerie"
                      search={{ conv: c.id }}
                      className="flex gap-3 border-b border-surface-soft px-4 py-3 last:border-b-0 hover:bg-surface"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-line text-xs text-ink-body">
                        {c.nom.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-sm text-ink">{c.nom}</span>
                          {c.nonLu && (
                            <span className="rounded-full bg-ink px-1.5 text-[10px] text-white">
                              nouveau
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-ink-subtle">
                          Demande à traiter — boîte Prospect
                        </p>
                      </div>
                    </Link>
                  </li>
                ))
              : filtres.map((m) => (
                  <li key={m.id}>
                    <Link
                      to="/messagerie"
                      search={convDe(m.auteur) ? { conv: convDe(m.auteur)!.id } : {}}
                      className="flex gap-3 border-b border-surface-soft px-4 py-3 last:border-b-0 hover:bg-surface"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-line text-xs text-ink-body">
                        {m.initiales}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-sm text-ink">{m.auteur}</span>
                          {m.bienNom && <span className="text-xs text-ink-muted">{m.bienNom}</span>}
                          <span className="ml-auto text-xs text-ink-muted">● {m.ilYa}</span>
                        </div>
                        <p className="truncate text-xs text-ink-subtle">{m.texte}</p>
                      </div>
                    </Link>
                  </li>
                ))}
            {canal === "prospect" && prospects.length === 0 && (
              <li className="px-4 py-3 text-xs text-ink-muted">Aucune demande prospect.</li>
            )}
            {canal !== "prospect" && filtres.length === 0 && (
              <li className="px-4 py-6 text-sm text-ink-muted">Aucun message dans cette vue.</li>
            )}
          </ul>
        </>
      )}
    </section>
  );
}

export function LoyersSection({
  loyers,
  onValider,
  onQuittance,
  onRembourser,
  viaPlateforme,
}: {
  loyers: LoyerMo1[];
  /** `null` : paiement reçu via la plateforme, la méthode se déduit de la réservation. */
  onValider: (id: string, details: { methode: string; reference: string } | null) => void;
  onQuittance: (id: string) => void;
  onRembourser?: (id: string, montant: number) => void;
  viaPlateforme?: (l: LoyerMo1) => boolean;
}) {
  const [ouvert, setOuvert] = useSessionBool("hublify.accordeon.loyers", true);
  const peutValider = useDroit("mod-finances");
  const synthese = syntheseLoyers(loyers);
  const [aValider, setAValider] = useState<LoyerMo1 | null>(null);
  const [aRembourser, setARembourser] = useState<LoyerMo1 | null>(null);
  const [montantRembourse, setMontantRembourse] = useState("");
  const [methode, setMethode] = useState<string>("Virement");
  const [reference, setReference] = useState("");

  return (
    <section
      id="paiements"
      className="mt-4 overflow-hidden rounded-card border border-line bg-white"
    >
      <button
        type="button"
        className="flex w-full items-start justify-between gap-2 border-b border-surface-soft px-4 py-3 text-left"
        onClick={() => setOuvert((o) => !o)}
      >
        <span className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-ink">
          <FileCheck className="size-4 shrink-0" />
          Les Loyers et paiements en attente
          <span className="basis-full text-xs text-ink-muted sm:basis-auto">
            paiements totaux : {loyers.reduce((s, l) => s + l.montant, 0).toLocaleString("fr-FR")} €
            {synthese.enAttente > 0
              ? ` · ${synthese.enAttente} en attente · ${synthese.impaye.toLocaleString("fr-FR")} €`
              : ""}
          </span>
        </span>
        {ouvert ? (
          <ChevronUp className="size-4 text-ink-muted" />
        ) : (
          <ChevronDown className="size-4 text-ink-muted" />
        )}
      </button>
      {ouvert && synthese.nombre === 0 && (
        <p className="px-4 py-6 text-sm text-ink-muted">
          Aucun loyer pour le moment. Ils apparaîtront ici dès qu'une échéance sera enregistrée.
        </p>
      )}
      {ouvert && synthese.nombre > 0 && (
        <ul>
          {loyers.map((l) => (
            <li
              key={l.id}
              className="flex flex-wrap items-center gap-3 border-b border-surface-soft px-4 py-3 last:border-b-0"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-line text-xs text-ink-body">
                {l.initiales}
              </span>
              <div className="min-w-0 flex-1 basis-32">
                <p className="text-sm text-ink">{l.locataire}</p>
                <p className="text-xs text-ink-muted">
                  {l.bienNom} · Échéance : {l.echeance}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-ink-status">
                  {l.montant.toLocaleString("fr-FR")} €
                </p>
                <p className="text-[11px] text-ink-muted">
                  Reste à devoir : {resteADevoir(l.montant, l.valide).toLocaleString("fr-FR")} €
                </p>
              </div>
              {!l.valide ? (
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                  {peutValider && (
                    <button
                      type="button"
                      onClick={() => {
                        if (viaPlateforme?.(l)) {
                          onValider(l.id, null);
                          return;
                        }
                        setMethode("Virement");
                        setReference("");
                        setAValider(l);
                      }}
                      className="h-11 rounded-card border border-line bg-white px-3 text-xs font-medium text-ink-body md:h-7"
                    >
                      Valider paiement
                    </button>
                  )}
                  <button
                    type="button"
                    aria-pressed={Boolean(l.relanceAuto)}
                    onClick={() => {
                      const actif = !l.relanceAuto;
                      definirRelanceLoyer(l.id, actif);
                      const lien = `${window.location.origin}/reservations?vue=liste`;
                      const texte = messageRelancePaiement({
                        locataire: l.locataire,
                        montant: resteADevoir(l.montant, l.valide),
                        bienNom: l.bienNom,
                        echeance: l.echeance,
                        lien,
                      });
                      if (actif)
                        void copierTexte(texte, "Relance automatique armée. Message copié.");
                    }}
                    className={cn(
                      "h-7 rounded-full px-3 text-xs font-medium",
                      l.relanceAuto
                        ? "bg-chip-success-fg text-white"
                        : "bg-chip-urgent text-ink-subtle",
                    )}
                  >
                    relance · auto
                  </button>
                  {peutValider && onRembourser && l.montant > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setARembourser(l);
                        setMontantRembourse(String(l.montant));
                      }}
                      className="h-11 rounded border border-line-strong bg-white px-3 text-xs font-medium text-ink-body md:h-[26px]"
                    >
                      Rembourser
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const lien = `${window.location.origin}/reservations?vue=liste`;
                      const texte = messageRelancePaiement({
                        locataire: l.locataire,
                        montant: resteADevoir(l.montant, l.valide),
                        bienNom: l.bienNom,
                        echeance: l.echeance,
                        lien,
                      });
                      void copierTexte(texte, "Message copié : mail, SMS et lien de paiement.");
                    }}
                    className="h-7 rounded-full border border-line px-3 text-xs font-medium text-ink-body"
                  >
                    Mail, SMS et lien
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (viaPlateforme?.(l) || !peutValider) {
                        onQuittance(l.id);
                        return;
                      }
                      setMethode("Virement");
                      setReference("");
                      setAValider(l);
                    }}
                    className="inline-flex h-11 items-center gap-1 rounded border border-line-strong bg-white px-3 text-xs font-medium text-ink-body md:h-[26px]"
                  >
                    <FileCheck className="size-2.5" />
                    Générer quittance
                  </button>
                </div>
              ) : (
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  <span className="inline-flex h-[26px] items-center gap-1 rounded border border-line bg-surface px-2 text-xs text-ink-muted">
                    <span className="flex size-3 items-center justify-center rounded-full border border-ink-muted">
                      <span className="size-1.5 rounded-full bg-ink-muted" />
                    </span>
                    Validé{l.methode ? ` · ${l.methode}` : ""}
                  </span>
                  {l.quittance ? (
                    <button
                      type="button"
                      onClick={() => onQuittance(l.id)}
                      className="inline-flex h-11 items-center gap-1 rounded border border-line-strong bg-white px-3 text-xs font-medium text-ink-body md:h-[26px]"
                    >
                      <FileCheck className="size-2.5" />
                      Quittance générée
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onQuittance(l.id)}
                      className="inline-flex h-11 items-center gap-1 rounded border border-line-strong bg-white px-3 text-xs font-medium text-ink-body md:h-[26px]"
                    >
                      <FileCheck className="size-2.5" />
                      Générer quittance
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <Dialog open={Boolean(aValider)} onOpenChange={(o) => !o && setAValider(null)}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Valider le paiement</DialogTitle>
          <DialogDescription>
            {aValider
              ? `${aValider.locataire} · ${aValider.montant.toLocaleString("fr-FR")} € · échéance ${aValider.echeance}`
              : ""}
          </DialogDescription>
          <label className="mt-2 block text-xs text-ink-muted">
            Méthode de paiement
            <select
              value={methode}
              onChange={(e) => setMethode(e.target.value)}
              className="mt-1 h-11 w-full rounded-card border border-line bg-white px-3 text-sm text-ink outline-none md:h-9"
            >
              {METHODES_PAIEMENT.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-ink-muted">
            Référence (n° de chèque, de virement…)
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Facultatif"
              className="mt-1 h-11 w-full rounded-card border border-line px-3 text-sm text-ink outline-none md:h-9"
            />
          </label>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAValider(null)}
              className="inline-flex h-11 items-center rounded-card border border-line px-3 text-xs md:h-9"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => {
                if (!aValider) return;
                onValider(aValider.id, { methode, reference: reference.trim() });
                setAValider(null);
              }}
              className="inline-flex h-11 items-center rounded-card bg-ink px-3 text-xs font-medium text-white md:h-9"
            >
              Valider le paiement
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(aRembourser)} onOpenChange={(o) => !o && setARembourser(null)}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Émettre un remboursement</DialogTitle>
          <DialogDescription>
            {aRembourser
              ? `${aRembourser.locataire} · reste ${resteADevoir(aRembourser.montant, aRembourser.valide).toLocaleString("fr-FR")} €. Stripe n'est pas connecté : le montant est retiré du reste à devoir.`
              : ""}
          </DialogDescription>
          <label className="mt-2 block text-xs text-ink-muted">
            Montant
            <input
              inputMode="decimal"
              value={montantRembourse}
              onChange={(e) => setMontantRembourse(e.target.value)}
              className="mt-1 h-11 w-full rounded-card border border-line px-3 text-sm text-ink outline-none md:h-9"
            />
          </label>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setARembourser(null)}
              className="inline-flex h-11 items-center rounded-card border border-line px-3 text-xs md:h-9"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => {
                if (!aRembourser || !onRembourser) return;
                const montant = Number(montantRembourse.replace(",", "."));
                if (!Number.isFinite(montant) || montant <= 0) {
                  toastErreur("Indiquez un montant de remboursement positif.");
                  return;
                }
                if (montant > aRembourser.montant) {
                  toastErreur("Le remboursement ne peut pas dépasser le montant du paiement.");
                  return;
                }
                onRembourser(aRembourser.id, montant);
                setARembourser(null);
              }}
              className="inline-flex h-11 items-center rounded-card bg-ink px-3 text-xs font-medium text-white md:h-9"
            >
              Rembourser
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function EvenementsSection({
  evenements,
  onAjouter,
}: {
  evenements: EvenementMo1[];
  onAjouter: () => void;
}) {
  const [ouvert, setOuvert] = useSessionBool("hublify.accordeon.evenements", true);
  const maintenant = useMemo(() => new Date(), []);
  const modResa = useDroit("mod-reservations");
  const modFinances = useDroit("mod-finances");
  const peutAjouter = modResa || modFinances;

  return (
    <section className="mt-4 overflow-hidden rounded-card border border-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-soft px-4 py-3">
        <button
          type="button"
          className="flex min-h-11 min-w-0 flex-wrap items-center gap-2 text-left text-sm text-ink md:min-h-0"
          onClick={() => setOuvert((o) => !o)}
        >
          <Star className="size-4" />
          Événements en cours
          <span className="text-xs text-ink-muted">
            {evenements.length} événement{evenements.length > 1 ? "s" : ""} détecté
            {evenements.length > 1 ? "s" : ""}
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          {peutAjouter && (
            <button
              type="button"
              onClick={onAjouter}
              className="inline-flex h-11 shrink-0 items-center gap-1 whitespace-nowrap rounded border border-line-strong bg-white px-3 text-xs font-medium text-ink-body md:h-[26px]"
            >
              <Plus className="size-2.5" />
              Ajouter
            </button>
          )}
          <button
            type="button"
            onClick={() => setOuvert((o) => !o)}
            aria-label="Replier les événements"
            className="flex size-11 shrink-0 items-center justify-center md:size-8"
          >
            {ouvert ? (
              <ChevronUp className="size-4 text-ink-muted" />
            ) : (
              <ChevronDown className="size-4 text-ink-muted" />
            )}
          </button>
        </div>
      </div>
      {ouvert && (
        <>
          <p className="flex items-center gap-2 border-b border-surface-soft bg-surface/50 px-4 py-2 text-xs text-ink-muted">
            <Info className="size-3" />
            Événements détectés automatiquement selon vos propriétés
          </p>
          <ul>
            {evenements.length === 0 && (
              <li className="px-4 py-6 text-sm text-ink-muted">
                Aucun événement pour le moment. Ajoutez-en un : il reste après rechargement.
              </li>
            )}
            {evenements.map((e) => (
              <li key={e.id} className="border-b border-surface-soft px-4 py-3 last:border-b-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex size-6 items-center justify-center rounded border border-line bg-surface-soft">
                      <Star className="size-3 text-ink-body" />
                    </span>
                    <div>
                      <p className="text-sm text-ink">{e.titre}</p>
                      <p className="text-xs text-ink-muted">{e.lieu}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded border px-2 py-0.5 text-xs",
                      e.impact === "Fort impact"
                        ? "border-ink-muted bg-surface-soft text-ink-body"
                        : "border-line-strong bg-surface text-ink-subtle",
                    )}
                  >
                    {e.impact}
                  </span>
                </div>
                <p className="mt-2 pl-8 text-xs text-ink-muted">
                  📅 {datesEvenementPourAffichage(e.id, e.dates, maintenant)}
                </p>
                <p className="mt-1 pl-8 text-xs text-ink-subtle">{e.description}</p>
              </li>
            ))}
          </ul>
          <p className="px-4 py-2 text-center text-xs text-ink-muted">
            Ces événements sont détectés automatiquement.
            {peutAjouter ? (
              <>
                {" "}
                Vous pouvez personnaliser les alertes dans le{" "}
                <Link
                  to="/parametrage"
                  className="inline-flex min-h-6 items-center font-medium text-accent-teal"
                >
                  paramétrage
                </Link>
                .
              </>
            ) : null}
          </p>
        </>
      )}
    </section>
  );
}
