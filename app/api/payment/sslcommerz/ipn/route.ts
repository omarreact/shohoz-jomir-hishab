import { NextRequest } from "next/server";
import { handlePaymentCallback } from "@/src/lib/payment-callback";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(req:NextRequest){return handlePaymentCallback(req,"ipn");}
