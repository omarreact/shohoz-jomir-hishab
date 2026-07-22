import { injectable } from "tsyringe";
import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type?: "INFO" | "WARNING" | "SUCCESS" | "ERROR";
  link?: string | null;
}

export interface NotificationFilter {
  userId: string;
  isRead?: boolean;
  type?: string;
  page?: number;
  limit?: number;
}

export interface NotificationWhereInput {
  userId: string;
  isRead?: boolean;
  type?: string;
}

const prisma = new PrismaClient();

@injectable()
export class NotificationService {
  /**
   * Create a new notification for a user.
   */
  async create(dto: CreateNotificationDto) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: dto.userId,
          title: dto.title,
          message: dto.message,
          type: dto.type || "INFO",
          link: dto.link || null,
        },
      });

      logger.info(
        { userId: dto.userId, notificationId: notification.id, type: dto.type },
        "Notification created",
      );

      return notification;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error(
        { err: msg, userId: dto.userId },
        "Failed to create notification",
      );
      throw new Error("Failed to create notification");
    }
  }

  /**
   * Get notifications for a user with pagination and filtering.
   */
  async getUserNotifications(filter: NotificationFilter) {
    try {
      const { userId, isRead, type, page = 1, limit = 20 } = filter;
      const skip = (page - 1) * limit;

      const where: NotificationWhereInput = { userId };

      if (isRead !== undefined) {
        where.isRead = isRead;
      }

      if (type) {
        where.type = type;
      }

      const [total, notifications] = await Promise.all([
        prisma.notification.count({ where }),
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: Number(limit),
        }),
      ]);

      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false },
      });

      return {
        data: notifications,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
          unreadCount,
        },
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error(
        { err: msg, userId: filter.userId },
        "Failed to fetch notifications",
      );
      throw new Error("Failed to fetch notifications");
    }
  }

  /**
   * Mark a single notification as read.
   */
  async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId },
      });

      if (!notification) {
        throw new Error("Notification not found");
      }

      return await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error(
        { err: msg, notificationId },
        "Failed to mark notification as read",
      );
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(userId: string) {
    try {
      const result = await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      return { count: result.count };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error(
        { err: msg, userId },
        "Failed to mark all notifications as read",
      );
      throw new Error("Failed to mark all notifications as read");
    }
  }

  /**
   * Delete a notification.
   */
  async delete(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId },
      });

      if (!notification) {
        throw new Error("Notification not found");
      }

      await prisma.notification.delete({
        where: { id: notificationId },
      });

      return { success: true };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error(
        { err: msg, notificationId },
        "Failed to delete notification",
      );
      throw error;
    }
  }

  /**
   * Get unread notification count for a user.
   */
  async getUnreadCount(userId: string) {
    try {
      const count = await prisma.notification.count({
        where: { userId, isRead: false },
      });

      return { count };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error({ err: msg, userId }, "Failed to get unread count");
      throw new Error("Failed to get unread count");
    }
  }
}
