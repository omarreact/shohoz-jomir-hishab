import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ success: false, error: "Cloudinary is not configured on the server (Missing API Secret)" }, { status: 500 });
    }

    const body = await req.json();
    const { paramsToSign } = body;

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );
    
    return NextResponse.json({ signature });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate signature" }, { status: 500 });
  }
}
