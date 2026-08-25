import { Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Info, Minus, Plus, User, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  COULEURS_RESERVATION,
  OCCUPANTS_MO1,
  TYPES_RESERVATION,
  type PlateformeMo1,
  type TypeReservationMo1,
} from "@/data/reservations-mo1";
import { ajouterNotif, ajouterReservation, idNouveau, useSession } from "@/data/session";
import { toastErreur, toastOk } from "@/lib/feedback";
import { cn } from "@/lib/utils";

const champ =
  "h-11 w-full rounded-[8px] border border-line bg-white px-3 text-base text-ink outline-none placeholder:text-ink-muted md:h-[34px] md:text-sm";

export function FormulaireReservation() {
  const navigate = useNavigate();
  const session = useSession();
  const [typeOuvert, setTypeOuvert] = useState(false);
  const [type, setType] = useState<TypeReservationMo1 | "">("");
  const [logement, setLogement] = useState("");
  const [occupant, setOccupant] = useState("");
  const [occupant2, setOccupant2] = useState("");
  const [adultes, setAdultes] = useState(2);
  const [enfants, setEnfants] = useState(0);
  const [animaux, setAnimaux] = useState(0);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [heureIn, setHeureIn] = useState("16:00");
  const [heureOut, setHeureOut] = useState("10:00");
  const [couleur, setCouleur] = useState(COULEURS_RESERVATION[0]!);
  const [prixNuit, setPrixNuit] = useState("250");
  const [duree, setDuree] = useState("4");
  const [plateforme, setPlateforme] = useState("Canal Direct");
  const [services, setServices] = useState(["Service 1", "Service 2", "Upsell 1", "Upsell 2"]);

  const couleurChoisie = couleur;

  const occupantsOptions = useMemo(() => OCCUPANTS_MO1.map((o) => o.nom), []);

  const plateformeDe = (s: string): PlateformeMo1 => {
    if (s === "Airbnb" || s === "Booking.com") return s;
    if (s === "Canal Direct") return "Direct";
    return "Autre";
  };

  const creer = () => {
    if (!type) {
      toastErreur("Choisissez un type de réservation.");
      return;
    }
    if (!logement || !occupant || !checkIn || !checkOut) {
      toastErreur("Renseignez le logement, l'occupant et les dates.");
      return;
    }
    if (checkOut <= checkIn) {
      toastErreur("Le check-out doit être après le check-in.");
      return;
    }
    const nuits = Number(duree) || 1;
    const prix = Number(prixNuit) || 0;
    const id = idNouveau("r");
    const initiales = occupant
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
    ajouterReservation({
      dossier: {
        id,
        bienId: logement,
        occupant,
        initiales: initiales || "??",
        email: `${occupant.toLowerCase().replace(/\s+/g, ".")}@email.fr`,
        telephone: "+33 6 00 00 00 00",
        arrivee: checkIn,
        depart: checkOut,
        heureArrivee: heureIn,
        heureDepart: heureOut,
        plateforme: plateformeDe(plateforme),
        voyageurs: adultes + enfants,
        adultes,
        enfants,
        montant: prix * nuits,
        paye: 0,
        statut: "Confirmé",
        couleur: couleur.hex,
      },
      calendrier: {
        id: `cal-${id}`,
        bienId: logement,
        voyageur: occupant,
        arrivee: checkIn,
        depart: checkOut,
      },
    });
    ajouterNotif({
      titre: "Réservation créée",
      detail: `${occupant} · ${checkIn} → ${checkOut}`,
      href: "/reservations",
    });
    toastOk("Réservation créée.");
    void navigate({ to: "/reservations", search: { vue: "liste" } });
  };

  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-ink-muted">
        <Link
          to="/reservations"
          className="inline-flex min-h-11 items-center hover:text-ink-body md:min-h-0"
        >
          Réservations
        </Link>
        <ChevronRight className="size-3" />
        <span>Créer une réservation</span>
      </div>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/reservations"
            className="flex size-11 shrink-0 items-center justify-center rounded-card border border-line text-ink-body md:size-8"
            aria-label="Retour"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-lg font-medium text-ink">Réservations</h1>
            <p className="text-xs text-ink-muted">Créer une nouvelle réservation</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/reservations"
            search={{ vue: "liste" }}
            className="inline-flex h-11 items-center rounded-card border border-line px-4 text-xs font-medium text-ink-body md:h-[34px]"
          >
            Gérer toutes les réservations
          </Link>
          <button
            type="button"
            onClick={creer}
            className="inline-flex h-11 items-center gap-1 rounded-card bg-ink px-3 text-xs font-medium text-white md:h-8"
          >
            <Check className="size-3" />
            Créer une réservation
          </button>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-[900px] space-y-4 pb-16">
        <div className="flex gap-3 rounded-card border border-chip-info bg-chip-info p-4">
          <Info className="mt-0.5 size-4 shrink-0 text-chip-info-fg" />
          <p className="text-xs leading-5 text-chip-info-fg">
            Le prix indiqué est le prix proposé dans l'annonce (payé annuel est le prix proposé via
            le manuel de taxe, pour chacune, avec les charges en bas d'écran pour tous les
            locataires). La plupart si le montant de la caution il l'ont les prix. En la case
            totale, payé pour savoir si le voyageur a déjà payé en ligne et si qui sont les taxes
            qu'on ajouter.
          </p>
        </div>

        <section className="rounded-card border border-line bg-white p-5">
          <h2 className="text-sm font-medium text-ink">Type de réservation</h2>
          <label className="mt-4 block text-xs text-ink-subtle">Type*</label>
          <div className="relative mt-1">
            <button
              type="button"
              onClick={() => setTypeOuvert((v) => !v)}
              className={cn(champ, "flex items-center justify-between text-left")}
            >
              <span className={type ? "text-ink" : "text-ink-muted"}>
                {type || "Sélectionner le type"}
              </span>
              <ChevronDown className="size-3.5 text-ink-muted" />
            </button>
            {typeOuvert && (
              <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-card border border-line bg-white py-1 shadow-md">
                {TYPES_RESERVATION.map((g) => (
                  <div key={g.groupe}>
                    <p className="px-3 py-1.5 text-[11px] text-ink-muted">{g.groupe}</p>
                    {g.options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setType(opt);
                          setTypeOuvert(false);
                        }}
                        className="flex w-full px-4 py-2 text-left text-sm text-ink hover:bg-surface"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          {type && (
            <p className="mt-3 flex items-center gap-2 text-xs text-ink-body">
              <span className="size-3 rounded-full bg-ink" />
              {type}
            </p>
          )}
        </section>

        {type && (
          <>
            <section className="rounded-card border border-line bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-ink">Création d'une réservation</h2>
          <Link
            to="/occupants"
            className="inline-flex h-8 items-center gap-1 rounded-card border border-line px-3 text-xs font-medium text-ink-body"
          >
            <User className="size-3" />
            Créer un occupant
          </Link>
              </div>
              <label className="mt-4 block text-xs text-ink-subtle">Logement*</label>
              <select
                value={logement}
                onChange={(e) => setLogement(e.target.value)}
                className={cn(champ, "mt-1")}
              >
                <option value="">Sélectionner le logement</option>
                {session.biens.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nom}
                  </option>
                ))}
              </select>
              <label className="mt-4 block text-xs text-ink-subtle">Occupant principal</label>
              <div className="mt-1 grid gap-2 sm:grid-cols-2">
                <select
                  value={occupant}
                  onChange={(e) => setOccupant(e.target.value)}
                  className={champ}
                >
                  <option value="">Sélectionner le nom de l’occupant 1</option>
                  {occupantsOptions.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <select
                  value={occupant2}
                  onChange={(e) => setOccupant2(e.target.value)}
                  className={champ}
                >
                  <option value="">Sélectionner le nom de l’occupant 2</option>
                  {occupantsOptions.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Compteur label="Nombre d'adultes" valeur={adultes} onChange={setAdultes} min={1} />
                <Compteur label="Nombre d'enfants" valeur={enfants} onChange={setEnfants} />
                <Compteur label="Nombre d'animaux" valeur={animaux} onChange={setAnimaux} />
              </div>
            </section>

            <section className="rounded-card border border-line bg-white p-5">
              <h2 className="text-sm font-medium text-ink">Dates</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <ChampDate label="Check-In*" value={checkIn} onChange={setCheckIn} type="date" />
                <ChampDate label="Check-Out*" value={checkOut} onChange={setCheckOut} type="date" />
                <ChampDate label="Heure Check-In" value={heureIn} onChange={setHeureIn} type="time" />
                <ChampDate
                  label="Heure Check-Out"
                  value={heureOut}
                  onChange={setHeureOut}
                  type="time"
                />
              </div>
            </section>

            <section className="rounded-card border border-line bg-white p-5">
              <h2 className="text-sm font-medium text-ink">Couleur</h2>
              <p className="mt-2 text-xs text-ink-muted">
                Choisissez une couleur pour distinguer cette réservation dans les vues calendrier.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {COULEURS_RESERVATION.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCouleur(c)}
                    className="relative size-8 rounded-full"
                    style={{ backgroundColor: c.hex }}
                    aria-label={c.label}
                  >
                    {couleurChoisie.id === c.id && (
                      <>
                        <span className="absolute -inset-1 rounded-full border-2 border-chip-info-fg" />
                        <Check className="absolute inset-0 m-auto size-3.5 text-white" />
                      </>
                    )}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-ink-muted">
                Couleur sélectionnée —{" "}
                <span className="text-ink-body">{couleurChoisie.label}</span>
                {" · Cette couleur apparaîtra dans les vues calendrier."}
              </p>
            </section>

            <section className="rounded-card border border-line bg-white p-5">
              <h2 className="text-sm font-medium text-ink">Tarification</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block text-xs text-ink-subtle">
                  Prix / nuit
                  <span className="relative mt-1 block">
                    <input
                      value={prixNuit}
                      onChange={(e) => setPrixNuit(e.target.value)}
                      inputMode="decimal"
                      className={champ}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted">
                      €
                    </span>
                  </span>
                </label>
                <label className="block text-xs text-ink-subtle">
                  Durée
                  <span className="relative mt-1 block">
                    <input
                      value={duree}
                      onChange={(e) => setDuree(e.target.value)}
                      inputMode="numeric"
                      className={champ}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted">
                      nuits
                    </span>
                  </span>
                </label>
              </div>
              <label className="mt-3 block text-xs text-ink-subtle">
                Plateforme
                <select
                  value={plateforme}
                  onChange={(e) => setPlateforme(e.target.value)}
                  className={cn(champ, "mt-1")}
                >
                  <option>Canal Direct</option>
                  <option>Airbnb</option>
                  <option>Booking.com</option>
                  <option>Autre</option>
                </select>
              </label>
              <p className="mt-3 text-xs text-ink-subtle">Services inclus</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {services.map((s) => (
                  <span
                    key={s}
                    className="inline-flex h-6 items-center gap-1 rounded border border-line px-2 text-xs text-ink-body"
                  >
                    {s}
                    <button
                      type="button"
                      aria-label={`Retirer ${s}`}
                      onClick={() => setServices((liste) => liste.filter((x) => x !== s))}
                    >
                      <X className="size-2.5" />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setServices((liste) => [...liste, `Service ${liste.length + 1}`])
                  }
                  className="inline-flex h-[30px] items-center gap-1 rounded border border-line px-3 text-xs font-medium text-ink-body"
                >
                  <Plus className="size-2.5" />
                  Créer un service
                </button>
              </div>
            </section>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={creer}
                className="inline-flex h-11 items-center gap-2 rounded-card bg-ink px-8 text-sm font-medium text-white"
              >
                <Check className="size-3.5" />
                Créer une réservation
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Compteur({
  label,
  valeur,
  onChange,
  min = 0,
}: {
  label: string;
  valeur: number;
  onChange: (n: number) => void;
  min?: number;
}) {
  return (
    <div>
      <p className="text-xs text-ink-subtle">{label}</p>
      <div className="mt-2 flex items-center gap-1">
        <button
          type="button"
          className="flex size-7 items-center justify-center rounded border border-line text-ink-body"
          onClick={() => onChange(Math.max(min, valeur - 1))}
        >
          <Minus className="size-2.5" />
        </button>
        <span className="w-7 text-center text-sm text-ink">{valeur}</span>
        <button
          type="button"
          className="flex size-7 items-center justify-center rounded border border-line text-ink-body"
          onClick={() => onChange(valeur + 1)}
        >
          <Plus className="size-2.5" />
        </button>
      </div>
    </div>
  );
}

function ChampDate({
  label,
  value,
  onChange,
  type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: "date" | "time";
}) {
  return (
    <label className="block text-xs text-ink-subtle">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(champ, "mt-1")}
      />
    </label>
  );
}
