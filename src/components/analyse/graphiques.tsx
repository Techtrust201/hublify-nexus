// SOURCE: Hublify V1.0 — Maq V1 Gestionnaire / Analyse

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MoisAnalyse, PartCanal } from "@/lib/analyse-vue";
import { AMBRE, COULEURS_CANAL, ENCRE, GRIS, SAUGE, euro } from "@/components/analyse/presentation";

function eurosTooltip(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "";
  return euro(Math.round(n * 100));
}

export function GraphiqueOccupation({ mois }: { mois: MoisAnalyse[] }) {
  const data = mois.map((m) => ({ mois: m.labelCourt, taux: m.taux }));
  return (
    <div className="h-52 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="#e6e8ec" />
          <XAxis
            dataKey="mois"
            tick={{ fontSize: 11, fill: "#6a7282" }}
            interval={data.length > 8 ? 1 : 0}
          />
          <YAxis tick={{ fontSize: 11, fill: "#6a7282" }} unit="%" width={36} />
          <Tooltip formatter={(v) => [`${v} %`, "Occupation"]} />
          <Bar dataKey="taux" fill={ENCRE} radius={[5, 5, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GraphiqueEncaissements({ mois }: { mois: MoisAnalyse[] }) {
  const data = mois.map((m) => ({
    mois: m.labelCourt,
    Encaissés: m.encaise / 100,
    Restant: m.restant / 100,
  }));
  return (
    <div className="h-56 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2}>
          <CartesianGrid vertical={false} stroke="#e6e8ec" />
          <XAxis
            dataKey="mois"
            tick={{ fontSize: 11, fill: "#6a7282" }}
            interval={data.length > 8 ? 1 : 0}
          />
          <YAxis tick={{ fontSize: 11, fill: "#6a7282" }} width={48} />
          <Tooltip formatter={(v) => eurosTooltip(v)} />
          <Legend />
          <Bar dataKey="Encaissés" fill={ENCRE} radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Bar dataKey="Restant" fill={AMBRE} radius={[4, 4, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GraphiqueProgression({
  mois,
  serieA,
  serieB,
  nomA,
  nomB,
}: {
  mois: MoisAnalyse[];
  serieA: "taux" | "net";
  serieB: "tauxPrecedent" | "brut";
  nomA: string;
  nomB: string;
}) {
  const data = mois.map((m) => ({
    mois: m.labelCourt,
    [nomA]: serieA === "taux" ? m.taux : m.net / 100,
    [nomB]: serieB === "tauxPrecedent" ? m.tauxPrecedent : m.brut / 100,
  }));
  return (
    <div className="h-52 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="#e6e8ec" vertical={false} />
          <XAxis
            dataKey="mois"
            tick={{ fontSize: 11, fill: "#6a7282" }}
            interval={data.length > 8 ? 1 : 0}
          />
          <YAxis tick={{ fontSize: 11, fill: "#6a7282" }} width={48} />
          <Tooltip formatter={(v) => (serieA === "taux" ? `${v} %` : eurosTooltip(v))} />
          <Legend />
          <Line type="monotone" dataKey={nomA} stroke={SAUGE} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey={nomB} stroke={GRIS} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GraphiqueCanaux({ canaux }: { canaux: PartCanal[] }) {
  const data = canaux.filter((c) => c.nuits > 0);
  return (
    <div className="mx-auto h-44 w-44">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="nuits"
            nameKey="canal"
            innerRadius={52}
            outerRadius={74}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((c, i) => (
              <Cell key={c.canal} fill={COULEURS_CANAL[i % COULEURS_CANAL.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v, nom) => [`${v} nuits`, String(nom)]} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
