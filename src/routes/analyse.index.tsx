import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Briefcase, Download, Moon, Percent, Sparkles, TrendingUp, Wrench } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { ScrollHint } from "@/components/layout/ScrollHint";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { type OngletAnalyse, type PaiementAnalyse } from "@/data/analyse-mo1";
import { formatMontant } from "@/data/reservations-mo1";
import { useSession } from "@/data/session";
import { analyserReservations } from "@/lib/kpi";
import { telechargerDemo } from "@/lib/feedback";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analyse/")({
  head: () => ({
    meta: [{ title: "Analyse — Hublify" }],
  }),
  component: PageAnalyse,
});

const ONGLETS: Array<{ id: OngletAnalyse; label: string }> = [
  { id: "occupation", label: "Occupation" },
  { id: "revenus", label: "Revenus & Paiements" },
  { id: "gestionnaire", label: "Gestionnaire" },
];

/** La moyenne ne porte que sur la courte durée : le dire évite de faire croire
 *  qu'elle couvre l'ensemble du parc quand des baux longs sont en cours. */
function detailRevenuNuit(kpi: { nuitsCourteDuree: number; longsSejours: number }) {
  const base = `${kpi.nuitsCourteDuree} nuits de courte durée`;
  if (!kpi.longsSejours) return `${base} · toutes plateformes`;
  return `${base} · ${kpi.longsSejours} bail${kpi.longsSejours > 1 ? "s" : ""} longue durée exclu${kpi.longsSejours > 1 ? "s" : ""}`;
}

