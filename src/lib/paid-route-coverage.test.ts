import fs from "node:fs";
import path from "node:path";

/**
 * Guardrail: sensitive paid-service endpoints must retain server authorization.
 * These are source-level invariants; integration tests still verify runtime behavior.
 */
describe("LandBD paid service endpoint authorization",()=>{
 const paths=[
  "app/api/land-records/full-khatian/[surveyKey]/[id]/route.ts",
  "app/api/land-records/khatians/[surveyKey]/[id]/route.ts",
  "app/api/land-records/resolve-khatian/route.ts",
  "app/api/land-records/mouza-porcha-report/route.ts",
  "app/api/land-records/mouza-porcha-report/hal-sabek/route.ts",
  "app/api/mouza-map/download/route.ts",
  "app/api/mouza-provider/file/route.ts",
  "app/api/rajuk/[layerId]/route.ts",
  "app/api/rajuk/query/route.ts"
 ];
 test.each(paths)("%s includes server-side service access check",(p)=>{
  const source=fs.readFileSync(path.join(process.cwd(),p),"utf8");
  expect(source).toContain('enforceServiceAccess(');
  expect(source).toMatch(/if\s*\(denied\)\s*return denied/);
 });
 test("refund success must not erase pooled credits blindly",()=>{
  const source=fs.readFileSync(path.join(process.cwd(),"app/api/admin/commerce/refunds/route.ts"),"utf8");
  expect(source).toContain("entitlementData?.lastTransactionId===command.orderId");
  expect(source).toContain("refundReviewHold:true");
 });
});
