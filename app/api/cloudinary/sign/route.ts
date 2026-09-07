import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";

const ALLOWED_SIGNING_KEYS = new Set([
  "timestamp",
  "folder",
  "upload_preset",
  "public_id",
  "tags",
  "context",
  "resource_type",
]);

export async function POST(req: NextRequest) {
  try {
    await verifyAdminAuth(req);

    if (!process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { success: false, error: "Cloudinary is not configured on the server" },
        { status: 500 },
      );
    }

    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
    }

    const paramsToSign = (body as { paramsToSign?: unknown }).paramsToSign;
    if (!paramsToSign || typeof paramsToSign !== "object" || Array.isArray(paramsToSign)) {
      return NextResponse.json({ success: false, error: "paramsToSign is required" }, { status: 400 });
    }

    const safeParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(paramsToSign)) {
      if (!ALLOWED_SIGNING_KEYS.has(key)) continue;
      if (typeof value !== "string" && typeof value !== "number") continue;
      const stringValue = String(value);
      if (stringValue.length > 2048) continue;
      safeParams[key] = stringValue;
    }

    if (safeParams.resource_type && safeParams.resource_type !== "image") {
      return NextResponse.json({ success: false, error: "Only image uploads are allowed" }, { status: 400 });
    }

    if (safeParams.folder && !safeParams.folder.startsWith("landbd/")) {
      return NextResponse.json({ success: false, error: "Invalid Cloudinary folder" }, { status: 400 });
    }

    const signature = cloudinary.utils.api_sign_request(
      safeParams,
      process.env.CLOUDINARY_API_SECRET,
    );

    return NextResponse.json({ signature });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate signature";
    const status = message === "Unauthorized" ? 401 : message.startsWith("Forbidden") ? 403 : 500;
    return NextResponse.json({ success: false, error: status === 500 ? "Failed to generate signature" : message }, { status });
  }
}
