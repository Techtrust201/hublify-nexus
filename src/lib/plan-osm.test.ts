import { describe, expect, it } from "vitest";
import { pointOsm, urlIntegrerOsm } from "@/lib/plan-osm";

describe("plan OpenStreetMap", () => {
  it("refuse un point hors limites", () => {
    expect(pointOsm("45.7", "4.75")).toEqual({ lat: 45.7, lon: 4.75 });
    expect(pointOsm("nord", "4")).toBeNull();
    expect(pointOsm(120, 4)).toBeNull();
  });

  it("construit une iframe gratuite, sans clé", () => {
    const url = urlIntegrerOsm({ lat: 45.702942, lon: 4.75238 });
    expect(url.startsWith("https://www.openstreetmap.org/export/embed.html?")).toBe(true);
    expect(url).toContain("layer=mapnik");
    expect(url).toContain("marker=45.702942%2C4.752380");
    expect(url).not.toContain("api_key");
    expect(url).not.toContain("token");
  });
});
