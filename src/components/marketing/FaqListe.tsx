import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { QUESTIONS_FAQ } from "@/design/offres";
import { cn } from "@/lib/utils";

export function FaqListe({ idPrefix = "faq" }: { idPrefix?: string }) {
  const [ouvert, setOuvert] = useState(0);

  return (
    <div className="divide-y divide-v1-line border-b border-v1-line">
      {QUESTIONS_FAQ.map((item, index) => {
        const estOuvert = ouvert === index;
        const panelId = `${idPrefix}-reponse-${index}`;
        return (
          <div key={item.question} className="py-5">
            <h3>
              <button
                type="button"
                className="flex w-full items-center gap-5 text-left"
                aria-expanded={estOuvert}
                aria-controls={panelId}
                onClick={() => setOuvert(estOuvert ? -1 : index)}
              >
                <span className="flex-1 text-[15px] text-[#111]">{item.question}</span>
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full",
                    estOuvert ? "bg-v1-brand text-white" : "bg-v1-canvas text-v1-ink",
                  )}
                >
                  {estOuvert ? (
                    <Minus className="size-3.5" aria-hidden />
                  ) : (
                    <Plus className="size-3.5" aria-hidden />
                  )}
                </span>
              </button>
            </h3>
            {estOuvert ? (
              <p id={panelId} className="mt-3 text-[13px] leading-relaxed text-[#111]">
                {item.reponse}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
