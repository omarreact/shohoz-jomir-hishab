import { FullKhatianSchema } from "@/src/features/land-records/full-khatian";
import { getFullKhatianByVerificationUuid } from "@/src/features/land-records/server/full-khatian-verification";
import { ok, providerError } from "@/src/features/land-records/server/http";
import { isSuperAdminRole } from "@/src/modules/auth/roles";
import { verifyServerAuth } from "@/src/modules/auth/serverAuth";
import { NextRequest } from "next/server";
import { z } from "zod";

const uuidSchema = z.string().uuid();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ uuid: string }> },
) {
  try {
    const actor = await verifyServerAuth(request);
    if (!isSuperAdminRole(actor.role)) {
      return Response.json(
        { error: "Super Admin access required" },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }

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
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json(
        { error: "Authentication required" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return Response.json(
        { error: "Super Admin access required" },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }

    return providerError(error);
  }
}
