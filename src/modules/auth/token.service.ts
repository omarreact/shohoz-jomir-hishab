import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "default_super_secret_jwt_key_override_this_in_prod";
if (!process.env.JWT_SECRET) {
  console.warn("⚠️  JWT_SECRET not set — using insecure fallback. Set JWT_SECRET in production!");
}
const JWT_EXPIRES_IN = "15m";

export class TokenService {
  /**
   * Generates a short-lived JWT Access Token
   */
  static generateAccessToken(payload: { userId: string; role: string }): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  /**
   * Verifies the Access Token
   */
  static verifyAccessToken(token: string): { userId: string; role: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generates a secure, opaque Refresh Token
   */
  static generateRefreshToken(): string {
    return crypto.randomUUID() + "-" + Date.now().toString(36) + "-" + crypto.randomUUID();
  }
}
