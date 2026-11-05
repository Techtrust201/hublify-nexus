import { useEffect, useState } from "react";
import { useAuth, useDroit } from "@/auth/auth-context";
import { Bouton, Carte, Ecran, Entete } from "@/components/portail/chrome";
import { champClasse } from "@/components/portail/chrome";
import { ajouterRapport, changerStatutMission, idNouveau, useSession } from "@/data/session";
import { deposerFichier, lireFichier } from "@/lib/documents.functions";
import { preparerFichier, urlDepuisBase64 } from "@/lib/fichiers-client";
import { descriptionVisible } from "@/lib/gestionnaire-planning";
import { joursAutour } from "@/lib/portail-mobile";
import { toastErreur, toastOk } from "@/lib/feedback";
import { useRef } from "react";

type PhotoRapport = { id: string; nom: string };

function ApercuFichier({ id }: { id: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [nom, setNom] = useState("Photo");
  useEffect(() => {
    let vivant = true;
    void lireFichier({ data: { id } }).then((res) => {
      if (!vivant || !res.ok) return;
      setNom(res.fichier.nom);
      setSrc(urlDepuisBase64(res.fichier.mime, res.fichier.base64));
    });
    return () => {
      vivant = false;
    };
  }, [id]);
  if (!src) return <span className="text-[11px] text-[#667085]">{nom}</span>;
  return <img src={src} alt={nom} className="mt-1 h-16 w-16 rounded-lg object-cover" />;
}

function isoLocal(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function etiquette(date: Date) {
  return {
    mois: date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
    numero: String(date.getDate()),
    semaine: date.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", ""),
    iso: isoLocal(date),
  };
}

export function MissionsPortail() {
  const session = useSession();
  const peutMod = useDroit("mod-missions");
  const auth = useAuth();
  const [jour, setJour] = useState(() => isoLocal(new Date()));
  const bandeau = joursAutour(new Date());
  const [brouillon, setBrouillon] = useState<
    Record<string, { texte: string; photos: PhotoRapport[] }>
  >({});
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
  const liste = (miennes.length > 0 ? miennes : []).filter((m) => m.date.slice(0, 10) === jour);

  return (
    <Ecran>
      <Entete titre="Toutes les tâches en cours" sousTitre="Ordre chronologique" />
      <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Jours">
        {bandeau.map((date) => {
          const e = etiquette(date);
          const on = e.iso === jour;
          return (
            <button
              key={e.iso}
              type="button"
              aria-pressed={on}
              onClick={() => setJour(e.iso)}
              className={`flex h-[78px] flex-col items-center justify-center rounded-2xl text-[11px] capitalize ${
                on ? "bg-[var(--portail-sarcelle)] text-white" : "bg-white text-black"
              }`}
            >
              <span>{e.mois}</span>
              <span className="text-lg font-semibold">{e.numero}</span>
              <span>{e.semaine}</span>
            </button>
          );
        })}
      </div>
      <p role="status" className="text-center text-[12px] font-semibold">
        {liste.length} mission{liste.length > 1 ? "s" : ""} le {jour.split("-").reverse().join("/")}
      </p>
      {liste.length === 0 && (
        <p className="rounded-[16px] bg-white px-4 py-3 text-sm">Aucune mission ce jour.</p>
      )}
      <ul className="space-y-3">
        {liste.map((m) => {
          const rapports = session.rapportsIntervention.filter((r) => r.missionId === m.id);
          const saisie = brouillon[m.id] ?? { texte: "", photos: [] };
          return (
            <li key={m.id}>
              <Carte className="space-y-2">
                <p className="text-sm font-semibold text-[#1d2939]">
                  {m.emoji} {m.titre}
                </p>
                <p className="text-xs text-[#667085]">
                  {m.date} · {m.heure} · {m.statut.replace("_", " ")}
                </p>
                <p className="text-sm text-[#344054]">{descriptionVisible(m.description)}</p>
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
                {rapports.flatMap((r) =>
                  r.photos
                    .filter((id) => id.startsWith("fic-"))
                    .map((id) => <ApercuFichier key={`${r.id}-${id}`} id={id} />),
                )}
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
                        e.target.value = "";
                        const missionId = missionPhoto;
                        if (!fichier || !missionId) return;
                        void (async () => {
                          const prepare = await preparerFichier(fichier, "mission");
                          if (!prepare.ok) {
                            toastErreur(prepare.erreur);
                            return;
                          }
                          const res = await deposerFichier({
                            data: {
                              contexte: "mission",
                              refId: missionId,
                              cote: "",
                              nom: prepare.fichier.nom,
                              mime: prepare.fichier.mime,
                              base64: prepare.fichier.base64,
                            },
                          });
                          if (!res.ok) {
                            toastErreur(res.erreur);
                            return;
                          }
                          setBrouillon((s) => {
                            const courant = s[missionId] ?? { texte: "", photos: [] };
                            return {
                              ...s,
                              [missionId]: {
                                texte: courant.texte,
                                photos: [
                                  ...courant.photos,
                                  { id: res.fichier.id, nom: res.fichier.nom },
                                ],
                              },
                            };
                          });
                          toastOk("Photo enregistrée.");
                        })();
                      }}
                    />
                    {saisie.photos.length > 0 && (
                      <ul className="text-[11px] text-[#667085]">
                        {saisie.photos.map((p) => (
                          <li key={p.id}>{p.nom}</li>
                        ))}
                      </ul>
                    )}
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
                          photos: saisie.photos.map((p) => p.id),
                          auteur: auth ? `${auth.prenom} ${auth.nom}` : "Prestataire",
                          date: new Date().toISOString().slice(0, 10),
                        });
                        setBrouillon((s) => ({ ...s, [m.id]: { texte: "", photos: [] } }));
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
