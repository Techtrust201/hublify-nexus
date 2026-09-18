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
import { useKpiMo1, useSession } from "@/data/session";
import { cn, useSessionBool } from "@/lib/utils";

export function KpiCards() {
  const kpi = useKpiMo1();
  const voirFinances = useDroit("voir-finances");
  return (
    <div className="grid gap-4 md:grid-cols-3">
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
            {" · Plomberie : "}
            <span className="text-ink-body">{kpi.plomberie}</span>
          </>
        }
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
}: {
  icone: typeof AlertTriangle;
  titre: string;
  titreDanger?: boolean;
  badge: string;
  badgeUrgent?: boolean;
  valeur: string;
  unite: string;
  detail: ReactNode;
}) {
  return (
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
}

export function MessagesSection({ messages }: { messages: MessageMo1[] }) {
  const session = useSession();
  const [ouvert, setOuvert] = useSessionBool("hublify.accordeon.messages", false);
  const [canal, setCanal] = useState<CanalMo1 | "prospect">("occupants");
  const prospects = session.conversations.filter((c) => c.section === "prospections");
  const filtres =
    canal === "prospect"
      ? []
      : messages.filter((m) => m.canal === canal);
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
  viaPlateforme,
}: {
  loyers: LoyerMo1[];
  onValider: (id: string) => void;
  onQuittance: (id: string) => void;
  viaPlateforme?: (l: LoyerMo1) => boolean;
}) {
  const [ouvert, setOuvert] = useSessionBool("hublify.accordeon.loyers", true);
  const peutValider = useDroit("mod-finances");
  const total = loyers.reduce((s, l) => s + l.montant, 0);

  return (
    <section className="mt-4 overflow-hidden rounded-card border border-line bg-white">
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
              <p className="text-sm font-medium text-ink-status">
                {l.montant.toLocaleString("fr-FR")} €
              </p>
              {!l.valide ? (
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  {peutValider && (
                    <button
                      type="button"
                      onClick={() => onValider(l.id)}
                      className="h-11 rounded border border-line-strong bg-white px-3 text-xs font-medium text-ink-body md:h-[26px]"
                    >
                      {viaPlateforme?.(l) ? "Valider + quittance auto" : "Valider paiement"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onQuittance(l.id)}
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
                    Validé
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
