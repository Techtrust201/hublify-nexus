import { useDroit } from "@/auth/auth-context";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  Minus,
  Plus,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  AIDE_TYPES_RESERVATION,
  COULEURS_RESERVATION,
  TYPES_RESERVATION,
  ajouterJours,
  formatMontant,
  isoJour,
  messageChevauchement,
  nuitsEntre,
  trouverChevauchement,
  type PlateformeMo1,
  type TypeReservationMo1,
} from "@/data/reservations-mo1";
import {
  ajouterNotif,
  ajouterReservation,
  idNouveau,
  modifierReservation,
  upsertOccupant,
  useSession,
} from "@/data/session";
import { toastErreur, toastOk } from "@/lib/feedback";
import { cn } from "@/lib/utils";
import { netPercu } from "@/data/v1-metier";

const champ =
  "h-11 w-full rounded-[8px] border border-line bg-white px-3 text-base text-ink outline-none placeholder:text-ink-muted md:h-[34px] md:text-sm";

export function FormulaireReservation({
  reservationId,
  bienId,
  arrivee,
}: {
  reservationId?: string;
  bienId?: string;
  arrivee?: string;
}) {
  const navigate = useNavigate();
  const session = useSession();
  const peutParametrer = useDroit("mod-biens");
  const edition = Boolean(reservationId);
  const prefillId = useRef<string | null>(null);
  const heuresInit = useRef(false);
  const [typeOuvert, setTypeOuvert] = useState(false);
  const [type, setType] = useState<TypeReservationMo1 | "">("");
  const [logement, setLogement] = useState(bienId ?? "");
  const [occupant, setOccupant] = useState("");
  const [occupant2, setOccupant2] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adultes, setAdultes] = useState(2);
  const [enfants, setEnfants] = useState(0);
  const [animaux, setAnimaux] = useState(0);
  const [checkIn, setCheckIn] = useState(arrivee ?? "");
  const [checkOut, setCheckOut] = useState(
    arrivee ? isoJour(ajouterJours(new Date(`${arrivee}T12:00:00`), 1)) : "",
  );
  const [heureIn, setHeureIn] = useState("16:00");
  const [heureOut, setHeureOut] = useState("10:00");
  const [couleur, setCouleur] = useState(COULEURS_RESERVATION[0]!);
  const [prixNuit, setPrixNuit] = useState("250");
  const [duree, setDuree] = useState("4");
  const [dejaEncaisse, setDejaEncaisse] = useState("0");
  const [taxeSejour, setTaxeSejour] = useState("0");
  const [commissionPct, setCommissionPct] = useState("0");
  const [commissionMontant, setCommissionMontant] = useState("0");
  const [caution, setCaution] = useState("0");
  const [fraisMenage, setFraisMenage] = useState("0");
  const [reductionPct, setReductionPct] = useState("0");
  const [fraisPlateforme, setFraisPlateforme] = useState("0");
  const [montantVoyageur, setMontantVoyageur] = useState("0");
  const [attribution, setAttribution] = useState("");
  const [rembourse, setRembourse] = useState(false);
  const [rembMotif, setRembMotif] = useState("");
  const [rembMontant, setRembMontant] = useState("");
  const [rembNote, setRembNote] = useState("");
  const [plateforme, setPlateforme] = useState("Canal Direct");
  const [services, setServices] = useState<string[]>([]);
  const [creerOccupant, setCreerOccupant] = useState(false);
  const [nouveauOccupant, setNouveauOccupant] = useState({ nom: "", email: "", telephone: "" });
  const [occupantsAjoutes, setOccupantsAjoutes] = useState<string[]>([]);

  const couleurChoisie = couleur;
  const occupantsOptions = useMemo(() => {
    const noms = new Set(session.occupants.map((o) => o.nom));
    for (const n of occupantsAjoutes) noms.add(n);
    for (const r of session.reservationsDossier) {
      if (r.occupant) noms.add(r.occupant);
    }
    return [...noms];
  }, [session.reservationsDossier, session.occupants, occupantsAjoutes]);

  useEffect(() => {
    if (bienId && !logement) setLogement(bienId);
    if (arrivee && !checkIn) {
      setCheckIn(arrivee);
      setCheckOut(isoJour(ajouterJours(new Date(`${arrivee}T12:00:00`), 1)));
    }
    if ((bienId || arrivee) && !type) setType("Location saisonnière");
  }, [bienId, arrivee, logement, checkIn, type]);

  useEffect(() => {
    if (edition || heuresInit.current) return;
    if (session.parametrage.heureCheckIn) {
      setHeureIn(session.parametrage.heureCheckIn);
      setHeureOut(session.parametrage.heureCheckOut);
      heuresInit.current = true;
    }
  }, [edition, session.parametrage.heureCheckIn, session.parametrage.heureCheckOut]);

  useEffect(() => {
    if (edition || !occupant) return;
    const connu = session.occupants.find(
      (o) => o.nom.toLowerCase() === occupant.trim().toLowerCase(),
    );
    if (connu) {
      if (connu.email && connu.email !== "—") setEmail(connu.email);
      if (connu.telephone && connu.telephone !== "—") setTelephone(connu.telephone);
    }
  }, [occupant, edition, session.occupants]);

  useEffect(() => {
    if (edition || !logement) return;
    const b = session.biens.find((x) => x.id === logement);
    if (b?.baseNuit) setPrixNuit(String(b.baseNuit));
  }, [edition, logement, session.biens]);

  useEffect(() => {
    if (!reservationId || prefillId.current === reservationId) return;
    const r = session.reservationsDossier.find((x) => x.id === reservationId);
    if (!r) return;
    prefillId.current = reservationId;
    setType(r.type ?? "Location saisonnière");
    setLogement(r.bienId);
    setOccupant(r.occupant);
    setEmail(r.email);
    setTelephone(r.telephone);
    setAdultes(r.adultes);
    setEnfants(r.enfants);
    setCheckIn(r.arrivee);
    setCheckOut(r.depart);
    setHeureIn(r.heureArrivee);
    setHeureOut(r.heureDepart);
    const nuits = Math.max(1, nuitsEntre(r.arrivee, r.depart));
    setDuree(String(nuits));
    setPrixNuit(String(Math.round(r.montant / nuits) || r.montant));
    setDejaEncaisse(String(r.paye));
    setTaxeSejour(String(r.taxeSejour ?? 0));
    setCommissionPct(String(r.commissionPourcent ?? 0));
    setCommissionMontant(String(r.commissionMontant ?? 0));
    setCaution(String(r.caution ?? 0));
    setFraisMenage(String(r.fraisMenage ?? 0));
    setReductionPct(String(r.reductionPourcent ?? 0));
    setFraisPlateforme(String(r.fraisPlateforme ?? 0));
    setMontantVoyageur(String(r.montantVoyageur ?? r.montant));
    setAttribution(r.attributionCommission ?? "");
    setPlateforme(
      r.plateforme === "Direct"
        ? "Canal Direct"
        : r.plateforme === "Autre"
          ? "Autre"
          : r.plateforme,
    );
    const couleurMatch = COULEURS_RESERVATION.find((c) => c.hex === r.couleur);
    if (couleurMatch) setCouleur(couleurMatch);
    const nomsUpsells = session.parametrage.upsells
      .filter((u) => r.upsellIds?.includes(u.id))
      .map((u) => u.nom);
    const bruts = r.services?.length ? r.services : nomsUpsells;
    const occ2 = bruts.find((s) => s.startsWith("Occupant 2 :"));
    const anim = bruts.find((s) => / animaux?$/.test(s));
    if (occ2) setOccupant2(occ2.replace(/^Occupant 2 :\s*/, ""));
    if (anim) setAnimaux(parseInt(anim, 10) || 0);
    setServices(bruts.filter((s) => !s.startsWith("Occupant 2 :") && !/ animaux?$/.test(s)));
  }, [reservationId, session.reservationsDossier, session.parametrage.upsells]);

  useEffect(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) return;
    setDuree(String(Math.max(1, nuitsEntre(checkIn, checkOut))));
  }, [checkIn, checkOut]);

  useEffect(() => {
    if (type === "Bail mobilité") setCaution("0");
  }, [type]);

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
    if (!email.trim() || !telephone.trim()) {
      toastErreur("Renseignez l'e-mail et le téléphone de l'occupant.");
      return;
    }
    if (checkOut <= checkIn) {
      toastErreur("Le check-out doit être après le check-in.");
      return;
    }
    const collision = trouverChevauchement(session.reservationsDossier, {
      bienId: logement,
      arrivee: checkIn,
      depart: checkOut,
      ...(edition && reservationId ? { horsId: reservationId } : {}),
    });
    if (collision) {
      toastErreur(messageChevauchement(collision));
      return;
    }
    const nuits = Math.max(1, Number(duree) || nuitsEntre(checkIn, checkOut));
    const prix = Number(prixNuit) || 0;
    const total = prix * nuits;
    const taxe = Math.max(0, Number(taxeSejour.replace(",", ".")) || 0);
    const commPct = Math.max(0, Number(commissionPct.replace(",", ".")) || 0);
    const commSaisie = Number(commissionMontant.replace(",", ".")) || 0;
    const cautionN = Math.max(0, Number(caution.replace(",", ".")) || 0);
    const menageN = Math.max(0, Number(fraisMenage.replace(",", ".")) || 0);
    const reducPct = Math.max(0, Number(reductionPct.replace(",", ".")) || 0);
    const fraisPlat = Math.max(0, Number(fraisPlateforme.replace(",", ".")) || 0);
    const voyageurN = Math.max(0, Number(montantVoyageur.replace(",", ".")) || 0);
    const commMontant = commSaisie > 0 ? commSaisie : Math.round((total * commPct) / 100);
    const paye = Math.max(0, Math.min(total, Number(dejaEncaisse.replace(",", ".")) || 0));
    const servicesFinaux = [...services];
    if (occupant2.trim()) servicesFinaux.push(`Occupant 2 : ${occupant2.trim()}`);
    if (animaux > 0) {
      servicesFinaux.push(animaux === 1 ? "1 animal" : `${animaux} animaux`);
    }
    const upsellIds = session.parametrage.upsells
      .filter((u) => u.actif && servicesFinaux.includes(u.nom))
      .map((u) => u.id);
    const initiales = occupant
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
    if (edition && reservationId) {
      const actuel = session.reservationsDossier.find((r) => r.id === reservationId);
      modifierReservation(reservationId, {
        bienId: logement,
        occupant,
        initiales: initiales || actuel?.initiales || "??",
        email: email.trim(),
        telephone: telephone.trim(),
        arrivee: checkIn,
        depart: checkOut,
        heureArrivee: heureIn,
        heureDepart: heureOut,
        plateforme: plateformeDe(plateforme),
        voyageurs: adultes + enfants,
        adultes,
        enfants,
        montant: total,
        paye,
        couleur: couleur.hex,
        type,
        services: servicesFinaux,
        upsellIds,
        taxeSejour: taxe,
        commissionPourcent: commPct,
        commissionMontant: commMontant,
        caution: cautionN,
        fraisMenage: menageN,
        reductionPourcent: reducPct,
        reductionMontant: Math.round((total * reducPct) / 100),
        fraisPlateforme: fraisPlat,
        montantVoyageur: voyageurN || total + taxe + menageN + fraisPlat,
        attributionCommission: attribution.trim(),
      });
      ajouterNotif({
        titre: "Réservation mise à jour",
        detail: `${occupant} · ${checkIn} → ${checkOut}`,
        href: `/reservations?vue=liste&resa=${encodeURIComponent(reservationId)}`,
      });
      toastOk("Réservation mise à jour.");
      void navigate({ to: "/reservations", search: { vue: "liste", resa: reservationId } });
      return;
    }
    const id = idNouveau("r");
    ajouterReservation({
      dossier: {
        id,
        bienId: logement,
        occupant,
        initiales: initiales || "??",
        email: email.trim(),
        telephone: telephone.trim(),
        arrivee: checkIn,
        depart: checkOut,
        heureArrivee: heureIn,
        heureDepart: heureOut,
        plateforme: plateformeDe(plateforme),
        voyageurs: adultes + enfants,
        adultes,
        enfants,
        montant: total,
        paye,
        statut: "Confirmé",
        couleur: couleur.hex,
        type,
        services: servicesFinaux,
        upsellIds,
        taxeSejour: taxe,
        commissionPourcent: commPct,
        commissionMontant: commMontant,
        caution: cautionN,
        fraisMenage: menageN,
        reductionPourcent: reducPct,
        reductionMontant: Math.round((total * reducPct) / 100),
        fraisPlateforme: fraisPlat,
        montantVoyageur: voyageurN || total + taxe + menageN + fraisPlat,
        attributionCommission: attribution.trim(),
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
      href: `/reservations?vue=liste&resa=${encodeURIComponent(id)}`,
    });
    toastOk("Réservation créée.");
    void navigate({ to: "/reservations", search: { vue: "liste", resa: id } });
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <Link
          to="/reservations"
          className="flex size-11 shrink-0 items-center justify-center rounded-card border border-line text-ink-body md:size-8"
          aria-label="Retour aux réservations"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <Link
          to="/reservations"
          className="inline-flex min-h-11 items-center text-xs text-ink-muted hover:text-ink-body md:min-h-0"
        >
          Réservations
        </Link>
      </div>

      <div className="mx-auto mt-6 max-w-[900px] space-y-4 pb-16">
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
          <AideTypesReservation />
        </section>

        {type && (
          <>
            <section className="rounded-card border border-line bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-ink">
                  {edition ? "Modification de la réservation" : "Création d'une réservation"}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setNouveauOccupant({ nom: "", email: "", telephone: "" });
                    setCreerOccupant(true);
                  }}
                  className="inline-flex h-11 items-center gap-1 rounded-card border border-line px-3 text-xs font-medium text-ink-body md:h-8"
                >
                  <User className="size-3" />
                  Créer un occupant
                </button>
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
                <input
                  list="occupants-connus"
                  value={occupant}
                  onChange={(e) => setOccupant(e.target.value)}
                  placeholder="Nom de l'occupant 1"
                  className={champ}
                />
                <input
                  list="occupants-connus"
                  value={occupant2}
                  onChange={(e) => setOccupant2(e.target.value)}
                  placeholder="Occupant 2 (optionnel)"
                  className={champ}
                />
                <datalist id="occupants-connus">
                  {occupantsOptions.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block text-xs text-ink-subtle">
                  E-mail *
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="prenom.nom@email.fr"
                    className={cn(champ, "mt-1")}
                    autoComplete="email"
                  />
                </label>
                <label className="block text-xs text-ink-subtle">
                  Téléphone *
                  <input
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                    className={cn(champ, "mt-1")}
                    autoComplete="tel"
                  />
                </label>
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
                <ChampDate
                  label="Heure Check-In"
                  value={heureIn}
                  onChange={setHeureIn}
                  type="time"
                />
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
                Couleur sélectionnée — <span className="text-ink-body">{couleurChoisie.label}</span>
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
                <label className="block text-xs text-ink-subtle">
                  Réduction (%)
                  <input
                    value={reductionPct}
                    onChange={(e) => setReductionPct(e.target.value)}
                    inputMode="decimal"
                    className={cn(champ, "mt-1")}
                  />
                </label>
                <label className="block text-xs text-ink-subtle">
                  Frais de ménage
                  <span className="relative mt-1 block">
                    <input
                      value={fraisMenage}
                      onChange={(e) => setFraisMenage(e.target.value)}
                      inputMode="decimal"
                      className={champ}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted">
                      €
                    </span>
                  </span>
                </label>
                <label className="block text-xs text-ink-subtle">
                  Frais et commissions plateforme
                  <span className="relative mt-1 block">
                    <input
                      value={fraisPlateforme}
                      onChange={(e) => setFraisPlateforme(e.target.value)}
                      inputMode="decimal"
                      className={champ}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted">
                      €
                    </span>
                  </span>
                </label>
                <label className="block text-xs text-ink-subtle">
                  Taxe de séjour
                  <span className="relative mt-1 block">
                    <input
                      value={taxeSejour}
                      onChange={(e) => setTaxeSejour(e.target.value)}
                      inputMode="decimal"
                      className={champ}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted">
                      €
                    </span>
                  </span>
                </label>
                <label className="block text-xs text-ink-subtle">
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
                <label className="block text-xs text-ink-subtle">
                  Montant payé par le voyageur
                  <span className="relative mt-1 block">
                    <input
                      value={montantVoyageur}
                      onChange={(e) => setMontantVoyageur(e.target.value)}
                      inputMode="decimal"
                      className={champ}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted">
                      €
                    </span>
                  </span>
                </label>
                <label className="block text-xs text-ink-subtle">
                  Commission gestionnaire / conciergerie
                  <span className="relative mt-1 block">
                    <input
                      value={commissionMontant}
                      onChange={(e) => setCommissionMontant(e.target.value)}
                      inputMode="decimal"
                      className={champ}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted">
                      €
                    </span>
                  </span>
                </label>
                <p className="flex items-end text-sm text-ink">
                  Montant net perçu :{" "}
                  {formatMontant(
                    netPercu({
                      montant: (Number(prixNuit) || 0) * (Math.max(1, Number(duree) || 1)),
                      taxeSejour: Number(taxeSejour.replace(",", ".")) || 0,
                      commissionMontant: Number(commissionMontant.replace(",", ".")) || 0,
                    }),
                  )}
                </p>
                <label className="block text-xs text-ink-subtle">
                  Commission plateforme (%)
                  <input
                    value={commissionPct}
                    onChange={(e) => {
                      setCommissionPct(e.target.value);
                      const pct = Number(e.target.value.replace(",", ".")) || 0;
                      const nuits = Math.max(1, Number(duree) || 1);
                      const total = (Number(prixNuit) || 0) * nuits;
                      setCommissionMontant(String(Math.round((total * pct) / 100)));
                    }}
                    inputMode="decimal"
                    className={cn(champ, "mt-1")}
                  />
                </label>
                <label className="block text-xs text-ink-subtle">
                  Caution
                  {type === "Bail mobilité" ? (
                    <span className="ml-1 text-[10px] text-ink-muted">
                      — aucun dépôt autorisé
                    </span>
                  ) : null}
                  <span className="relative mt-1 block">
                    <input
                      value={caution}
                      onChange={(e) => setCaution(e.target.value)}
                      inputMode="decimal"
                      disabled={type === "Bail mobilité"}
                      className={cn(champ, type === "Bail mobilité" && "bg-surface text-ink-muted")}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted">
                      €
                    </span>
                  </span>
                </label>
                <label className="block text-xs text-ink-subtle">
                  Déjà encaissé
                  <span className="relative mt-1 block">
                    <input
                      value={dejaEncaisse}
                      onChange={(e) => setDejaEncaisse(e.target.value)}
                      inputMode="decimal"
                      className={champ}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted">
                      €
                    </span>
                  </span>
                </label>
                <label className="block text-xs text-ink-subtle sm:col-span-2">
                  Attribution commission
                  <input
                    value={attribution}
                    onChange={(e) => setAttribution(e.target.value)}
                    placeholder="Vérifier attribution"
                    className={cn(champ, "mt-1")}
                  />
                </label>
              </div>
              <p className="mt-3 text-xs text-ink-subtle">Services inclus</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {services.map((s) => (
                  <span
                    key={s}
                    className="inline-flex h-11 items-center gap-1 rounded border border-line px-2 text-xs text-ink-body md:h-6"
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
                <select
                  aria-label="Ajouter un service"
                  defaultValue=""
                  onChange={(e) => {
                    const nom = e.target.value;
                    if (!nom) return;
                    setServices((liste) => (liste.includes(nom) ? liste : [...liste, nom]));
                    e.target.value = "";
                  }}
                  className="h-11 rounded border border-line bg-white px-2 text-xs text-ink-body outline-none md:h-[30px]"
                >
                  <option value="">Ajouter un service…</option>
                  {session.parametrage.upsells
                    .filter((u) => u.actif && !services.includes(u.nom))
                    .map((u) => (
                      <option key={u.id} value={u.nom}>
                        {u.nom}
                      </option>
                    ))}
                </select>
              </div>
              {session.parametrage.upsells.filter((u) => u.actif && !services.includes(u.nom))
                .length === 0 && (
                <p className="mt-2 text-[11px] text-ink-muted">
                  Tous les services actifs sont déjà ajoutés.{" "}
                  {peutParametrer ? (
                    <Link to="/parametrage" className="font-medium text-accent-teal">
                      Gérer le catalogue
                    </Link>
                  ) : (
                    "Ajoutez un service depuis le détail de la réservation."
                  )}
                </p>
              )}
              {edition && reservationId && (
                <button
                  type="button"
                  onClick={() => setRembourse(true)}
                  className="mt-4 inline-flex h-11 items-center rounded-card border border-line px-3 text-xs font-medium text-ink-body md:h-9"
                >
                  Remboursement
                </button>
              )}
            </section>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={creer}
                className="inline-flex h-11 items-center gap-2 rounded-card bg-ink px-8 text-sm font-medium text-white"
              >
                <Check className="size-3.5" />
                {edition ? "Enregistrer les modifications" : "Créer une réservation"}
              </button>
            </div>
          </>
        )}
      </div>

      <Dialog open={creerOccupant} onOpenChange={setCreerOccupant}>
        <DialogContent className="max-w-[420px] rounded-card border border-line bg-white p-0">
          <div className="border-b border-surface-soft px-5 py-4">
            <DialogTitle className="text-sm font-medium text-ink">Nouvel occupant</DialogTitle>
            <DialogDescription className="mt-1 text-xs text-ink-muted">
              Il est ajouté à la liste des occupants et proposé dans ce formulaire.
            </DialogDescription>
          </div>
          <div className="space-y-3 px-5 py-4">
            <label className="block text-xs text-ink-subtle">
              Nom *
              <input
                value={nouveauOccupant.nom}
                onChange={(e) => setNouveauOccupant((o) => ({ ...o, nom: e.target.value }))}
                className={cn(champ, "mt-1")}
                autoComplete="name"
              />
            </label>
            <label className="block text-xs text-ink-subtle">
              E-mail
              <input
                type="email"
                value={nouveauOccupant.email}
                onChange={(e) => setNouveauOccupant((o) => ({ ...o, email: e.target.value }))}
                className={cn(champ, "mt-1")}
              />
            </label>
            <label className="block text-xs text-ink-subtle">
              Téléphone
              <input
                value={nouveauOccupant.telephone}
                onChange={(e) => setNouveauOccupant((o) => ({ ...o, telephone: e.target.value }))}
                className={cn(champ, "mt-1")}
              />
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-surface-soft px-5 py-3">
            <button
              type="button"
              onClick={() => setCreerOccupant(false)}
              className="inline-flex h-11 items-center rounded-card border border-line px-3 text-xs font-medium text-ink-body md:h-[30px]"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => {
                const nom = nouveauOccupant.nom.trim();
                if (!nom) {
                  toastErreur("Indiquez le nom de l'occupant.");
                  return;
                }
                const initiales = nom
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase() ?? "")
                  .join("");
                const bienNom = session.biens.find((b) => b.id === logement)?.nom ?? "—";
                upsertOccupant({
                  id: idNouveau("occ"),
                  nom,
                  initiales: initiales || "??",
                  type: "Voyageur",
                  logement: bienNom,
                  telephone: nouveauOccupant.telephone.trim() || "—",
                  email:
                    nouveauOccupant.email.trim() ||
                    `${nom.toLowerCase().replace(/\s+/g, ".")}@email.fr`,
                  arrivee: checkIn || new Date().toLocaleDateString("fr-FR"),
                  statut: "Actif",
                });
                setOccupantsAjoutes((liste) => (liste.includes(nom) ? liste : [...liste, nom]));
                if (!occupant) setOccupant(nom);
                else if (!occupant2) setOccupant2(nom);
                if (nouveauOccupant.email.trim()) setEmail(nouveauOccupant.email.trim());
                if (nouveauOccupant.telephone.trim())
                  setTelephone(nouveauOccupant.telephone.trim());
                setCreerOccupant(false);
                toastOk("Occupant ajouté.");
              }}
              className="inline-flex h-11 items-center rounded-card bg-ink px-3 text-xs font-medium text-white md:h-[30px]"
            >
              Ajouter
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rembourse} onOpenChange={(o) => !o && setRembourse(false)}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Remboursement</DialogTitle>
          <DialogDescription>
            Le montant est déduit de l'encaissé. Un motif est obligatoire.
          </DialogDescription>
          <div className="mt-3 space-y-2">
            <label className="block text-xs text-ink-muted">
              Motif *
              <input
                value={rembMotif}
                onChange={(e) => setRembMotif(e.target.value)}
                className={cn(champ, "mt-1")}
              />
            </label>
            <label className="block text-xs text-ink-muted">
              Montant *
              <input
                value={rembMontant}
                onChange={(e) => setRembMontant(e.target.value)}
                inputMode="decimal"
                className={cn(champ, "mt-1")}
              />
            </label>
            <label className="block text-xs text-ink-muted">
              Note
              <textarea
                value={rembNote}
                onChange={(e) => setRembNote(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-card border border-line px-3 py-2 text-sm outline-none"
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRembourse(false)}
              className="h-9 rounded-card border border-line px-3 text-xs"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => {
                if (!reservationId) return;
                const actuel = session.reservationsDossier.find((r) => r.id === reservationId);
                if (!actuel) return;
                if (!rembMotif.trim()) {
                  toastErreur("Indiquez le motif du remboursement.");
                  return;
                }
                const montant = Number(rembMontant.replace(",", ".")) || 0;
                if (montant <= 0) {
                  toastErreur("Indiquez un montant positif.");
                  return;
                }
                const paye = Math.max(0, actuel.paye - Math.round(montant));
                modifierReservation(reservationId, {
                  paye,
                  remboursements: [
                    ...(actuel.remboursements ?? []),
                    {
                      id: idNouveau("rb"),
                      date: new Date().toISOString().slice(0, 10),
                      motif: rembMotif.trim(),
                      montant: Math.round(montant),
                      note: rembNote.trim(),
                    },
                  ],
                });
                setDejaEncaisse(String(paye));
                setRembourse(false);
                setRembMotif("");
                setRembMontant("");
                setRembNote("");
                toastOk(`Remboursement de ${formatMontant(Math.round(montant))} enregistré.`);
              }}
              className="h-9 rounded-card bg-ink px-3 text-xs font-medium text-white"
            >
              Confirmer
            </button>
          </div>
        </DialogContent>
      </Dialog>
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
          className="flex size-11 items-center justify-center rounded border border-line text-ink-body md:size-7"
          onClick={() => onChange(Math.max(min, valeur - 1))}
        >
          <Minus className="size-2.5" />
        </button>
        <span className="w-7 text-center text-sm text-ink">{valeur}</span>
        <button
          type="button"
          className="flex size-11 items-center justify-center rounded border border-line text-ink-body md:size-7"
          onClick={() => onChange(valeur + 1)}
        >
          <Plus className="size-2.5" />
        </button>
      </div>
    </div>
  );
}