function PageAnalyse() {
  const navigate = useNavigate();
  const session = useSession();
  const [filtreLogement, setFiltreLogement] = useState("tous");
  const sessionFiltree = useMemo(() => {
    if (filtreLogement === "tous") return session;
    return {
      ...session,
      reservationsDossier: session.reservationsDossier.filter((r) => r.bienId === filtreLogement),
      biens: session.biens.filter((b) => b.id === filtreLogement),
    };
  }, [filtreLogement, session]);
  const analyse = useMemo(() => analyserReservations(sessionFiltree), [sessionFiltree]);
  const [onglet, setOnglet] = useState<OngletAnalyse>("revenus");
  const [filtreStatut, setFiltreStatut] = useState<"tous" | PaiementAnalyse["statut"]>("tous");
  const [selection, setSelection] = useState<string[]>([]);
  const [fiche, setFiche] = useState<PaiementAnalyse | null>(null);

  const occupationMoy = analyse.occupation.length
    ? Math.round(analyse.occupation.reduce((s, o) => s + o.taux, 0) / analyse.occupation.length)
    : 0;

  const paiements = useMemo(
    () =>
      filtreStatut === "tous"
        ? analyse.paiements
        : analyse.paiements.filter((p) => p.statut === filtreStatut),
    [filtreStatut, analyse.paiements],
  );

  const toggleSel = (id: string) =>
    setSelection((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const exporter = () => {
    const source =
      selection.length > 0 ? paiements.filter((p) => selection.includes(p.id)) : paiements;
    const lignes = [
      "Nom;Logement;Arrivee;Depart;Booking;Nuits;Montant;Commission;Canal;Statut",
      ...source.map(
        (p) =>
          `${p.nom};${p.logement};${p.arrivee};${p.depart};${p.booking};${p.nuits};${p.montant};${p.commission};${p.canal};${p.statut}`,
      ),
    ];
    telechargerDemo("paiements-hublify.csv", lignes.join("\n"));
  };

  const resaDe = (p: PaiementAnalyse) =>
    session.reservationsDossier.find((r) => r.id === p.reservationId && r.statut !== "Annulé") ??
    session.reservationsDossier.find((r) => r.occupant === p.nom && r.statut !== "Annulé");

  return (
    <AppShell
      attendDonnees
      titre="Analyses, revenus et paiements"
      sousTitre="Suivi détaillé de vos revenus et commissions"
    >
      <label className="mb-4 flex max-w-sm items-center gap-2 text-sm text-ink-body">
        Appartement
        <select
          value={filtreLogement}
          onChange={(e) => setFiltreLogement(e.target.value)}
          className="h-11 flex-1 rounded-card border border-line bg-white px-3 text-sm outline-none md:h-9"
        >
          <option value="tous">Tous les appartements</option>
          {session.biens.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nom}
            </option>
          ))}
        </select>
      </label>
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-line">
        {ONGLETS.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setOnglet(o.id)}
            className={cn(
              "h-11 shrink-0 border-b-2 px-4 text-sm font-medium md:h-[46px]",
              onglet === o.id
                ? "border-ink bg-tab-active text-ink-deep"
                : "border-transparent text-ink-subtle",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      {onglet === "occupation" && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Kpi
              icone={<Moon className="size-4" />}
              titre="Taux d'occupation"
              valeur={`${occupationMoy} %`}
              detail="Moyenne 6 mois"
              badge="Optimal"
            />
            <Kpi
              icone={<TrendingUp className="size-4" />}
              titre="Revenu moyen par nuit"
              valeur={formatMontant(analyse.kpi.revenuNuit)}
              detail={detailRevenuNuit(analyse.kpi)}
              variation={`${analyse.kpi.variationNuit} %`}
            />
            <Kpi
              icone={<Moon className="size-4" />}
              titre="Nuits occupées"
              valeur={String(analyse.kpi.nuits)}
              detail="selon les réservations actives"
            />
          </div>
          <section className="rounded-card border border-line bg-white p-4">
            <h2 className="text-sm font-medium text-ink">Occupation</h2>
            <p className="text-xs text-ink-muted">Pourcentage de nuits occupées</p>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyse.occupation}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12, fill: "#6a7282" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#6a7282" }} unit="%" />
                  <Tooltip />
                  <Bar dataKey="taux" fill="#5591a9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}

      {onglet === "revenus" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Kpi
              icone={<TrendingUp className="size-4" />}
              titre="Montant total NET"
              valeur={formatMontant(analyse.kpi.net)}
              detail="Montant perçu après déduction des charges et taxes"
              badge="Live"
            />
            <Kpi
              icone={<Moon className="size-4" />}
              titre="Revenu moyen par nuit"
              valeur={formatMontant(analyse.kpi.revenuNuit)}
              detail={detailRevenuNuit(analyse.kpi)}
            />
            <Kpi
              icone={<Wrench className="size-4" />}
              titre="Frais de prestations"
              valeur={formatMontant(analyse.kpi.fraisPresta)}
              detail={`Total des prestations, ménage, travaux · ${analyse.kpi.nbPresta}`}
              extra={analyse.kpi.partPresta}
            />
            <Kpi
              icone={<Percent className="size-4" />}
              titre="Commissions OTA"
              valeur={formatMontant(analyse.kpi.commissionsOta)}
              detail="plateformes Airbnb, Booking,…"
              extra={analyse.kpi.partOta}
            />
            <Kpi
              icone={<Sparkles className="size-4" />}
              titre="Autres revenus"
              valeur={formatMontant(analyse.kpi.autres)}
              detail="services additionnels"
              extra={analyse.kpi.partAutres}
            />
            <Kpi
              icone={<Briefcase className="size-4" />}
              titre="Commissions gestionnaire"
              valeur={formatMontant(analyse.kpi.commissionGestionnaire)}
              detail="Commissions du gestionnaire"
              action="Voir détails →"
              onAction={() => setOnglet("gestionnaire")}
            />
          </div>

          <section className="rounded-card border border-line bg-white p-4">
            <h2 className="text-sm font-medium text-ink">Évolution des revenus</h2>
            <p className="text-xs text-ink-muted">Revenus bruts vs nets (après commissions)</p>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyse.evolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mois" tick={{ fontSize: 11, fill: "#6a7282" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#6a7282" }} />
                  <Tooltip />
                  <Legend formatter={(v) => (v === "brut" ? "Brut" : "Net")} />
                  <Line
                    type="monotone"
                    dataKey="brut"
                    stroke="#1e2939"
                    strokeWidth={2}
                    dot={false}
                    name="brut"
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    stroke="#5591a9"
                    strokeWidth={2}
                    dot={false}
                    name="net"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <TableauPaiements
            titre="Document comptable : Liste des paiements"
            sousTitre={`${paiements.length} réservations · ${selection.length} sélectionnées`}
            paiements={paiements}
            selection={selection}
            onToggle={toggleSel}
            variante="revenus"
            filtreStatut={filtreStatut}
            onFiltre={setFiltreStatut}
            onExporter={exporter}
            onVoir={setFiche}
          />
        </div>
      )}

      {onglet === "gestionnaire" && (
        <div className="space-y-4">
          <p className="text-sm text-ink-body">
            Historique complet des transactions concernant le titulaire de ce compte
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <Kpi
              titre="Revenu total"
              valeur={formatMontant(analyse.kpi.net)}
              detail="Propriétaires et gestionnaires — vue complète"
            />
            <Kpi
              titre="Revenus validés"
              valeur={formatMontant(analyse.kpi.revenusValides)}
              detail={`Montant confirmé · ${analyse.kpi.partValides}`}
            />
            <Kpi
              titre="Commissions totales"
              valeur={formatMontant(analyse.kpi.commissionsOta)}
              detail={`Frais et commissions · ${analyse.kpi.partOta}`}
            />
          </div>
          <TableauPaiements
            titre="Historique des paiements"
            sousTitre={`Solde par propriétaire : ${paiements.length} transactions`}
            paiements={paiements}
            selection={selection}
            onToggle={toggleSel}
            variante="gestionnaire"
            filtreStatut={filtreStatut}
            onFiltre={setFiltreStatut}
            onExporter={exporter}
            onVoir={setFiche}
          />
        </div>
      )}

      <Dialog open={Boolean(fiche)} onOpenChange={(o) => !o && setFiche(null)}>
        <DialogContent className="max-w-md">
          <DialogTitle>{fiche?.nom}</DialogTitle>
          <DialogDescription>
            {fiche?.logement} · {fiche?.booking}
          </DialogDescription>
          {fiche && (
            <div className="mt-3 space-y-2 text-sm text-ink-body">
              <p>
                {fiche.arrivee} → {fiche.depart} · {fiche.nuits} nuits
              </p>
              <p>Canal : {fiche.canal}</p>
              <p>
                Montant {formatMontant(fiche.montant)} · commission{" "}
                {formatMontant(fiche.commission)}
              </p>
              <p>Statut : {fiche.statut}</p>
              {resaDe(fiche) ? (
                <button
                  type="button"
                  onClick={() => {
                    const r = resaDe(fiche);
                    if (!r) return;
                    void navigate({ to: "/reservations", search: { vue: "liste", resa: r.id } });
                  }}
                  className="mt-2 inline-flex h-9 items-center rounded-card bg-accent-teal px-3 text-xs font-medium text-white"
                >
                  Ouvrir la réservation
                </button>
              ) : (
                <Link
                  to="/reservations"
                  search={{ vue: "liste" }}
                  className="mt-2 inline-flex h-9 items-center rounded-card border border-line px-3 text-xs font-medium text-ink-body"
                >
                  Voir les réservations
                </Link>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Kpi({
  icone,
  titre,
  valeur,
  detail,
  variation,
  extra,
  badge,
  action,
  onAction,
}: {
  icone?: ReactNode;
  titre: string;
  valeur: string;
  detail: string;
  variation?: string;
  extra?: string;
  badge?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <article className="min-h-[116px] w-full rounded-card border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-2 text-sm text-ink-body">
          {icone}
          {titre}
        </p>
        {badge && (
          <span className="rounded-full bg-chip-urgent px-2 py-0.5 text-[10px] font-medium text-ink">
            {badge}
          </span>
        )}
        {variation && (
          <span
            className={cn(
              "text-xs font-medium",
              variation.startsWith("-") ? "text-danger-loyer" : "text-ink-body",
            )}
          >
            {variation.startsWith("-")
              ? variation
              : variation.startsWith("+")
                ? variation
                : variation}
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl text-ink">{valeur}</p>
      <p className="mt-1 text-xs text-ink-muted">{detail}</p>
      {extra && <p className="mt-1 text-xs text-ink-subtle">{extra}</p>}
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 inline-flex min-h-6 items-center text-xs font-medium text-accent-teal"
        >
          {action}
        </button>
      )}
    </article>
  );
}

function TableauPaiements({
  titre,
  sousTitre,
  paiements,
  selection,
  onToggle,
  variante,
  filtreStatut,
  onFiltre,
  onExporter,
  onVoir,
}: {
  titre: string;
  sousTitre: string;
  paiements: PaiementAnalyse[];
  selection: string[];
  onToggle: (id: string) => void;
  variante: "revenus" | "gestionnaire";
  filtreStatut: "tous" | PaiementAnalyse["statut"];
  onFiltre: (v: "tous" | PaiementAnalyse["statut"]) => void;
  onExporter: () => void;
  onVoir: (p: PaiementAnalyse) => void;
}) {
  return (
    <section className="overflow-hidden rounded-card border border-line bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-soft px-5 py-3">
        <div>
          <h2 className="text-sm font-medium text-ink">{titre}</h2>
          <p className="text-xs text-ink-muted">{sousTitre}</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <label className="flex min-h-11 items-center text-xs text-ink-muted md:min-h-0">
            Filtrer
            <select
              value={filtreStatut}
              onChange={(e) => onFiltre(e.target.value as typeof filtreStatut)}
              className="ml-2 h-11 rounded-card border border-line bg-white px-2 text-xs text-ink md:h-8"
            >
              <option value="tous">Tous</option>
              <option value="Validé">Validé</option>
              <option value="En attente">En attente</option>
            </select>
          </label>
          <button
            type="button"
            onClick={onExporter}
            className="inline-flex h-11 items-center justify-center gap-1 rounded-card border border-line px-3 text-xs text-ink-body md:h-8"
          >
            <Download className="size-3" /> Extraire les tableaux de paiements
          </button>
        </div>
      </header>
      {paiements.length === 0 && (
        <p className="px-5 py-8 text-center text-sm text-ink-muted">
          Aucune réservation à afficher. Créez une réservation pour alimenter l'analyse.
        </p>
      )}
      <div className="divide-y divide-surface-soft md:hidden">
        {paiements.map((p) => (
          <article key={p.id} className="flex flex-col gap-2 px-4 py-4">
            <div className="flex items-start justify-between gap-2">
              <label className="flex min-h-11 items-center gap-2">
                <input
                  type="checkbox"
                  checked={selection.includes(p.id)}
                  onChange={() => onToggle(p.id)}
                  aria-label={`Sélectionner ${p.nom}`}
                />
                <span className="text-sm font-medium text-ink">{p.nom}</span>
              </label>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs",
                  p.statut === "Validé"
                    ? "bg-surface-soft text-ink"
                    : "border border-line text-ink-body",
                )}
              >
                {p.statut}
              </span>
            </div>
            <p className="text-xs text-ink-muted">
              {p.logement}
              {variante === "revenus" ? ` · ${p.localisation}` : ""}
            </p>
            <p className="text-xs text-ink-body">
              {p.arrivee} → {p.depart}
              {variante === "revenus" ? ` · ${p.nuits} nuits` : ""}
            </p>
            {variante === "gestionnaire" && (
              <p className="text-sm text-ink">
                {formatMontant(p.montant)}{" "}
                <span className="text-danger-loyer">-{formatMontant(p.commission)}</span>
              </p>
            )}
            <button
              type="button"
              onClick={() => onVoir(p)}
              className="inline-flex h-11 items-center justify-center rounded-card border border-line text-xs font-medium text-accent-teal"
            >
              Voir
            </button>
          </article>
        ))}
      </div>
      <ScrollHint className="hidden md:block">
        <table className="w-full min-w-[980px] text-left text-xs">
          <thead className="border-b border-surface-soft text-ink-subtle">
            <tr>
              <th className="w-10 px-4 py-3" />
              {variante === "gestionnaire" && <th className="px-2 py-3 font-medium">Nom</th>}
              <th className="px-2 py-3 font-medium">Logement</th>
              {variante === "revenus" && <th className="px-2 py-3 font-medium">Localisation</th>}
              {variante === "revenus" && <th className="px-2 py-3 font-medium">Réservation</th>}
              <th className="px-2 py-3 font-medium">Arrivée</th>
              <th className="px-2 py-3 font-medium">Départ</th>
              <th className="px-2 py-3 font-medium">Booking</th>
              {variante === "revenus" && <th className="px-2 py-3 font-medium">Nuits</th>}
              {variante === "gestionnaire" && <th className="px-2 py-3 font-medium">Montant</th>}
              {variante === "gestionnaire" && <th className="px-2 py-3 font-medium">Commission</th>}
              {variante === "gestionnaire" && <th className="px-2 py-3 font-medium">Canal</th>}
              <th className="px-2 py-3 font-medium">Statut</th>
              <th className="px-2 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paiements.map((p) => (
              <tr key={p.id} className="border-b border-surface-soft last:border-b-0">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selection.includes(p.id)}
                    onChange={() => onToggle(p.id)}
                    aria-label={`Sélectionner ${p.nom}`}
                  />
                </td>
                {variante === "gestionnaire" && (
                  <td className="px-2 py-3">
                    <span className="inline-flex items-center gap-2 text-ink">
                      <span className="flex size-6 items-center justify-center rounded-full bg-surface-soft text-[10px]">
                        {p.initiales}
                      </span>
                      {p.nom}
                    </span>
                  </td>
                )}
                <td className="px-2 py-3 text-ink">{p.logement}</td>
                {variante === "revenus" && (
                  <td className="px-2 py-3 text-ink-body">{p.localisation}</td>
                )}
                {variante === "revenus" && (
                  <td className="px-2 py-3 text-ink-body">{p.reservation}</td>
                )}
                <td className="px-2 py-3 text-ink-body">{p.arrivee}</td>
                <td className="px-2 py-3 text-ink-body">{p.depart}</td>
                <td className="px-2 py-3 text-ink-body">{p.booking}</td>
                {variante === "revenus" && <td className="px-2 py-3 text-ink-body">{p.nuits}</td>}
                {variante === "gestionnaire" && (
                  <td className="px-2 py-3 text-ink">{formatMontant(p.montant)}</td>
                )}
                {variante === "gestionnaire" && (
                  <td className="px-2 py-3 text-danger-loyer">-{formatMontant(p.commission)}</td>
                )}
                {variante === "gestionnaire" && (
                  <td className="px-2 py-3 text-ink-body">{p.canal}</td>
                )}
                <td className="px-2 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5",
                      p.statut === "Validé"
                        ? "bg-surface-soft text-ink"
                        : "border border-line text-ink-body",
                    )}
                  >
                    {p.statut}
                  </span>
                </td>
                <td className="px-2 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onVoir(p)}
                    className="text-xs font-medium text-accent-teal"
                  >
                    Voir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollHint>
    </section>
  );
}
