import { AuthService } from "@/src/modules/auth/auth.service";
import { UserService } from "@/src/modules/auth/user.service";
import { SessionService } from "@/src/modules/auth/session.service";
import { TokenService } from "@/src/modules/auth/token.service";
import { prisma } from "@/src/modules/database/prisma";
import bcrypt from "bcryptjs";

jest.mock("@/src/modules/auth/user.service");
jest.mock("@/src/modules/auth/session.service");
jest.mock("@/src/modules/auth/token.service");
jest.mock("@/src/modules/database/prisma", () => ({
  prisma: {
    loginHistory: {
      create: jest.fn(),
    },
    session: {
      findUnique: jest.fn(),
    }
  },
}));
jest.mock("bcryptjs");

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should successfully register a user", async () => {
      const mockUser = { id: "1", email: "test@test.com", role: "Basic User", name: "Test" };
      (UserService.registerUser as jest.Mock).mockResolvedValue(mockUser);
      (SessionService.createSession as jest.Mock).mockResolvedValue("refresh-token-123");
      (TokenService.generateAccessToken as jest.Mock).mockReturnValue("access-token-123");

      const result = await AuthService.register({
        email: "test@test.com",
        password: "Password123!",
        name: "Test",
      }, {} as Request);

      expect(result.user).toEqual(mockUser);
      expect(result.accessToken).toBe("access-token-123");
      expect(result.refreshToken).toBe("refresh-token-123");
      expect(UserService.registerUser).toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("should reject invalid email", async () => {
      (UserService.findByEmail as jest.Mock).mockResolvedValue(null);
      
      const req = { headers: new Map() } as unknown as Request;
      // In JS environments Map doesn't perfectly mirror Request headers, but good enough for this mock
      req.headers.get = jest.fn().mockReturnValue(null);

      await expect(AuthService.login({ email: "bad@test.com", password: "pwd" }, req))
        .rejects
        .toThrow("Invalid credentials");
    });

    it("should reject locked out user", async () => {
      const mockUser = { id: "1", failedAttempts: 5 };
      (UserService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (UserService.isLockedOut as jest.Mock).mockReturnValue(true);

      const req = { headers: { get: () => null } } as unknown as Request;

      await expect(AuthService.login({ email: "test@test.com", password: "pwd" }, req))
        .rejects
        .toThrow("Account is temporarily locked");
    });
  });
});
