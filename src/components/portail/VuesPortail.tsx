import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth, useDroit } from "@/auth/auth-context";
import { DialoguePrecheckin } from "@/components/reservations/DialoguePrecheckin";
import {
  PIECES_DOSSIER_DEFAUT,
  dossierArchiveSeuleLigne,
  totalCandidature,
  type GarantDossier,
  type PieceDossier,
} from "@/data/v1-metier";
import {
  ajouterCandidature,
  ajouterNotif,
  ajouterRapport,
  changerStatutMission,
  idNouveau,
  modifierReservation,
  ouvrirConversationProspect,
  poserCollection,
  upsertDossierLocation,
  upsertPartageDossier,
  validerCandidature,
  useSession,
} from "@/data/session";
import { chargerAccesLieux } from "@/data/session-remote";
import { formatMontant } from "@/data/reservations-mo1";
import { toastErreur, toastOk } from "@/lib/feedback";
import { telechargerPdf } from "@/lib/feedback";

/** Accueil résident / prestataire — pas de template Grocery/Livia, pas de mode proprio/voyageur. */
export function AccueilPortail() {
  const auth = useAuth();
  const session = useSession();
  const missions = session.missions
    .filter((m) => m.statut !== "terminee")
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.heure.localeCompare(b.heure));
  const dernierMessage = session.conversations[0];
  const contacts = session.prestataires.slice(0, 4);
  const taches =
    auth?.roleId === "prestataire"
      ? missions.slice(0, 5).map((m) => ({
          id: m.id,
          titre: `${m.emoji} ${m.titre}`,
          detail: `${m.date} · ${m.heure} · ${m.assigne}`,
          href: "/espace/missions" as const,
        }))
      : auth?.roleId === "voyageur"
        ? session.reservationsDossier
            .filter((r) => r.precheckinStatut !== "fait")
            .map((r) => ({
              id: r.id,
              titre: `Pré-checkin · ${r.occupant}`,
              detail: `${r.arrivee} → ${r.depart}`,
              href: "/espace/precheckin" as const,
            }))
        : auth?.roleId === "proprietaire"
          ? session.loyers.slice(0, 5).map((l) => ({
              id: l.id,
              titre: `Loyer ${l.bienNom}`,
              detail: `${l.echeance} · ${formatMontant(l.montant)}`,
              href: "/espace/logement" as const,
            }))
          : [
              ...session.loyers
                .filter((l) => !l.valide)
                .slice(0, 3)
                .map((l) => ({
                  id: l.id,
                  titre: `Loyer à régler · ${l.echeance}`,
                  detail: formatMontant(l.montant),
                  href: "/espace/logement" as const,
                })),
              ...session.dossiersLocation
                .filter((d) => d.departDeclare && !d.departValide)
                .map((d) => ({
                  id: `dep-${d.id}`,
                  titre: "Départ en attente de validation",
                  detail: d.departDeclare ?? "",
                  href: "/espace/logement" as const,
                })),
              ...session.partagesDossier
                .filter((p) => p.autorise === null)
                .map((p) => ({
                  id: p.id,
                  titre: `Autorisation de partage · ${p.destinataire}`,
                  detail: "Oui / Non depuis le dossier",
                  href: "/espace/dossier" as const,
                })),
            ];

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-muted">
        {auth?.role} · {auth?.affectation}
      </p>
      {auth?.roleId === "locataire" && (
        <Link
          to="/espace/logement"
          hash="faq"
          className="block rounded-[20px] border border-line bg-white px-4 py-3 text-sm font-medium text-ink"
        >
          J'ai un problème dans mon logement
          <span className="mt-0.5 block text-xs font-normal text-ink-muted">
            FAQ électricité / plomberie, puis le gestionnaire
          </span>
        </Link>
      )}
      <section className="rounded-[20px] border border-line bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-ink">Tâches</h2>
          <Link to="/espace/missions" className="text-xs text-accent-teal">
            Tout voir
          </Link>
        </div>
        {taches.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">Rien de prévu pour le moment.</p>
        ) : (
          <ul className="mt-2 divide-y divide-surface-soft">
            {taches.map((t) => (
              <li key={t.id} className="py-2 text-sm">
                <Link to={t.href} className="block">
                  <p className="text-ink">{t.titre}</p>
                  <p className="text-xs text-ink-muted">{t.detail}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="rounded-[20px] border border-line bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-ink">Dernier message</h2>
          <Link to="/espace/messages" className="text-xs text-accent-teal">
            Gestionnaire
          </Link>
        </div>
        {dernierMessage ? (
          <p className="mt-2 text-sm text-ink-body">
            {dernierMessage.nom} — {dernierMessage.extrait}
          </p>
        ) : (
          <p className="mt-2 text-sm text-ink-muted">Aucun message.</p>
        )}
      </section>
      <section className="rounded-[20px] border border-line bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-ink">Contacts</h2>
          <Link to="/espace/contacts" className="text-xs text-accent-teal">
            Annuaire
          </Link>
        </div>
        <ul className="mt-2 space-y-1 text-sm">
          {contacts.map((c) => (
            <li key={c.id}>
              {c.nom} · {c.categorie}
            </li>
          ))}
          {contacts.length === 0 && <li className="text-ink-muted">Votre gestionnaire Hublify.</li>}
        </ul>
      </section>
      {auth?.roleId === "locataire" && (
        <Link to="/espace/logement" className="block text-sm font-medium text-accent-teal">
          Mon logement →
        </Link>
      )}
    </div>
  );
}

export function MissionsPortail() {
  const session = useSession();
  const peutMod = useDroit("mod-missions");
  const auth = useAuth();
  const [brouillon, setBrouillon] = useState<Record<string, { texte: string; photos: string }>>({});
  const miennes =
    auth?.roleId === "prestataire"
      ? session.missions.filter(
          (m) =>
            m.assigne.toLowerCase().includes((auth.nom ?? "").toLowerCase()) ||
            m.assigne.toLowerCase().includes("lucas"),
        )
      : session.missions;

  return (
    <ul className="space-y-3">
      {miennes.map((m) => {
        const rapports = session.rapportsIntervention.filter((r) => r.missionId === m.id);
        const saisie = brouillon[m.id] ?? { texte: "", photos: "" };
        return (
          <li key={m.id} className="rounded-card border border-line bg-white p-4">
            <p className="text-sm font-medium text-ink">
              {m.emoji} {m.titre}
            </p>
            <p className="text-xs text-ink-muted">
              {m.date} · {m.heure} · {m.statut.replace("_", " ")}
            </p>
            <p className="mt-2 text-sm text-ink-body">{m.description}</p>
            {peutMod && m.statut !== "terminee" && (
              <button
                type="button"
                onClick={() => {
                  changerStatutMission(m.id, m.statut === "a_faire" ? "en_cours" : "terminee");
                  toastOk(m.statut === "a_faire" ? "Mission démarrée." : "Mission terminée.");
                }}
                className="mt-3 h-9 rounded-card bg-ink px-3 text-xs font-medium text-white"
              >
                {m.statut === "a_faire" ? "Démarrer" : "Terminer"}
              </button>
            )}
            {rapports.map((r) => (
              <p key={r.id} className="mt-2 rounded-card bg-surface px-3 py-2 text-xs text-ink-body">
                Rapport · {r.date} — {r.texte}
                {r.photos.length > 0 ? ` · ${r.photos.length} photo(s)` : ""}
              </p>
            ))}
            {peutMod && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={saisie.texte}
                  onChange={(e) =>
                    setBrouillon((s) => ({ ...s, [m.id]: { ...saisie, texte: e.target.value } }))
                  }
                  rows={3}
                  placeholder="Rapport d'intervention"
                  className="w-full rounded-card border border-line px-3 py-2 text-sm outline-none"
                />
                <input
                  value={saisie.photos}
                  onChange={(e) =>
                    setBrouillon((s) => ({ ...s, [m.id]: { ...saisie, photos: e.target.value } }))
                  }
                  placeholder="Photos : une légende ou URL par ligne"
                  className="h-9 w-full rounded-card border border-line px-3 text-xs outline-none"
                />
                <button
                  type="button"
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
                  className="h-9 rounded-card border border-line px-3 text-xs"
                >
                  Enregistrer le rapport
                </button>
              </div>
            )}
            <Link to="/espace/documents" className="mt-2 inline-block text-xs text-accent-teal">
              Documents liés
            </Link>
          </li>
        );
      })}
      {miennes.length === 0 && (
        <li className="rounded-card border border-line bg-white p-4 text-sm text-ink-muted">
          Aucune mission assignée.
        </li>
      )}
    </ul>
  );
}

export function MessagesPortail() {
  const session = useSession();
  const [texte, setTexte] = useState("");
  const conv = session.conversations[0];

  return (
    <div className="rounded-card border border-line bg-white p-4">
      <h2 className="text-sm font-medium text-ink">{conv?.nom ?? "Gestionnaire du logement"}</h2>
      <p className="text-xs text-ink-muted">Contact du gestionnaire — même fil pour le logement.</p>
      <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto text-sm">
        {session.messagesFil
          .filter((m) => !conv || m.conversationId === conv.id)
          .slice(-12)
          .map((m) => (
            <li key={m.id} className="rounded-card bg-surface px-3 py-2">
              <p className="text-[10px] text-ink-muted">{m.heure}</p>
              <p>{m.texte}</p>
            </li>
          ))}
      </ul>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!texte.trim() || !conv) {
            toastErreur("Écrivez un message.");
            return;
          }
          poserCollection("messagesFil", (liste) => [
            ...liste,
            {
              id: idNouveau("msg"),
              conversationId: conv.id,
              kind: "envoye",
              texte: texte.trim(),
              heure: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
          setTexte("");
          toastOk("Message envoyé.");
        }}
      >
        <input
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          className="h-10 flex-1 rounded-card border border-line px-3 text-sm outline-none"
          placeholder="Votre message"
        />
        <button type="submit" className="h-10 rounded-card bg-ink px-3 text-xs font-medium text-white">
          Envoyer
        </button>
      </form>
    </div>
  );
}

export function DocumentsPortail() {
  const session = useSession();
  const auth = useAuth();
  const dossier = session.dossiersLocation.find(
    (d) => d.email.toLowerCase() === (auth?.email ?? "").toLowerCase(),
  );
  if (dossierArchiveSeuleLigne(dossier)) {
    return (
      <p className="rounded-[20px] border border-line bg-white p-4 text-sm text-ink-muted">
        Archive 1–2 ans expirée : seule la ligne d'historique reste visible.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {session.documents.map((d) => (
        <li key={d.id} className="flex items-center justify-between rounded-card border border-line bg-white px-4 py-3">
          <span>
            <span className="block text-sm text-ink">{d.titre}</span>
            <span className="text-xs text-ink-muted">
              {d.logement} · {d.type}
            </span>
          </span>
          <button
            type="button"
            className="text-xs font-medium text-accent-teal"
            onClick={() =>
              void telechargerPdf(d.titre, [d.titre, d.logement], { extra: [d.titre] })
            }
          >
            Télécharger
          </button>
        </li>
      ))}
      {session.documents.length === 0 && (
        <li className="rounded-card border border-line bg-white p-4 text-sm text-ink-muted">
          Aucun document partagé.
        </li>
      )}
    </ul>
  );
}

