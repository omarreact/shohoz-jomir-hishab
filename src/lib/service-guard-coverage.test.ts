import fs from "node:fs";
import path from "node:path";

const nonConsumingRoutes=[
 "app/api/land-records/khatians/route.ts",
 "app/api/mouza-provider/browse/route.ts",
 "app/api/porcha/route.ts",
 "app/api/land-records/dag-map-area/route.ts",
 "app/api/land-records/dag-map-areas/route.ts",
];
const billableRoutes=[
 "app/api/land-records/resolve-khatian/route.ts",
 "app/api/land-records/full-khatian/[surveyKey]/[id]/route.ts",
 "app/api/land-records/khatians/[surveyKey]/[id]/route.ts",
 "app/api/land-records/mouza-porcha-report/route.ts",
 "app/api/land-records/mouza-porcha-report/hal-sabek/route.ts",
 "app/api/mouza-map/download/route.ts",
 "app/api/mouza-provider/file/route.ts",
 "app/api/rajuk/query/route.ts",
 "app/api/rajuk/[layerId]/route.ts",
];
describe("Paid LandBD service enforcement inventory",()=>{
 test.each(nonConsumingRoutes)("search or browse checks access without charging a credit: %s",(p)=>{
  const code=fs.readFileSync(path.join(process.cwd(),p),"utf8");
  expect(code).toContain("checkServiceAccess(request,");
 });
 test.each(billableRoutes)("sensitive report or map result has server-side access control: %s",(p)=>{
  const code=fs.readFileSync(path.join(process.cwd(),p),"utf8");
  expect(code).toContain("enforceServiceAccess(");
 });
 test("official QR verification and short-lived token retrieval remain independently protected",()=>{
  const pdf=fs.readFileSync(path.join(process.cwd(),"app/api/mouza-map/retrieve/route.ts"),"utf8");
  expect(pdf).toContain("verifyPrivateDownloadToken");
 });
});
