import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function providerError(error: unknown) {
  if (error instanceof ZodError) return NextResponse.json({ error: "Provider returned invalid data" }, { status: 502 });
  if (error instanceof DOMException && error.name === "AbortError") return NextResponse.json({ error: "Request timed out" }, { status: 504 });
  const message = error instanceof Error ? error.message : "Unexpected provider error";
  return NextResponse.json({ error: message }, { status: 502 });
}

export function ok<T>(data: T) {
  return NextResponse.json(data, { headers: { "Cache-Control": "private, max-age=30" } });
}
