// La configuration Vite (React, Tailwind, TanStack Start, Nitro, alias @) est fournie
// par le preset partagé — ne pas réajouter ces plugins manuellement.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Sans preset explicite, le preset partagé vise Cloudflare Workers, dont le
  // runtime n'ouvre pas les connexions Postgres dont l'application a besoin.
  nitro: { preset: "vercel" },
});
