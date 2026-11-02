import { useNavigate } from "@tanstack/react-router";
import { FileText, Home, Receipt, ScrollText } from "lucide-react";
import { useMemo, useState } from "react";
import { BandeauSimulation, Bouton, Carte, Ecran, Entete } from "@/components/portail/chrome";
import {
  ajouterPaiement,
  ecrireDocCourant,
  lireDocCourant,
  lirePaiements,
} from "@/components/portail/etat-local";
import { useAncre } from "@/components/portail/use-ancre";
import { dossierArchiveSeuleLigne } from "@/data/v1-metier";
import { useSession } from "@/data/session";
import { formatMontant } from "@/data/reservations-mo1";
import { useAuth } from "@/auth/auth-context";
import {
  classeDocument,
  creerPaiementSimulation,
  GESTIONNAIRE_PORTAIL,
  type ClasseDocument,
} from "@/lib/portail-mobile";
import { telechargerPdf, toastOk } from "@/lib/feedback";

type DocVue = {
  id: string;
  titre: string;
  date: string;
  logement: string;
  type: string;
  auteur: string;
  montant?: number;
  classe: ClasseDocument;
};

const DEMO: DocVue[] = [
  {
    id: "d-loc-suz",
    titre: "Ma location — Suzette — Cannes",
    date: "2026-11-10",
    logement: "Suzette",
    type: "location",
    auteur: GESTIONNAIRE_PORTAIL.nom,
    classe: "location",
  },
  {
    id: "d-loc-col",
    titre: "Ma location — Colette — Cannes",
    date: "2026-11-13",
    logement: "Colette",
    type: "location",
    auteur: GESTIONNAIRE_PORTAIL.nom,
    classe: "location",
  },
  {
    id: "d-fact",
    titre: "Facture voyageur — Suzette — Cannes",
    date: "2026-11-10",
    logement: "Suzette",
    type: "facture",
    auteur: GESTIONNAIRE_PORTAIL.nom,
    montant: 240,
    classe: "location",
  },
  {
    id: "d-bail",
    titre: "Bail — Colette — Cannes",
    date: "2026-11-13",
    logement: "Colette",
    type: "bail",
    auteur: GESTIONNAIRE_PORTAIL.nom,
    classe: "location",
  },
  {
    id: "d-appel",
    titre: "Appel de loyer — nov. 2026",
    date: "2026-11-01",
    logement: "Colette",
    type: "appel",
    auteur: GESTIONNAIRE_PORTAIL.nom,
    montant: 650,
    classe: "quittance",
  },
  {
    id: "d-quit",
    titre: "Quittance de loyer — nov. 2026",
    date: "2026-11-13",
    logement: "Colette",
    type: "quittance",
    auteur: GESTIONNAIRE_PORTAIL.nom,
    montant: 650,
    classe: "quittance",
  },
  {
    id: "d-edl-e",
    titre: "AEDL Entrée — Suzette — Cannes",
    date: "2026-11-10",
    logement: "Suzette",
    type: "edl",
    auteur: GESTIONNAIRE_PORTAIL.nom,
    classe: "edl",
  },
  {
    id: "d-edl-s",
    titre: "AEDL Sortie — Suzette — Cannes",
    date: "2026-11-13",
    logement: "Suzette",
    type: "edl",
    auteur: GESTIONNAIRE_PORTAIL.nom,
    classe: "edl",
  },
  {
    id: "d-inv",
    titre: "Inventaire Entrée — Colette — Cannes",
    date: "2026-11-13",
    logement: "Colette",
    type: "inventaire",
    auteur: GESTIONNAIRE_PORTAIL.nom,
    classe: "edl",
  },
  {
    id: "d-reg",
    titre: "Règlement intérieur — Suzette — Cannes",
    date: "2026-11-10",
    logement: "Suzette",
    type: "reglement",
    auteur: GESTIONNAIRE_PORTAIL.nom,
    classe: "reglement",
  },
  {
    id: "d-fiche",
    titre: "Fiche d'accès — Colette — Cannes",
    date: "2026-11-13",
    logement: "Colette",
    type: "fiche",
    auteur: GESTIONNAIRE_PORTAIL.nom,
    classe: "fiche",
  },
];

