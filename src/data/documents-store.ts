import type { DocMo1 } from "@/data/documents-mo1";
import { poserCollection, useSession } from "@/data/session";

export function ajouterDocument(doc: DocMo1) {
  poserCollection("documents", (liste) => [doc, ...liste.filter((d) => d.id !== doc.id)]);
}

export function retirerDocuments(ids: string[]) {
  if (ids.length === 0) return;
  poserCollection("documents", (liste) => liste.filter((d) => !ids.includes(d.id)));
}

export function useDocuments() {
  return useSession().documents;
}
