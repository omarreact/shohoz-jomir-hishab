import {
  DATA_MONITOR_SERVICES,
  VERIFIED_RAJUK_SERVICE_IDS,
} from "./api-registry";

describe("Data Monitor runtime registry", () => {
  test("exposes LandBD proxy routes for every RAJUK service", () => {
    const rajukServices = DATA_MONITOR_SERVICES.filter(
      (service) => service.id !== "elevation",
    );

    expect(rajukServices).toHaveLength(10);
    for (const service of rajukServices) {
      expect(service.endpoint).toMatch(/^\/api\/rajuk\//);
      expect(service.endpoint).not.toMatch(/Hosted\//i);
      expect(service.endpoint).not.toMatch(/masterplan\.rajuk\.gov\.bd/i);
    }
  });

  test("keeps the six raster layers on the canonical tile proxy contract", () => {
    const endpoints = Object.fromEntries(
      DATA_MONITOR_SERVICES.map((service) => [service.id, service.endpoint]),
    );

    expect(endpoints["dap-landuse"]).toBe("/api/rajuk/tile/dap/{z}/{y}/{x}");
    expect(endpoints["rs-mauza-tiles"]).toBe("/api/rajuk/tile/rs/{z}/{y}/{x}");
    expect(endpoints["ms-mauza-tiles"]).toBe("/api/rajuk/tile/ms/{z}/{y}/{x}");
    expect(endpoints.flood).toBe("/api/rajuk/tile/flood/{z}/{y}/{x}");
    expect(endpoints["overlay-boundary"]).toBe("/api/rajuk/tile/boundary/{z}/{y}/{x}");
    expect(endpoints.transport).toBe("/api/rajuk/tile/transport/{z}/{y}/{x}");
  });

  test("tracks only RAJUK services in the verified RAJUK id list", () => {
    expect(VERIFIED_RAJUK_SERVICE_IDS).not.toContain("elevation");
    expect(VERIFIED_RAJUK_SERVICE_IDS).toHaveLength(10);
  });
});
