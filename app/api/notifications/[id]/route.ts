import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/src/modules/notification/notification.service";
import { verifyServerAuth } from "@/src/modules/auth/serverAuth";
import { logger } from "@/src/shared/logger";

const notificationService = new NotificationService();

function authStatus(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  return {
    message,
    status:
      message === "Unauthorized" ? 401 :
      message === "Account locked" || message === "Account disabled" ? 403 : 500,
  };
}

// PATCH /api/notifications/[id] — mark the authenticated user's notification as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const user = await verifyServerAuth(request);
    const notification = await notificationService.markAsRead(id, user.id);
    return NextResponse.json(notification);
  } catch (error) {
    const { message, status } = authStatus(error);
    logger.error({ err: message, notificationId: id }, "Failed to mark notification as read");

    if (message === "Notification not found") {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }
    return NextResponse.json({ error: status === 500 ? "Failed to mark notification as read" : message }, { status });
  }
}

// DELETE /api/notifications/[id] — delete the authenticated user's notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const user = await verifyServerAuth(request);
    const result = await notificationService.delete(id, user.id);
    return NextResponse.json(result);
  } catch (error) {
    const { message, status } = authStatus(error);
    logger.error({ err: message, notificationId: id }, "Failed to delete notification");

    if (message === "Notification not found") {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }
    return NextResponse.json({ error: status === 500 ? "Failed to delete notification" : message }, { status });
  }
}
