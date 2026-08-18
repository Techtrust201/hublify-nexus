import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Booléen persisté pour la session (accordéons Messages / Loyers / Événements). */
export function useSessionBool(cle: string, defaut: boolean) {
  const [valeur, setValeur] = useState(() => {
    if (typeof sessionStorage === "undefined") return defaut;
    const brut = sessionStorage.getItem(cle);
    if (brut === null) return defaut;
    return brut === "1";
  });
  const set = (next: boolean | ((prev: boolean) => boolean)) => {
    setValeur((prev) => {
      const resolu = typeof next === "function" ? next(prev) : next;
      try {
        sessionStorage.setItem(cle, resolu ? "1" : "0");
      } catch {
        /* sessionStorage indisponible (SSR, mode privé) */
      }
      return resolu;
    });
  };
  return [valeur, set] as const;
}