function AideTypesReservation() {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className="mt-4 border-t border-surface-soft pt-3">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        className="inline-flex min-h-11 items-center gap-1 text-xs font-medium text-ink-body md:min-h-0"
      >
        Comment choisir ?
        <ChevronDown className={cn("size-3.5 transition", ouvert && "rotate-180")} />
      </button>
      {ouvert && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[11px]">
            <thead className="text-ink-muted">
              <tr>
                <th className="pb-2 pr-2 font-medium">Type</th>
                <th className="pb-2 pr-2 font-medium">Durée</th>
                <th className="pb-2 pr-2 font-medium">Dépôt</th>
                <th className="pb-2 pr-2 font-medium">Préavis</th>
                <th className="pb-2 font-medium">Pour qui</th>
              </tr>
            </thead>
            <tbody>
              {AIDE_TYPES_RESERVATION.map((l) => (
                <tr key={l.type} className="border-t border-surface-soft align-top">
                  <td className="py-2 pr-2 font-medium text-ink">{l.type}</td>
                  <td className="py-2 pr-2 text-ink-body">{l.duree}</td>
                  <td className="py-2 pr-2 text-ink-body">{l.depot}</td>
                  <td className="py-2 pr-2 text-ink-body">{l.preavis}</td>
                  <td className="py-2 text-ink-body">{l.pour}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
