import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const lisfEnabled = process.env.LISF_ENABLED?.trim() === "1";
  const lisfMock = lisfEnabled && process.env.LISF_PROVIDER?.trim().toLowerCase() === "mock";

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
      lisf: {
        enabled: lisfEnabled,
        mode: !lisfEnabled ? "disabled" : lisfMock ? "mock" : "authorized-fail-closed",
        livePrivateRequests: false,
        note: lisfEnabled
          ? "Private LISF calls remain fail-closed until the current authority-issued signing contract is implemented."
          : "Public DLRMS remains the active production source.",
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
