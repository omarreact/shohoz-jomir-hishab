import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    cache: { status: "serverless-stateless", enabled: false },
    timestamp: new Date().toISOString()
  });
}

