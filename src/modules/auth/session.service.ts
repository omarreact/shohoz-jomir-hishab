import { prisma } from "@/src/modules/database/prisma";
import { TokenService } from "./token.service";

export class SessionService {
  /**
   * Create a new session with a refresh token
   */
  static async createSession(userId: string, req: Request): Promise<string> {
    const refreshToken = TokenService.generateRefreshToken();
    const familyId = TokenService.generateRefreshToken(); // Unique family for token rotation

    const ipAddress = req.headers.get("x-forwarded-for") || "unknown";
    const userAgentStr = req.headers.get("user-agent") || "";

    // In a real app we would parse User Agent to get device details.
    // For simplicity, we just use a hash or the raw string as device identifier.
    let deviceFingerprint = "unknown-device";
    if (userAgentStr) {
      deviceFingerprint = Buffer.from(userAgentStr).toString("base64").substring(0, 32);
    }

    // Find existing device by fingerprint + userId, then upsert properly
    const existingDevice = await prisma.device.findFirst({
      where: { deviceId: deviceFingerprint, userId },
    });

    let device;
    if (existingDevice) {
      device = await prisma.device.update({
        where: { id: existingDevice.id },
        data: { lastActive: new Date(), ipAddress, userAgent: userAgentStr },
      });
    } else {
      device = await prisma.device.create({
        data: {
          userId,
          deviceId: deviceFingerprint,
          userAgent: userAgentStr,
          ipAddress,
        },
      });
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.session.create({
      data: {
        userId,
        refreshToken,
        familyId,
        expiresAt,
        deviceId: device.id,
      },
    });

    return refreshToken;
  }

  /**
   * Validate and rotate refresh token.
   * Returns the new refresh token along with user info.
   */
  static async rotateRefreshToken(
    oldRefreshToken: string,
    req: Request,
  ): Promise<{ newRefreshToken: string; user: { id: string; role: string } }> {
    const session = await prisma.session.findUnique({
      where: { refreshToken: oldRefreshToken },
      include: { user: { select: { id: true, role: true } } },
    });

    if (!session) {
      throw new Error("Invalid refresh token");
    }

    if (session.isRevoked) {
      // Security breach detected: someone tried to use a revoked token.
      // We must revoke the entire family of tokens.
      await prisma.session.updateMany({
        where: { familyId: session.familyId },
        data: { isRevoked: true },
      });
      throw new Error("Token reuse detected. All sessions revoked.");
    }

    if (new Date() > session.expiresAt) {
      throw new Error("Refresh token expired");
    }

    // Revoke the old token
    await prisma.session.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });

    // Issue a new token in the same family
    const newRefreshToken = TokenService.generateRefreshToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const ipAddress = req.headers.get("x-forwarded-for") || "unknown";

    // Update device last active
    if (session.deviceId) {
      await prisma.device.update({
        where: { id: session.deviceId },
        data: { lastActive: new Date(), ipAddress },
      });
    }

    await prisma.session.create({
      data: {
        userId: session.userId,
        refreshToken: newRefreshToken,
        familyId: session.familyId, // Same family!
        expiresAt,
        deviceId: session.deviceId,
      },
    });

    return {
      newRefreshToken,
      user: { id: session.user.id, role: session.user.role },
    };
  }

  /**
   * Revoke a specific session
   */
  static async revokeSession(refreshToken: string): Promise<void> {
    await prisma.session.update({
      where: { refreshToken },
      data: { isRevoked: true },
    });
  }

  /**
   * Logout all devices
   */
  static async revokeAllSessions(userId: string): Promise<void> {
    await prisma.session.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }
}
