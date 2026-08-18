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
import { useKpiMo1 } from "@/data/session";
import { cn, useSessionBool } from "@/lib/utils";

export function KpiCards() {
  const kpi = useKpiMo1();
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <CarteKpi
        icone={AlertTriangle}
        titre="Loyers en retard"
        badge="Urgent"
        valeur={String(kpi.loyersRetard)}
        unite="en attente"
        detail={
          <>
            Tout impayé :{" "}
            <span className="text-ink-body">{kpi.impaye.toLocaleString("fr-FR")} €</span>
          </>
        }
      />
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
        valeur={String(kpi.interventionsEnCours)}
        unite="en cours"
        detail={
          <>
            Ménage : <span className="text-ink-body">{kpi.menage}</span>
            {" · Réservation : "}
            <span className="text-ink-body">{kpi.reservationsActives}</span>
          </>
        }
      />
    </div>
  );
}

function CarteKpi({
  icone: Icone,
  titre,
  badge,
  valeur,
  unite,
  detail,
}: {
  icone: typeof AlertTriangle;
  titre: string;
  badge: string;
  valeur: string;
  unite: string;
  detail: ReactNode;
}) {
  return (
    <div className="rounded-card border border-line bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm text-ink-body">
          <Icone className="size-4" />
          {titre}
        </p>
        <span className="rounded border border-line-strong px-2 py-0.5 text-xs text-ink-subtle">
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
  const [ouvert, setOuvert] = useSessionBool("hublify.accordeon.messages", true);
  const [canal, setCanal] = useState<CanalMo1>("occupants");
  const filtres = messages.filter((m) => m.canal === canal);

  return (
    <section className="mt-4 overflow-hidden rounded-card border border-line bg-white">
      <button
        type="button"
        className="flex w-full items-center justify-between border-b border-surface-soft px-4 py-3"
        onClick={() => setOuvert((o) => !o)}
      >
        <span className="flex items-center gap-2 text-sm text-ink">
          <MessageSquare className="size-4" />
          Les Messages
        </span>
        {ouvert ? (
          <ChevronUp className="size-4 text-ink-muted" />
        ) : (
          <ChevronDown className="size-4 text-ink-muted" />
        )}
      </button>
      <div className="flex flex-wrap gap-2 border-b border-surface-soft px-4 py-2">
        {(["occupants", "prestataires", "team"] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setCanal(c);
              setOuvert(true);
            }}
            className={cn(
              "inline-flex h-11 min-h-11 items-center rounded border px-3 text-sm font-medium md:h-[26px] md:min-h-[26px] md:text-xs",
              canal === c
                ? "border-ink text-ink"
                : "border-line-strong text-ink-body",
            )}
          >
            {c === "occupants" ? "Occupants" : c === "prestataires" ? "Prestataires" : "Team"}
          </button>
        ))}
      </div>
      {ouvert && (
        <ul>
          {filtres.map((m) => (
            <li key={m.id}>
              <Link
                to="/messagerie"
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
        </ul>
      )}
    </section>
  );
}

export function LoyersSection({
  loyers,
  onValider,
  onQuittance,
}: {
  loyers: LoyerMo1[];
  onValider: (id: string) => void;
  onQuittance: (id: string) => void;
}) {
  const [ouvert, setOuvert] = useSessionBool("hublify.accordeon.loyers", true);
  const total = loyers.reduce((s, l) => s + l.montant, 0);

  return (
    <section className="mt-4 overflow-hidden rounded-card border border-line bg-white">
      <button
        type="button"
        className="flex w-full items-center justify-between border-b border-surface-soft px-4 py-3"
        onClick={() => setOuvert((o) => !o)}
      >
        <span className="flex items-center gap-2 text-sm text-ink">
          <FileCheck className="size-4" />
          Les Loyers Payés Cette Semaine
          <span className="text-xs text-ink-muted">
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
              <span className="flex size-8 items-center justify-center rounded-full bg-line text-xs text-ink-body">
                {l.initiales}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">{l.locataire}</p>
                <p className="text-xs text-ink-muted">
                  {l.bienNom} · Échéance : {l.echeance}
                </p>
              </div>
              <p className="text-sm font-medium text-ink-status">
                {l.montant.toLocaleString("fr-FR")} €
              </p>
              {!l.valide ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onValider(l.id)}
                    className="h-[26px] rounded border border-line-strong bg-white px-3 text-xs font-medium text-ink-body"
                  >
                    Valider paiement
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuittance(l.id)}
                    className="inline-flex h-[26px] items-center gap-1 rounded border border-line-strong bg-white px-3 text-xs font-medium text-ink-body"
                  >
                    <FileCheck className="size-2.5" />
                    Générer quittance
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <span className="inline-flex h-[26px] items-center gap-1 rounded border border-line bg-surface px-2 text-xs text-ink-muted">
                    <span className="flex size-3 items-center justify-center rounded-full border border-ink-muted">
                      <span className="size-1.5 rounded-full bg-ink-muted" />
                    </span>
                    Validé
                  </span>
                  {l.quittance ? (
                    <span className="inline-flex h-[26px] items-center gap-1 rounded border border-line bg-surface px-2 text-xs text-ink-muted">
                      <FileCheck className="size-2.5" />
                      Quittance générée
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onQuittance(l.id)}
                      className="inline-flex h-[26px] items-center gap-1 rounded border border-line-strong bg-white px-3 text-xs font-medium text-ink-body"
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

  return (
    <section className="mt-4 overflow-hidden rounded-card border border-line bg-white">
      <div className="flex items-center justify-between border-b border-surface-soft px-4 py-3">
        <button
          type="button"
          className="flex items-center gap-2 text-sm text-ink"
          onClick={() => setOuvert((o) => !o)}
        >
          <Star className="size-4" />
          Événements en Cours
          <span className="text-xs text-ink-muted">
            {evenements.length} événement{evenements.length > 1 ? "s" : ""} détecté
            {evenements.length > 1 ? "s" : ""}
          </span>
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAjouter}
            className="inline-flex h-[26px] items-center gap-1 rounded border border-line-strong bg-white px-3 text-xs font-medium text-ink-body"
          >
            <Plus className="size-2.5" />
            Ajouter
          </button>
          <button
            type="button"
            onClick={() => setOuvert((o) => !o)}
            aria-label="Replier les événements"
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
            Ces événements sont détectés automatiquement via l'API d'Événements. Vous pouvez
            personnaliser les alertes dans les paramètres.
          </p>
        </>
      )}
    </section>
  );
}
