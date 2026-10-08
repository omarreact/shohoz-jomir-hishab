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

/** Prefer the original safe destination, otherwise send staff to their workspace
 * and regular accounts to the public landing page. Never send a nonstaff user
 * into the Admin console just because login succeeded. */
export function resolvePostLoginTarget(
  rawTarget: string | null | undefined,
  role: unknown,
): string {
  const staff = isStaffRole(role);
  const destination = resolveLoginTarget(rawTarget, staff ? "/admin" : "/");
  const pathname = destination.split(/[?#]/, 1)[0];
  if (!staff && (pathname === "/admin" || pathname.startsWith("/admin/"))) {
    return "/403";
  }
  return destination;
}
