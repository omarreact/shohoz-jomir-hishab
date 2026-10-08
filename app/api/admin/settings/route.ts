import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { collections } from "@/src/modules/database/firebaseAdmin";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";
import { isSuperAdminRole } from "@/src/modules/auth/roles";
import { invalidateSiteAccessPolicyCache } from "@/src/modules/access/server/siteAccessPolicy";
import {
  adminErrorStatus,
  protectAdminMutation,
  recordAdminAudit,
} from "@/src/modules/security/adminSecurity";

const ALLOWED_KEYS = [
  "siteName",
  "contactEmail",
  "contactPhone",
  "facebookUrl",
  "youtubeUrl",
  "maintenanceMode",
  "announcement",
] as const;

const httpUrl = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
      } catch {
        return false;
      }
    },
    "Invalid URL",
  );

const maintenanceSchema = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

const settingsSchema = z
  .object({
    siteName: z.string().trim().min(1).max(100).optional(),
    contactEmail: z.union([z.literal(""), z.string().trim().email().max(254)]).optional(),
    contactPhone: z
      .string()
      .trim()
      .max(40)
      .regex(/^[0-9+()\-\s]*$/, "Invalid phone number")
      .optional(),
    facebookUrl: httpUrl.optional(),
    youtubeUrl: httpUrl.optional(),
    maintenanceMode: maintenanceSchema.optional(),
    announcement: z.string().trim().max(2000).optional(),
  })
  .strict();

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function GET(req: NextRequest) {
  try {
    await verifyAdminAuth(req);
    const settingsSnapshot = await collections.settings
      .where("key", "in", [...ALLOWED_KEYS])
      .get();

    const result: Record<string, string | boolean> = {
      siteName: "LandBD",
      contactEmail: "",
      contactPhone: "",
      facebookUrl: "",
      youtubeUrl: "",
      maintenanceMode: false,
      announcement: "",
    };

    for (const doc of settingsSnapshot.docs) {
      const row = doc.data();
      if (!ALLOWED_KEYS.includes(row.key)) continue;
      result[row.key] =
        row.key === "maintenanceMode" ? row.value === "true" : String(row.value ?? "");
    }

    return json({ settings: result });
  } catch (error: unknown) {
    console.error("Failed to fetch settings:", error);
    const status = adminErrorStatus(error);
    return json(
      { error: status < 500 ? "আপনার অনুমতি নেই।" : "সেটিংস লোড করা যায়নি।" },
      status,
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await protectAdminMutation(req, "settings", {
      max: 20,
      windowSeconds: 60,
      maxBodyBytes: 20_000,
    });
    const actor = await verifyAdminAuth(req);
    const validated = settingsSchema.parse(await req.json());

    if (
      Object.prototype.hasOwnProperty.call(validated, "maintenanceMode") &&
      !isSuperAdminRole(actor.role)
    ) {
      return json(
        { error: "মেইনটেন্যান্স মোড শুধুমাত্র Super Admin পরিবর্তন করতে পারবেন।" },
        403,
      );
    }

    const entries = Object.entries(validated);
    if (!entries.length) {
      return json({ error: "কোনো বৈধ সেটিংস পাঠানো হয়নি।" }, 400);
    }

    const batch = collections.settings.firestore.batch();
    for (const [key, value] of entries) {
      batch.set(
        collections.settings.doc(key),
        {
          key,
          value: String(value),
          updatedAt: new Date().toISOString(),
          updatedBy: actor.email || actor.id,
        },
        { merge: true },
      );
    }
    await batch.commit();
    invalidateSiteAccessPolicyCache();

    await recordAdminAudit(
      req,
      actor,
      "settings.update",
      "siteSettings",
      null,
      { keys: entries.map(([key]) => key).join(",") },
    );

    return json({ success: true, updatedKeys: entries.map(([key]) => key) });
  } catch (error: unknown) {
    console.error("Failed to update settings:", error);
    if (error instanceof z.ZodError) {
      return json(
        { error: "সেটিংসের তথ্য সঠিক নয়।", issues: error.issues },
        400,
      );
    }
    const status = adminErrorStatus(error);
    return json(
      {
        error:
          status < 500 && error instanceof Error
            ? error.message
            : "সেটিংস আপডেট করা যায়নি।",
      },
      status,
    );
  }
}
