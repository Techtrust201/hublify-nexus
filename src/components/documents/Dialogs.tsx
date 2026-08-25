import { Download, Eye } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { telechargerBase64, toastErreur, toastInfo } from "@/lib/feedback";
import { genererAvisPdf, genererQuittancePdf } from "@/lib/documents.functions";
import { BtnNavy, BtnOutline, Champ } from "./ui";

export function GenerateQuittanceDialog({
  ouvert,
  onClose,
}: {
  ouvert: boolean;
  onClose: () => void;
}) {
  const [bailleur, setBailleur] = useState("M. PROPRIÉTAIRE Exemple");
  const [bailleurAdr, setBailleurAdr] = useState("10 rue Exemple, 75001 PARIS");
  const [locataire, setLocataire] = useState("M. LOCATAIRE Exemple");
  const [locAdr, setLocAdr] = useState("01 rue du Bien, 75001 PARIS");
  const [loyer, setLoyer] = useState("500");
  const [charges, setCharges] = useState("50");
  const [mois, setMois] = useState("Août 2026");
  const [faitA, setFaitA] = useState("PARIS");
  const total = (Number(loyer) || 0) + (Number(charges) || 0);

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
            <p className="font-medium text-ink">
              Total : {total.toFixed(2).replace(".", ",")} €
            </p>
          </div>
        </div>
        <div className="flex gap-2 border-t border-surface-soft px-6 py-4">
          <BtnOutline className="flex-1 justify-center" onClick={onClose}>
            Annuler
          </BtnOutline>
          <BtnOutline
            className="flex-1 justify-center"
            onClick={() => toastInfo("Aperçu PDF (démo) — utilisez Télécharger.")}
          >
            <Eye className="size-3" /> Aperçu PDF
          </BtnOutline>
          <BtnNavy
            className="flex-1 justify-center"
            onClick={() => {
              void (async () => {
                try {
                  const doc = await genererQuittancePdf({
                    data: {
                      bailleur,
                      bailleurAdr,
                      locataire,
                      locAdr,
                      loyer,
                      charges,
                      mois,
                      faitA,
                    },
                  });
                  telechargerBase64(doc.nom, doc.mime, doc.base64);
                  onClose();
                } catch {
                  toastErreur("Impossible de générer la quittance.");
                }
              })();
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
}: {
  ouvert: boolean;
  onClose: () => void;
}) {
  const [bailleur, setBailleur] = useState("M. PROPRIÉTAIRE Exemple");
  const [bailleurAdr, setBailleurAdr] = useState("10 rue Exemple, 75001 PARIS");
  const [locataire, setLocataire] = useState("M. LOCATAIRE Exemple");
  const [locAdr, setLocAdr] = useState("01 rue du Bien, 75001 PARIS");
  const [loyer, setLoyer] = useState("500");
  const [charges, setCharges] = useState("50");
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
              void (async () => {
                try {
                  const doc = await genererAvisPdf({
                    data: {
                      bailleur,
                      locataire,
                      mois,
                      echeance,
                      loyer,
                      charges,
                    },
                  });
                  telechargerBase64(doc.nom, doc.mime, doc.base64);
                  onClose();
                } catch {
                  toastErreur("Impossible de générer l'avis.");
                }
              })();
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
}: {
  ouvert: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg rounded-card border-line">
        <DialogHeader>
          <DialogTitle className="text-base font-medium text-ink">
            Fiche intervention — Plomberie
          </DialogTitle>
          <DialogDescription className="text-xs text-ink-muted">
            Appartement Colette · 27 Jun 2024 · Erik Gunsel
          </DialogDescription>
        </DialogHeader>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Type</dt>
            <dd className="text-ink">Fiche intervention</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Logement</dt>
            <dd className="text-ink">Appartement Colette</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Photos</dt>
            <dd className="text-ink">3</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Constat</dt>
            <dd className="mt-1 text-ink-body">
              Fuite sous évier cuisine. Joint remplacé, essai d'étanchéité OK.
            </dd>
          </div>
        </dl>
        <BtnNavy onClick={onClose}>Fermer</BtnNavy>
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
  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl rounded-card border-line">
        <DialogHeader>
          <DialogTitle className="text-base font-medium text-ink">
            Photos de preuve
          </DialogTitle>
          <DialogDescription className="text-xs text-ink-muted">{titre}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex aspect-square items-center justify-center rounded-card border border-line bg-surface-soft text-xs text-ink-muted"
            >
              Photo {i + 1}
            </div>
          ))}
        </div>
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
