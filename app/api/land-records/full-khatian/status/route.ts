import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const lisfFlag = process.env.LISF_ENABLED?.trim().toLowerCase();
  const lisfExplicitlyDisabled = ["0", "false", "off"].includes(lisfFlag ?? "");
  const lisfMockRequested = process.env.LISF_PROVIDER?.trim().toLowerCase() === "mock";
  const lisfCredentialsReady = Boolean(
    process.env.LISF_SERVICE_ID?.trim() && process.env.LISF_ACCESS_CODE?.trim(),
  );
  const lisfAuthorized = !lisfExplicitlyDisabled && !lisfMockRequested && lisfCredentialsReady;
  const mirrorFlag = process.env.DLRMS_ENRICH_ENABLED?.trim().toLowerCase();
  const mirrorEnabled = !["0", "false", "off"].includes(mirrorFlag ?? "");
  const mirrorBaseUrl =
    process.env.DLRMS_ENRICH_BASE_URL?.trim() || "https://eporcha.tech/api/dlrms";
  const firebaseReferenceFlag =
    process.env.LANDBD_FIREBASE_VERIFIED_REFERENCE_ENABLED?.trim().toLowerCase();
  const firebaseVerifiedReference =
    !["0", "false", "off"].includes(firebaseReferenceFlag ?? "");

  return NextResponse.json(
    {
      success: true,
      service: "land-records/full-khatian",
      status: "ok",
      publicDlrms: {
        enabled: true,
        official: true,
        search: true,
        detail: true,
        verification: true,
        halSabek: true,
      },
      enrichment: {
        mirror: {
          enabled: mirrorEnabled,
          baseUrl: mirrorBaseUrl,
          official: false,
        },
        bundledReference: {
          enabled: process.env.LANDBD_REFERENCE_DATA_ENABLED?.trim().toLowerCase() !== "false",
          official: false,
        },
        firebaseVerifiedReference: {
          enabled: firebaseVerifiedReference,
          official: false,
          mode: "exact-match-read-only",
        },
      },
      lisf: {
        enabled: lisfAuthorized,
        mode: lisfAuthorized
          ? "authorized"
          : lisfExplicitlyDisabled
            ? "disabled"
            : lisfMockRequested
              ? process.env.NODE_ENV === "production" ? "mock-blocked-in-production" : "mock"
              : "credentials-missing",
        livePrivateRequests: lisfAuthorized,
        note: lisfAuthorized
          ? "Authorized LISF owner/dag enrichment is available."
          : "Public DLRMS, mirror and registered LandBD references remain active while LISF is unavailable.",
      },
      privacy: {
        secretsExposed: false,
        credentialsReported: false,
      },
      timestamp: new Date().toISOString(),
      commit: process.env.VERCEL_GIT_COMMIT_SHA || "local",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow",
        "Content-Type": "application/json; charset=utf-8",
      },
    },
  );
}
