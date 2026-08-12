import { collections } from "@/src/modules/database/firebaseAdmin";
import { logger } from "@/lib/logger";

export interface SystemHealth {
  status: "healthy" | "degraded" | "unhealthy";
  uptime: number;
  database: { connected: boolean; latency: number };
  memory: { used: number; total: number; percentage: number };
  timestamp: string;
}

export interface UserMetrics {
  totalUsers: number;
  verifiedUsers: number;
  activeSessions: number;
  failedLogins24h: number;
  newUsersToday: number;
}

export class AdminService {
  /**
   * Get system health status.
   */
  async getSystemHealth(): Promise<SystemHealth> {
    let dbConnected = false;
    let dbLatency = 0;

    try {
      const dbStart = Date.now();
      await collections.users.limit(1).get();
      dbLatency = Date.now() - dbStart;
      dbConnected = true;
    } catch (error: unknown) {
      logger.error(
        { err: error instanceof Error ? error.message : "Unknown error" },
        "Database health check failed",
      );
      dbConnected = false;
    }

    const memoryUsage = process.memoryUsage();
    const totalMemory = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const usedMemory = Math.round(memoryUsage.heapUsed / 1024 / 1024);

    return {
      status: dbConnected ? "healthy" : "unhealthy",
      uptime: Math.floor(process.uptime()),
      database: { connected: dbConnected, latency: dbLatency },
      memory: {
        used: usedMemory,
        total: totalMemory,
        percentage:
          totalMemory > 0 ? Math.round((usedMemory / totalMemory) * 100) : 0,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get user metrics.
   */
  async getUserMetrics(): Promise<UserMetrics> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalUsersRes,
      verifiedUsersRes,
      activeSessionsRes,
      failedLogins24hRes,
      newUsersTodayRes,
    ] = await Promise.all([
      collections.users.count().get(),
      collections.users.where("isVerified", "==", true).count().get(),
      collections.sessions.where("isRevoked", "==", false).where("expiresAt", ">=", new Date()).count().get(),
      collections.loginHistory.where("status", "==", "FAILED").where("createdAt", ">=", twentyFourHoursAgo).count().get(),
      collections.users.where("createdAt", ">=", todayStart).count().get(),
    ]);

    return {
      totalUsers: totalUsersRes.data().count,
      verifiedUsers: verifiedUsersRes.data().count,
      activeSessions: activeSessionsRes.data().count,
      failedLogins24h: failedLogins24hRes.data().count,
      newUsersToday: newUsersTodayRes.data().count,
    };
  }

  /**
   * Get login history with pagination.
   */
  async getLoginHistory(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const totalRes = await collections.loginHistory.count().get();
    const total = totalRes.data().count;

    const loginsSnapshot = await collections.loginHistory
      .orderBy("createdAt", "desc")
      .offset(skip)
      .limit(Number(limit))
      .get();

    const logins = [];
    for (const doc of loginsSnapshot.docs) {
      const data = doc.data();
      let user = null;
      if (data.userId) {
        const userDoc = await collections.users.doc(data.userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          user = {
            id: userDoc.id,
            email: userData?.email,
            name: userData?.name,
          };
        }
      }
      logins.push({
        id: doc.id,
        ...data,
        user,
      });
    }

    return {
      data: logins,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * Get all users with pagination and basic info.
   */
  async getUsers(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const totalRes = await collections.users.count().get();
    const total = totalRes.data().count;

    const usersSnapshot = await collections.users
      .orderBy("createdAt", "desc")
      .offset(skip)
      .limit(Number(limit))
      .get();

    const users = usersSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        name: data.name,
        role: data.role,
        isVerified: data.isVerified,
        lastLogin: data.lastLogin,
        failedAttempts: data.failedAttempts,
        lockedUntil: data.lockedUntil,
        createdAt: data.createdAt,
      };
    });

    return {
      data: users,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * Update user role.
   */
  async updateUserRole(userId: string, role: string) {
    const validRoles = ["Basic User", "Editor", "Admin", "Super Admin"];

    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(", ")}`);
    }

    const userDoc = await collections.users.doc(userId).get();

    if (!userDoc.exists) {
      throw new Error("User not found");
    }

    await collections.users.doc(userId).update({ role });
    
    const updatedDoc = await collections.users.doc(userId).get();
    const updatedData = updatedDoc.data()!;

    return {
      id: updatedDoc.id,
      email: updatedData.email,
      name: updatedData.name,
      role: updatedData.role,
    };
  }

  /**
   * Suspend a user by locking their account.
   */
  async suspendUser(userId: string, durationHours: number = 24) {
    const userDoc = await collections.users.doc(userId).get();

    if (!userDoc.exists) {
      throw new Error("User not found");
    }

    const lockedUntil = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    await collections.users.doc(userId).update({ lockedUntil, failedAttempts: 5 });

    const updatedDoc = await collections.users.doc(userId).get();
    const updatedData = updatedDoc.data()!;

    return {
      id: updatedDoc.id,
      email: updatedData.email,
      name: updatedData.name,
      lockedUntil: updatedData.lockedUntil,
    };
  }

  /**
   * Unsuspend a user.
   */
  async unsuspendUser(userId: string) {
    const userDoc = await collections.users.doc(userId).get();

    if (!userDoc.exists) {
      throw new Error("User not found");
    }

    await collections.users.doc(userId).update({ lockedUntil: null, failedAttempts: 0 });

    const updatedDoc = await collections.users.doc(userId).get();
    const updatedData = updatedDoc.data()!;

    return {
      id: updatedDoc.id,
      email: updatedData.email,
      name: updatedData.name,
    };
  }
}
