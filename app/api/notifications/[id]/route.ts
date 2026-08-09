import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/src/modules/notification/notification.service";
import { container } from "tsyringe";
import { logger } from "@/lib/logger";

const notificationService = container.resolve(NotificationService);

// PATCH /api/notifications/[id]?userId=...  - Mark a notification as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required parameter: userId" },
        { status: 400 },
      );
    }

    const notification = await notificationService.markAsRead(id, userId);

    return NextResponse.json(notification);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error(
      { err: msg, notificationId: id },
      "Failed to mark notification as read",
    );

    if (msg === "Notification not found") {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 },
    );
  }
}

// DELETE /api/notifications/[id]?userId=...  - Delete a notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required parameter: userId" },
        { status: 400 },
      );
    }

    const result = await notificationService.delete(id, userId);

    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error(
      { err: msg, notificationId: id },
      "Failed to delete notification",
    );

    if (msg === "Notification not found") {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 },
    );
  }
}
