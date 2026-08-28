import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/src/modules/notification/notification.service";
import { verifyAdminAuth, verifyServerAuth } from "@/src/modules/auth/serverAuth";
import { logger } from "@/src/shared/logger";
import { z } from "zod";

const notificationService = new NotificationService();

const createSchema = z.object({
  userId: z.string().min(1).max(128),
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(2000),
  type: z.enum(["INFO", "WARNING", "SUCCESS", "ERROR"]).optional().default("INFO"),
  link: z.string().url().optional().nullable(),
});

const querySchema = z.object({
  userId: z.string().min(1).max(128).optional(),
  isRead: z.coerce.boolean().optional(),
  type: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

// GET /api/notifications — the authenticated user's notifications only
export async function GET(request: NextRequest) {
  try {
    const user = await verifyServerAuth(request);
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const validatedQuery = querySchema.parse(query);

    if (validatedQuery.userId && validatedQuery.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await notificationService.getUserNotifications({
      ...validatedQuery,
      userId: user.id,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid query parameters", details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ err: message }, "Notifications GET failed");
    const status = message === "Unauthorized" ? 401 : message === "Account locked" || message === "Account disabled" ? 403 : 500;
    return NextResponse.json({ error: status === 500 ? "Failed to fetch notifications" : message }, { status });
  }
}

// POST /api/notifications — server/admin notification creation only
export async function POST(request: NextRequest) {
  try {
    await verifyAdminAuth(request);
    const body = await request.json();
    const validated = createSchema.parse(body);
    const notification = await notificationService.create(validated);
    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ err: message }, "Notifications POST failed");
    const status = message === "Unauthorized" ? 401 : message === "Account locked" || message === "Account disabled" ? 403 : message.startsWith("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: status === 500 ? "Failed to create notification" : message }, { status });
  }
}
