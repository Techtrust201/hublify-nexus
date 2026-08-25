import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState, type ComponentProps } from "react";

export const ChampMotDePasse = forwardRef<HTMLInputElement, ComponentProps<"input">>(
  function ChampMotDePasse({ className, ...props }, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <div className="relative">
        <input
          ref={ref}
          {...props}
          type={visible ? "text" : "password"}
          className={`${className ?? "h-11 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"} pr-12`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-muted hover:text-ink"
        >
          {visible ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
        </button>
      </div>
    );
  },
);
