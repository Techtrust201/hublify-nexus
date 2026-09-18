import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { DocMo1 } from "@/data/documents-mo1";
import { marquerDocRecent } from "@/lib/docs-recents";
import { urlApercuFichier } from "@/lib/feedback";

export function contexteDoc(d: Pick<DocMo1, "titre" | "type" | "logement" | "date">) {
  return {
    logement: d.logement,
    adresse: d.logement,
    date: d.date,
    extra: [`Type : ${d.type}`, `Logement : ${d.logement}`, `Date : ${d.date}`],
  };
}

export function ApercuDocumentDialog({
  doc,
  onFermer,
}: {
  doc: DocMo1 | null;
  onFermer: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!doc) {
      setUrl(null);
      return;
    }
    marquerDocRecent(doc.id);
    let ignore = false;
    let cree: string | null = null;
    void urlApercuFichier(doc.fichier ?? { nom: doc.titre }, contexteDoc(doc)).then((u) => {
      if (ignore) {
        if (u) URL.revokeObjectURL(u);
        return;
      }
      cree = u;
      setUrl(u);
    });
    return () => {
      ignore = true;
      if (cree) URL.revokeObjectURL(cree);
    };
  }, [doc]);

  return (
    <Dialog open={Boolean(doc)} onOpenChange={(o) => !o && onFermer()}>
      <DialogContent className="max-h-[92dvh] w-[calc(100%-1rem)] max-w-4xl">
        <DialogTitle className="pr-8">{doc?.titre ?? "Aperçu"}</DialogTitle>
        <DialogDescription className="sr-only">
          Visualisation du document avant téléchargement.
        </DialogDescription>
        {url ? (
          <iframe
            title={doc?.titre ?? "Aperçu"}
            src={url}
            className="mt-3 h-[min(70vh,calc(100dvh-10rem))] w-full rounded-card border border-line bg-white"
          />
        ) : (
          <p className="mt-3 text-sm text-ink-muted">Préparation de l'aperçu…</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
