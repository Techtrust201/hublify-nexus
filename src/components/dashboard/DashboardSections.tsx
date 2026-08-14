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
import { cn } from "@/lib/utils";

export function KpiCards() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <CarteKpi
        icone={AlertTriangle}
        titre="Loyers en retard"
        badge="Urgent"
        valeur="3"
        unite="en attente"
        detail={
          <>
            Tout impayé : <span className="text-[#4a5565]">2 450 €</span>
          </>
        }
      />
      <CarteKpi
        icone={LogIn}
        titre="Check-in / Check-out"
        badge="Aujourd'hui"
        valeur="12"
        unite="prévus"
        detail={
          <>
            In : <span className="text-[#4a5565]">6</span>
            {" · Out : "}
            <span className="text-[#4a5565]">6</span>
          </>
        }
      />
      <CarteKpi
        icone={Wrench}
        titre="Interventions"
        badge="Aujourd'hui"
        valeur="6"
        unite="en cours"
        detail={
          <>
            Ménage : <span className="text-[#4a5565]">3</span>
            {" · Réservation : "}
            <span className="text-[#4a5565]">9</span>
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
    <div className="rounded-[10px] border border-[#e5e7eb] bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm text-[#4a5565]">
          <Icone className="size-4" />
          {titre}
        </p>
        <span className="rounded border border-[#d1d5dc] px-2 py-0.5 text-xs text-[#6a7282]">
          {badge}
        </span>
      </div>
      <p className="mt-2 text-[#1e2939]">
        <span className="text-2xl leading-8">{valeur} </span>
        <span className="text-sm text-[#99a1af]">{unite}</span>
      </p>
      <p className="mt-1 text-xs text-[#99a1af]">{detail}</p>
    </div>
  );
}

