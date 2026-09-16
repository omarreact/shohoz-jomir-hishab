import { randomUUID } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { collections, isFirebaseAdminReady } from "@/src/modules/database/firebaseAdmin";
import { normalizeReportText } from "@/src/features/land-records/reports/mouza-porcha-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  district: z.string().trim().min(1).max(160),
  upazila: z.string().trim().min(1).max(160),
  survey: z.string().trim().min(1).max(120),
  mouza: z.string().trim().min(1).max(220),
  jlNumber: z.string().trim().min(1).max(80),
  totalKhatians: z.number().int().nonnegative().max(100000),
  expectedKhatians: z.number().int().nonnegative().max(100000).nullable(),
  halSabekRequested: z.number().int().nonnegative().max(100000),
  halSabekMapped: z.number().int().nonnegative().max(100000),
  khatianGapCount: z.number().int().nonnegative().max(100000),
  payloadHash: z.string().regex(/^[a-f0-9]{64}$/i),
});

export async function POST(request: Request) {
  if (!isFirebaseAdminReady()) {
    return Response.json(
      { error: "রিপোর্ট যাচাই সেবা বর্তমানে প্রস্তুত নয়। PDF তৈরি করা যাবে, তবে QR যাচাই থাকবে না।" },
      { status: 503 },
    );
  }

  try {
    const input = requestSchema.parse(await request.json());
    const reportId = `LANDBD-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
    const generatedAt = new Date().toISOString();

    await collections.reportVerifications.doc(reportId).create({
      reportId,
      documentType: "INFORMATION_REPORT",
      generatedAt,
      createdAt: FieldValue.serverTimestamp(),
      district: normalizeReportText(input.district),
      upazila: normalizeReportText(input.upazila),
      survey: normalizeReportText(input.survey),
      mouza: normalizeReportText(input.mouza),
      jlNumber: normalizeReportText(input.jlNumber),
      totalKhatians: input.totalKhatians,
      expectedKhatians: input.expectedKhatians,
      halSabekRequested: input.halSabekRequested,
      halSabekMapped: input.halSabekMapped,
      khatianGapCount: input.khatianGapCount,
      payloadHash: input.payloadHash.toLowerCase(),
      source: "DLRMS_PUBLIC_RECORDS",
      governmentCertified: false,
    });

    return Response.json({
      reportId,
      generatedAt,
      verificationUrl: `/verify/report/${encodeURIComponent(reportId)}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "রিপোর্ট যাচাই তথ্য সঠিক নয়।" }, { status: 400 });
    }
    console.error("[mouza-porcha-report] verification registration failed", error);
    return Response.json(
      { error: "রিপোর্ট যাচাই তথ্য সংরক্ষণ করা যায়নি।" },
      { status: 500 },
    );
  }
}
