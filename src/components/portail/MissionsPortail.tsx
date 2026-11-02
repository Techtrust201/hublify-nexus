import { useState } from "react";
import { useAuth, useDroit } from "@/auth/auth-context";
import { Bouton, Carte, Ecran, Entete } from "@/components/portail/chrome";
import { champClasse } from "@/components/portail/chrome";
import { ajouterRapport, changerStatutMission, idNouveau, useSession } from "@/data/session";
import { TACHES_DEMO_PRESTATAIRE } from "@/lib/portail-mobile";
import { toastErreur, toastOk } from "@/lib/feedback";
import { useRef } from "react";

export function MissionsPortail() {
  const session = useSession();
  const peutMod = useDroit("mod-missions");
  const auth = useAuth();
  const [brouillon, setBrouillon] = useState<Record<string, { texte: string; photos: string }>>({});
  const photo = useRef<HTMLInputElement>(null);
  const [missionPhoto, setMissionPhoto] = useState<string | null>(null);
  const miennes =
    auth?.roleId === "prestataire"
      ? session.missions.filter(
          (m) =>
            m.assigne.toLowerCase().includes((auth.nom ?? "").toLowerCase()) ||
            m.assigne.toLowerCase().includes("lucas"),
        )
      : session.missions;
  const liste = miennes.length > 0 ? miennes : [];

  return (
    <Ecran>
      <Entete titre="Missions" sousTitre="Mode Prestataire" />
      {liste.length === 0 && (
        <ul className="space-y-2">
          {TACHES_DEMO_PRESTATAIRE.map((t) => (
            <li key={t.id} className="rounded-[22px] bg-white px-4 py-3">
              <p className="text-sm font-medium">{t.titre}</p>
              <p className="text-xs text-[#e11d48]">{t.heureLabel}</p>
              <p className="mt-1 text-xs text-[#98a2b3]">
                Démonstration — aucune mission assignée sur ce compte.
              </p>
            </li>
          ))}
        </ul>
      )}
      <ul className="space-y-3">
        {liste.map((m) => {
          const rapports = session.rapportsIntervention.filter((r) => r.missionId === m.id);
          const saisie = brouillon[m.id] ?? { texte: "", photos: "" };
          return (
            <li key={m.id}>
              <Carte className="space-y-2">
                <p className="text-sm font-semibold text-[#1d2939]">
                  {m.emoji} {m.titre}
                </p>
                <p className="text-xs text-[#667085]">
                  {m.date} · {m.heure} · {m.statut.replace("_", " ")}
                </p>
                <p className="text-sm text-[#344054]">{m.description}</p>
                {peutMod && m.statut !== "terminee" && (
                  <Bouton
                    onClick={() => {
                      changerStatutMission(m.id, m.statut === "a_faire" ? "en_cours" : "terminee");
                      toastOk(m.statut === "a_faire" ? "Mission démarrée." : "Mission terminée.");
                    }}
                  >
                    {m.statut === "a_faire" ? "Démarrer" : "Terminer"}
                  </Bouton>
                )}
                {rapports.map((r) => (
                  <p key={r.id} className="rounded-2xl bg-[#f6f7f6] px-3 py-2 text-xs">
                    Rapport · {r.date} — {r.texte}
                    {r.photos.length > 0 ? ` · ${r.photos.length} photo(s)` : ""}
                  </p>
                ))}
                {peutMod && (
                  <>
                    <textarea
                      value={saisie.texte}
                      onChange={(e) =>
                        setBrouillon((s) => ({
                          ...s,
                          [m.id]: { ...saisie, texte: e.target.value },
                        }))
                      }
                      rows={3}
                      placeholder="Rapport d'intervention"
                      className={`${champClasse} h-24 py-2`}
                    />
                    <input
                      ref={photo}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="sr-only"
                      onChange={(e) => {
                        const fichier = e.target.files?.[0];
                        if (!fichier || !missionPhoto) return;
                        setBrouillon((s) => ({
                          ...s,
                          [missionPhoto]: {
                            texte: s[missionPhoto]?.texte ?? "",
                            photos: [s[missionPhoto]?.photos, fichier.name]
                              .filter(Boolean)
                              .join("\n"),
                          },
                        }));
                        toastOk("Photo ajoutée au rapport.");
                      }}
                    />
                    <button
                      type="button"
                      className="text-xs text-[#5090A8]"
                      onClick={() => {
                        setMissionPhoto(m.id);
                        photo.current?.click();
                      }}
                    >
                      Prendre une photo
                    </button>
                    <Bouton
                      variante="ligne"
                      onClick={() => {
                        if (!saisie.texte.trim()) {
                          toastErreur("Rédigez le rapport.");
                          return;
                        }
                        ajouterRapport({
                          id: idNouveau("rp"),
                          missionId: m.id,
                          texte: saisie.texte.trim(),
                          photos: saisie.photos
                            .split("\n")
                            .map((p) => p.trim())
                            .filter(Boolean),
                          auteur: auth ? `${auth.prenom} ${auth.nom}` : "Prestataire",
                          date: new Date().toISOString().slice(0, 10),
                        });
                        setBrouillon((s) => ({ ...s, [m.id]: { texte: "", photos: "" } }));
                        toastOk("Rapport enregistré.");
                      }}
                    >
                      Enregistrer le rapport
                    </Bouton>
                  </>
                )}
              </Carte>
            </li>
          );
        })}
      </ul>
    </Ecran>
  );
}
