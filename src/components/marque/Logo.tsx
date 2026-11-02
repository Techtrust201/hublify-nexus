import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/**
 * Wordmark du frame Navigation 163:8879 : « H » bleu #002fa7, « Ü » #9e2f1e, reste bleu.
 * Le filet du Ü est dans le mot, pas une image.
 */
export function Logo({ className, vers = "/" }: { className?: string; vers?: "/" | "/connexion" }) {
  return (
    <Link
      to={vers}
      className={cn(
        "inline-flex items-baseline font-display text-[1.75rem] font-bold leading-none tracking-tight text-v1-brand",
        className,
      )}
    >
      H
      <span className="-mx-[0.06em] text-[1.28em] font-semibold leading-[0.8] text-v1-mark">Ü</span>
      blify
    </Link>
  );
}
