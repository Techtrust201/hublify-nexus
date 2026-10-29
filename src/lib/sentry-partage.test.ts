import { describe, expect, it } from "vitest";
import { filtrerEvenementSentry } from "@/lib/sentry-partage";

describe("filtrerEvenementSentry", () => {
  const evenement = { event_id: "evt" };

  it("laisse passer une exception sans statut HTTP", () => {
    expect(filtrerEvenementSentry(evenement, { originalException: new Error("panne") })).toBe(
      evenement,
    );
  });

  it("laisse passer une erreur serveur", () => {
    const erreur = Object.assign(new Error("casse"), { statusCode: 500 });
    expect(filtrerEvenementSentry(evenement, { originalException: erreur })).toBe(evenement);
  });

  it("ignore les réponses client (auth, introuvable)", () => {
    expect(filtrerEvenementSentry(evenement, { originalException: { status: 401 } })).toBeNull();
    expect(
      filtrerEvenementSentry(evenement, { originalException: { statusCode: 404 } }),
    ).toBeNull();
  });
});
