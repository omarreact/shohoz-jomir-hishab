import { NextResponse } from "next/server";

export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const targetUrl =
      "https://masterplan.rajuk.gov.bd/portal/sharing/rest/generateToken";

    // ফর্ম ডাটা তৈরি
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);
    formData.append("referer", "https://masterplan.rajuk.gov.bd");
    formData.append("f", "json");

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 401 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Token generation failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  let activeToken = process.env.RAJUK_MAP_TOKEN || "";
  try {
    const { doc, getDoc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");
    const docRef = doc(db, "config", "rajuk_api");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().token) {
      activeToken = docSnap.data().token;
    }
  } catch (err) {
    console.error("Failed to load Rajuk token from Firebase:", err);
  }
  
  return NextResponse.json({ token: activeToken });
}
