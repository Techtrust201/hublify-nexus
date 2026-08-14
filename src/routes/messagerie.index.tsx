import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useHublify } from "@/data/store";
import type { CanalMessage } from "@/data/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/messagerie/")({
  head: () => ({
    meta: [{ title: "Messagerie — Hublify" }],
  }),
  component: PageMessagerie,
});

function PageMessagerie() {
  const { messages } = useHublify();
  const [canal, setCanal] = useState<CanalMessage>("occupants");
  const [selection, setSelection] = useState(messages[0]?.id);
  const liste = messages.filter((m) => m.canal === canal);
  const actif = messages.find((m) => m.id === selection) ?? liste[0];

  return (
    <AppShell titre="Messagerie" sousTitre="Occupants, prestataires et équipe">
      <div className="grid min-h-[520px] overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white lg:grid-cols-[320px_1fr]">
        <aside className="border-b border-[#e5e7eb] lg:border-b-0 lg:border-r">
          <div className="flex gap-2 border-b border-[#f3f4f6] p-3">
            {(["occupants", "prestataires", "team"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCanal(c)}
                className={cn(
                  "h-[26px] rounded border px-3 text-xs font-medium",
                  canal === c
                    ? "border-[#1e2939] text-[#1e2939]"
                    : "border-[#d1d5dc] text-[#4a5565]",
                )}
              >
                {c === "occupants" ? "Occupants" : c === "prestataires" ? "Prestataires" : "Team"}
              </button>
            ))}
          </div>
          <ul>
            {liste.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setSelection(m.id)}
                  className={cn(
                    "flex w-full gap-3 border-b border-[#f3f4f6] px-4 py-3 text-left",
                    actif?.id === m.id && "bg-[#f9fafb]",
                  )}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e5e7eb] text-xs text-[#4a5565]">
                    {m.initiales}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm text-[#1e2939]">{m.auteur}</span>
                    <span className="block truncate text-xs text-[#6a7282]">{m.texte}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <section className="flex flex-col">
          {actif ? (
            <>
              <header className="flex items-center gap-3 border-b border-[#f3f4f6] px-4 py-3">
                <MessageSquare className="size-4 text-[#4a5565]" />
                <div>
                  <p className="text-sm text-[#1e2939]">{actif.auteur}</p>
                  <p className="text-xs text-[#99a1af]">{actif.bienNom ?? "Conversation équipe"}</p>
                </div>
              </header>
              <div className="flex-1 p-4">
                <div className="max-w-xl rounded-[10px] border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
                  <p className="text-sm text-[#1e2939]">{actif.texte}</p>
                  <p className="mt-2 text-xs text-[#99a1af]">{actif.ilYa}</p>
                </div>
              </div>
              <form
                className="border-t border-[#f3f4f6] p-3"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  className="h-10 w-full rounded-[10px] border border-[#e5e7eb] px-3 text-sm outline-none placeholder:text-[#99a1af]"
                  placeholder="Écrire un message…"
                />
              </form>
            </>
          ) : (
            <p className="p-6 text-sm text-[#6a7282]">Aucun message.</p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