function depuisSession(
  documents: {
    id: string;
    titre: string;
    date: string;
    logement: string;
    type: string;
    modifiePar: string;
  }[],
): DocVue[] {
  if (documents.length === 0) return DEMO;
  return documents.map((d) => ({
    id: d.id,
    titre: d.titre,
    date: d.date,
    logement: d.logement,
    type: d.type,
    auteur: d.modifiePar || GESTIONNAIRE_PORTAIL.nom,
    classe: classeDocument(d.titre, d.type),
  }));
}

export function DocumentsPortail() {
  const ancre = useAncre();
  const session = useSession();
  const auth = useAuth();
  const docs = useMemo(() => depuisSession(session.documents), [session.documents]);
  const dossier = session.dossiersLocation.find(
    (d) => d.email.toLowerCase() === (auth?.email ?? "").toLowerCase(),
  );
  const archive = dossierArchiveSeuleLigne(dossier);

  if (archive && ancre !== "historique") {
    return (
      <Ecran>
        <Entete titre="Archives" />
        <p className="rounded-[22px] bg-white p-4 text-sm text-[#667085]">
          Au-delà de 1 à 2 ans, les fichiers sont retirés. Seule la ligne d'historique reste.
        </p>
      </Ecran>
    );
  }
  if (ancre === "voir") return <Visualisation docs={docs} />;
  if (ancre === "paiement") return <Paiement docs={docs} />;
  if (ancre === "historique") return <Historique />;
  if (
    ancre === "location" ||
    ancre === "quittances" ||
    ancre === "edl" ||
    ancre === "reglement" ||
    ancre === "fiche"
  ) {
    return (
      <Liste
        classe={
          ancre === "quittances"
            ? "quittance"
            : ancre === "reglement"
              ? "reglement"
              : ancre === "fiche"
                ? "fiche"
                : ancre
        }
        docs={docs}
      />
    );
  }
  return <Hub docs={docs} />;
}

function Hub({ docs }: { docs: DocVue[] }) {
  const navigate = useNavigate();
  const tuiles: Array<{ hash: string; titre: string; detail: string; icone: typeof Home }> = [
    { hash: "location", titre: "Ma location", detail: "Bail, facture voyageur", icone: Home },
    {
      hash: "quittances",
      titre: "Quittances",
      detail: "Appels, quittances, historique",
      icone: Receipt,
    },
    {
      hash: "edl",
      titre: "État des lieux",
      detail: "Entrée, sortie, inventaire",
      icone: ScrollText,
    },
    { hash: "reglement", titre: "Documents", detail: "Règlement, fiche d'accès", icone: FileText },
  ];
  return (
    <Ecran>
      <Entete titre="Vos documents" sousTitre="Vos tâches en attente" />
      <button
        type="button"
        className="text-xs text-[#5090A8]"
        onClick={() => void navigate({ to: "/espace", hash: "taches" })}
      >
        Voir les tâches en attente
      </button>
      <div className="grid grid-cols-2 gap-3">
        {tuiles.map((t) => (
          <button
            key={t.hash}
            type="button"
            onClick={() => void navigate({ to: "/espace/documents", hash: t.hash })}
            className="flex h-32 flex-col items-start justify-between rounded-[22px] bg-white p-4 text-left shadow-[0_8px_24px_rgba(70,80,60,0.05)]"
          >
            <t.icone className="size-5 text-[#5090A8]" />
            <span>
              <span className="block text-sm font-semibold text-[#1d2939]">{t.titre}</span>
              <span className="text-[11px] text-[#98a2b3]">{t.detail}</span>
            </span>
          </button>
        ))}
      </div>
      <Carte>
        <p className="text-sm font-medium text-[#1d2939]">Information à propos du propriétaire</p>
        <p className="mt-1 text-xs text-[#667085]">
          {GESTIONNAIRE_PORTAIL.nom} ({GESTIONNAIRE_PORTAIL.societe}) ·{" "}
          {GESTIONNAIRE_PORTAIL.telephone}
        </p>
      </Carte>
      <p className="text-[11px] text-[#98a2b3]">
        {docs.length} documents suivis. Les archives de plus de deux ans ne conservent que la ligne.
      </p>
    </Ecran>
  );
}

