import { mouzaExportQuerySchema } from "./mouzaExport.schema";

describe("mouzaExportQuerySchema", () => {
  it("accepts a normal mouza geotiff request", () => {
    const r = mouzaExportQuerySchema.safeParse({
      mouza: "তেজগাঁও",
      format: "geotiff",
      layers: "rs",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.format).toBe("geotiff");
      expect(r.data.maxDim).toBe(6144);
    }
  });

  it("rejects short mouza names", () => {
    const r = mouzaExportQuerySchema.safeParse({ mouza: "a" });
    expect(r.success).toBe(false);
  });

  it("rejects HTML injection characters in mouza", () => {
    const r = mouzaExportQuerySchema.safeParse({ mouza: "<script>x</script>" });
    expect(r.success).toBe(false);
  });

  it("rejects arbitrary format values", () => {
    const r = mouzaExportQuerySchema.safeParse({ mouza: "Test", format: "jpeg" });
    expect(r.success).toBe(false);
  });
});
