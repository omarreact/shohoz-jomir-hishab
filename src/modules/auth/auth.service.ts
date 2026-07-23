import { UserService } from "./user.service";
import { SessionService } from "./session.service";
import { TokenService } from "./token.service";
import { prisma } from "@/src/modules/database/prisma";
import bcrypt from "bcryptjs";
import { RegisterInput, LoginInput } from "./schemas";

export class AuthService {
  static async register(data: RegisterInput, req: Request) {
    const user = await UserService.registerUser(data);
    const refreshToken = await SessionService.createSession(user.id, req);
    const accessToken = TokenService.generateAccessToken({
      userId: user.id,
      role: user.role,
    });

    return { user, accessToken, refreshToken };
  }

  static async login(data: LoginInput, req: Request) {
    const ipAddress = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const user = await UserService.findByEmail(data.email);

    if (!user) {
      // Don't leak whether user exists
      throw new Error("Invalid credentials");
    }

    if (await UserService.isLockedOut(user.id)) {
      await prisma.loginHistory.create({
        data: { userId: user.id, status: "LOCKED_OUT", ipAddress, userAgent },
      });
      throw new Error(
        "Account is temporarily locked due to too many failed login attempts",
      );
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
      await UserService.handleFailedLogin(user.id);
      await prisma.loginHistory.create({
        data: { userId: user.id, status: "FAILED", ipAddress, userAgent },
      });
      throw new Error("Invalid credentials");
    }

    // Success
    await UserService.resetFailedAttempts(user.id);
    await prisma.loginHistory.create({
      data: { userId: user.id, status: "SUCCESS", ipAddress, userAgent },
    });

    const refreshToken = await SessionService.createSession(user.id, req);
    const accessToken = TokenService.generateAccessToken({
      userId: user.id,
      role: user.role,
    });

    return { user, accessToken, refreshToken };
  }

  static async refresh(refreshToken: string, req: Request) {
    const result = await SessionService.rotateRefreshToken(refreshToken, req);

    // result contains both the new token and the user info
    const accessToken = TokenService.generateAccessToken({
      userId: result.user.id,
      role: result.user.role,
    });

    return { accessToken, refreshToken: result.newRefreshToken };
  }

  static async logout(refreshToken: string) {
    await SessionService.revokeSession(refreshToken);
  }
}
