// SOURCE: Hublify V1.0 — Bail / Espace de rédaction (affichage par page)
// et annotation « Voir systeme prise de caution ».

import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { EspaceRedaction, type PageRedaction } from "@/components/documents/EspaceRedaction";
import { AppShell } from "@/components/layout/AppShell";
import { ajouterDocument } from "@/data/documents-store";
import {
  AIDE_TYPES_RESERVATION,
  TYPES_RESERVATION,
  messageChevauchement,
  nuitsEntre,
  trouverChevauchement,
} from "@/data/reservations-mo1";
import type { TypeReservationMo1 } from "@/data/reservations-mo1";
import { ajouterNotif, ajouterReservation, idNouveau, useSession } from "@/data/session";
import {
  cautionSuggeree,
  libelleStatutCaution,
  peutEncaisserCaution,
  type StatutCaution,
} from "@/lib/caution";
import { telechargerPdf, toastErreur, toastOk } from "@/lib/feedback";

const champ =
  "mt-1 h-11 w-full rounded-card border border-line px-3 text-sm text-ink outline-none md:h-9";

const TYPES_BAIL = TYPES_RESERVATION.flatMap((g) => g.options).filter((t) => t.startsWith("Bail"));

/** Horodatage d'affichage. Appelé seulement après montage : `toLocale*` diverge entre Node et le navigateur. */
function horodatageRedaction(maintenant = new Date()) {
  return {
    date: maintenant.toLocaleDateString("fr-FR"),
    heure: maintenant.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  };
}

const PAGES = [
  "type",
  "designations",
  "periode",
  "loyer",
  "caution",
  "conditions",
  "surloyer",
] as const;

type PageBail = (typeof PAGES)[number];

