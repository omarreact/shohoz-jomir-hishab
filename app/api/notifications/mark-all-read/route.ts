import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/src/modules/notification/notification.service";
import "reflect-metadata";
import { container } from "tsyringe";
import { logger } from "@/lib/logger";

const notificationService = container.resolve(NotificationService);

// POST /api/notifications/mark-all-read - Mark all notifications as read
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required field: userId" },
        { status: 400 },
      );
    }

    const result = await notificationService.markAllAsRead(userId);

    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error({ err: msg }, "Failed to mark all notifications as read");

    return NextResponse.json(
      { error: "Failed to mark all notifications as read" },
      { status: 500 },
    );
  }
}
