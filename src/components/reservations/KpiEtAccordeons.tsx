import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileCheck,
  LogIn,
  MessageSquare,
  Plus,
  Star,
  Wrench,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function KpiReservations() {
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

export function AccordeonsBas() {
  const [ouvert, setOuvert] = useState({ messages: false, loyers: false, evenements: false });

  return (
    <div className="mt-4 space-y-4">
      <section className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3"
          onClick={() => setOuvert((o) => ({ ...o, messages: !o.messages }))}
        >
          <span className="flex items-center gap-2 text-sm text-[#1e2939]">
            <MessageSquare className="size-4" />
            Les Messages
          </span>
          {ouvert.messages ? (
            <ChevronUp className="size-4 text-[#99a1af]" />
          ) : (
            <ChevronDown className="size-4 text-[#99a1af]" />
          )}
        </button>
        {ouvert.messages && (
          <p className="border-t border-[#f3f4f6] px-4 py-3 text-xs text-[#6a7282]">
            Aucun nouveau message pour le moment.
          </p>
        )}
      </section>

      <section className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3"
          onClick={() => setOuvert((o) => ({ ...o, loyers: !o.loyers }))}
        >
          <span className="flex items-center gap-2 text-sm text-[#1e2939]">
            <FileCheck className="size-4" />
            Les Loyers Payés Cette Semaine
            <span className="text-xs text-[#99a1af]">3 paiements totaux · 2 670 €</span>
          </span>
          {ouvert.loyers ? (
            <ChevronUp className="size-4 text-[#99a1af]" />
          ) : (
            <ChevronDown className="size-4 text-[#99a1af]" />
          )}
        </button>
        {ouvert.loyers && (
          <p className="border-t border-[#f3f4f6] px-4 py-3 text-xs text-[#6a7282]">
            3 paiements totaux · 2 670 €
          </p>
        )}
      </section>

      <section className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            className="flex items-center gap-2 text-sm text-[#1e2939]"
            onClick={() => setOuvert((o) => ({ ...o, evenements: !o.evenements }))}
          >
            <Star className="size-4" />
            Événements en Cours
            <span className="text-xs text-[#99a1af]">3 événements détectés</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-[26px] items-center gap-1 rounded border border-[#d1d5dc] bg-white px-3 text-xs font-medium text-[#4a5565]">
              <Plus className="size-2.5" />
              Ajouter
            </span>
            <button
              type="button"
              onClick={() => setOuvert((o) => ({ ...o, evenements: !o.evenements }))}
              aria-label="Replier les événements"
            >
              {ouvert.evenements ? (
                <ChevronUp className="size-4 text-[#99a1af]" />
              ) : (
                <ChevronDown className="size-4 text-[#99a1af]" />
              )}
            </button>
          </div>
        </div>
        {ouvert.evenements && (
          <p className="border-t border-[#f3f4f6] px-4 py-3 text-xs text-[#6a7282]">
            3 événements détectés
          </p>
        )}
      </section>
    </div>
  );
}

export function FiltreOnglet({
  actif,
  onClick,
  children,
}: {
  actif: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-[26px] items-center rounded border px-2.5 text-xs font-medium",
        actif
          ? "border-[#1e2939] bg-[#1e2939] text-white"
          : "border-[#e5e7eb] bg-white text-[#4a5565]",
      )}
    >
      {children}
    </button>
  );
}
