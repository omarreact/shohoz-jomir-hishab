import { RedisService } from "@/src/modules/redis/redis.service";
import { redis } from "@/src/modules/redis/redis.client";

jest.mock("@/src/modules/redis/redis.client", () => {
  return {
    redis: {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      incr: jest.fn(),
      expire: jest.fn(),
    },
  };
});

describe("RedisService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("get", () => {
    it("should parse valid JSON", async () => {
      (redis.get as jest.Mock).mockResolvedValue('{"key":"value"}');
      const result = await RedisService.get("testKey");
      expect(result).toEqual({ key: "value" });
    });

    it("should return string if not JSON", async () => {
      (redis.get as jest.Mock).mockResolvedValue('just a string');
      const result = await RedisService.get("testKey");
      expect(result).toBe('just a string');
    });

    it("should return null if key does not exist", async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      const result = await RedisService.get("missing");
      expect(result).toBeNull();
    });
  });

  describe("set", () => {
    it("should set object as JSON string", async () => {
      await RedisService.set("testKey", { foo: "bar" });
      expect(redis.set).toHaveBeenCalledWith("testKey", '{"foo":"bar"}');
    });

    it("should set string as string", async () => {
      await RedisService.set("testKey", "bare string");
      expect(redis.set).toHaveBeenCalledWith("testKey", "bare string");
    });

    it("should set with TTL", async () => {
      await RedisService.set("testKey", "val", 60);
      expect(redis.set).toHaveBeenCalledWith("testKey", "val", "EX", 60);
    });
  });

  describe("increment", () => {
    it("should increment and set expire on first call", async () => {
      (redis.incr as jest.Mock).mockResolvedValue(1);
      const val = await RedisService.increment("rate:ip", 300);
      expect(val).toBe(1);
      expect(redis.incr).toHaveBeenCalledWith("rate:ip");
      expect(redis.expire).toHaveBeenCalledWith("rate:ip", 300);
    });

    it("should not set expire on subsequent calls", async () => {
      (redis.incr as jest.Mock).mockResolvedValue(2);
      const val = await RedisService.increment("rate:ip", 300);
      expect(val).toBe(2);
      expect(redis.incr).toHaveBeenCalledWith("rate:ip");
      expect(redis.expire).not.toHaveBeenCalled();
    });
  });
});