export function MessagesSection({ messages }: { messages: MessageMo1[] }) {
  const [ouvert, setOuvert] = useState(true);
  const [canal, setCanal] = useState<CanalMo1>("occupants");
  const filtres = messages.filter((m) => m.canal === canal);

  return (
    <section className="mt-4 overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
      <button
        type="button"
        className="flex w-full items-center justify-between border-b border-[#f3f4f6] px-4 py-3"
        onClick={() => setOuvert((o) => !o)}
      >
        <span className="flex items-center gap-2 text-sm text-[#1e2939]">
          <MessageSquare className="size-4" />
          Les Messages
        </span>
        <span className="flex items-center gap-3">
          {(["occupants", "prestataires", "team"] as const).map((c) => (
            <span
              key={c}
              role="presentation"
              onClick={(e) => {
                e.stopPropagation();
                setCanal(c);
                setOuvert(true);
              }}
              className={cn(
                "inline-flex h-[26px] items-center rounded border px-3 text-xs font-medium",
                canal === c
                  ? "border-[#1e2939] text-[#1e2939]"
                  : "border-[#d1d5dc] text-[#4a5565]",
              )}
            >
              {c === "occupants" ? "Occupants" : c === "prestataires" ? "Prestataires" : "Team"}
            </span>
          ))}
          {ouvert ? (
            <ChevronUp className="size-4 text-[#99a1af]" />
          ) : (
            <ChevronDown className="size-4 text-[#99a1af]" />
          )}
        </span>
      </button>
      {ouvert && (
        <ul>
          {filtres.map((m) => (
            <li key={m.id} className="flex gap-3 border-b border-[#f3f4f6] px-4 py-3 last:border-b-0">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e5e7eb] text-xs text-[#4a5565]">
                {m.initiales}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm text-[#1e2939]">{m.auteur}</span>
                  {m.bienNom && <span className="text-xs text-[#99a1af]">{m.bienNom}</span>}
                  <span className="ml-auto text-xs text-[#99a1af]">● {m.ilYa}</span>
                </div>
                <p className="truncate text-xs text-[#6a7282]">{m.texte}</p>
              </div>
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
  const [ouvert, setOuvert] = useState(true);
  const total = loyers.reduce((s, l) => s + l.montant, 0);

  return (
    <section className="mt-4 overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
      <button
        type="button"
        className="flex w-full items-center justify-between border-b border-[#f3f4f6] px-4 py-3"
        onClick={() => setOuvert((o) => !o)}
      >
        <span className="flex items-center gap-2 text-sm text-[#1e2939]">
          <FileCheck className="size-4" />
          Les Loyers Payés Cette Semaine
          <span className="text-xs text-[#99a1af]">
            {loyers.length} paiements totaux · {total.toLocaleString("fr-FR")} €
          </span>
        </span>
        {ouvert ? (
          <ChevronUp className="size-4 text-[#99a1af]" />
        ) : (
          <ChevronDown className="size-4 text-[#99a1af]" />
        )}
      </button>
      {ouvert && (
        <ul>
          {loyers.map((l) => (
            <li
              key={l.id}
              className="flex flex-wrap items-center gap-3 border-b border-[#f3f4f6] px-4 py-3 last:border-b-0"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-[#e5e7eb] text-xs text-[#4a5565]">
                {l.initiales}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[#1e2939]">{l.locataire}</p>
                <p className="text-xs text-[#99a1af]">
                  {l.bienNom} · Échéance : {l.echeance}
                </p>
              </div>
              <p className="text-sm font-medium text-[#364153]">
                {l.montant.toLocaleString("fr-FR")} €
              </p>
              {!l.valide ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onValider(l.id)}
                    className="h-[26px] rounded border border-[#d1d5dc] bg-white px-3 text-xs font-medium text-[#4a5565]"
                  >
                    Valider paiement
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuittance(l.id)}
                    className="inline-flex h-[26px] items-center gap-1 rounded border border-[#d1d5dc] bg-white px-3 text-xs font-medium text-[#4a5565]"
                  >
                    <FileCheck className="size-2.5" />
                    Générer quittance
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <span className="inline-flex h-[26px] items-center gap-1 rounded border border-[#e5e7eb] bg-[#f9fafb] px-2 text-xs text-[#99a1af]">
                    <span className="flex size-3 items-center justify-center rounded-full border border-[#99a1af]">
                      <span className="size-1.5 rounded-full bg-[#99a1af]" />
                    </span>
                    Validé
                  </span>
                  {l.quittance ? (
                    <span className="inline-flex h-[26px] items-center gap-1 rounded border border-[#e5e7eb] bg-[#f9fafb] px-2 text-xs text-[#99a1af]">
                      <FileCheck className="size-2.5" />
                      Quittance générée
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onQuittance(l.id)}
                      className="inline-flex h-[26px] items-center gap-1 rounded border border-[#d1d5dc] bg-white px-3 text-xs font-medium text-[#4a5565]"
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
  const [ouvert, setOuvert] = useState(true);

  return (
    <section className="mt-4 overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
      <div className="flex items-center justify-between border-b border-[#f3f4f6] px-4 py-3">
        <button
          type="button"
          className="flex items-center gap-2 text-sm text-[#1e2939]"
          onClick={() => setOuvert((o) => !o)}
        >
          <Star className="size-4" />
          Événements en Cours
          <span className="text-xs text-[#99a1af]">
            {evenements.length} événement{evenements.length > 1 ? "s" : ""} détecté
            {evenements.length > 1 ? "s" : ""}
          </span>
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAjouter}
            className="inline-flex h-[26px] items-center gap-1 rounded border border-[#d1d5dc] bg-white px-3 text-xs font-medium text-[#4a5565]"
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
              <ChevronUp className="size-4 text-[#99a1af]" />
            ) : (
              <ChevronDown className="size-4 text-[#99a1af]" />
            )}
          </button>
        </div>
      </div>
      {ouvert && (
        <>
          <p className="flex items-center gap-2 border-b border-[#f3f4f6] bg-[#f9fafb]/50 px-4 py-2 text-xs text-[#99a1af]">
            <Info className="size-3" />
            Événements détectés automatiquement selon vos propriétés
          </p>
          <ul>
            {evenements.map((e) => (
              <li key={e.id} className="border-b border-[#f3f4f6] px-4 py-3 last:border-b-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex size-6 items-center justify-center rounded border border-[#e5e7eb] bg-[#f3f4f6]">
                      <Star className="size-3 text-[#4a5565]" />
                    </span>
                    <div>
                      <p className="text-sm text-[#1e2939]">{e.titre}</p>
                      <p className="text-xs text-[#99a1af]">{e.lieu}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded border px-2 py-0.5 text-xs",
                      e.impact === "Fort impact"
                        ? "border-[#99a1af] bg-[#f3f4f6] text-[#4a5565]"
                        : "border-[#d1d5dc] bg-[#f9fafb] text-[#6a7282]",
                    )}
                  >
                    {e.impact}
                  </span>
                </div>
                <p className="mt-2 pl-8 text-xs text-[#99a1af]">📅 {e.dates}</p>
                <p className="mt-1 pl-8 text-xs text-[#6a7282]">{e.description}</p>
              </li>
            ))}
          </ul>
          <p className="px-4 py-2 text-center text-xs text-[#99a1af]">
            Ces événements sont détectés automatiquement via l'API d'Événements. Vous pouvez
            personnaliser les alertes dans les paramètres.
          </p>
        </>
      )}
    </section>
  );
}
