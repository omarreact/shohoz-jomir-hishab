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
    const parsed = uuidSchema.safeParse(rawUuid);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid DLRMS verification UUID" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const result = await getFullKhatianByVerificationUuid(parsed.data, request.signal);
    return ok(FullKhatianSchema.parse(result));
  } catch (error) {
    return providerError(error);
  }
}
