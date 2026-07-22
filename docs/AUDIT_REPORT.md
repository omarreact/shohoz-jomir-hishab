# Production Audit Report — LandBD

## Architecture Score: 5.5/10

## Security Score: 4/10

## Performance Score: 5/10

## Maintainability Score: 4.5/10

## Scalability Score: 3/10

---

## 🔴 CRITICAL ISSUES

### 1. ArcGIS Token Exposed to Frontend

**Files**: `app/api/rajuk-token/route.ts:42-56`, `lib/hooks/useRajukToken.ts`, `src/features/map/hooks/useRajukToken.ts`
**Severity**: CRITICAL
**Risk**: `GET /api/rajuk-token` returns the raw ArcGIS token to any client. This token is then used directly on the frontend for tile URL construction. Attackers can extract this token and make unauthorized ArcGIS API calls.
**Fix**: Remove token endpoint. Proxy all tile requests server-side using the existing `/api/tiles/route.ts`. Inject token server-side only.

### 2. SSRF Vulnerability in Rajuk Proxy

**Files**: `app/api/rajuk/proxy/route.ts:27-29`
**Severity**: CRITICAL
**Risk**: The proxy accepts an arbitrary `target` URL parameter. An attacker could proxy requests to internal services (localhost, AWS metadata endpoint, etc.).
**Fix**: Validate and whitelist allowed target domains.

### 3. SSL Verification Disabled

**Files**: `app/api/tiles/route.ts:7`
**Severity**: HIGH
**Risk**: `process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"` disables SSL certificate verification for all outgoing connections.
**Fix**: Remove this line. Fix the underlying certificate issue instead.

### 4. Two Duplicate `useRajukToken` Hooks

**Files**: `lib/hooks/useRajukToken.ts`, `src/features/map/hooks/useRajukToken.ts`
**Severity**: HIGH
**Risk**: Both hooks do the exact same thing but live in different locations. Both expose token to client. Maintenance nightmare.
**Fix**: Remove `lib/hooks/useRajukToken.ts` (older copy). Fix `src/features/map/hooks/useRajukToken.ts` to use server-side proxy instead of raw token.

### 5. Two Duplicate `MapFitter` Components

**Files**: Inline in `components/DapMiniMapContent.tsx`, `src/features/map/components/MapFitter.tsx`
**Severity**: HIGH
**Risk**: Same logic duplicated. My recent refactor extracted one, but the original inline one remains.
**Fix**: Remove inline `MapFitter` from `DapMiniMapContent.tsx` and import from new location.

### 6. Two Duplicate `RajukTileLayers` Components

**Files**: Inline tile layers in `components/DapMiniMapContent.tsx`, `src/features/map/components/RajukTileLayers.tsx`
**Severity**: HIGH
**Risk**: Both define the same Rajuk tile URLs and layer controls.
**Fix**: My recent refactor extracted one, but the inline layers remain.

### 7. Multiple PrismaClient Instances

**Files**: `src/modules/search/search.service.ts:5`, `src/modules/notification/notification.service.ts:25`, `src/modules/admin/admin.service.ts:19`
**Severity**: HIGH
**Risk**: Each service creates its own `new PrismaClient()`. In serverless/Vercel environments, this creates connection storms and memory leaks.
**Fix**: Use the shared instance from `src/modules/database/prisma.ts` across all services.

### 8. SQLite in Production

