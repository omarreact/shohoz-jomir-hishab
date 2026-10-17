import { isStaffRole } from "@/src/modules/auth/roles";

const DEFAULT_LOGIN_TARGET = "/";

function isSafeLocalTarget(value: string): boolean {
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  if (value.includes("\\") || value.includes("\0")) return false;

  const pathname = value.split(/[?#]/, 1)[0] || "/";
  if (pathname === "/login" || pathname.startsWith("/login/")) return false;

  return true;
}

/**
 * Resolve the post-login destination without allowing external/open redirects.
 * Query/hash are preserved for valid same-origin paths.
 */
export function resolveLoginTarget(
  rawTarget: string | null | undefined,
  fallback = DEFAULT_LOGIN_TARGET,
): string {
  const safeFallback = isSafeLocalTarget(fallback) ? fallback : DEFAULT_LOGIN_TARGET;
  const target = rawTarget?.trim();

  if (!target || !isSafeLocalTarget(target)) return safeFallback;
  return target;
}

/**
 * Build a login URL that returns the user to the page they were trying to use.
 */
export function buildLoginHref(target: string | null | undefined): string {
  const safeTarget = resolveLoginTarget(target, "/");
  return `/login?from=${encodeURIComponent(safeTarget)}`;
}

/** Staff reach the control plane; ordinary Firebase members return to their
 * intended safe page (or the public homepage), never a staff/system route. */
export function resolvePostLoginTarget(
  rawTarget: string | null | undefined,
  role: unknown,
): string {
  if (isStaffRole(role)) return "/admin";

  const target = resolveLoginTarget(rawTarget, DEFAULT_LOGIN_TARGET);
  const pathname = target.split(/[?#]/, 1)[0] || "/";
  const forbidden = ["/admin", "/api", "/403", "/maintenance", "/security-locked"];
  if (forbidden.some(prefix => pathname === prefix || pathname.startsWith(prefix + "/"))) {
    return DEFAULT_LOGIN_TARGET;
  }
  return target;
}
