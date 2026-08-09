import { prisma } from "@/src/modules/database/prisma";
import bcrypt from "bcryptjs";
import { RegisterInput } from "./schemas";
import { RedisService } from "@/src/modules/redis/redis.service";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export class UserService {
  /**
   * Check if a user account is currently locked out.
   * Returns FALSE if Redis is unavailable (graceful degradation).
   */
  static async isLockedOut(userId: string): Promise<boolean> {
    // Check 1: DB-level suspension (set by admin)
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { lockedUntil: true },
      });
      if (user?.lockedUntil && user.lockedUntil > new Date()) {
        return true;
      }
    } catch {
      // DB error — proceed to Redis check
    }

    try {
      const attempts = await RedisService.get<number>(
        `login_attempts:${userId}`,
      );
      return attempts !== null && attempts >= MAX_FAILED_ATTEMPTS;
    } catch {
      // Redis unavailable — allow login attempt (graceful degradation)
      return false;
    }
  }

  /**
   * Handle a failed login attempt (increment counter, lock if needed).
   * Silently ignores Redis errors so login is not blocked.
   */
  static async handleFailedLogin(userId: string): Promise<void> {
    try {
      const key = `login_attempts:${userId}`;
      const current = (await RedisService.get<number>(key)) || 0;

      if (current < MAX_FAILED_ATTEMPTS) {
        await RedisService.increment(key, LOCKOUT_MINUTES * 60);
      }
    } catch {
      // Redis unavailable — skip attempt tracking (graceful degradation)
    }
  }

  /**
   * Reset failed attempts after successful login.
   * Silently ignores Redis errors.
   */
  static async resetFailedAttempts(userId: string): Promise<void> {
    try {
      await RedisService.delete(`login_attempts:${userId}`);
    } catch {
      // Redis unavailable — skip (graceful degradation)
    }

    // Still update lastLogin in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLogin: new Date(),
      },
    });
  }

  /**
   * Register a new user
   */
  static async registerUser(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
      },
    });

    return user;
  }

  /**
   * Find a user by email
   */
  static async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  /**
   * Find a user by ID
   */
  static async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }
}
