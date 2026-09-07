import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DlrmsProviderError } from "./dlrms-provider";

function errorHeaders(requestId?: string): Record<string, string> {
  return {
    "Cache-Control": "no-store",
    ...(requestId ? { "X-Request-Id": requestId } : {}),
  };
}

function logProviderError(error: unknown, requestId?: string) {
  const base = {
    requestId: requestId || "unknown",
    name: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : "Unexpected provider error",
  };

  if (error instanceof DlrmsProviderError) {
    console.error("Land-record provider request failed", {
      ...base,
      provider: "DLRMS",
      stage: error.stage,
      status: error.status,
    });
    return;
  }

  console.error("Land-record provider request failed", base);
}

/**
 * Normalize provider failures into stable public errors.
 * Upstream response bodies and authentication/session details stay in
 * server logs and are never echoed to the browser.
 */
export function providerError(error: unknown, requestId?: string) {
  if (error instanceof ZodError) {
    logProviderError(error, requestId);
    return NextResponse.json(
      { error: "ভূমি রেকর্ড সেবা থেকে অপ্রত্যাশিত তথ্য পাওয়া গেছে।" },
      { status: 502, headers: errorHeaders(requestId) },
    );
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    logProviderError(error, requestId);
    return NextResponse.json(
      { error: "সরকারি ভূমি রেকর্ড সেবা সময়মতো উত্তর দেয়নি। আবার চেষ্টা করুন।" },
      { status: 504, headers: errorHeaders(requestId) },
    );
  }

  if (error instanceof DlrmsProviderError) {
    logProviderError(error, requestId);

    const message =
      error.stage === "auth"
        ? "সরকারি DLRMS সেবার সাথে নিরাপদ সংযোগ স্থাপন করা যাচ্ছে না। কিছুক্ষণ পরে আবার চেষ্টা করুন।"
        : error.status === 429
          ? "সরকারি ভূমি রেকর্ড সেবা বর্তমানে ব্যস্ত। কিছুক্ষণ পরে আবার চেষ্টা করুন।"
          : "সরকারি ভূমি রেকর্ড সেবা থেকে তথ্য আনা যায়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন।";

    return NextResponse.json(
      { error: message },
      {
        status: error.status === 429 ? 503 : 502,
        headers: errorHeaders(requestId),
      },
    );
  }

  logProviderError(error, requestId);
  return NextResponse.json(
    { error: "ভূমি রেকর্ডের তথ্য লোড করা যায়নি।" },
    { status: 502, headers: errorHeaders(requestId) },
  );
}

export function ok<T>(data: T, requestId?: string) {
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "private, max-age=30",
      ...(requestId ? { "X-Request-Id": requestId } : {}),
    },
  });
}