const TITRES: Record<string, string> = {
  location: "Mon logement",
  quittance: "Quittances et paiements",
  edl: "État des lieux et inventaires",
  reglement: "Règlement intérieur",
  fiche: "Fiche d'accès",
};

function Liste({ classe, docs }: { classe: string; docs: DocVue[] }) {
  const navigate = useNavigate();
  const lignes =
    classe === "reglement"
      ? docs.filter((d) => d.classe === "reglement" || d.classe === "fiche")
      : docs.filter((d) => d.classe === classe);
  return (
    <Ecran>
      <Entete
        titre={TITRES[classe] ?? "Documents"}
        surRetour={() => void navigate({ to: "/espace/documents" })}
      />
      <ul className="space-y-3">
        {lignes.map((d) => (
          <li key={d.id}>
            <button
              type="button"
              className="w-full rounded-[22px] bg-white px-4 py-3 text-left"
              onClick={() => {
                ecrireDocCourant(d.id);
                void navigate({ to: "/espace/documents", hash: "voir" });
              }}
            >
              <span className="block text-sm font-medium text-[#1d2939]">{d.titre}</span>
              <span className="text-[11px] text-[#98a2b3]">Émis le {d.date}</span>
            </button>
          </li>
        ))}
        {lignes.length === 0 && (
          <li className="text-sm text-[#667085]">Aucun document dans cette catégorie.</li>
        )}
      </ul>
      {classe === "location" && (
        <Bouton
          variante="ligne"
          onClick={() => void navigate({ to: "/espace/logement", hash: "depart" })}
        >
          Je déclare mon départ du logement
        </Bouton>
      )}
      {classe === "quittance" && (
        <Bouton onClick={() => void navigate({ to: "/espace/documents", hash: "historique" })}>
          Mon historique de paiement
        </Bouton>
      )}
      {classe === "fiche" && (
        <Bouton variante="ligne" onClick={() => void navigate({ to: "/espace", hash: "acces" })}>
          Ouvrir la fiche d'accès
        </Bouton>
      )}
    </Ecran>
  );
}

function Visualisation({ docs }: { docs: DocVue[] }) {
  const navigate = useNavigate();
  const id = lireDocCourant();
  const doc = docs.find((d) => d.id === id) ?? docs[0];
  if (!doc) return null;
  const payable = /appel|facture/i.test(doc.titre) || /appel|facture/i.test(doc.type);
  const lien = /quittance/i.test(doc.titre);
  return (
    <Ecran>
      <Entete
        titre={doc.titre}
        sousTitre={`Émis le ${doc.date}`}
        surRetour={() => void navigate({ to: "/espace/documents" })}
      />
      <Carte className="space-y-3">
        <p className="text-center text-sm text-[#98a2b3]">Visualisation du document</p>
        <p className="text-sm text-[#1d2939]">{doc.logement}</p>
        <p className="text-xs text-[#667085]">Rédigé par {doc.auteur}</p>
        <ol className="space-y-2 border-l border-[#e4e7ec] pl-3 text-xs text-[#344054]">
          <li>
            {doc.date} — rédaction par {doc.auteur}
          </li>
          <li>{doc.date} — envoi au résident</li>
          <li>Aujourd'hui — consultation dans le portail</li>
        </ol>
        <button
          type="button"
          className="text-xs font-medium text-[#5090A8]"
          onClick={() =>
            void telechargerPdf(doc.titre, [doc.titre, doc.logement, `Rédigé par ${doc.auteur}`])
          }
        >
          Télécharger
        </button>
      </Carte>
      {payable && (
        <Bouton
          onClick={() => {
            ecrireDocCourant(doc.id);
            void navigate({ to: "/espace/documents", hash: "paiement" });
          }}
        >
          Procéder au paiement
        </Bouton>
      )}
      {lien && !payable && (
        <Bouton
          variante="ligne"
          onClick={() => {
            const sim = creerPaiementSimulation({ libelle: doc.titre, montant: doc.montant ?? 0 });
            void navigator.clipboard?.writeText(`Lien simulé ${sim.reference} — ${sim.mention}`);
            toastOk("Lien de paiement simulé copié. Aucun encaissement.");
          }}
        >
          Lien de paiement
        </Bouton>
      )}
    </Ecran>
  );
}

