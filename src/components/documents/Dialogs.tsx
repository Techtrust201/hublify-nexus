import { Download, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DOCS_MO1, PRESTATIONS_PHOTOS } from "@/data/documents-mo1";
import { telechargerPdf, toastOk } from "@/lib/feedback";
import { BtnNavy, BtnOutline, Champ } from "./ui";

export function GenerateQuittanceDialog({
  ouvert,
  onClose,
  onCree,
}: {
  ouvert: boolean;
  onClose: () => void;
  onCree?: (doc: import("@/data/documents-mo1").DocMo1) => void;
}) {
  const [bailleur, setBailleur] = useState("Hublify");
  const [bailleurAdr, setBailleurAdr] = useState("10 rue Exemple, 75001 PARIS");
  const [locataire, setLocataire] = useState("Jean Dupont");
  const [locAdr, setLocAdr] = useState("Appartement Colette");
  const [loyer, setLoyer] = useState("1280");
  const [charges, setCharges] = useState("80");
  const [mois, setMois] = useState("Août 2026");
  const [faitA, setFaitA] = useState("PARIS");
  const [apercuUrl, setApercuUrl] = useState<string | null>(null);
  const total = (Number(loyer) || 0) + (Number(charges) || 0);
  const contexte = {
    titulaire: locataire,
    locataire,
    logement: locAdr,
    adresse: locAdr,
    bailleur,
    date: mois,
    periode: mois,
    loyer: `${loyer} EUR`,
    charges: `${charges} EUR`,
    total: `${total} EUR`,
    extra: [
      `Bailleur : ${bailleur}`,
      `Adresse bailleur : ${bailleurAdr}`,
      `Locataire : ${locataire}`,
      `Logement : ${locAdr}`,
      `Mois : ${mois}`,
      `Loyer : ${loyer} EUR`,
      `Charges : ${charges} EUR`,
      `Total : ${total.toFixed(2)} EUR`,
      `Fait a : ${faitA}`,
    ],
  };

  useEffect(() => {
    if (ouvert) return;
    setApercuUrl((url) => {
      if (url) URL.revokeObjectURL(url);
      return null;
    });
  }, [ouvert]);

  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-[540px] overflow-y-auto rounded-card border-line p-0">
        <DialogHeader className="border-b border-surface-soft px-6 py-4">
          <DialogTitle className="text-base font-medium text-ink">
            Générer une quittance
          </DialogTitle>
          <DialogDescription className="text-xs text-ink-muted">
            Remplissez puis téléchargez
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 px-6 py-4">
          <Champ label="Bailleur — Nom complet" value={bailleur} onChange={setBailleur} />
          <Champ label="Bailleur — Adresse" value={bailleurAdr} onChange={setBailleurAdr} />
          <Champ label="Locataire — Nom complet" value={locataire} onChange={setLocataire} />
          <Champ label="Locataire — Adresse du bien" value={locAdr} onChange={setLocAdr} />
          <Champ label="Loyer nu (€)" value={loyer} onChange={setLoyer} />
          <Champ label="Charges / Provisions (€)" value={charges} onChange={setCharges} />
          <Champ label="Mois concerné" value={mois} onChange={setMois} />
          <Champ label="Fait à" value={faitA} onChange={setFaitA} />
        </div>
        <div className="mx-6 mb-4 rounded-card border border-surface-soft bg-surface p-4">
          <p className="text-xs text-ink-muted">Aperçu</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-ink-muted">Bailleur</p>
              <p className="text-ink">{bailleur}</p>
              <p className="text-ink-subtle">{bailleurAdr}</p>
            </div>
            <div>
              <p className="text-ink-muted">Locataire</p>
              <p className="text-ink">{locataire}</p>
              <p className="text-ink-subtle">{locAdr}</p>
            </div>
          </div>
          <p className="mt-3 text-xs font-medium text-ink">Quittance de loyer — {mois}</p>
          <div className="mt-2 flex justify-between text-xs text-ink-body">
            <div>
              <p>Loyer nu : {Number(loyer).toFixed(2).replace(".", ",")} €</p>
              <p>Charges : {Number(charges).toFixed(2).replace(".", ",")} €</p>
            </div>
            <p className="font-medium text-ink">Total : {total.toFixed(2).replace(".", ",")} €</p>
          </div>
        </div>
        {apercuUrl && (
          <iframe
            title="Aperçu de la quittance"
            src={apercuUrl}
            className="mx-6 mb-4 h-[360px] w-[calc(100%-3rem)] rounded-card border border-line bg-white"
          />
        )}
        <div className="flex gap-2 border-t border-surface-soft px-6 py-4">
          <BtnOutline className="flex-1 justify-center" onClick={onClose}>
            Annuler
          </BtnOutline>
          <BtnOutline
            className="flex-1 justify-center"
            onClick={() => {
              void (async () => {
                const { octetsDocument } = await import("@/lib/pdf-documents");
                const { octets } = await octetsDocument(`Quittance ${mois}`, contexte);
                setApercuUrl((url) => {
                  if (url) URL.revokeObjectURL(url);
                  return URL.createObjectURL(
                    new Blob([new Uint8Array(octets)], { type: "application/pdf" }),
                  );
                });
                toastOk("Aperçu généré dans la fenêtre.");
              })();
            }}
          >
            <Eye className="size-3" /> Aperçu PDF
          </BtnOutline>
          <BtnNavy
            className="flex-1 justify-center"
            onClick={() => {
              void telechargerPdf(`Quittance ${mois}`, [], contexte).then(() => {
                onCree?.({
                  id: `gen-q-${Date.now()}`,
                  titre: `Quittance ${mois} — ${locataire}`,
                  type: "Quittance",
                  filtre: "Quittances",
                  logement: locAdr,
                  date: new Date().toLocaleDateString("fr-FR"),
                  taille: "PDF",
                  modifiePar: "Vous",
                  photos: 0,
                  vue: "residents",
                  occupant: "locataires",
                });
                onClose();
              });
            }}
          >
            <Download className="size-3" /> Télécharger
          </BtnNavy>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function GenerateAvisDialog({
  ouvert,
  onClose,
  onCree,
}: {
  ouvert: boolean;
  onClose: () => void;
  onCree?: (doc: import("@/data/documents-mo1").DocMo1) => void;
}) {
  const [bailleur, setBailleur] = useState("Hublify");
  const [bailleurAdr, setBailleurAdr] = useState("10 rue Exemple, 75001 PARIS");
  const [locataire, setLocataire] = useState("Jean Dupont");
  const [locAdr, setLocAdr] = useState("Appartement Colette");
  const [loyer, setLoyer] = useState("1280");
  const [charges, setCharges] = useState("80");
  const [mois, setMois] = useState("Septembre 2026");
  const [echeance, setEcheance] = useState("05 Sept 2026");

  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-[540px] overflow-y-auto rounded-card border-line p-0">
        <DialogHeader className="border-b border-surface-soft px-6 py-4">
          <DialogTitle className="text-base font-medium text-ink">Avis d'échéance</DialogTitle>
          <DialogDescription className="text-xs text-ink-muted">
            Remplissez puis téléchargez
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 px-6 py-4">
          <Champ label="Bailleur — Nom complet" value={bailleur} onChange={setBailleur} />
          <Champ label="Bailleur — Adresse" value={bailleurAdr} onChange={setBailleurAdr} />
          <Champ label="Locataire — Nom complet" value={locataire} onChange={setLocataire} />
          <Champ label="Locataire — Adresse du bien" value={locAdr} onChange={setLocAdr} />
          <Champ label="Loyer nu (€)" value={loyer} onChange={setLoyer} />
          <Champ label="Charges / Provisions (€)" value={charges} onChange={setCharges} />
          <Champ label="Mois concerné" value={mois} onChange={setMois} />
          <Champ label="Date d'échéance" value={echeance} onChange={setEcheance} />
        </div>
        <div className="mx-6 mb-4 rounded-card border border-surface-soft bg-surface p-4 text-xs">
          <p className="text-ink-muted">Aperçu</p>
          <p className="mt-2 font-medium text-ink">Avis d'échéance — {mois}</p>
          <p className="mt-1 text-ink-body">
            {locataire} — échéance le {echeance}
          </p>
        </div>
        <div className="flex gap-2 border-t border-surface-soft px-6 py-4">
          <BtnOutline className="flex-1 justify-center" onClick={onClose}>
            Annuler
          </BtnOutline>
          <BtnNavy
            className="flex-1 justify-center"
            onClick={() => {
              const total = (Number(loyer) || 0) + (Number(charges) || 0);
              void telechargerPdf(`Avis d'echeance ${mois}`, [], {
                titulaire: locataire,
                locataire,
                logement: locAdr,
                adresse: locAdr,
                bailleur,
                date: mois,
                periode: mois,
                loyer: `${loyer} EUR`,
                charges: `${charges} EUR`,
                extra: [
                  `Bailleur : ${bailleur}`,
                  `Locataire : ${locataire}`,
                  `Logement : ${locAdr}`,
                  `Mois : ${mois}`,
                  `Echeance : ${echeance}`,
                  `Loyer : ${loyer} EUR`,
                  `Charges : ${charges} EUR`,
                  `Total : ${total.toFixed(2)} EUR`,
                ],
              }).then(() => {
                onCree?.({
                  id: `gen-a-${Date.now()}`,
                  titre: `Avis d'échéance ${mois} — ${locataire}`,
                  type: "Avis",
                  filtre: "Quittances",
                  logement: locAdr,
                  date: new Date().toLocaleDateString("fr-FR"),
                  taille: "PDF",
                  modifiePar: "Vous",
                  photos: 0,
                  vue: "residents",
                  occupant: "locataires",
                });
                onClose();
              });
            }}
          >
            <Download className="size-3" /> Télécharger
          </BtnNavy>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function FicheInterventionDialog({
  ouvert,
  onClose,
  titre = "Fiche intervention — Plomberie",
  logement = "Appartement Colette",
  date = "27 Jun 2024",
}: {
  ouvert: boolean;
  onClose: () => void;
  titre?: string;
  logement?: string;
  date?: string;
}) {
  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg rounded-card border-line">
        <DialogHeader>
          <DialogTitle className="text-base font-medium text-ink">{titre}</DialogTitle>
          <DialogDescription className="text-xs text-ink-muted">
            {logement} · {date}
          </DialogDescription>
        </DialogHeader>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Type</dt>
            <dd className="text-ink">Fiche intervention</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Logement</dt>
            <dd className="text-ink">{logement}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Date</dt>
            <dd className="text-ink">{date}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Constat</dt>
            <dd className="mt-1 text-ink-body">
              Intervention réalisée. Photos de preuve disponibles dans le dossier.
            </dd>
          </div>
        </dl>
        <div className="mt-4 flex gap-2">
          <BtnNavy
            onClick={() => {
              void telechargerPdf(titre, [], {
                adresse: logement,
                logement,
                date,
                extra: [
                  `Type : Fiche intervention`,
                  `Logement : ${logement}`,
                  `Date : ${date}`,
                  "Constat : intervention réalisée, preuves au dossier.",
                ],
              });
            }}
          >
            Télécharger
          </BtnNavy>
          <BtnOutline onClick={onClose}>Fermer</BtnOutline>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PhotosPreuvesDialog({
  ouvert,
  onClose,
  titre,
}: {
  ouvert: boolean;
  onClose: () => void;
  titre: string;
}) {
  const logement =
    DOCS_MO1.find((d) => d.titre === titre)?.logement ||
    PRESTATIONS_PHOTOS.find((p) => p.titre === titre)?.lieu ||
    titre;
  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl rounded-card border-line">
        <DialogHeader>
          <DialogTitle className="text-base font-medium text-ink">Photos de preuve</DialogTitle>
          <DialogDescription className="text-xs text-ink-muted">{titre}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() =>
                void telechargerPdf(`Photo ${i + 1} — ${titre}`, [], {
                  extra: [`Légende : Photo ${i + 1}`, `Pièce : ${titre}`, `Logement : ${logement}`],
                  adresse: logement,
                  logement,
                  piece: titre,
                  legende: `Photo ${i + 1}`,
                })
              }
              className="flex aspect-square items-center justify-center rounded-card border border-line bg-surface-soft text-xs text-ink-muted hover:bg-surface"
            >
              Photo {i + 1}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-muted">Cliquez une photo pour télécharger la fiche.</p>
      </DialogContent>
    </Dialog>
  );
}

export function FiltreLogementDialog({
  ouvert,
  onClose,
  logements,
  valeur,
  onChange,
}: {
  ouvert: boolean;
  onClose: () => void;
  logements: string[];
  valeur: string;
  onChange: (v: string) => void;
}) {
  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm rounded-card border-line">
        <DialogHeader>
          <DialogTitle className="text-base font-medium text-ink">Filtres</DialogTitle>
          <DialogDescription className="text-xs text-ink-muted">
            Filtrer par logement
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1">
          {["Tous", ...logements].map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => {
                onChange(l);
                onClose();
              }}
              className={`rounded-card px-3 py-2 text-left text-sm ${
                valeur === l ? "bg-surface-soft text-ink" : "text-ink-body"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
