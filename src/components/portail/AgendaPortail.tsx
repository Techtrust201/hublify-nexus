import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Clock, UserRound } from "lucide-react";
import {
  Bouton,
  Carte,
  Ecran,
  Entete,
  champClasse,
  usePortailUi,
} from "@/components/portail/chrome";
import { usePortailDonnees } from "@/components/portail/etat-portail";
import { useAncre } from "@/components/portail/use-ancre";
import { idNouveau, useSession } from "@/data/session";
import { libelleMois } from "@/lib/portail-mobile";
import { toastErreur, toastOk } from "@/lib/feedback";

export function CalendrierPortail() {
  const ui = usePortailUi();
  const session = useSession();
  const navigate = useNavigate();
  const ancre = useAncre();
  const { notes, ajouterNote, modifierNote, supprimerNote } = usePortailDonnees();
  const saisie = useRef<HTMLInputElement>(null);
  const [cursor, setCursor] = useState(() => new Date());
  const [jourChoisi, setJourChoisi] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [edition, setEdition] = useState<string | null>(null);

  useEffect(() => {
    if (ancre !== "note") return;
    saisie.current?.focus();
    saisie.current?.scrollIntoView({ block: "center" });
  }, [ancre]);
  const annee = cursor.getFullYear();
  const mois = cursor.getMonth();
  const premier = new Date(annee, mois, 1);
  const decalage = (premier.getDay() + 6) % 7;
  const nb = new Date(annee, mois + 1, 0).getDate();
  const cases = [
    ...Array.from({ length: decalage }, () => ""),
    ...Array.from({ length: nb }, (_, i) => String(i + 1)),
  ];

  const occupations = useMemo(() => {
    if (ui.mode === "prestataire") {
      const source = session.missions.length
        ? session.missions
        : [
            {
              id: "demo-m",
              date: "2026-11-13",
              titre: "Ménage — App. Colette — Cannes",
              heure: "10:00",
            },
          ];
      return source.map((m) => ({ id: m.id, date: m.date, label: `${m.heure} · ${m.titre}` }));
    }
    return session.reservationsDossier
      .filter((r) => r.statut !== "Annulé")
      .map((r) => ({
        id: r.id,
        date: r.arrivee,
        label: `${r.occupant} · ${r.arrivee} → ${r.depart}`,
      }));
  }, [session.missions, session.reservationsDossier, ui.mode]);

  const iso = (jour: string) =>
    `${annee}-${String(mois + 1).padStart(2, "0")}-${jour.padStart(2, "0")}`;

  const aujourdhui = new Date();
  const isoAujourdhui = `${aujourdhui.getFullYear()}-${String(aujourdhui.getMonth() + 1).padStart(2, "0")}-${String(aujourdhui.getDate()).padStart(2, "0")}`;
  const duJour = occupations.filter((o) => o.date === jourChoisi);
  const evenement = duJour[0] ?? occupations[0];

  return (
    <Ecran>
      <Entete titre="Calendrier" />
      <button
        type="button"
        className="mx-auto flex h-10 items-center rounded-full bg-white px-6 text-sm font-medium text-[var(--portail-encre)] shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
        onClick={() => {
          const maintenant = new Date();
          setCursor(maintenant);
          setJourChoisi(isoAujourdhui);
        }}
      >
        Aujourd&apos;hui
      </button>
      <div className="rounded-[16px] bg-white px-3 py-4 shadow-[var(--portail-ombre)]">
        <div className="mb-3 flex items-center justify-between px-1">
          <button
            type="button"
            aria-label="Mois précédent"
            className="grid size-9 place-items-center rounded-full bg-[#f4f4f5] text-[var(--portail-encre)] shadow-sm"
            onClick={() => setCursor(new Date(annee, mois - 1, 1))}
          >
            <ChevronLeft className="size-4" />
          </button>
          <p className="text-lg font-semibold capitalize text-[var(--portail-encre)]">
            {libelleMois(cursor)}
          </p>
          <button
            type="button"
            aria-label="Mois suivant"
            className="grid size-9 place-items-center rounded-full bg-[#f4f4f5] text-[var(--portail-encre)] shadow-sm"
            onClick={() => setCursor(new Date(annee, mois + 1, 1))}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 text-center text-[11px] text-[#98a2b3]">
          {["lu", "ma", "me", "je", "ve", "sa", "di"].map((j) => (
            <span key={j} className="py-1 capitalize">
              {j}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cases.map((jour, i) => {
            const date = jour ? iso(jour) : "";
            const marque =
              occupations.some((o) => o.date === date) || notes.some((n) => n.jour === date);
            const choisi = Boolean(date && date === jourChoisi);
            return (
              <button
                key={`${i}-${jour}`}
                type="button"
                disabled={!jour}
                onClick={() => jour && setJourChoisi(date)}
                className={`mx-auto grid h-11 w-10 place-items-center text-base font-semibold text-[var(--portail-encre)] ${
                  choisi ? "rounded-lg ring-2 ring-[#3b82f6]" : ""
                } ${marque && !choisi ? "underline decoration-2 underline-offset-4 decoration-[var(--portail-corail)]" : ""}`}
              >
                {jour}
              </button>
            );
          })}
        </div>
      </div>
      {evenement && (
        <button
          type="button"
          onClick={() =>
            void navigate({
              to: ui.mode === "prestataire" ? "/espace/missions" : "/espace/logement",
            })
          }
          className="flex w-full items-center gap-3 rounded-[22px] bg-white px-4 py-3 text-left shadow-[var(--portail-ombre)]"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-[var(--portail-encre-douce)]">
              {ui.mode === "prestataire" ? "Mission" : "Location"}
            </span>
            <span className="block truncate text-[15px] font-semibold">{evenement.label}</span>
            <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[var(--portail-corail)]">
              <Clock className="size-3.5" fill="currentColor" />
              {evenement.date}
            </span>
          </span>
          <span className="grid size-11 place-items-center rounded-xl bg-[#f6f1df]">
            <UserRound className="size-5" fill="currentColor" />
          </span>
        </button>
      )}
      <Carte className="space-y-2">
        <p id="note-calendrier" className="text-sm font-medium">
          {edition ? "Modifier la note" : "Ajouter une note dans le calendrier"}
        </p>
        <p className="text-[11px] text-[#98a2b3]">Jour retenu : {jourChoisi}</p>
        <input
          ref={saisie}
          className={champClasse}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note personnelle"
          aria-label="Note du calendrier"
        />
        <Bouton
          onClick={() => {
            if (!note.trim()) {
              toastErreur("Écrivez la note.");
              return;
            }
            if (edition) {
              modifierNote({ id: edition, jour: jourChoisi, texte: note.trim() });
              setEdition(null);
              toastOk("Note mise à jour.");
            } else {
              ajouterNote({
                id: idNouveau("note"),
                jour: jourChoisi,
                texte: note.trim(),
              });
              toastOk("Note ajoutée au calendrier.");
            }
            setNote("");
          }}
        >
          {edition ? "Enregistrer la modification" : "Enregistrer la note"}
        </Bouton>
        <ul className="space-y-2 text-xs text-[#667085]">
          {notes.map((n) => (
            <li key={n.id} className="flex items-start justify-between gap-2">
              <span>
                {n.jour} — {n.texte}
              </span>
              <span className="flex shrink-0 gap-2">
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center px-1 text-[#5090A8]"
                  onClick={() => {
                    setEdition(n.id);
                    setJourChoisi(n.jour);
                    setNote(n.texte);
                  }}
                >
                  Modifier
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center px-1 text-[#b42318]"
                  onClick={() => {
                    supprimerNote(n.id);
                    if (edition === n.id) {
                      setEdition(null);
                      setNote("");
                    }
                    toastOk("Note retirée.");
                  }}
                >
                  Supprimer
                </button>
              </span>
            </li>
          ))}
        </ul>
      </Carte>
      {ui.mode === "prestataire" && (
        <button
          type="button"
          className="inline-flex min-h-11 items-center text-xs text-[#5090A8]"
          onClick={() => void navigate({ to: "/espace/missions" })}
        >
          Ouvrir les missions
        </button>
      )}
    </Ecran>
  );
}
