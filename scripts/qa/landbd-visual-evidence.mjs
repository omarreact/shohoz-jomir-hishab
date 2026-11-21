#!/usr/bin/env node
// Public-route visual evidence only; synthetic Firebase on local CI server.
// Human sign-off, real Firebase authentication and staging rollback are separate gates.
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const baseURL = new URL(process.env.QA_BASE_URL || "http://127.0.0.1:3000").origin;
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(baseURL)) {
  throw new Error("Visual QA must use the local CI server, never production.");
}
const dest = path.resolve(process.env.LANDBD_VISUAL_DIR || "test-results/landbd-visual-evidence");
mkdirSync(dest, { recursive: true });
const sizes = [[360,800], [390,844], [768,1024], [1024,768], [1180,820], [1440,900], [1920,1080]];
const primary = ["/", "/all-services", "/dlrms-khatian", "/mouza-khatian-book", "/mouza-dag-report",
  "/khatiyan", "/faraez", "/land-measurement", "/porcha", "/geospatial-map",
  "/mouza-map", "/rajuk-test", "/contact", "/login"];
const secondary = ["/about", "/faq", "/blog", "/api-docs", "/privacy", "/terms", "/ms-test",
  "/checkout/result", "/checkout/pinpay", "/403", "/maintenance", "/security-locked",
  "/survey-khatian", "/admin", "/admin/users"];
const records = [];
const findings = [];
const browser = await chromium.launch({ headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--no-proxy-server",
    "--proxy-bypass-list=<-loopback>", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist"] });
try {
  for (const [width,height] of sizes) {
    const context = await browser.newContext({ viewport: { width,height }, deviceScaleFactor: 1,
      reducedMotion: "reduce", colorScheme: "light", locale: "bn-BD", serviceWorkers: "block" });
    const page = await context.newPage();
    const routes = primary.concat([390,1440].includes(width) ? secondary : []);
    for (const route of routes) {
      const name = (route === "/" ? "home" : route.slice(1).replace(/[^a-z0-9-]/gi, "-")) + "-" + width + ".jpg";
      const row = {route,width,height,file:name,status:null,finalPath:null,overflow:null,captured:false,error:null};
      try {
        const response = await page.goto(baseURL + route, { waitUntil: "domcontentloaded", timeout:25000 });
        row.status = response?.status() ?? null;
        row.finalPath = new URL(page.url()).pathname;
        await page.waitForTimeout(250);
        const metrics = await page.evaluate(() => ({
          width: document.documentElement.clientWidth,
          scroll: document.documentElement.scrollWidth,
          pageHeight: document.documentElement.scrollHeight
        }));
        row.overflow = Math.max(0,metrics.scroll-metrics.width);
        await page.screenshot({path:path.join(dest,name),type:"jpeg",quality:65,
          fullPage:metrics.pageHeight <= 16000, animations:"disabled", timeout:18000});
        row.captured = true;
        if (row.status == null || row.status >= 500) findings.push(route+" @"+width+" HTTP "+row.status);
        if (row.overflow > 2) findings.push(route+" @"+width+" overflow "+row.overflow+"px");
      } catch(error) {
        row.error = String(error).slice(0,300);
        findings.push(route+" @"+width+" "+row.error);
      }
      records.push(row);
      console.log((row.error || row.overflow > 2 ? "REVIEW" : "CAPTURED")+" "+route+" @"+width+" "+row.status);
    }
    await context.close();
  }
} finally { await browser.close(); }
const result = {
  environment: "local GitHub Actions production build using synthetic Firebase",
  commit: process.env.GITHUB_SHA || "local", humanReviewed:false, authTested:false,
  expectedCount:sizes.length*primary.length+secondary.length*2,
  capturedCount:records.filter(r=>r.captured).length, findings, records
};
writeFileSync(path.join(dest,"manifest.json"),JSON.stringify(result,null,2));
const summary = ["# LandBD PR #184 visual evidence (automated; not human-approved)",
  "Commit: "+result.commit, "Target: local CI production server, synthetic Firebase.",
  "Widths: "+sizes.map(s=>s[0]).join(", ")+" px.",
  "Images: "+result.capturedCount+"/"+result.expectedCount+".",
  "Human visual sign-off: **PENDING**. Authenticated Firebase: **NOT RUN**.", "",
  "## Defects and automated findings", ...(findings.length?findings.map(f=>"- "+f):["- No automated overflow/HTTP/capture errors."]),
  "", "## Screenshot inventory",
  "| Route | Width | HTTP | Redirect/final path | Overflow px | File |",
  "|---|---:|---:|---|---:|---|",
  ...records.map(r=>"| "+r.route+" | "+r.width+" | "+(r.status??"N/A")+
   " | "+(r.finalPath??"N/A")+" | "+(r.overflow??"N/A")+" | "+(r.captured?r.file:"FAILED")+" |"),
  "", "Manual reviewer: inspect typography, clipping, menus, mobile content, GIS canvas and document layouts; compare approved design baselines."];
writeFileSync(path.join(dest,"REVIEW.md"),summary.join("\n"));
console.log("Evidence: "+result.capturedCount+"/"+result.expectedCount+" captures; findings "+findings.length);
if(findings.length)process.exitCode=1;
