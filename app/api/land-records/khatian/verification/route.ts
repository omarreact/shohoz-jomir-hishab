import { createHash, randomUUID } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { collections, isFirebaseAdminReady } from "@/src/modules/database/firebaseAdmin";
import { normalizeReportText } from "@/src/features/land-records/reports/mouza-porcha-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  recordId: z.number().int().nonnegative(),
  khatianEntryId: z.number().int().nonnegative().nullable(),
  khatianNo: z.string().trim().min(1).max(120),
  survey: z.string().trim().min(1).max(160),
  district: z.string().trim().min(1).max(160),
  upazila: z.string().trim().min(1).max(160),
  mouza: z.string().trim().min(1).max(220),
  jlNumber: z.string().trim().max(80),
  owners: z.array(z.string().trim().min(1).max(240)).max(500),
  dags: z.array(z.string().trim().min(1).max(120)).max(1000),
  totalLand: z.string().trim().max(120),
});

export async function POST(request: Request) {
  if (!isFirebaseAdminReady()) {
    return Response.json(
      { error: "LandBD verification service is unavailable." },
      { status: 503 },
    );
  }

  try {
    const input = requestSchema.parse(await request.json());
    const generatedAt = new Date().toISOString();
    const reportId = `LANDBD-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;

    const normalized = {
      recordId: input.recordId,
      khatianEntryId: input.khatianEntryId,
      khatianNo: normalizeReportText(input.khatianNo),
      survey: normalizeReportText(input.survey),
      district: normalizeReportText(input.district),
      upazila: normalizeReportText(input.upazila),
      mouza: normalizeReportText(input.mouza),
      jlNumber: normalizeReportText(input.jlNumber),
      owners: input.owners.map(normalizeReportText),
      dags: input.dags.map(normalizeReportText),
      totalLand: normalizeReportText(input.totalLand),
    };

    const payloadHash = createHash("sha256")
      .update(JSON.stringify(normalized))
      .digest("hex");

    await collections.reportVerifications.doc(reportId).create({
      reportId,
      documentType: "KHATIAN_VIEW",
      generatedAt,
      createdAt: FieldValue.serverTimestamp(),
      ...normalized,
      payloadHash,
      source: "DLRMS_PUBLIC_RECORD",
      governmentCertified: false,
    });

    return Response.json({
      reportId,
      generatedAt,
      verificationUrl: `/verify/report/${encodeURIComponent(reportId)}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid khatian verification payload." }, { status: 400 });
    }

    console.error("[dlrms-khatian] verification registration failed", error);
    return Response.json(
      { error: "Khatian verification record could not be stored." },
      { status: 500 },
    );
  }
}