export function ContactsPortail() {
  const session = useSession();
  return (
    <ul className="space-y-2">
      <li className="rounded-[20px] border border-line bg-white px-4 py-3 text-sm">
        <p className="font-medium text-ink">Gestionnaire du logement</p>
        <p className="text-xs text-ink-muted">Contact principal — messagerie Hublify</p>
        <Link to="/espace/messages" className="text-xs text-accent-teal">
          Ouvrir Messages
        </Link>
      </li>
      {session.prestataires.map((p) => (
        <li key={p.id} className="rounded-card border border-line bg-white px-4 py-3">
          <p className="text-sm text-ink">{p.nom}</p>
          <p className="text-xs text-ink-muted">{p.categorie}</p>
          <a href={`mailto:${p.email}`} className="text-xs text-accent-teal">
            {p.email}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function LogementPortail() {
  const auth = useAuth();
  const session = useSession();
  const [depart, setDepart] = useState("");
  const bien = session.biens[0];
  const resas = session.reservationsDossier;
  const loyers = session.loyers;
  const [acces, setAcces] = useState<{
    wifi: string;
    wifiMdp: string;
    codeCles: string;
    consignes: string;
  } | null>(null);

  useEffect(() => {
    let vivant = true;
    void chargerAccesLieux().then((res) => {
      if (!vivant || !res.ok) return;
      const ligne = res.acces.find((a) => a.bienId === bien?.id) ?? res.acces[0];
      if (ligne) {
        setAcces({
          wifi: ligne.wifi,
          wifiMdp: ligne.wifiMdp,
          codeCles: ligne.codeCles,
          consignes: ligne.consignes,
        });
      }
    });
    return () => {
      vivant = false;
    };
  }, [bien?.id]);

  if (auth?.roleId === "proprietaire") {
    return (
      <div className="space-y-4">
        {session.biens.map((b) => (
          <article key={b.id} className="rounded-card border border-line bg-white p-4">
            <p className="text-sm font-medium text-ink">{b.nom}</p>
            <p className="text-xs text-ink-muted">{b.adresse}</p>
            <p className="mt-2 text-sm">
              Honoraires / loyers :{" "}
              {formatMontant(
                loyers.filter((l) => l.bienNom.toLowerCase() === b.nom.toLowerCase()).reduce((s, l) => s + l.montant, 0),
              )}
            </p>
          </article>
        ))}
        <Link to="/espace/documents" className="text-sm text-accent-teal">
          Documents →
        </Link>
        <Link to="/espace/messages" className="ml-3 text-sm text-accent-teal">
          Message au gestionnaire →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-card border border-line bg-white p-4">
        <h2 className="text-sm font-medium text-ink">Mon logement</h2>
        <p className="mt-1 text-sm">{bien?.nom ?? "—"}</p>
        <p className="text-xs text-ink-muted">{bien?.adresse}</p>
        <p className="mt-2 text-xs text-ink-body">{session.parametrage.consignesArrivee}</p>
        <CodesProteges
          enfants={{
            ...(acces?.wifi ? { wifi: acces.wifi } : {}),
            ...(acces?.wifiMdp ? { wifiMdp: acces.wifiMdp } : {}),
            ...(acces?.codeCles ? { codeCles: acces.codeCles } : {}),
          }}
        />
        {acces?.consignes && <p className="mt-2 text-xs text-ink-muted">{acces.consignes}</p>}
      </section>
      <section className="rounded-card border border-line bg-white p-4">
        <h2 className="text-sm font-medium text-ink">Bail et quittances</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {session.documents
            .filter((d) => /bail|quittance/i.test(d.type) || /bail|quittance/i.test(d.titre))
            .map((d) => (
              <li key={d.id}>{d.titre}</li>
            ))}
        </ul>
        {loyers.map((l) => (
          <p key={l.id} className="mt-2 text-sm">
            {l.echeance} · {formatMontant(l.montant)} {l.valide ? "payé" : "en attente"}
          </p>
        ))}
      </section>
      <section id="depart" className="rounded-card border border-line bg-white p-4">
        <h2 className="text-sm font-medium text-ink">Déclaration de départ</h2>
        <input
          type="date"
          value={depart}
          onChange={(e) => setDepart(e.target.value)}
          className="mt-2 h-10 rounded-card border border-line px-3 text-sm"
        />
        <button
          type="button"
          onClick={() => {
            if (!depart) {
              toastErreur("Choisissez une date de départ.");
              return;
            }
            const existant = session.dossiersLocation.find(
              (d) => d.email.toLowerCase() === (auth?.email ?? "").toLowerCase(),
            );
            upsertDossierLocation({
              id: existant?.id ?? idNouveau("dos"),
              occupantId: existant?.occupantId ?? session.occupants[0]?.id ?? "o",
              occupantNom: existant?.occupantNom || `${auth?.prenom ?? ""} ${auth?.nom ?? ""}`.trim(),
              email: auth?.email ?? "",
              statut: existant?.statut ?? "complet",
              pieces: existant?.pieces ?? PIECES_DOSSIER_DEFAUT,
              garants: existant?.garants ?? [],
              dureeAccesMois: existant?.dureeAccesMois ?? 24,
              departDeclare: depart,
              departValide: false,
              ...(existant?.archiveLe ? { archiveLe: existant.archiveLe } : {}),
            });
            ajouterNotif({
              titre: "Départ déclaré",
              detail: `${auth?.prenom} ${auth?.nom} · ${depart}`,
              href: "/occupants",
            });
            toastOk("Demande envoyée au gestionnaire. Les documents de sortie seront générés après validation.");
            setDepart("");
          }}
          className="mt-2 h-9 rounded-card bg-ink px-3 text-xs font-medium text-white"
        >
          Envoyer au gestionnaire
        </button>
      </section>
      <section className="rounded-card border border-line bg-white p-4">
        <h2 className="text-sm font-medium text-ink">Historique</h2>
        {resas.map((r) => (
          <p key={r.id} className="text-sm">
            {r.arrivee} → {r.depart} · {r.statut}
          </p>
        ))}
      </section>
      <Link to="/espace/dossier" className="text-sm text-accent-teal">
        Constituez votre dossier →
      </Link>
      <div id="faq">
        <FaqPortail />
      </div>
    </div>
  );
}

export function CalendrierPortail() {
  const session = useSession();
  const ouvertures = session.datesBloquees.filter(
    (d) => d.motif === "Ouverture" || d.motif === "Ouverture BAIL",
  );
  const resas = session.reservationsDossier.filter((r) => r.statut !== "Annulé");
  const departs = session.dossiersLocation.filter((d) => d.departDeclare);

  return (
    <div className="space-y-3">
      <section className="rounded-[20px] border border-line bg-white p-4">
        <h2 className="text-sm font-medium text-ink">Calendrier d'occupation</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {resas.map((r) => (
            <li key={r.id}>
              {r.arrivee} → {r.depart} · {r.occupant}
            </li>
          ))}
          {resas.length === 0 && <li className="text-ink-muted">Aucune occupation.</li>}
        </ul>
      </section>
      <section className="rounded-[20px] border border-line bg-white p-4">
        <h2 className="text-sm font-medium text-ink">Ouvertures type bail</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {ouvertures.slice(0, 12).map((d) => (
            <li key={d.id}>
              {d.date} · {session.biens.find((b) => b.id === d.bienId)?.nom ?? d.bienId}
            </li>
          ))}
          {ouvertures.length === 0 && (
            <li className="text-ink-muted">Aucune période d'ouverture posée par le gestionnaire.</li>
          )}
        </ul>
      </section>
      <section className="rounded-[20px] border border-line bg-white p-4">
        <h2 className="text-sm font-medium text-ink">Départs déclarés</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {departs.map((d) => (
            <li key={d.id}>
              {d.occupantNom} · {d.departDeclare}
              {d.departValide ? " · validé" : " · en attente"}
            </li>
          ))}
          {departs.length === 0 && <li className="text-ink-muted">Aucun départ déclaré.</li>}
        </ul>
        <Link to="/espace/logement" hash="depart" className="mt-2 inline-block text-xs text-accent-teal">
          Déclarer une date →
        </Link>
      </section>
    </div>
  );
}

export function FaqPortail() {
  const [q, setQ] = useState("");
  const faq = [
    {
      q: "Panne d'électricité",
      r: "Vérifiez le disjoncteur et le compteur Linky. Si rien ne revient, contactez le gestionnaire depuis Messages — n'appelez pas un électricien sans accord.",
    },
    {
      q: "Fuite ou plomberie",
      r: "Coupez l'eau au robinet d'arrêt. Mettez un récipient. Puis message au gestionnaire avec une photo. Urgence hors heures : le contact figure dans Messages.",
    },
    { q: "Comment obtenir le code Wi-Fi ?", r: "Les codes sont protégés : confirmez votre session (PIN) dans Mon logement." },
    { q: "Comment déclarer un départ ?", r: "Depuis Mon logement, indiquez la date : le gestionnaire valide puis génère les documents de sortie." },
    { q: "Où sont les quittances ?", r: "Dans Documents, filtre Quittances, ou dans Mon logement." },
  ];
  const hits = faq.filter(
    (f) =>
      !q.trim() ||
      f.q.toLowerCase().includes(q.toLowerCase()) ||
      f.r.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <section className="rounded-card border border-line bg-white p-4">
      <h2 className="text-sm font-medium text-ink">FAQ</h2>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher une question"
        className="mt-2 h-10 w-full rounded-card border border-line px-3 text-sm outline-none"
      />
      <ul className="mt-3 space-y-2">
        {hits.map((f) => (
          <li key={f.q}>
            <p className="text-sm text-ink">{f.q}</p>
            <p className="text-xs text-ink-muted">{f.r}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-ink-muted">
        Si la FAQ ne suffit pas :{" "}
        <Link to="/espace/messages" className="text-accent-teal">
          contacter le gestionnaire du logement
        </Link>
        .
      </p>
      {hits.length === 0 && (
        <p className="mt-2 text-sm">
          Rien trouvé.{" "}
          <Link to="/espace/messages" className="text-accent-teal">
            Contacter le gestionnaire
          </Link>
        </p>
      )}
    </section>
  );
}

function CodesProteges({
  enfants,
}: {
  enfants: { wifi?: string; wifiMdp?: string; codeCles?: string };
}) {
  const [pin, setPin] = useState("");
  const [ok, setOk] = useState(() =>
    typeof sessionStorage === "undefined" ? false : sessionStorage.getItem("hublify.pin.ok") === "1",
  );
  if (ok) {
    return (
      <div className="mt-2 space-y-1 text-xs text-ink-body">
        {enfants.wifi && <p>Wi-Fi : {enfants.wifi}{enfants.wifiMdp ? ` · ${enfants.wifiMdp}` : ""}</p>}
        {enfants.codeCles && <p>Boîte à clés / code : {enfants.codeCles}</p>}
      </div>
    );
  }
  return (
    <div className="mt-2 rounded-card bg-surface p-3">
      <p className="text-xs text-ink-muted">
        Infos sensibles : confirmez votre session (PIN à 4 chiffres). Pas de biométrie native.
      </p>
      <div className="mt-2 flex gap-2">
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          placeholder="••••"
          className="h-10 w-24 rounded-card border border-line px-3 text-sm"
        />
        <button
          type="button"
          onClick={() => {
            if (pin.length < 4) {
              toastErreur("Indiquez 4 chiffres.");
              return;
            }
            sessionStorage.setItem("hublify.pin.ok", "1");
            setOk(true);
            toastOk("Session confirmée. Codes visibles.");
          }}
          className="h-10 rounded-card bg-ink px-3 text-xs font-medium text-white"
        >
          Afficher
        </button>
      </div>
    </div>
  );
}

export function PrecheckinPortail() {
  const session = useSession();
  const resa = session.reservationsDossier[0];
  const [identite, setIdentite] = useState(resa?.precheckinIdentite || resa?.occupant || "");
  const [nb, setNb] = useState(String(resa?.precheckinNbPersonnes || resa?.voyageurs || 1));
  const [heure, setHeure] = useState(resa?.precheckinHeureArrivee || resa?.heureArrivee || "16:00");
  const [note, setNote] = useState(resa?.precheckinNote || "");
  const [voir, setVoir] = useState(false);

  if (!resa) {
    return <p className="text-sm text-ink-muted">Aucune réservation à préparer.</p>;
  }

  return (
    <div className="max-w-md space-y-3 rounded-card border border-line bg-white p-5">
      <h2 className="text-sm font-medium text-ink">Pré-checkin · {resa.occupant}</h2>
      <p className="text-xs text-ink-muted">
        {resa.arrivee} → {resa.depart}
      </p>
      <label className="block text-xs text-ink-muted">
        Identité
        <input value={identite} onChange={(e) => setIdentite(e.target.value)} className="mt-1 h-10 w-full rounded-card border border-line px-3 text-sm" />
      </label>
      <label className="block text-xs text-ink-muted">
        Nombre de personnes
        <input value={nb} onChange={(e) => setNb(e.target.value)} className="mt-1 h-10 w-full rounded-card border border-line px-3 text-sm" />
      </label>
      <label className="block text-xs text-ink-muted">
        Heure d'arrivée
        <input type="time" value={heure} onChange={(e) => setHeure(e.target.value)} className="mt-1 h-10 w-full rounded-card border border-line px-3 text-sm" />
      </label>
      <label className="block text-xs text-ink-muted">
        Note
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="mt-1 w-full rounded-card border border-line px-3 py-2 text-sm" />
      </label>
      <button
        type="button"
        onClick={() => {
          if (!identite.trim()) {
            toastErreur("Indiquez l'identité du voyageur.");
            return;
          }
          modifierReservation(resa.id, {
            precheckinStatut: "fait",
            precheckinIdentite: identite.trim(),
            precheckinNbPersonnes: Number(nb) || resa.voyageurs,
            precheckinHeureArrivee: heure,
            precheckinNote: note.trim(),
          });
          toastOk("Pré-checkin envoyé. Le gestionnaire le voit sur la réservation.");
        }}
        className="h-10 w-full rounded-card bg-ink text-sm font-medium text-white"
      >
        Envoyer
      </button>
      <button type="button" onClick={() => setVoir(true)} className="text-xs text-accent-teal">
        Voir le récapitulatif
      </button>
      <DialoguePrecheckin reservation={resa} ouvert={voir} onFermer={() => setVoir(false)} lectureSeule />
    </div>
  );
}

function CapturerPiece({
  piece,
  onChange,
}: {
  piece: PieceDossier;
  onChange: (p: PieceDossier) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const fichier = e.target.files?.[0];
          if (!fichier) return;
          onChange({ ...piece, present: true, photoNom: fichier.name });
          toastOk(`${piece.titre} ajoutée.`);
          e.target.value = "";
        }}
      />
      <button type="button" onClick={() => ref.current?.click()} className="text-xs text-accent-teal">
        {piece.present ? piece.photoNom ?? "Présente" : "Prendre en photo"}
      </button>
    </>
  );
}

export function DossierPortail() {
  const auth = useAuth();
  const session = useSession();
  const existant = session.dossiersLocation.find((d) => d.email.toLowerCase() === (auth?.email ?? "").toLowerCase());
  const [pieces, setPieces] = useState<PieceDossier[]>(existant?.pieces ?? PIECES_DOSSIER_DEFAUT);
  const [garants, setGarants] = useState<GarantDossier[]>(existant?.garants ?? []);
  const [etape, setEtape] = useState(0);
  const [tuto, setTuto] = useState(false);
  const [garant, setGarant] = useState<GarantDossier>({
    id: "",
    type: "personne",
    nom: "",
    email: "",
    telephone: "",
    organisme: "",
    numeroDossier: "",
  });
  const [dest, setDest] = useState("");
  const [tel, setTel] = useState("");
  const [notePerso, setNotePerso] = useState("");
  const [expire, setExpire] = useState("30");
  const [situationFam, setSituationFam] = useState(existant?.situationFamiliale ?? "");
  const [situationPro, setSituationPro] = useState(existant?.situationProfessionnelle ?? "");
  const [revenus, setRevenus] = useState(String(existant?.revenus ?? ""));
  const [rfr, setRfr] = useState(String(existant?.rfr ?? ""));
  const archiveSeule = dossierArchiveSeuleLigne(existant);

  const enregistrer = (statut: "brouillon" | "complet") => {
    const id = existant?.id ?? idNouveau("dos");
    const revenusN = Number(revenus.replace(",", ".")) || 0;
    const rfrN = Number(rfr.replace(",", ".")) || 0;
    upsertDossierLocation({
      id,
      occupantId: session.occupants[0]?.id ?? id,
      occupantNom: `${auth?.prenom ?? ""} ${auth?.nom ?? ""}`.trim(),
      email: auth?.email ?? "",
      statut,
      pieces,
      garants,
      dureeAccesMois: 24,
      situationFamiliale: situationFam,
      situationProfessionnelle: situationPro,
      ...(revenusN ? { revenus: revenusN } : {}),
      ...(rfrN ? { rfr: rfrN } : {}),
    });
    toastOk(statut === "complet" ? "Dossier enregistré." : "Brouillon enregistré.");
    return id;
  };

  if (archiveSeule) {
    return (
      <p className="rounded-[20px] border border-line bg-white p-4 text-sm text-ink-muted">
        Archive de plus de 2 ans : seule la ligne d'historique reste visible.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-muted">
        Deux étapes : déposer et filigraner les pièces, puis partager le dossier avec une date d'expiration.
      </p>
      <div className="flex gap-2 text-xs">
        <span className={etape === 0 ? "font-medium text-ink" : "text-ink-muted"}>1. Déposer</span>
        <span className={etape === 1 ? "font-medium text-ink" : "text-ink-muted"}>2. Partager</span>
      </div>
      {etape === 0 && (
        <div className="space-y-3 rounded-[20px] border border-line bg-white p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-ink-muted">
              Photo du justificatif : cadrez le document, lumière uniforme, pas de doigt sur le texte.
            </p>
            <button type="button" onClick={() => setTuto(true)} className="shrink-0 text-xs text-accent-teal">
              Voir le tuto
            </button>
          </div>
          {tuto && (
            <div className="rounded-card border border-line bg-surface px-3 py-2 text-xs text-ink-body">
              <p className="font-medium text-ink">Comment photographier une pièce</p>
              <ol className="mt-1 list-decimal space-y-1 pl-4">
                <li>Posez le document à plat, page entière dans le cadre.</li>
                <li>Lumière du jour, sans flash qui brûle le texte.</li>
                <li>Aucun doigt ni ombre sur les mentions.</li>
                <li>Pour l'avis d'imposition, le code 2D-DOC doit rester lisible.</li>
              </ol>
              <button type="button" onClick={() => setTuto(false)} className="mt-2 text-accent-teal">
                J'ai compris
              </button>
            </div>
          )}
          <ul className="space-y-3">
          {pieces.map((p) => (
            <li key={p.id} className="text-sm">
              <div className="flex items-center justify-between gap-2">
                <span>{p.titre}</span>
                <span className="flex gap-2">
                  <CapturerPiece
                    piece={p}
                    onChange={(suivant) =>
                      setPieces((liste) => liste.map((x) => (x.id === p.id ? suivant : x)))
                    }
                  />
                  {p.present && (
                    <button
                      type="button"
                      onClick={() =>
                        setPieces((liste) =>
                          liste.map((x) => (x.id === p.id ? { ...x, filigrane: !x.filigrane } : x)),
                        )
                      }
                      className="text-xs text-ink-muted"
                    >
                      {p.filigrane ? "Filigrané" : "Filigraner"}
                    </button>
                  )}
                </span>
              </div>
              {p.aide && <p className="text-[11px] text-ink-muted">{p.aide}</p>}
              {p.type === "fiscal" && (
                <label className="mt-1 block text-[11px] text-ink-muted">
                  Code 2D-DOC
                  <input
                    value={p.numero2dDoc ?? ""}
                    onChange={(e) =>
                      setPieces((liste) =>
                        liste.map((x) =>
                          x.id === p.id ? { ...x, numero2dDoc: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="Série imprimée en bas de l'avis"
                    className="mt-1 h-9 w-full rounded-card border border-line px-3 text-sm text-ink"
                  />
                </label>
              )}
            </li>
          ))}
          </ul>
          <label className="block text-xs text-ink-muted">
            Situation familiale (marié / pacsé / coloc)
            <input
              value={situationFam}
              onChange={(e) => setSituationFam(e.target.value)}
              className="mt-1 h-10 w-full rounded-card border border-line px-3 text-sm"
            />
          </label>
          <label className="block text-xs text-ink-muted">
            Situation professionnelle
            <input
              value={situationPro}
              onChange={(e) => setSituationPro(e.target.value)}
              className="mt-1 h-10 w-full rounded-card border border-line px-3 text-sm"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs text-ink-muted">
              Revenus
              <input
                value={revenus}
                onChange={(e) => setRevenus(e.target.value)}
                inputMode="decimal"
                className="mt-1 h-10 w-full rounded-card border border-line px-3 text-sm"
              />
            </label>
            <label className="block text-xs text-ink-muted">
              RFR
              <input
                value={rfr}
                onChange={(e) => setRfr(e.target.value)}
                inputMode="decimal"
                className="mt-1 h-10 w-full rounded-card border border-line px-3 text-sm"
              />
            </label>
          </div>
          <div className="space-y-2 border-t border-line pt-3">
            <p className="text-xs font-medium text-ink">Garants (personne physique ou organisme)</p>
          {garants.map((g) => (
            <p key={g.id} className="text-sm">
              {g.type === "institutionnel" ? `${g.organisme} · n° ${g.numeroDossier}` : g.nom}
            </p>
          ))}
          <select
            value={garant.type}
            onChange={(e) => setGarant({ ...garant, type: e.target.value as GarantDossier["type"] })}
            className="h-10 w-full rounded-card border border-line px-3 text-sm"
          >
            <option value="personne">Garant personne physique</option>
            <option value="institutionnel">Garant institutionnel</option>
          </select>
          <input
            value={garant.nom}
            onChange={(e) => setGarant({ ...garant, nom: e.target.value })}
            placeholder="Nom"
            className="h-10 w-full rounded-card border border-line px-3 text-sm"
          />
          {garant.type === "institutionnel" && (
            <>
              <input
                value={garant.organisme ?? ""}
                onChange={(e) => setGarant({ ...garant, organisme: e.target.value })}
                placeholder="Organisme"
                className="h-10 w-full rounded-card border border-line px-3 text-sm"
              />
              <input
                value={garant.numeroDossier ?? ""}
                onChange={(e) => setGarant({ ...garant, numeroDossier: e.target.value })}
                placeholder="N° de dossier"
                className="h-10 w-full rounded-card border border-line px-3 text-sm"
              />
            </>
          )}
          <button
            type="button"
            onClick={() => {
              if (!garant.nom.trim()) {
                toastErreur("Indiquez le nom du garant.");
                return;
              }
              if (garant.type === "institutionnel" && (!garant.organisme?.trim() || !garant.numeroDossier?.trim())) {
                toastErreur("Indiquez l'organisme et le n° de dossier.");
                return;
              }
              setGarants((liste) => [...liste, { ...garant, id: idNouveau("g") }]);
              setGarant({
                id: "",
                type: "personne",
                nom: "",
                email: "",
                telephone: "",
                organisme: "",
                numeroDossier: "",
              });
              toastOk("Garant ajouté.");
            }}
            className="h-9 rounded-card border border-line px-3 text-xs"
          >
            Ajouter le garant
          </button>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        {etape === 1 && (
          <button type="button" onClick={() => setEtape(0)} className="h-9 rounded-card border border-line px-3 text-xs">
            Retour
          </button>
        )}
        {etape === 0 ? (
          <button
            type="button"
            onClick={() => {
              enregistrer("brouillon");
              setEtape(1);
            }}
            className="h-9 rounded-card bg-ink px-3 text-xs font-medium text-white"
          >
            Continuer
          </button>
        ) : (
          <button
            type="button"
            onClick={() => enregistrer("complet")}
            className="h-9 rounded-card bg-ink px-3 text-xs font-medium text-white"
          >
            Enregistrer le dossier
          </button>
        )}
      </div>
      <div className="rounded-[20px] border border-line bg-white p-4">
        <h3 className="text-sm font-medium text-ink">Partager (Y/N, expiration)</h3>
        <input
          value={dest}
          onChange={(e) => setDest(e.target.value)}
          placeholder="Email ou, hors plateforme, un lien"
          className="mt-2 h-10 w-full rounded-card border border-line px-3 text-sm"
        />
        <input
          value={tel}
          onChange={(e) => setTel(e.target.value)}
          placeholder="Téléphone"
          className="mt-2 h-10 w-full rounded-card border border-line px-3 text-sm"
        />
        <textarea
          value={notePerso}
          onChange={(e) => setNotePerso(e.target.value)}
          placeholder="Note personnelle"
          rows={2}
          className="mt-2 w-full rounded-card border border-line px-3 py-2 text-sm"
        />
        <label className="mt-2 block text-xs text-ink-muted">
          Expiration (jours)
          <input
            value={expire}
            onChange={(e) => setExpire(e.target.value)}
            inputMode="numeric"
            className="mt-1 h-10 w-full rounded-card border border-line px-3 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            if (!dest.trim()) {
              toastErreur("Indiquez un destinataire.");
              return;
            }
            const id = enregistrer("complet");
            const jours = Math.max(1, Number(expire) || 30);
            const expireLe = new Date();
            expireLe.setDate(expireLe.getDate() + jours);
            upsertPartageDossier({
              id: idNouveau("part"),
              dossierId: id,
              destinataire: dest.trim(),
              autorise: null,
              demandeLe: new Date().toISOString().slice(0, 10),
              expireLe: expireLe.toISOString().slice(0, 10),
              ...(!dest.includes("@") ? { lienExterne: dest.trim() } : {}),
              ...(notePerso.trim() ? { notePersonnelle: notePerso.trim() } : {}),
              ...(tel.trim() ? { telephone: tel.trim() } : {}),
            });
            ouvrirConversationProspect({
              nom: dest.trim(),
              extrait: notePerso.trim() || `Dossier partagé par ${auth?.prenom ?? "le locataire"}`,
              bienNom: session.biens[0]?.nom,
              type: "locataire",
            });
            toastOk(`Demande envoyée. Messagerie Prospect à jour.`);
            setDest("");
          }}
          className="mt-2 h-9 rounded-card bg-ink px-3 text-xs font-medium text-white"
        >
          Demander l'autorisation
        </button>
        {session.partagesDossier.map((p) => (
          <div key={p.id} className="mt-2 flex items-center justify-between text-xs">
            <span>
              {p.destinataire} · {p.autorise === true ? "accepté" : p.autorise === false ? "refusé" : "en attente"}
            </span>
            {p.autorise === null && (
              <span className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    upsertPartageDossier({ ...p, autorise: true });
                    toastOk("Partage autorisé.");
                  }}
                  className="text-accent-teal"
                >
                  Oui
                </button>
                <button
                  type="button"
                  onClick={() => {
                    upsertPartageDossier({ ...p, autorise: false });
                    toastOk("Partage refusé.");
                  }}
                >
                  Non
                </button>
              </span>
            )}
          </div>
        ))}
      </div>
      <Link to="/espace/candidature" className="text-sm text-accent-teal">
        Proposer une candidature →
      </Link>
    </div>
  );
}

export function CandidaturePortail() {
  const session = useSession();
  const auth = useAuth();
  const peutValider = useDroit("mod-reservations");
  const dossier =
    session.dossiersLocation.find((d) => d.email.toLowerCase() === (auth?.email ?? "").toLowerCase()) ??
    session.dossiersLocation[0];
  const [bienId, setBienId] = useState(session.biens[0]?.id ?? "");
  const [arrivee, setArrivee] = useState("");
  const [depart, setDepart] = useState("");
  const bien = session.biens.find((b) => b.id === bienId);
  const estimation = useMemo(() => {
    if (!arrivee || !depart || depart <= arrivee || !bien) {
      return { prorata: 0, commissions: 0, total: 0 };
    }
    return totalCandidature({
      debut: arrivee,
      fin: depart,
      loyerMensuel: bien.baseNuit * 30,
      commission: Math.round(bien.baseNuit * 2),
    });
  }, [arrivee, depart, bien]);

  return (
    <div className="max-w-md space-y-3 rounded-card border border-line bg-white p-5">
      <h2 className="text-sm font-medium text-ink">Proposer ma candidature</h2>
      {!dossier && (
        <p className="text-sm text-ink-muted">
          Constituez d'abord votre dossier.{" "}
          <Link to="/espace/dossier" className="text-accent-teal">
            Ouvrir le dossier
          </Link>
        </p>
      )}
      <label className="block text-xs text-ink-muted">
        Logement
        <select value={bienId} onChange={(e) => setBienId(e.target.value)} className="mt-1 h-10 w-full rounded-card border border-line px-3 text-sm">
          {session.biens.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nom}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs text-ink-muted">
        Arrivée souhaitée
        <input type="date" value={arrivee} onChange={(e) => setArrivee(e.target.value)} className="mt-1 h-10 w-full rounded-card border border-line px-3 text-sm" />
      </label>
      <label className="block text-xs text-ink-muted">
        Départ
        <input type="date" value={depart} onChange={(e) => setDepart(e.target.value)} className="mt-1 h-10 w-full rounded-card border border-line px-3 text-sm" />
      </label>
      <p className="text-sm text-ink">
        Prorata {formatMontant(estimation.prorata)} + commissions {formatMontant(estimation.commissions)}{" "}
        = {formatMontant(estimation.total)}
      </p>
      <button
        type="button"
        onClick={() => {
          if (!dossier) {
            toastErreur("Enregistrez votre dossier avant de candidater.");
            return;
          }
          if (!arrivee || !depart || depart <= arrivee) {
            toastErreur("Indiquez des dates cohérentes.");
            return;
          }
          ajouterCandidature({
            id: idNouveau("cand"),
            dossierId: dossier.id,
            bienId,
            arrivee,
            depart,
            montant: estimation.total,
            statut: "proposee",
            commissionIncluse: estimation.commissions,
          });
          ouvrirConversationProspect({
            nom: `${auth?.prenom ?? ""} ${auth?.nom ?? ""}`.trim() || "Candidat",
            extrait: `Candidature ${arrivee} → ${depart} · ${formatMontant(estimation.total)}`,
            bienNom: bien?.nom,
            type: "locataire",
          });
          toastOk("Candidature envoyée. Messagerie Prospect et calendriers à valider.");
        }}
        className="h-10 w-full rounded-card bg-ink text-sm font-medium text-white"
      >
        Proposer ma candidature
      </button>
      <ul className="space-y-2 text-sm">
        {session.candidatures.map((c) => (
          <li key={c.id} className="rounded-card border border-surface-soft p-2">
            {c.arrivee} → {c.depart} · {c.statut}
            {peutValider && c.statut === "proposee" && (
              <button
                type="button"
                className="ml-2 text-xs text-accent-teal"
                onClick={() => {
                  if (!validerCandidature(c.id)) {
                    toastErreur("Candidature introuvable.");
                    return;
                  }
                  const b = session.biens.find((x) => x.id === c.bienId);
                  toastOk(`Date validée${b ? ` pour ${b.nom}` : ""}. Les deux calendriers sont à jour.`);
                }}
              >
                Valider la date
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
