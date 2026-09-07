import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/src/modules/notification/notification.service";
import { verifyServerAuth } from "@/src/modules/auth/serverAuth";
import { logger } from "@/src/shared/logger";

const notificationService = new NotificationService();

// POST /api/notifications/mark-all-read — mark all notifications for current user
export async function POST(request: NextRequest) {
  try {
    const user = await verifyServerAuth(request);
    const result = await notificationService.markAllAsRead(user.id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ err: message }, "Failed to mark all notifications as read");
    const status =
      message === "Unauthorized" ? 401 :
      message === "Account locked" || message === "Account disabled" ? 403 : 500;
    return NextResponse.json(
      { error: status === 500 ? "Failed to mark all notifications as read" : message },
      { status },
    );
  }
}
