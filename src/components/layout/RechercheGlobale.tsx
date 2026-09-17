import { Search } from "lucide-react";
import { useMemo } from "react";
import { useSession } from "@/data/session";
import { cn } from "@/lib/utils";

type Resultat = { id: string; label: string; detail: string; to: string };

export function RechercheGlobale({
  valeur,
  onChange,
  placeholder = "Rechercher un propriétaire ou un appartement...",
}: {
  valeur: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const session = useSession();
  const q = valeur.trim().toLowerCase();

  const resultats = useMemo(() => {
    if (!q) return [] as Resultat[];
    const liste: Resultat[] = [];

    for (const b of session.biens) {
      const adresse = b.adresse ?? "";
      const proprio = b.proprietaire ?? "";
      if (b.nom.toLowerCase().includes(q) || proprio.toLowerCase().includes(q)) {
        liste.push({
          id: `bien-${b.id}`,
          label: b.nom,
          detail: proprio ? `${proprio} · ${adresse || "Patrimoine"}` : adresse || "Patrimoine",
          to: `/patrimoines?logement=${encodeURIComponent(b.id)}`,
        });
      }
    }

    for (const i of session.immeubles) {
      if (i.proprietaire.toLowerCase().includes(q)) {
        liste.push({
          id: `imm-${i.id}`,
          label: i.proprietaire,
          detail: `Propriétaire · ${i.nom}`,
          to: `/patrimoines?immeuble=${encodeURIComponent(i.id)}`,
        });
      }
    }

    return liste.slice(0, 12);
  }, [q, session.biens, session.immeubles]);

  return (
    <div className="relative w-full max-w-[448px]">
      <label className="relative flex h-11 w-full items-center gap-2 rounded-card border border-line bg-white px-3">
        <Search className="size-3.5 shrink-0 text-ink-muted" />
        <input
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-full w-full bg-transparent text-base text-ink outline-none placeholder:text-ink-muted md:text-sm"
        />
      </label>
      {q.length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-card border border-line bg-white shadow-md">
          {resultats.length === 0 ? (
            <p className="px-3 py-2 text-sm text-ink-subtle">Aucun résultat pour « {valeur} ».</p>
          ) : (
            <ul>
              {resultats.map((r) => (
                <li key={r.id}>
                  <a
                    href={r.to}
                    onClick={() => onChange("")}
                    className={cn("block px-3 py-2 text-sm text-ink hover:bg-surface")}
                  >
                    <span className="block font-medium">{r.label}</span>
                    <span className="block text-xs text-ink-muted">{r.detail}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
