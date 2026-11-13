# 02 — Security, Authentication, and Site Access

## Privileged role enforcement

Server-side Admin, Staff, and Super Admin verification remains role-authoritative after Firebase Admin verification.

The obsolete `authenticatedFullAccessEnabled()` helper was removed from server auth. A regression test proves `LANDBD_AUTHENTICATED_FULL_ACCESS=true` cannot promote a basic User to Admin.

The mouza-map download route previously allowed a general full-access flag to unlock Admin-only vector PDF/GeoTIFF export. That path was removed. Admin export now depends on `isAdminRole(user.role)` and remains separately service-entitlement protected.

Proxy behavior was reviewed:
- Admin paths use privileged Firebase Admin verification and route-specific minimum roles.
- The remaining full-access flag in Proxy does not promote ordinary members; it can only relax configurable non-admin page rules for a verified staff role.
- API handlers remain their own authorization boundary.

## Site-access policy

The policy now:
- preserves the last successfully loaded Firestore policy during transient failure;
- fails closed on cold/no-trust policy failure;
- treats missing/invalid maintenance configuration as degraded/fail-safe;
- clears last-known-good state only on explicit cache invalidation.

`LANDBD_PUBLIC_ACCESS` is now explicit opt-in. If absent, it is false and Firestore remains authoritative. `.env.example` documents the normal value as `false`.

## Sensitive data

No secret values were added or exposed. Public DLRMS payload sanitization continues to remove fields matching authorization, cookie, password, secret, token, refresh-token, and access-token patterns.

## Status

DONE and covered by auth/site-access/paid-route tests.
