import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { TYPES_RESERVATION, nuitsEntre } from "@/data/reservations-mo1";
import type { TypeReservationMo1 } from "@/data/reservations-mo1";
import { ajouterDocument } from "@/data/documents-store";
import {
  ajouterNotif,
  ajouterReservation,
  idNouveau,
  useSession,
} from "@/data/session";
import { telechargerPdf, toastErreur, toastOk } from "@/lib/feedback";
import { cn } from "@/lib/utils";

const champ =
  "mt-1 h-11 w-full rounded-card border border-line px-3 text-sm text-ink outline-none md:h-9";

const TYPES_BAIL = TYPES_RESERVATION.flatMap((g) => g.options).filter((t) => t.startsWith("Bail"));

export function CreerBail() {
  const session = useSession();
  const navigate = useNavigate();
  const [etape, setEtape] = useState(0);
  const [bienId, setBienId] = useState(session.biens[0]?.id ?? "");
  const [parties, setParties] = useState({ bailleur: "", locataire: "", email: "", telephone: "" });
  const [dates, setDates] = useState({ debut: "", fin: "" });
  const [type, setType] = useState<TypeReservationMo1>("Bail meublé");
  const [loyer, setLoyer] = useState("850");
  const [charges, setCharges] = useState("50");
  const [caution, setCaution] = useState("1700");
  const [calendrier, setCalendrier] = useState(true);

  const bien = session.biens.find((b) => b.id === bienId);
  const etapes = ["Logement", "Parties", "Dates", "Loyer", "Générer"];

  const generer = async () => {
    if (!bienId || !parties.locataire.trim() || !dates.debut || !dates.fin) {
      toastErreur("Complétez le logement, le locataire et les dates.");
      return;
    }
    if (dates.fin <= dates.debut) {
      toastErreur("La date de fin doit être après le début.");
      return;
    }
    const loyerN = Number(loyer.replace(",", ".")) || 0;
    const chargesN = Number(charges.replace(",", ".")) || 0;
    const cautionN = Number(caution.replace(",", ".")) || 0;
    const extra = [
      `Type : ${type}`,
      `Logement : ${bien?.nom ?? bienId}`,
      `Adresse : ${bien?.adresse ?? "—"}`,
      `Bailleur : ${parties.bailleur || bien?.proprietaire || "Gestionnaire"}`,
      `Locataire : ${parties.locataire}`,
      `Du ${dates.debut} au ${dates.fin}`,
      `Loyer : ${loyerN} EUR`,
      `Charges : ${chargesN} EUR`,
      `Caution : ${cautionN} EUR`,
    ];
    try {
      await telechargerPdf(`Bail ${parties.locataire}`, extra, {
        titulaire: parties.bailleur || bien?.proprietaire || "Hublify",
        locataire: parties.locataire,
        extra,
        ...(bien?.nom ? { logement: bien.nom } : {}),
        ...(bien?.adresse ? { adresse: bien.adresse } : {}),
      });
    } catch {
      toastErreur("Impossible de générer le PDF.");
      return;
    }
    ajouterDocument({
      id: idNouveau("doc"),
      titre: `Bail — ${parties.locataire}`,
      type: "Bail",
      filtre: "Bail",
      logement: bien?.nom ?? "—",
      date: new Date().toLocaleDateString("fr-FR"),
      taille: "PDF",
      modifiePar: "Vous",
      photos: 0,
      vue: "logements",
      occupant: "locataires",
    });
    if (calendrier) {
      const id = idNouveau("r");
      const initiales = parties.locataire
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? "")
        .join("");
      ajouterReservation({
        dossier: {
          id,
          bienId,
          occupant: parties.locataire.trim(),
          initiales: initiales || "??",
          email: parties.email.trim(),
          telephone: parties.telephone.trim(),
          arrivee: dates.debut,
          depart: dates.fin,
          heureArrivee: session.parametrage.heureCheckIn || "16:00",
          heureDepart: session.parametrage.heureCheckOut || "10:00",
          plateforme: "Direct",
          voyageurs: 1,
          adultes: 1,
          enfants: 0,
          montant: loyerN + chargesN,
          paye: 0,
          statut: "Confirmé",
          couleur: "#e5e7eb",
          type,
          caution: cautionN,
        },
        calendrier: {
          id: `cal-${id}`,
          bienId,
          voyageur: parties.locataire.trim(),
          arrivee: dates.debut,
          depart: dates.fin,
        },
      });
    }
    ajouterNotif({
      titre: "Bail créé",
      detail: `${parties.locataire} · ${bien?.nom}`,
      href: "/documents?vue=logements",
    });
    toastOk("Bail enregistré dans Documents.");
    await navigate({ to: "/documents", search: { vue: "logements" } });
  };

  return (
    <AppShell titre="Créer un bail" sousTitre="Du logement au document, puis au calendrier">
      <div className="flex items-center gap-2 text-xs text-ink-muted">
        <Link to="/outils" className="hover:text-ink-body">
          Outils
        </Link>
        <ChevronRight className="size-3" />
        <span>Baux</span>
      </div>

      <ol className="mt-4 flex flex-wrap gap-2">
        {etapes.map((e, i) => (
          <li
            key={e}
            className={cn(
              "rounded-full px-3 py-1 text-xs",
              i === etape ? "bg-ink text-white" : "bg-surface-soft text-ink-muted",
            )}
          >
            {i + 1}. {e}
          </li>
        ))}
      </ol>

      <div className="mt-4 max-w-xl rounded-card border border-line bg-white p-5">
        {etape === 0 && (
          <label className="block text-xs text-ink-muted">
            Logement
            <select value={bienId} onChange={(e) => setBienId(e.target.value)} className={champ}>
              {session.biens.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nom}
                </option>
              ))}
            </select>
          </label>
        )}
        {etape === 1 && (
          <div className="space-y-3">
            <label className="block text-xs text-ink-muted">
              Bailleur
              <input
                value={parties.bailleur}
                onChange={(e) => setParties({ ...parties, bailleur: e.target.value })}
                placeholder={bien?.proprietaire || "Nom du bailleur"}
                className={champ}
              />
            </label>
            <label className="block text-xs text-ink-muted">
              Locataire *
              <input
                value={parties.locataire}
                onChange={(e) => setParties({ ...parties, locataire: e.target.value })}
                className={champ}
              />
            </label>
            <label className="block text-xs text-ink-muted">
              Email
              <input
                type="email"
                value={parties.email}
                onChange={(e) => setParties({ ...parties, email: e.target.value })}
                className={champ}
              />
            </label>
            <label className="block text-xs text-ink-muted">
              Téléphone
              <input
                value={parties.telephone}
                onChange={(e) => setParties({ ...parties, telephone: e.target.value })}
                className={champ}
              />
            </label>
          </div>
        )}
        {etape === 2 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-ink-muted">
              Début *
              <input
                type="date"
                value={dates.debut}
                onChange={(e) => setDates({ ...dates, debut: e.target.value })}
                className={champ}
              />
            </label>
            <label className="block text-xs text-ink-muted">
              Fin *
              <input
                type="date"
                value={dates.fin}
                onChange={(e) =>
                  setDates({
                    ...dates,
                    fin: e.target.value,
                  })
                }
                className={champ}
              />
            </label>
            <label className="col-span-2 block text-xs text-ink-muted">
              Type
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TypeReservationMo1)}
                className={champ}
              >
                {TYPES_BAIL.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        {etape === 3 && (
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-xs text-ink-muted">
              Loyer
              <input value={loyer} onChange={(e) => setLoyer(e.target.value)} className={champ} />
            </label>
            <label className="block text-xs text-ink-muted">
              Charges
              <input value={charges} onChange={(e) => setCharges(e.target.value)} className={champ} />
            </label>
            <label className="block text-xs text-ink-muted">
              Caution
              <input value={caution} onChange={(e) => setCaution(e.target.value)} className={champ} />
            </label>
          </div>
        )}
        {etape === 4 && (
          <div className="space-y-3 text-sm text-ink-body">
            <p>
              {bien?.nom} · {type}
            </p>
            <p>
              {parties.locataire} · {dates.debut} → {dates.fin}
              {dates.debut && dates.fin
                ? ` (${nuitsEntre(dates.debut, dates.fin)} nuits)`
                : ""}
            </p>
            <p>
              Loyer {loyer} € + charges {charges} € · caution {caution} €
            </p>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={calendrier}
                onChange={(e) => setCalendrier(e.target.checked)}
              />
              Créer l'entrée calendrier
            </label>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <button
            type="button"
            disabled={etape === 0}
            onClick={() => setEtape((e) => e - 1)}
            className="inline-flex h-9 items-center gap-1 rounded-card border border-line px-3 text-xs disabled:opacity-40"
          >
            <ChevronLeft className="size-3" /> Retour
          </button>
          {etape < 4 ? (
            <button
              type="button"
              onClick={() => setEtape((e) => e + 1)}
              className="h-9 rounded-card bg-ink px-3 text-xs font-medium text-white"
            >
              Continuer
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void generer()}
              className="inline-flex h-9 items-center gap-1 rounded-card bg-ink px-3 text-xs font-medium text-white"
            >
              <Check className="size-3" /> Générer et enregistrer
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
