import "reflect-metadata";
import { container } from "tsyringe";
import { RajukTokenManager } from "@/lib/rajuk/manager";
import { CacheProvider, TokenProvider } from "@/lib/rajuk/types";
import { getCacheProvider } from "@/lib/rajuk/cache";
import { getTokenProvider } from "@/lib/rajuk/provider";
import { LockManager } from "@/lib/rajuk/lock";

// Register dependencies
container.register<CacheProvider>("CacheProvider", {
  useFactory: () => getCacheProvider(),
});

container.register<TokenProvider>("TokenProvider", {
  useFactory: () => getTokenProvider(),
});

container.registerSingleton<LockManager>("LockManager", LockManager);
container.registerSingleton<RajukTokenManager>("RajukTokenManager", RajukTokenManager);

export { container };
