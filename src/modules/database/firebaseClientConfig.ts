const REQUIRED_FIREBASE_CLIENT_ENV = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

type FirebaseClientEnv = Record<string, string | undefined>;

export function isProductionDeployment(env: FirebaseClientEnv): boolean {
  return env.VERCEL_ENV === "production" || env.LANDBD_ENV === "production";
}

export function missingFirebaseClientConfig(env: FirebaseClientEnv): string[] {
  return REQUIRED_FIREBASE_CLIENT_ENV.filter((key) => !env[key]?.trim());
}

export function assertProductionFirebaseClientConfig(
  env: FirebaseClientEnv,
): void {
  if (!isProductionDeployment(env)) return;
  const missing = missingFirebaseClientConfig(env);
  if (!missing.length) return;
  throw new Error(
    `[FirebaseClient] Production Firebase client configuration is incomplete: ${missing.join(", ")}`,
  );
}
