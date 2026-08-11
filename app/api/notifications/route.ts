import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/src/modules/notification/notification.service";
import { logger } from "@/lib/logger";
import { z } from "zod";

const notificationService = new NotificationService();

const createSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(2000),
  type: z
    .enum(["INFO", "WARNING", "SUCCESS", "ERROR"])
    .optional()
    .default("INFO"),
  link: z.string().url().optional().nullable(),
});

const querySchema = z.object({
  userId: z.string().uuid(),
  isRead: z.coerce.boolean().optional(),
  type: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

// GET /api/notifications?userId=...&page=1&limit=20
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());

    if (!query.userId) {
      return NextResponse.json(
        { error: "Missing required parameter: userId" },
        { status: 400 },
      );
    }

    const validatedQuery = querySchema.parse(query);
    const result =
      await notificationService.getUserNotifications(validatedQuery);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 },
      );
    }

    logger.error(
      { err: error instanceof Error ? error.message : "Unknown error" },
      "Notifications GET failed",
    );
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createSchema.parse(body);
    const notification = await notificationService.create(validated);

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 },
      );
    }

    logger.error(
      { err: error instanceof Error ? error.message : "Unknown error" },
      "Notifications POST failed",
    );
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 },
    );
  }
}
