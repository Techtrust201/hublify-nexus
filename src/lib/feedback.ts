import { toast } from "sonner";

export function toastOk(message: string) {
  toast.success(message);
}

export function toastInfo(message: string) {
  toast.message(message);
}

export function toastErreur(message: string) {
  toast.error(message);
}

export function telechargerBase64(nom: string, mime: string, base64: string) {
  const binaire = atob(base64);
  const octets = new Uint8Array(binaire.length);
  for (let i = 0; i < binaire.length; i += 1) octets[i] = binaire.charCodeAt(i);
  const blob = new Blob([octets], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast.success(`Téléchargement : ${nom}`);
}

export function telechargerDemo(nomFichier: string, contenu?: string) {
  const nom = nomFichier.includes(".") ? nomFichier : `${nomFichier}.txt`;
  const blob = new Blob(
    [contenu ?? `Hublify — ${nom}\n\nDocument de démonstration.\nGénéré depuis la maquette MO1.\n`],
    { type: "text/plain;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast.success(`Téléchargement : ${nom}`);
}

export function choisirFichier(onChoisi: (nom: string) => void) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.txt";
  input.onchange = () => {
    const fichier = input.files?.[0];
    if (fichier) onChoisi(fichier.name);
  };
  input.click();
}