**Files**: `prisma/schema.prisma:2`
**Severity**: HIGH
**Risk**: SQLite is used as the database provider. It doesn't support concurrent writes, has no connection pooling, no full-text search, and will fail under load.
**Fix**: Migrate to PostgreSQL (matching the Prisma schema's PostgreSQL features).

---

## 🔴 HIGH PRIORITY ISSUES

### 9. No CSRF Protection

**Severity**: HIGH
**Risk**: All POST/PUT/DELETE endpoints lack CSRF tokens. An attacker can trick authenticated users into performing actions.
**Fix**: Implement CSRF token validation on mutating endpoints.

### 10. No Rate Limiting

**Severity**: HIGH
**Risk**: API endpoints have no rate limiting. Attackers can brute-force login, scrape data, or DoS the service.
**Fix**: Implement rate limiting in middleware using Redis.

### 11. Missing Security Headers

**Severity**: HIGH
**Risk**: No CSP, HSTS, X-Frame-Options, X-Content-Type-Options headers.
**Fix**: Add security headers middleware.

### 12. Auth Uses Static Methods

**Files**: `src/modules/auth/*.ts`
**Severity**: HIGH
**Risk**: All auth services use static methods. Can't be mocked in tests, violates DI principles. The rest of the codebase uses DI with tsyringe, but auth doesn't.
**Fix**: Convert to injectable classes consistent with the rest of the architecture.

### 13. Missing Request Timeouts

**Files**: `app/api/tiles/route.ts`, `lib/rajuk/proxy.ts`, `src/modules/unified/core/UnifiedGateway.ts`
**Severity**: HIGH
**Risk**: External API calls have no timeout. If Rajuk API hangs, the serverless function will timeout after the default 10s, wasting resources.
**Fix**: Add AbortController timeouts (5s for tiles, 10s for API calls).

### 14. Hydration Mismatch in ConditionalShell

**Files**: `components/shared/ConditionalShell.tsx:65-71`
**Severity**: HIGH
**Risk**: Server renders loading state, client renders content → hydration error. This breaks the entire app.
**Fix**: Use `suppressHydrationWarning` or restructure to avoid server/client mismatch.

---

## 🟡 MEDIUM PRIORITY ISSUES

### 15. No Cursor Pagination

**Files**: `src/modules/search/search.service.ts`, `src/modules/admin/admin.service.ts`, `src/modules/notification/notification.service.ts`
**Severity**: MEDIUM
**Risk**: All pagination uses `skip/take` which becomes slow on large datasets.
**Fix**: Use cursor-based pagination for large tables.

### 16. N+1 Query in User Metrics

**Files**: `src/modules/admin/admin.service.ts:66-79`
**Severity**: MEDIUM
**Risk**: Five separate count queries run sequentially instead of in a single batch.
**Fix**: Compose queries or use a raw query for all counts.

### 17. Missing Error Boundaries

**Severity**: MEDIUM
**Files**: Several page-level components lack error boundaries.
**Risk**: Unhandled errors crash the entire page.
**Fix**: Add error boundaries to root layout and each major section.

### 18. Missing Loading States

**Severity**: MEDIUM
**Risk**: Several pages lack proper Suspense boundaries.
**Fix**: Add Suspense with fallbacks.

### 19. Uncontrolled `any` Types

**Files**: Multiple
**Severity**: MEDIUM
**Risk**: Many `any` types throughout the codebase defeat TypeScript's purpose.
**Fix**: Replace with proper interfaces.

### 20. No Audit Logging in Admin

**Files**: `src/modules/admin/admin.service.ts`
**Severity**: MEDIUM
**Risk**: Admin actions (role changes, suspensions) aren't logged with who/when/old value/new value.
**Fix**: Add audit trail table and logging.

### 21. No Transaction Safety

**Files**: `src/modules/auth/auth.service.ts`
**Severity**: MEDIUM
**Risk**: Login/create operations aren't wrapped in Prisma transactions. Partial failures can leave inconsistent state.
**Fix**: Use `prisma.$transaction()` for multi-step operations.

---

## 🟢 LOW PRIORITY ISSUES

### 22. No Search Indexes on Prisma Schema

**Files**: `prisma/schema.prisma`
**Severity**: LOW
**Risk**: Only basic indexes exist. Search queries on text fields will be slow.
**Fix**: Add composite indexes and consider PG FTS.

### 23. Hardcoded Constants

**Severity**: LOW
**Risk**: Several magic strings and numbers throughout the codebase.
**Fix**: Extract to constants/enums.

### 24. Missing JSDoc

**Severity**: LOW
**Risk**: Many functions lack documentation.
**Fix**: Add JSDoc to public APIs.

### 25. Test Coverage Gap

**Severity**: LOW
**Risk**: Only 4 test files exist covering auth, rajuk, and redis.
**Fix**: Add tests for admin, notification, search modules.

---

## 📋 PRIORITIZED FIX PLAN

### Phase A: Security (Day 1)

1. Remove raw token endpoint, proxy all tile requests server-side
2. Fix SSRF vulnerability in rajuk proxy
3. Remove SSL bypass
4. Add security headers middleware
5. Add rate limiting

### Phase B: Architecture (Day 2)

6. Remove duplicate hooks/components
7. Unify PrismaClient to single instance
8. Convert auth to DI pattern
9. Add request timeouts
10. Fix hydration error

### Phase C: Performance (Day 3)

11. Add cursor pagination
12. Batch user metrics queries
13. Add database indexes
14. Add error boundaries and loading states

### Phase D: Quality (Day 4)

15. Replace `any` types with interfaces
16. Add audit logging
17. Add transaction safety
18. Add documentation
19. Add tests

---

## 🔧 EXECUTION ORDER

Execution starts with Phase A (Security) since those are critical vulnerabilities. Each change will be:

1. Explained with rationale
2. Show affected files
3. Implemented
4. Verified
5. Documented
