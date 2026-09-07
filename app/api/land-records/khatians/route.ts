import { KhatianPageSchema, idParam, khatianSearchText, pageSize, positivePage } from "@/src/features/land-records/schemas";
import { providers } from "@/src/features/land-records/server/provider";
import { ok, providerError } from "@/src/features/land-records/server/http";
import { z } from "zod";

const surveyKeySchema = z.enum(["CS", "RS", "SA", "BS", "DIARA", "PETY", "BRS", "BDS"]);

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const surveyKey = surveyKeySchema.parse(params.get("surveyKey"));
    const jlNumberId = Number(idParam.parse(params.get("jlNumberId")));
    if (!Number.isSafeInteger(jlNumberId)) {
      return Response.json({ error: "Invalid JL number" }, { status: 400 });
    }

    const page = positivePage.parse(params.get("page") ?? "1");
    const size = pageSize.parse(params.get("pageSize") ?? "20");
    const khatianNo = khatianSearchText.parse(params.get("khatianNo") || undefined);
    const owner = khatianSearchText.parse(params.get("owner") || undefined);
    const dagNumber = khatianSearchText.parse(params.get("dagNumber") || undefined);

    if (!khatianNo && !owner && !dagNumber) {
      return Response.json(
        {
          error:
            "নির্দিষ্ট খতিয়ান নম্বর, দাগ নম্বর অথবা মালিকের নাম দিন। পুরো মৌজার রেকর্ড bulk আকারে তালিকাভুক্ত করা হয় না।",
        },
        { status: 400 },
      );
    }

    const data = await providers.landRecords.listKhatians({
      surveyKey,
      jlNumberId,
      page,
      pageSize: size,
      khatianNo,
      owner,
      dagNumber,
    });

    return ok(KhatianPageSchema.parse(data));
  } catch (error) {
    return providerError(error);
  }
}
