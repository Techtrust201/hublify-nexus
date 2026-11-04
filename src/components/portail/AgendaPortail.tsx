import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
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
          const choisi = date && date === jourChoisi;
          return (
            <button
              key={`${i}-${jour}`}
              type="button"
              disabled={!jour}
              onClick={() => jour && setJourChoisi(date)}
              className={`grid h-9 place-items-center rounded-xl text-sm ${
                choisi
                  ? "bg-[#1d2939] text-white"
                  : marque
                    ? "bg-[#5090A8] text-white"
                    : "text-[#344054]"
              }`}
            >
              {jour}
            </button>
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
                  className="text-[#5090A8]"
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
                  className="text-[#b42318]"
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
          className="text-xs text-[#5090A8]"
          onClick={() => void navigate({ to: "/espace/missions" })}
        >
          Ouvrir les missions
        </button>
      )}
    </Ecran>
  );
}
