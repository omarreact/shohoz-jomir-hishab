import { fetchPublicHalSabek } from "@/src/features/land-records/server/dlrms-public-extras";
import { z } from "zod";

const requestSchema = z.object({
  surveyKey: z.enum(["CS", "RS", "SA", "BS", "DIARA", "PETY", "BRS", "BDS"]),
  divisionBbsCode: z.string().trim().min(1).max(20),
  districtBbsCode: z.string().trim().min(1).max(20),
  upazilaBbsCode: z.string().trim().min(1).max(20),
  jlNumberId: z.number().int().positive(),
  khatianNos: z.array(z.string().trim().min(1).max(120)).min(1).max(12),
});

export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await request.json());

    // A small batch prevents a full-mouza report from opening hundreds of
    // upstream requests at once. The client advances batch-by-batch and shows
    // progress to the user.
    const entries = await Promise.all(
      input.khatianNos.map(async (khatianNo) => {
        try {
          const mappings = await fetchPublicHalSabek({
            surveyKey: input.surveyKey,
            divisionBbsCode: input.divisionBbsCode,
            districtBbsCode: input.districtBbsCode,
            upazilaBbsCode: input.upazilaBbsCode,
            jlNumberId: input.jlNumberId,
            khatianNo,
          });
          return { khatianNo, mappings };
        } catch {
          return { khatianNo, mappings: [], unavailable: true };
        }
      }),
    );

    return Response.json({ entries });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid hal/sabek report request" }, { status: 400 });
    }
    console.error("[mouza-porcha-report] hal/sabek batch failed", error);
    return Response.json({ error: "হাল/সাবেক দাগের তথ্য লোড করা যায়নি।" }, { status: 502 });
  }
}
