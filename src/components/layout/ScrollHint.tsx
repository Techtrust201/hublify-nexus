import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Scroll horizontal contenu + dégradé d'indication sur petit écran. */
export function ScrollHint({
  children,
  className,
  snap,
}: {
  children: ReactNode;
  className?: string;
  snap?: boolean;
}) {
  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "overflow-x-auto overscroll-x-contain",
          snap && "snap-x snap-mandatory",
        )}
      >
        {children}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent lg:hidden"
      />
    </div>
  );
}
