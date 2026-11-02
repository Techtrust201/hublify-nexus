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
import { useState, type ReactNode } from "react";
import type { CanalMo1, EvenementMo1, LoyerMo1, MessageMo1 } from "@/data/planning-mo1";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useKpiMo1, useSession } from "@/data/session";
import { METHODES_PAIEMENT } from "@/data/v1-metier";
import { copierTexte } from "@/lib/feedback";
import { messageRelancePaiement, resteADevoir } from "@/lib/gestionnaire-planning";
import { cn, useSessionBool } from "@/lib/utils";

export function KpiCards() {
  const kpi = useKpiMo1();
  const voirFinances = useDroit("voir-finances");
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {voirFinances && (
        <CarteKpi
          icone={AlertTriangle}
          titre="Loyers en retard"
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
          href="#paiements"
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
            {" · Check-in : "}
            <span className="text-ink-body">{kpi.checkInMissions}</span>
            {" · Check-out : "}
            <span className="text-ink-body">{kpi.checkOutMissions}</span>
          </>
        }
        href="#planning"
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
}) {
  const corps = (
    <div className="min-h-[116px] rounded-card border border-line bg-white p-4">
      <div className="flex items-center justify-between">
        <p
          className={cn(
            "flex items-center gap-2 text-sm",
            titreDanger ? "text-danger-loyer" : "text-ink-body",
          )}
        >
          <Icone className="size-4" />
          {titre}
        </p>
        <span
          className={cn(
            "rounded border px-2 py-0.5 text-xs text-ink-subtle",
            badgeUrgent
              ? "border-danger-loyer bg-danger-loyer/10 text-danger-loyer"
              : "border-line-strong",
          )}
        >
          {badge}
        </span>
      </div>
      <p className="mt-2 text-ink">
        <span className="text-2xl leading-8">{valeur} </span>
        <span className="text-sm text-ink-muted">{unite}</span>
      </p>
      <p className="mt-1 text-xs text-ink-muted">{detail}</p>
    </div>
  );
  if (!href) return corps;
  return (
    <a
      href={href}
      className="block rounded-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      {corps}
    </a>
  );
}

export function MessagesSection({ messages }: { messages: MessageMo1[] }) {
  const session = useSession();
  const [ouvert, setOuvert] = useSessionBool("hublify.accordeon.messages", false);
  const [canal, setCanal] = useState<CanalMo1 | "prospect">("occupants");
  const prospects = session.conversations.filter((c) => c.section === "prospections");
  const filtres = canal === "prospect" ? [] : messages.filter((m) => m.canal === canal);
  const convDe = (auteur: string) =>
    session.conversations.find((c) => c.nom.toLowerCase() === auteur.toLowerCase());
  const nonLus = session.conversations.filter((c) => c.nonLu).length;

  return (
    <section className="mt-4 overflow-hidden rounded-card border border-line bg-white">
      <button
        type="button"
        className="flex w-full items-center justify-between border-b border-surface-soft px-4 py-3"
        onClick={() => setOuvert((o) => !o)}
      >
        <span className="flex min-w-0 items-center gap-2 text-sm text-ink">
          <MessageSquare className="size-4 shrink-0" />
          Les Messages
          {nonLus > 0 && (
            <span className="rounded-full bg-ink px-1.5 py-0.5 text-[10px] text-white">
              {nonLus}
            </span>
          )}
        </span>
        {ouvert ? (
          <ChevronUp className="size-4 text-ink-muted" />
        ) : (
          <ChevronDown className="size-4 text-ink-muted" />
        )}
      </button>
      {ouvert && (
        <>
          <div className="flex flex-wrap gap-2 border-b border-surface-soft px-4 py-2">
            {(["occupants", "prestataires", "team", "prospect"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCanal(c);
                  setOuvert(true);
                }}
                className={cn(
                  "inline-flex h-11 min-h-11 items-center rounded border px-3 text-sm font-medium md:h-[26px] md:min-h-[26px] md:text-xs",
                  canal === c ? "border-ink text-ink" : "border-line-strong text-ink-body",
                )}
              >
                {c === "occupants"
                  ? "Occupants"
                  : c === "prestataires"
                    ? "Prestataires"
                    : c === "team"
                      ? "Team"
                      : `Prospect${prospects.length ? ` (${prospects.length})` : ""}`}
              </button>
            ))}
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
  const total = loyers.reduce((s, l) => s + l.montant, 0);
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
            {loyers.length} paiements totaux · {total.toLocaleString("fr-FR")} €
          </span>
        </span>
        {ouvert ? (
          <ChevronUp className="size-4 text-ink-muted" />
        ) : (
          <ChevronDown className="size-4 text-ink-muted" />
        )}
      </button>
      {ouvert && (
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
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
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
                      className="h-11 rounded border border-line-strong bg-white px-3 text-xs font-medium text-ink-body md:h-[26px]"
                    >
                      {viaPlateforme?.(l) ? "Valider + quittance auto" : "Valider paiement"}
                    </button>
                  )}
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
                    className="h-11 rounded border border-line-strong bg-white px-3 text-xs font-medium text-ink-body md:h-[26px]"
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
                    {viaPlateforme?.(l) ? "Télécharger quittance" : "Saisir montant → quittance"}
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
                      Télécharger quittance
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
                if (!Number.isFinite(montant) || montant <= 0 || montant > aRembourser.montant)
                  return;
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
          Événements en Cours
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
                <p className="mt-2 pl-8 text-xs text-ink-muted">📅 {e.dates}</p>
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