export function CreerBail() {
  const session = useSession();
  const navigate = useNavigate();
  const [page, setPage] = useState<PageBail>("type");
  const [filtreType, setFiltreType] = useState("tous");
  const [bienId, setBienId] = useState(session.biens[0]?.id ?? "");
  const [parties, setParties] = useState({ bailleur: "", locataire: "", email: "", telephone: "" });
  const [dates, setDates] = useState({ debut: "", fin: "" });
  const [type, setType] = useState<TypeReservationMo1>("Bail meublé");
  const [loyer, setLoyer] = useState("850");
  const [charges, setCharges] = useState("50");
  const [caution, setCaution] = useState("1700");
  const [statutCaution, setStatutCaution] = useState<StatutCaution>("a_encaisser");
  const [modeCaution, setModeCaution] = useState("Virement");
  const [garant, setGarant] = useState({ nom: "", contrat: false, identite: false });
  const [conditions, setConditions] = useState(
    "Le logement est loué meublé. L'état des lieux d'entrée est annexé.",
  );
  const [surloyer, setSurloyer] = useState("");
  const [calendrier, setCalendrier] = useState(true);
  const [horodatage, setHorodatage] = useState<{ date: string; heure: string } | null>(null);

  useEffect(() => {
    if (!bienId && session.biens[0]) setBienId(session.biens[0].id);
  }, [bienId, session.biens]);

  useEffect(() => {
    setHorodatage(horodatageRedaction());
  }, []);

  const bien = session.biens.find((b) => b.id === bienId);
  const aideType = AIDE_TYPES_RESERVATION.find((a) => a.type === type);
  const bauxEnregistres = session.reservationsDossier.filter(
    (r) => r.statut !== "Annulé" && (r.type ?? "").startsWith("Bail"),
  );
  const bauxFiltres =
    filtreType === "tous" ? bauxEnregistres : bauxEnregistres.filter((r) => r.type === filtreType);
  const loyerN = Number(loyer.replace(",", ".")) || 0;
  const chargesN = Number(charges.replace(",", ".")) || 0;
  const cautionN = Number(caution.replace(",", ".")) || 0;
  const suggestion = cautionSuggeree(loyerN, chargesN);

  const pages: PageRedaction[] = useMemo(
    () => [
      { id: "type", label: "Type de bail", fait: Boolean(type && bienId) },
      {
        id: "designations",
        label: "Désignations",
        fait: Boolean(parties.locataire.trim() && (parties.bailleur.trim() || bien?.proprietaire)),
      },
      { id: "periode", label: "Période de location", fait: Boolean(dates.debut && dates.fin) },
      { id: "loyer", label: "Loyer et charges", fait: loyerN > 0 },
      { id: "caution", label: "Caution et garantie", fait: cautionN > 0 },
      { id: "conditions", label: "Conditions diverses", fait: conditions.trim().length > 12 },
      { id: "surloyer", label: "Surloyer", detail: "Optionnel", fait: surloyer.trim().length > 0 },
    ],
    [type, bienId, parties, bien?.proprietaire, dates, loyerN, cautionN, conditions, surloyer],
  );

  const encaisser = () => {
    if (!peutEncaisserCaution(cautionN, statutCaution)) {
      toastErreur("Indiquez un montant de caution encore à encaisser.");
      return;
    }
    setStatutCaution("encaissee");
    toastOk(`Caution de ${cautionN} € marquée encaissée (${modeCaution}).`);
  };

  const generer = async () => {
    if (!bienId || !parties.locataire.trim() || !dates.debut || !dates.fin) {
      toastErreur("Complétez le logement, le locataire et les dates.");
      setPage(!parties.locataire.trim() ? "designations" : "periode");
      return;
    }
    if (dates.fin <= dates.debut) {
      toastErreur("La date de fin doit être après le début.");
      setPage("periode");
      return;
    }
    if (calendrier) {
      const collision = trouverChevauchement(session.reservationsDossier, {
        bienId,
        arrivee: dates.debut,
        depart: dates.fin,
      });
      if (collision) {
        toastErreur(messageChevauchement(collision));
        return;
      }
    }
    const extra = [
      `Type : ${type}`,
      `Logement : ${bien?.nom ?? bienId}`,
      `Adresse : ${bien?.adresse ?? "—"}`,
      `Bailleur : ${parties.bailleur || bien?.proprietaire || "Gestionnaire"}`,
      `Locataire : ${parties.locataire}`,
      `Du ${dates.debut} au ${dates.fin}`,
      `Loyer : ${loyerN} EUR`,
      `Charges : ${chargesN} EUR`,
      `Caution : ${cautionN} EUR (${libelleStatutCaution(statutCaution)}, ${modeCaution})`,
      garant.nom.trim() ? `Garant : ${garant.nom.trim()}` : "Garant : aucun",
      garant.contrat ? "Contrat de travail ou avis de situation : fourni" : "",
      surloyer.trim() ? `Surloyer : ${surloyer.trim()}` : "",
      conditions.trim(),
    ].filter(Boolean);
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
      date: horodatageRedaction().date,
      taille: "PDF",
      modifiePar: "Vous",
      photos: 0,
      vue: "residents",
      occupant: "locataires",
    });
    if (garant.nom.trim()) {
      ajouterDocument({
        id: idNouveau("doc"),
        titre: `Dossier garant — ${garant.nom.trim()}`,
        type: "Dossier",
        filtre: "Dossiers",
        logement: bien?.nom ?? "—",
        date: horodatageRedaction().date,
        taille: "—",
        modifiePar: "Vous",
        photos: 0,
        vue: "residents",
        occupant: "locataires",
      });
    }
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
      detail: `${parties.locataire} · ${bien?.nom} · caution ${libelleStatutCaution(statutCaution)}`,
      href: "/documents?vue=residents",
    });
    toastOk("Bail enregistré dans Documents.");
    await navigate({ to: "/documents", search: { vue: "residents" } });
  };

  const apercu = (
    <div className="space-y-3 text-sm text-ink">
      {page === "type" && (
        <>
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
          <label className="block text-xs text-ink-muted">
            Type de bail
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
          {aideType && (
            <p className="text-xs text-ink-body">
              {aideType.duree} · dépôt {aideType.depot} · préavis {aideType.preavis}
            </p>
          )}
        </>
      )}
      {page === "designations" && (
        <>
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
            Locataire
            <input
              value={parties.locataire}
              onChange={(e) => setParties({ ...parties, locataire: e.target.value })}
              className={champ}
            />
          </label>
          <label className="block text-xs text-ink-muted">
            E-mail
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
        </>
      )}
      {page === "periode" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-ink-muted">
            Début
            <input
              type="date"
              value={dates.debut}
              onChange={(e) => setDates({ ...dates, debut: e.target.value })}
              className={champ}
            />
          </label>
          <label className="block text-xs text-ink-muted">
            Fin
            <input
              type="date"
              value={dates.fin}
              onChange={(e) => setDates({ ...dates, fin: e.target.value })}
              className={champ}
            />
          </label>
          {dates.debut && dates.fin ? (
            <p className="text-xs text-ink-muted sm:col-span-2">
              {nuitsEntre(dates.debut, dates.fin)} nuits
            </p>
          ) : null}
        </div>
      )}
      {page === "loyer" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-ink-muted">
            Loyer hors charges
            <input value={loyer} onChange={(e) => setLoyer(e.target.value)} className={champ} />
          </label>
          <label className="block text-xs text-ink-muted">
            Charges
            <input value={charges} onChange={(e) => setCharges(e.target.value)} className={champ} />
          </label>
        </div>
      )}
      {page === "caution" && (
        <div className="space-y-3">
          <p className="text-xs text-ink-muted">
            Prise de caution suggérée : {suggestion} € (deux mois, charges comprises). Le dépôt
            reste restituable en fin de bail.
          </p>
          <label className="block text-xs text-ink-muted">
            Montant
            <input value={caution} onChange={(e) => setCaution(e.target.value)} className={champ} />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCaution(String(suggestion))}
              className="inline-flex h-11 items-center rounded-card border border-line px-3 text-xs md:h-9"
            >
              Appliquer {suggestion} €
            </button>
          </div>
          <label className="block text-xs text-ink-muted">
            Mode d'encaissement
            <select
              value={modeCaution}
              onChange={(e) => setModeCaution(e.target.value)}
              className={champ}
            >
              <option>Virement</option>
              <option>Chèque</option>
              <option>Espèces</option>
            </select>
          </label>
          <p className="text-[11px] text-ink-muted">
            Stripe n'est proposé qu'une fois le compte de paiement connecté.
          </p>
          <p className="text-sm">
            Statut : <span className="font-medium">{libelleStatutCaution(statutCaution)}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={encaisser}
              className="inline-flex h-11 items-center rounded-card bg-ink px-3 text-xs font-medium text-white md:h-9"
            >
              Encaisser la caution
            </button>
            <button
              type="button"
              onClick={() => setStatutCaution("restituee")}
              className="inline-flex h-11 items-center rounded-card border border-line px-3 text-xs md:h-9"
            >
              Marquer restituée
            </button>
          </div>
          <fieldset className="rounded-card border border-line p-3">
            <legend className="px-1 text-xs font-medium text-ink">Garant</legend>
            <p className="text-[11px] text-ink-muted">
              S'il y a un garant, ses pièces suivent le même tableau que le dossier locataire :
              contrat de travail ou avis de situation, pièce d'identité recto puis verso.
            </p>
            <label className="mt-2 block text-xs text-ink-muted">
              Nom du garant
              <input
                value={garant.nom}
                onChange={(e) => setGarant({ ...garant, nom: e.target.value })}
                className={champ}
              />
            </label>
            <label className="mt-2 flex items-center gap-2 text-xs text-ink-body">
              <input
                type="checkbox"
                checked={garant.contrat}
                onChange={(e) => setGarant({ ...garant, contrat: e.target.checked })}
              />
              Contrat de travail ou avis de situation
            </label>
            <label className="mt-2 flex items-center gap-2 text-xs text-ink-body">
              <input
                type="checkbox"
                checked={garant.identite}
                onChange={(e) => setGarant({ ...garant, identite: e.target.checked })}
              />
              Pièce d'identité, recto et verso
            </label>
            {garant.nom.trim() ? (
              <Link
                to="/documents"
                search={{ vue: "residents" }}
                className="mt-2 inline-flex text-xs font-medium text-ink underline"
              >
                Ouvrir les documents du garant
              </Link>
            ) : null}
          </fieldset>
        </div>
      )}
      {page === "conditions" && (
        <label className="block text-xs text-ink-muted">
          Conditions
          <textarea
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
            rows={6}
            className="mt-1 w-full rounded-card border border-line px-3 py-2 text-sm text-ink outline-none"
          />
        </label>
      )}
      {page === "surloyer" && (
        <>
          <label className="block text-xs text-ink-muted">
            Surloyer éventuel
            <input
              value={surloyer}
              onChange={(e) => setSurloyer(e.target.value)}
              placeholder="Laisser vide s'il n'y en a pas"
              className={champ}
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-ink-body">
            <input
              type="checkbox"
              checked={calendrier}
              onChange={(e) => setCalendrier(e.target.checked)}
            />
            Créer l'entrée au calendrier
          </label>
          <button
            type="button"
            onClick={() => void generer()}
            className="inline-flex h-11 items-center rounded-card bg-ink px-4 text-sm font-medium text-white md:h-9"
          >
            Générer et enregistrer le bail
          </button>
        </>
      )}
    </div>
  );

  const nomLocataire = parties.locataire.trim() || "Locataire";

  return (
    <AppShell titre="Baux" sousTitre="Espace de rédaction, page par page">
      <p className="mb-3 text-xs text-ink-muted">
        <Link to="/outils" className="hover:text-ink">
          Outils
        </Link>
        <span> · Baux</span>
      </p>
      <section aria-label="Baux enregistrés" className="mb-4 rounded-card border border-line bg-white p-4">
        <div role="group" aria-label="Type de bail" className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={filtreType === "tous"}
            onClick={() => setFiltreType("tous")}
            className={`inline-flex h-11 items-center rounded-full border px-3 text-xs md:h-8 ${filtreType === "tous" ? "border-ink bg-ink text-white" : "border-line text-ink"}`}
          >
            Tous les types
          </button>
          {TYPES_BAIL.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={filtreType === t}
              onClick={() => setFiltreType(t)}
              className={`inline-flex h-11 items-center rounded-full border px-3 text-xs md:h-8 ${filtreType === t ? "border-ink bg-ink text-white" : "border-line text-ink"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <p role="status" className="mt-3 text-sm text-ink">
          {bauxFiltres.length} bail{bauxFiltres.length > 1 ? "x" : ""}
          {filtreType === "tous" ? "" : ` · ${filtreType}`}
        </p>
        <ul className="mt-2 space-y-1 text-sm text-ink-body">
          {bauxFiltres.length === 0 ? (
            <li>Aucun bail pour ce type.</li>
          ) : (
            bauxFiltres.map((r) => (
              <li key={r.id}>
                {r.occupant} · {r.type} · {r.arrivee}
              </li>
            ))
          )}
        </ul>
      </section>
      <EspaceRedaction
        titre={`Bail ${nomLocataire}`}
        sousTitre={
          bien
            ? `${bien.nom}${bien.adresse ? ` · ${bien.adresse}` : ""} · Rédacteur : vous`
            : "Choisissez un logement"
        }
        meta={
          <>
            <span className="rounded-card bg-surface-soft px-2 py-1 text-[11px] text-ink-muted">
              {horodatage?.date ?? "\u00a0"}
            </span>
            <span className="rounded-card bg-surface-soft px-2 py-1 text-[11px] text-ink-muted">
              {horodatage?.heure ?? "\u00a0"}
            </span>
          </>
        }
        pages={pages}
        pageActive={page}
        onPage={(id) => setPage(id as PageBail)}
        apercu={apercu}
      />
    </AppShell>
  );
}
