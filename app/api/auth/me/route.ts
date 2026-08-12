import { NextRequest, NextResponse } from "next/server";
import { auth, collections } from "@/src/modules/database/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const cookieToken = req.cookies.get("access_token")?.value ?? null;
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    const token = cookieToken ?? bearerToken;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await auth.verifyIdToken(token);
    if (!decodedToken) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    const userDoc = await collections.users.doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      // If user is in Firebase Auth but not in Firestore users collection, we can return the auth data
      return NextResponse.json({ 
        user: { 
          id: decodedToken.uid, 
          email: decodedToken.email, 
          name: decodedToken.name || null,
          role: decodedToken.email?.includes('admin') ? 'Admin' : 'User' 
        } 
      }, { status: 200 });
    }

    const userData = userDoc.data()!;
    const user = {
      id: userDoc.id,
      email: userData.email,
      name: userData.name,
      role: userData.role || (userData.email?.includes('admin') ? 'Admin' : 'User'),
    };

    return NextResponse.json({ user }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
