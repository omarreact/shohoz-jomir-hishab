import { DistrictSchema, bbsCodeParam } from "@/src/features/land-records/schemas";
import { providers } from "@/src/features/land-records/server/provider";
import { ok, providerError } from "@/src/features/land-records/server/http";

export async function GET(request: Request) {
  try {
    const value = new URL(request.url).searchParams.get("divisionBbsCode");
    const division = value ? bbsCodeParam.parse(value) : undefined;
    return ok(DistrictSchema.array().parse(await providers.landRecords.listDistricts(division)));
  } catch (error) { return providerError(error); }
}
