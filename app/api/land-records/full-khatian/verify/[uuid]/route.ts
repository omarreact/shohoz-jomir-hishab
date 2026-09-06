import { FullKhatianSchema } from "@/src/features/land-records/full-khatian";
import { getFullKhatianByVerificationUuid } from "@/src/features/land-records/server/full-khatian-verification";
import { ok, providerError } from "@/src/features/land-records/server/http";
import { z } from "zod";

const uuidSchema = z.string().uuid();

export async function GET(
  request: Request,
  context: { params: Promise<{ uuid: string }> },
) {
  try {
    const { uuid: rawUuid } = await context.params;
    const uuid = uuidSchema.parse(rawUuid);
    const result = await getFullKhatianByVerificationUuid(uuid, request.signal);
    return ok(FullKhatianSchema.parse(result));
  } catch (error) {
    return providerError(error);
  }
}
