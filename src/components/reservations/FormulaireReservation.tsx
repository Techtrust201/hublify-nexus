import { Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Info, Minus, Plus, User, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  BIENS_MO1,
  COULEURS_RESERVATION,
  OCCUPANTS_MO1,
  TYPES_RESERVATION,
  type TypeReservationMo1,
} from "@/data/reservations-mo1";
import { cn } from "@/lib/utils";

const champ =
  "h-[34px] w-full rounded-[8px] border border-[#e5e7eb] bg-white px-3 text-sm text-[#1e2939] outline-none placeholder:text-[#99a1af]";

export function FormulaireReservation() {
  const navigate = useNavigate();
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

  const saisonnier = type === "Location saisonnière";
  const couleurChoisie = couleur;

  const occupantsOptions = useMemo(() => OCCUPANTS_MO1.map((o) => o.nom), []);

  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-[#99a1af]">
        <Link to="/reservations" className="hover:text-[#4a5565]">
          Réservations
        </Link>
        <ChevronRight className="size-3" />
        <span>Créer une réservation</span>
      </div>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/reservations"
            className="flex size-8 items-center justify-center rounded-[10px] border border-[#e5e7eb] text-[#4a5565]"
            aria-label="Retour"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-lg font-medium text-[#1e2939]">Réservations</h1>
            <p className="text-xs text-[#99a1af]">Créer une nouvelle réservation</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/reservations"
            search={{ vue: "liste" }}
            className="inline-flex h-[34px] items-center rounded-[10px] border border-[#e5e7eb] px-4 text-xs font-medium text-[#4a5565]"
          >
            Gérer toutes les réservations
          </Link>
          <button
            type="button"
            onClick={() => navigate({ to: "/reservations" })}
            className="inline-flex h-8 items-center gap-1 rounded-[10px] bg-[#1e2939] px-3 text-xs font-medium text-white"
          >
            <Check className="size-3" />
            Créer une réservation
          </button>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-[900px] space-y-4 pb-16">
        <div className="flex gap-3 rounded-[10px] border border-[#bfdbfe] bg-[#eff6ff] p-4">
          <Info className="mt-0.5 size-4 shrink-0 text-[#1447e6]" />
          <p className="text-xs leading-5 text-[#1447e6]">
            Le prix indiqué est le prix proposé dans l'annonce (payé annuel est le prix proposé via
            le manuel de taxe, pour chacune, avec les charges en bas d'écran pour tous les
            locataires). La plupart si le montant de la caution il l'ont les prix. En la case
            totale, payé pour savoir si le voyageur a déjà payé en ligne et si qui sont les taxes
            qu'on ajouter.
          </p>
        </div>

        <section className="rounded-[10px] border border-[#e5e7eb] bg-white p-5">
          <h2 className="text-sm font-medium text-[#1e2939]">Type de réservation</h2>
          <label className="mt-4 block text-xs text-[#6a7282]">Type*</label>
          <div className="relative mt-1">
            <button
              type="button"
              onClick={() => setTypeOuvert((v) => !v)}
              className={cn(champ, "flex items-center justify-between text-left")}
            >
              <span className={type ? "text-[#1e2939]" : "text-[#99a1af]"}>
                {type || "Sélectionner le type"}
              </span>
              <ChevronDown className="size-3.5 text-[#99a1af]" />
            </button>
            {typeOuvert && (
              <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white py-1 shadow-md">
                {TYPES_RESERVATION.map((g) => (
                  <div key={g.groupe}>
                    <p className="px-3 py-1.5 text-[11px] text-[#99a1af]">{g.groupe}</p>
                    {g.options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setType(opt);
                          setTypeOuvert(false);
                        }}
                        className="flex w-full px-4 py-2 text-left text-sm text-[#1e2939] hover:bg-[#f9fafb]"
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
            <p className="mt-3 flex items-center gap-2 text-xs text-[#4a5565]">
              <span className="size-3 rounded-full bg-[#1e2939]" />
              {type}
            </p>
          )}
        </section>

        {saisonnier && (
          <>
            <section className="rounded-[10px] border border-[#e5e7eb] bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-[#1e2939]">Création d'une réservation</h2>
                <button
                  type="button"
                  className="inline-flex h-8 items-center gap-1 rounded-[10px] border border-[#e5e7eb] px-3 text-xs font-medium text-[#4a5565]"
                >
                  <User className="size-3" />
                  Créer un occupant
                </button>
              </div>
              <label className="mt-4 block text-xs text-[#6a7282]">Logement*</label>
              <select
                value={logement}
                onChange={(e) => setLogement(e.target.value)}
                className={cn(champ, "mt-1")}
              >
                <option value="">Sélectionner le logement</option>
                {BIENS_MO1.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nom}
                  </option>
                ))}
              </select>
              <label className="mt-4 block text-xs text-[#6a7282]">Occupant principal</label>
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

            <section className="rounded-[10px] border border-[#e5e7eb] bg-white p-5">
              <h2 className="text-sm font-medium text-[#1e2939]">Dates</h2>
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

            <section className="rounded-[10px] border border-[#e5e7eb] bg-white p-5">
              <h2 className="text-sm font-medium text-[#1e2939]">Couleur</h2>
              <p className="mt-2 text-xs text-[#99a1af]">
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
                        <span className="absolute -inset-1 rounded-full border-2 border-[#2563eb]" />
                        <Check className="absolute inset-0 m-auto size-3.5 text-white" />
                      </>
                    )}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-[#99a1af]">
                Couleur sélectionnée —{" "}
                <span className="text-[#4a5565]">{couleurChoisie.label}</span>
                {" · Cette couleur apparaîtra dans les vues calendrier."}
              </p>
            </section>

            <section className="rounded-[10px] border border-[#e5e7eb] bg-white p-5">
              <h2 className="text-sm font-medium text-[#1e2939]">Tarification</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block text-xs text-[#6a7282]">
                  Prix / nuit
                  <span className="relative mt-1 block">
                    <input
                      value={prixNuit}
                      onChange={(e) => setPrixNuit(e.target.value)}
                      className={champ}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#99a1af]">
                      €
                    </span>
                  </span>
                </label>
                <label className="block text-xs text-[#6a7282]">
                  Durée
                  <span className="relative mt-1 block">
                    <input
                      value={duree}
                      onChange={(e) => setDuree(e.target.value)}
                      className={champ}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#99a1af]">
                      nuits
                    </span>
                  </span>
                </label>
              </div>
              <label className="mt-3 block text-xs text-[#6a7282]">
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
              <p className="mt-3 text-xs text-[#6a7282]">Services inclus</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {services.map((s) => (
                  <span
                    key={s}
                    className="inline-flex h-6 items-center gap-1 rounded border border-[#e5e7eb] px-2 text-xs text-[#4a5565]"
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
                  className="inline-flex h-[30px] items-center gap-1 rounded border border-[#e5e7eb] px-3 text-xs font-medium text-[#4a5565]"
                >
                  <Plus className="size-2.5" />
                  Créer un service
                </button>
              </div>
            </section>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => navigate({ to: "/reservations" })}
                className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#1e2939] px-8 text-sm font-medium text-white"
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
      <p className="text-xs text-[#6a7282]">{label}</p>
      <div className="mt-2 flex items-center gap-1">
        <button
          type="button"
          className="flex size-7 items-center justify-center rounded border border-[#e5e7eb] text-[#4a5565]"
          onClick={() => onChange(Math.max(min, valeur - 1))}
        >
          <Minus className="size-2.5" />
        </button>
        <span className="w-7 text-center text-sm text-[#1e2939]">{valeur}</span>
        <button
          type="button"
          className="flex size-7 items-center justify-center rounded border border-[#e5e7eb] text-[#4a5565]"
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
    <label className="block text-xs text-[#6a7282]">
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
