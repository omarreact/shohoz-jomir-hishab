import { UpazilaSchema, bbsCodeParam } from "@/src/features/land-records/schemas";
import { providers } from "@/src/features/land-records/server/provider";
import { ok, providerError } from "@/src/features/land-records/server/http";

export async function GET(request: Request) {
  try {
    const value = new URL(request.url).searchParams.get("districtBbsCode");
    const district = value ? bbsCodeParam.parse(value) : undefined;
    return ok(UpazilaSchema.array().parse(await providers.landRecords.listUpazilas(district)));
  } catch (error) { return providerError(error); }
}
