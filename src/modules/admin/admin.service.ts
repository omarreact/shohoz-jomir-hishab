import { PrismaClient } from "@prisma/client";
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

const prisma = new PrismaClient();

export class AdminService {
  /**
   * Get system health status.
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const start = Date.now();
    let dbConnected = false;
    let dbLatency = 0;

    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
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
      totalUsers,
      verifiedUsers,
      activeSessions,
      failedLogins24h,
      newUsersToday,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.session.count({
        where: { isRevoked: false, expiresAt: { gte: new Date() } },
      }),
      prisma.loginHistory.count({
        where: { status: "FAILED", createdAt: { gte: twentyFourHoursAgo } },
      }),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    ]);

    return {
      totalUsers,
      verifiedUsers,
      activeSessions,
      failedLogins24h,
      newUsersToday,
    };
  }

  /**
   * Get login history with pagination.
   */
  async getLoginHistory(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [total, logins] = await Promise.all([
      prisma.loginHistory.count(),
      prisma.loginHistory.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      }),
    ]);

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

    const [total, users] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isVerified: true,
          lastLogin: true,
          failedAttempts: true,
          lockedUntil: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
    ]);

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

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new Error("User not found");
    }

    return await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });
  }

  /**
   * Suspend a user by locking their account.
   */
  async suspendUser(userId: string, durationHours: number = 24) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new Error("User not found");
    }

    const lockedUntil = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    return await prisma.user.update({
      where: { id: userId },
      data: { lockedUntil, failedAttempts: 5 },
      select: { id: true, email: true, name: true, lockedUntil: true },
    });
  }

  /**
   * Unsuspend a user.
   */
  async unsuspendUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new Error("User not found");
    }

    return await prisma.user.update({
      where: { id: userId },
      data: { lockedUntil: null, failedAttempts: 0 },
      select: { id: true, email: true, name: true },
    });
  }
}