function Paiement({ docs }: { docs: DocVue[] }) {
  const navigate = useNavigate();
  const id = lireDocCourant();
  const doc = docs.find((d) => d.id === id) ?? docs.find((d) => d.montant) ?? docs[0];
  const [fait, setFait] = useState<string | null>(null);
  if (!doc) return null;
  const montant = doc.montant ?? 650;
  return (
    <Ecran>
      <Entete
        titre="Procéder au paiement"
        surRetour={() => void navigate({ to: "/espace/documents", hash: "voir" })}
      />
      <BandeauSimulation />
      <Carte className="space-y-2 text-sm">
        <p className="font-medium text-[#1d2939]">{doc.titre}</p>
        <p className="text-2xl font-semibold text-[#1d2939]">{formatMontant(montant)}</p>
        <p className="text-xs text-[#667085]">Référence locale, non transmise à une banque.</p>
        {fait && <p className="text-sm text-[#027a48]">Simulation confirmée · {fait}</p>}
      </Carte>
      {!fait && (
        <Bouton
          onClick={() => {
            const sim = creerPaiementSimulation({ libelle: doc.titre, montant });
            ajouterPaiement(sim);
            setFait(sim.reference);
            toastOk("Paiement simulé. Rien n'a été débité.");
          }}
        >
          Confirmer la simulation
        </Bouton>
      )}
      <Bouton
        variante="ghost"
        onClick={() => void navigate({ to: "/espace/documents", hash: "historique" })}
      >
        Voir l'historique
      </Bouton>
    </Ecran>
  );
}

function Historique() {
  const navigate = useNavigate();
  const session = useSession();
  const simules = lirePaiements();
  const lignes = [
    ...session.loyers
      .filter((l) => l.valide)
      .map((l) => ({
        id: l.id,
        date: l.payeLe || l.echeance,
        montant: formatMontant(l.montant),
        methode: l.methode || "Virement",
        ref: l.reference || "Loyer",
      })),
    ...simules.map((p) => ({
      id: p.id,
      date: p.creeLe.slice(0, 10),
      montant: formatMontant(p.montant),
      methode: "Simulation",
      ref: p.reference,
    })),
  ];
  const affiche =
    lignes.length > 0
      ? lignes
      : [
          {
            id: "h1",
            date: "2026-05-01",
            montant: "1 280 €",
            methode: "Virement",
            ref: "LoyerMois",
          },
          {
            id: "h2",
            date: "2026-04-01",
            montant: "1 280 €",
            methode: "Virement",
            ref: "LoyerMois",
          },
          { id: "h3", date: "2026-02-15", montant: "850 €", methode: "Espèces", ref: "Facture" },
        ];
  return (
    <Ecran>
      <Entete
        titre="Historique des paiements"
        surRetour={() => void navigate({ to: "/espace/documents", hash: "quittances" })}
      />
      <div className="overflow-hidden rounded-[22px] bg-white">
        <table className="w-full text-left text-xs">
          <thead className="text-[#98a2b3]">
            <tr>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Montant</th>
              <th className="px-3 py-2 font-medium">Méthode</th>
              <th className="px-3 py-2 font-medium">Réf</th>
            </tr>
          </thead>
          <tbody>
            {affiche.map((l) => (
              <tr key={l.id} className="border-t border-[#f2f4f7]">
                <td className="px-3 py-2">{l.date}</td>
                <td className="px-3 py-2">{l.montant}</td>
                <td className="px-3 py-2">{l.methode}</td>
                <td className="px-3 py-2">{l.ref}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Ecran>
  );
}
