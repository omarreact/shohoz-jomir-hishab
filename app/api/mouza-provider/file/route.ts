import { idParam, MouzaMapEntrySchema } from "@/src/features/land-records/schemas";
import { providers } from "@/src/features/land-records/server/provider";
import { ok, providerError } from "@/src/features/land-records/server/http";

export async function GET(request: Request) {
  try {
    const id = idParam.parse(new URL(request.url).searchParams.get("fileId"));
    return ok(MouzaMapEntrySchema.parse(await providers.mouzaMaps.file({ fileId: id })));
  } catch (error) { return providerError(error); }
}
