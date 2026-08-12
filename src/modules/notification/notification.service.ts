import { collections } from "@/src/modules/database/firebaseAdmin";
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

export class NotificationService {
  /**
   * Create a new notification for a user.
   */
  async create(dto: CreateNotificationDto) {
    try {
      const data = {
        userId: dto.userId,
        title: dto.title,
        message: dto.message,
        type: dto.type || "INFO",
        link: dto.link || null,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      const ref = await collections.notifications.add(data);
      const doc = await ref.get();

      logger.info(
        { userId: dto.userId, notificationId: doc.id, type: dto.type },
        "Notification created",
      );

      return { id: doc.id, ...doc.data() };
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

      let query = collections.notifications.where("userId", "==", userId);

      if (isRead !== undefined) {
        query = query.where("isRead", "==", isRead);
      }

      if (type) {
        query = query.where("type", "==", type);
      }

      // Pagination is limited in Firestore without cursors, but for small limits we can fetch everything or just use simple skip
      // For this simple implementation, we'll order and use offset (note: offset is not optimal for large datasets in Firestore)
      const countSnapshot = await query.count().get();
      const total = countSnapshot.data().count;

      const notificationsSnapshot = await query
        .orderBy("createdAt", "desc")
        .offset(skip)
        .limit(Number(limit))
        .get();

      const notifications = notificationsSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));

      const unreadCountSnapshot = await collections.notifications
        .where("userId", "==", userId)
        .where("isRead", "==", false)
        .count()
        .get();
        
      const unreadCount = unreadCountSnapshot.data().count;

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
      const docRef = collections.notifications.doc(notificationId);
      const doc = await docRef.get();

      if (!doc.exists || doc.data()?.userId !== userId) {
        throw new Error("Notification not found");
      }

      await docRef.update({ isRead: true });
      const updated = await docRef.get();
      return { id: updated.id, ...updated.data() };
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
      const snapshot = await collections.notifications
        .where("userId", "==", userId)
        .where("isRead", "==", false)
        .get();

      if (snapshot.empty) {
        return { count: 0 };
      }

      const batch = collections.notifications.firestore.batch();
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isRead: true });
      });

      await batch.commit();

      return { count: snapshot.size };
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
      const docRef = collections.notifications.doc(notificationId);
      const doc = await docRef.get();

      if (!doc.exists || doc.data()?.userId !== userId) {
        throw new Error("Notification not found");
      }

      await docRef.delete();

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
      const countSnapshot = await collections.notifications
        .where("userId", "==", userId)
        .where("isRead", "==", false)
        .count()
        .get();

      return { count: countSnapshot.data().count };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error({ err: msg, userId }, "Failed to get unread count");
      throw new Error("Failed to get unread count");
    }
  }
}
