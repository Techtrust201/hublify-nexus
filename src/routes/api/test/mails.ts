import { createFileRoute } from "@tanstack/react-router";
import { mailsPour } from "@/lib/mail";

function autorise() {
  return process.env["CI"] === "true" || process.env["NODE_ENV"] !== "production";
}

export const Route = createFileRoute("/api/test/mails")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        if (!autorise()) {
          return new Response("Not found", { status: 404 });
        }
        const url = new URL(request.url);
        const destinataire = (url.searchParams.get("destinataire") ?? "").trim().toLowerCase();
        if (!destinataire.includes("@")) {
          return Response.json({ mails: [] });
        }
        const mails = await mailsPour(destinataire);
        return Response.json({ mails });
      },
    },
  },
});
