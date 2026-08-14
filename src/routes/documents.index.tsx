import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useHublify } from "@/data/store";

export const Route = createFileRoute("/documents/")({
  head: () => ({
    meta: [{ title: "Documents — Hublify" }],
  }),
  component: PageDocuments,
});

function PageDocuments() {
  const { documents } = useHublify();

  return (
    <AppShell titre="Documents" sousTitre="Contrats, états des lieux et quittances">
      <div className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
        <header className="flex items-center gap-2 border-b border-[#f3f4f6] px-4 py-3 text-sm text-[#1e2939]">
          <FileText className="size-4" />
          Documents
        </header>
        <ul className="divide-y divide-[#f3f4f6]">
          {documents.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="flex size-9 items-center justify-center rounded-[10px] border border-[#e5e7eb] bg-[#f9fafb]">
                <FileText className="size-4 text-[#4a5565]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[#1e2939]">{d.titre}</p>
                <p className="text-xs text-[#99a1af]">
                  {d.type} · {d.bienNom} · {d.date}
                </p>
              </div>
              <button
                type="button"
                className="h-[26px] rounded border border-[#d1d5dc] px-3 text-xs font-medium text-[#4a5565]"
              >
                Télécharger
              </button>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
