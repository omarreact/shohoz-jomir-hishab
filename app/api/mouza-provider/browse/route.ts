import { checkServiceAccess } from "@/src/lib/service-entitlement";
import { providers } from "@/src/features/land-records/server/provider";
import { MouzaMapBrowseSchema } from "@/src/features/land-records/schemas";
import { ok, providerError } from "@/src/features/land-records/server/http";

export async function GET(request: Request) {
  const denied=await checkServiceAccess(request,"mouza-map");
  if(denied)return denied;
  try {
    const params = new URL(request.url).searchParams;
    const parentId = params.get("parentId") || undefined;
    const path = params.get("path") || "0:/";
    if (parentId && !/^[\w-]+$/.test(parentId)) return Response.json({ error: "Invalid folder id" }, { status: 400 });
    return ok(MouzaMapBrowseSchema.parse(await providers.mouzaMaps.browse({ parentId, path })));
  } catch (error) { return providerError(error); }
}
