import { DivisionSchema } from "@/src/features/land-records/schemas";
import { providers } from "@/src/features/land-records/server/provider";
import { ok, providerError } from "@/src/features/land-records/server/http";

export async function GET() {
  try { return ok(DivisionSchema.array().parse(await providers.landRecords.listDivisions())); }
  catch (error) { return providerError(error); }
}
