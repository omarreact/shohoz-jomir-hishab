/** Canonical LandBD roles (Firestore + custom claims). */
export const ROLES = [
  "Super Admin",
  "Admin",
  "Editor",
  "Basic User",
  "User",
] as const;

export type AppRole = (typeof ROLES)[number];

const ADMIN_ROLES: AppRole[] = ["Super Admin", "Admin"];
const STAFF_ROLES: AppRole[] = ["Super Admin", "Admin", "Editor"];

export function normalizeRole(role: unknown): AppRole {
  if (typeof role !== "string" || !role.trim()) return "User";
  const trimmed = role.trim();
  const hit = ROLES.find((r) => r.toLowerCase() === trimmed.toLowerCase());
  return hit ?? "User";
}

export function isAdminRole(role: unknown): boolean {
  const r = normalizeRole(role);
  return ADMIN_ROLES.includes(r);
}

export function isStaffRole(role: unknown): boolean {
  const r = normalizeRole(role);
  return STAFF_ROLES.includes(r);
}

export function isSuperAdminRole(role: unknown): boolean {
  return normalizeRole(role) === "Super Admin";
}

export function isEditorRole(role: unknown): boolean {
  return normalizeRole(role) === "Editor" || isAdminRole(role);
}

/** Claims written via Admin SDK setCustomUserClaims */
export function claimsForRole(role: unknown): { role: AppRole; admin?: boolean } {
  const r = normalizeRole(role);
  if (r === "Super Admin" || r === "Admin") {
    return { role: r, admin: true };
  }
  return { role: r };
}
