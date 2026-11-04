import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Bouton,
  Carte,
  Ecran,
  Entete,
  champClasse,
  usePortailUi,
} from "@/components/portail/chrome";
import { ajouterNote, lireNotes } from "@/components/portail/etat-local";
import { idNouveau, useSession } from "@/data/session";
import { libelleMois } from "@/lib/portail-mobile";
import { toastErreur, toastOk } from "@/lib/feedback";

export function CalendrierPortail() {
  const ui = usePortailUi();
  const session = useSession();
  const navigate = useNavigate();
  const [cursor, setCursor] = useState(() => new Date());
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState(() => lireNotes());
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

  return (
    <Ecran>
      <Entete titre="Calendrier" />
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Mois précédent"
          className="size-9 text-lg"
          onClick={() => setCursor(new Date(annee, mois - 1, 1))}
        >
          ‹
        </button>
        <p className="text-sm font-semibold capitalize text-[#1d2939]">{libelleMois(cursor)}</p>
        <button
          type="button"
          aria-label="Mois suivant"
          className="size-9 text-lg"
          onClick={() => setCursor(new Date(annee, mois + 1, 1))}
        >
          ›
        </button>
      </div>
      <button
        type="button"
        className="text-xs text-[#5090A8]"
        onClick={() => setCursor(new Date())}
      >
        Aujourd'hui
      </button>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-[#98a2b3]">
        {["lu", "ma", "me", "je", "ve", "sa", "di"].map((j) => (
          <span key={j}>{j}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cases.map((jour, i) => {
          const date = jour ? iso(jour) : "";
          const marque =
            occupations.some((o) => o.date === date) || notes.some((n) => n.jour === date);
          return (
            <span
              key={`${i}-${jour}`}
              className={`grid h-9 place-items-center rounded-xl text-sm ${marque ? "bg-[#5090A8] text-white" : "text-[#344054]"}`}
            >
              {jour}
            </span>
          );
        })}
      </div>
      <Carte className="space-y-2">
        <p className="text-sm font-medium">
          {ui.mode === "prestataire" ? "Prestations" : "Occupations"}
        </p>
        <ul className="space-y-1 text-sm text-[#344054]">
          {occupations.slice(0, 8).map((o) => (
            <li key={o.id}>
              {o.date} · {o.label}
            </li>
          ))}
          {occupations.length === 0 && <li className="text-[#98a2b3]">Rien sur cette période.</li>}
        </ul>
      </Carte>
      <Carte className="space-y-2">
        <p className="text-sm font-medium">Ajouter une note</p>
        <input
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
            const ligne = {
              id: idNouveau("note"),
              jour: new Date().toISOString().slice(0, 10),
              texte: note.trim(),
            };
            ajouterNote(ligne);
            setNotes(lireNotes());
            setNote("");
            toastOk("Note ajoutée au calendrier.");
          }}
        >
          Enregistrer la note
        </Bouton>
        <ul className="space-y-1 text-xs text-[#667085]">
          {notes.map((n) => (
            <li key={n.id}>
              {n.jour} — {n.texte}
            </li>
          ))}
        </ul>
      </Carte>
      {ui.mode === "prestataire" && (
        <button
          type="button"
          className="text-xs text-[#5090A8]"
          onClick={() => void navigate({ to: "/espace/missions" })}
        >
          Ouvrir les missions
        </button>
      )}
    </Ecran>
  );
}
