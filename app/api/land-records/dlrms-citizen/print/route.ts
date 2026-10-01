import { NextRequest } from "next/server";
import { z } from "zod";
import { verifyServerAuth } from "@/src/modules/auth/serverAuth";
import {
  DlrmsCitizenError,
  fetchDlrmsCitizenPrintKhatian,
} from "@/src/features/land-records/server/dlrms-citizen-provider";
import { DlrmsCitizenPrintSchema } from "@/src/features/land-records/dlrms-citizen";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  token: z.string().trim().min(20).max(4096),
  applicationId: z.coerce.number().int().positive(),
});

function headers() {
  return {
    "Cache-Control": "no-store, private, max-age=0",
    Pragma: "no-cache",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  };
}

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function POST(request: NextRequest) {
  try {
    if (!sameOrigin(request)) {
      return Response.json({ error: "Invalid request origin" }, { status: 403, headers: headers() });
    }

    await verifyServerAuth(request);

    const body = BodySchema.safeParse(await request.json().catch(() => null));
    if (!body.success) {
      return Response.json(
        { error: "DLRMS token এবং Application ID সঠিকভাবে দিন।" },
        { status: 400, headers: headers() },
      );
    }

    const print = await fetchDlrmsCitizenPrintKhatian(
      body.data.token,
      body.data.applicationId,
      request.signal,
    );

    return Response.json(DlrmsCitizenPrintSchema.parse(print), {
      status: 200,
      headers: headers(),
    });
  } catch (error) {
    if (error instanceof DlrmsCitizenError) {
      return Response.json({ error: error.message }, { status: error.status, headers: headers() });
    }

    const message = error instanceof Error ? error.message : "";
    const status = /unauthorized|disabled|locked/i.test(message) ? 401 : 502;
    return Response.json(
      {
        error:
          status === 401
            ? "এই সেবাটি ব্যবহার করতে LandBD-তে লগইন করুন।"
            : "DLRMS citizen খতিয়ানের পূর্ণ কপি লোড করা যায়নি।",
      },
      { status, headers: headers() },
    );
  }
}
