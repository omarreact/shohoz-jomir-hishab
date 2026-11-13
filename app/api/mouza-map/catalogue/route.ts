import { checkServiceAccess } from "@/src/lib/service-entitlement";
import { providers } from "@/src/features/land-records/server/provider";
import { getDistricts, getMouzas, getUpazilas } from "@/src/services/rajuk/rajukQuery.service";

export const dynamic = "force-dynamic";

type SurveyKind = "rs" | "ms";

function surveyKind(value: string | null): SurveyKind {
  return value === "ms" ? "ms" : "rs";
}

function isDhakaDivision(name: string, nameEn: string): boolean {
  const value = `${name} ${nameEn}`.toLocaleLowerCase("bn-BD");
  return value.includes("ঢাকা") || value.includes("dhaka");
}

export async function GET(request: Request) {
  const denied = await checkServiceAccess(request, "mouza-map");
  if (denied) return denied;

  try {
    const params = new URL(request.url).searchParams;
    const action = params.get("action");
    const kind = surveyKind(params.get("kind"));

    if (action === "divisions") {
      const rows = await providers.landRecords.listDivisions(request.signal);
      return Response.json(
        {
          features: rows.map((row) => ({
            code: row.BBS_CODE,
            name: row.NAME,
            nameEn: row.NAME_EN,
            supported: isDhakaDivision(row.NAME, row.NAME_EN),
          })),
          coverageNote: "Current generated GIS map coverage is RAJUK/Dhaka only. Other divisions remain visible so coverage is explicit rather than fabricated.",
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    if (action === "districts") {
      const divisionBbsCode = params.get("divisionBbsCode")?.trim();
      if (divisionBbsCode) {
        const rows = await providers.landRecords.listDivisions(request.signal);
        const division = rows.find((row) => row.BBS_CODE === divisionBbsCode);
        if (!division) return Response.json({ error: "Unknown division" }, { status: 400 });
        if (!isDhakaDivision(division.NAME, division.NAME_EN)) {
          return Response.json(
            { features: [], supported: false, coverageNote: "এই বিভাগে এখনো authorized generated Mouza GIS coverage যুক্ত হয়নি।" },
            { headers: { "Cache-Control": "private, no-store" } },
          );
        }
      }
      return Response.json(
        { features: await getDistricts(kind), supported: true },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    if (action === "upazilas") {
      const districtGuid = params.get("d_guid")?.trim();
      if (!districtGuid || !/^[\w-]+$/.test(districtGuid)) {
        return Response.json({ error: "Valid d_guid is required" }, { status: 400 });
      }
      return Response.json(
        { features: await getUpazilas(districtGuid, kind) },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    if (action === "mouzas") {
      const upazilaGuid = params.get("t_guid")?.trim();
      if (!upazilaGuid || !/^[\w-]+$/.test(upazilaGuid)) {
        return Response.json({ error: "Valid t_guid is required" }, { status: 400 });
      }
      return Response.json(
        { features: await getMouzas(upazilaGuid, kind) },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    return Response.json({ error: "Unknown catalogue action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mouza catalogue request failed";
    console.error("[LandBD][mouza-map-catalogue] request failed", { error });
    return Response.json(
      { error: message },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
