import { useEffect, useRef } from "react";
import { CLE_SITE_TURNSTILE } from "@/components/marque/cle-turnstile";

type Turnstile = {
  render: (
    el: HTMLElement,
    opts: { sitekey: string; callback: (jeton: string) => void; "expired-callback": () => void },
  ) => string;
  remove: (id: string) => void;
};

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function WidgetTurnstile({ onJeton }: { onJeton: (jeton: string | undefined) => void }) {
  const zone = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!CLE_SITE_TURNSTILE || !zone.current) return;
    let id: string | undefined;
    let annule = false;
    const monter = () => {
      const ts = (window as unknown as { turnstile?: Turnstile }).turnstile;
      if (annule || !ts || !zone.current) return;
      id = ts.render(zone.current, {
        sitekey: CLE_SITE_TURNSTILE!,
        callback: (jeton) => onJeton(jeton),
        "expired-callback": () => onJeton(undefined),
      });
    };
    let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = SCRIPT;
      script.async = true;
      document.head.appendChild(script);
    }
    if ((window as unknown as { turnstile?: Turnstile }).turnstile) monter();
    else script.addEventListener("load", monter, { once: true });
    return () => {
      annule = true;
      const ts = (window as unknown as { turnstile?: Turnstile }).turnstile;
      if (id && ts) ts.remove(id);
    };
  }, [onJeton]);
  if (!CLE_SITE_TURNSTILE) return null;
  return <div ref={zone} className="mt-3" />;
}
