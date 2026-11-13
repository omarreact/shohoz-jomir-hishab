import { checkServiceAccess } from "@/src/lib/service-entitlement";
import { getDistricts, getMouzas, getUpazilas } from "@/src/services/rajuk/rajukQuery.service";

export const dynamic = "force-dynamic";

type SurveyKind = "rs" | "ms";

function surveyKind(value: string | null): SurveyKind {
  return value === "ms" ? "ms" : "rs";
}

export async function GET(request: Request) {
  const denied = await checkServiceAccess(request, "mouza-map");
  if (denied) return denied;

  try {
    const params = new URL(request.url).searchParams;
    const action = params.get("action");
    const kind = surveyKind(params.get("kind"));

    if (action === "districts") {
      return Response.json(
        { features: await getDistricts(kind) },
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
