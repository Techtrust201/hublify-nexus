import { Download, Eye } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [mois, setMois] = useState("Août 2025");
  const [faitA, setFaitA] = useState("PARIS");
  const total = (Number(loyer) || 0) + (Number(charges) || 0);

  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-[540px] overflow-y-auto rounded-[10px] border-[#e5e7eb] p-0">
        <DialogHeader className="border-b border-[#f3f4f6] px-6 py-4">
          <DialogTitle className="text-base font-medium text-[#1e2939]">
            Générer une quittance
          </DialogTitle>
          <DialogDescription className="text-xs text-[#99a1af]">
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
        <div className="mx-6 mb-4 rounded-[10px] border border-[#f3f4f6] bg-[#f9fafb] p-4">
          <p className="text-xs text-[#99a1af]">Aperçu</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[#99a1af]">Bailleur</p>
              <p className="text-[#1e2939]">{bailleur}</p>
              <p className="text-[#6a7282]">{bailleurAdr}</p>
            </div>
            <div>
              <p className="text-[#99a1af]">Locataire</p>
              <p className="text-[#1e2939]">{locataire}</p>
              <p className="text-[#6a7282]">{locAdr}</p>
            </div>
          </div>
          <p className="mt-3 text-xs font-medium text-[#1e2939]">Quittance de loyer — {mois}</p>
          <div className="mt-2 flex justify-between text-xs text-[#4a5565]">
            <div>
              <p>Loyer nu : {Number(loyer).toFixed(2).replace(".", ",")} €</p>
              <p>Charges : {Number(charges).toFixed(2).replace(".", ",")} €</p>
            </div>
            <p className="font-medium text-[#1e2939]">
              Total : {total.toFixed(2).replace(".", ",")} €
            </p>
          </div>
        </div>
        <div className="flex gap-2 border-t border-[#f3f4f6] px-6 py-4">
          <BtnOutline className="flex-1 justify-center" onClick={onClose}>
            Annuler
          </BtnOutline>
          <BtnOutline className="flex-1 justify-center">
            <Eye className="size-3" /> Aperçu PDF
          </BtnOutline>
          <BtnNavy className="flex-1 justify-center">
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
  const [mois, setMois] = useState("Septembre 2025");
  const [echeance, setEcheance] = useState("05 Sept 2025");

  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-[540px] overflow-y-auto rounded-[10px] border-[#e5e7eb] p-0">
        <DialogHeader className="border-b border-[#f3f4f6] px-6 py-4">
          <DialogTitle className="text-base font-medium text-[#1e2939]">Avis d'échéance</DialogTitle>
          <DialogDescription className="text-xs text-[#99a1af]">
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
        <div className="mx-6 mb-4 rounded-[10px] border border-[#f3f4f6] bg-[#f9fafb] p-4 text-xs">
          <p className="text-[#99a1af]">Aperçu</p>
          <p className="mt-2 font-medium text-[#1e2939]">Avis d'échéance — {mois}</p>
          <p className="mt-1 text-[#4a5565]">
            {locataire} — échéance le {echeance}
          </p>
        </div>
        <div className="flex gap-2 border-t border-[#f3f4f6] px-6 py-4">
          <BtnOutline className="flex-1 justify-center" onClick={onClose}>
            Annuler
          </BtnOutline>
          <BtnNavy className="flex-1 justify-center">
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
      <DialogContent className="max-w-lg rounded-[10px] border-[#e5e7eb]">
        <DialogHeader>
          <DialogTitle className="text-base font-medium text-[#1e2939]">
            Fiche intervention — Plomberie
          </DialogTitle>
          <DialogDescription className="text-xs text-[#99a1af]">
            Appartement Colette · 27 Jun 2024 · Erik Gunsel
          </DialogDescription>
        </DialogHeader>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-[#99a1af]">Type</dt>
            <dd className="text-[#1e2939]">Fiche intervention</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#99a1af]">Logement</dt>
            <dd className="text-[#1e2939]">Appartement Colette</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#99a1af]">Photos</dt>
            <dd className="text-[#1e2939]">3</dd>
          </div>
          <div>
            <dt className="text-[#99a1af]">Constat</dt>
            <dd className="mt-1 text-[#4a5565]">
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
      <DialogContent className="max-w-xl rounded-[10px] border-[#e5e7eb]">
        <DialogHeader>
          <DialogTitle className="text-base font-medium text-[#1e2939]">
            Photos de preuve
          </DialogTitle>
          <DialogDescription className="text-xs text-[#99a1af]">{titre}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex aspect-square items-center justify-center rounded-[10px] border border-[#e5e7eb] bg-[#f3f4f6] text-xs text-[#99a1af]"
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
      <DialogContent className="max-w-sm rounded-[10px] border-[#e5e7eb]">
        <DialogHeader>
          <DialogTitle className="text-base font-medium text-[#1e2939]">Filtres</DialogTitle>
          <DialogDescription className="text-xs text-[#99a1af]">
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
              className={`rounded-[10px] px-3 py-2 text-left text-sm ${
                valeur === l ? "bg-[#f3f4f6] text-[#1e2939]" : "text-[#4a5565]"
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
