"use client";

import { useState, useEffect, useCallback } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getIdToken,
} from "firebase/auth";
import { auth, db } from "@/src/modules/database/firebaseClient";
import { doc, getDoc } from "firebase/firestore";
import { normalizeRole } from "@/src/modules/auth/roles";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoggedIn: boolean;
  loading: boolean;
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isLocked(lockedUntil: unknown): boolean {
  if (!lockedUntil) return false;
  const t =
    typeof lockedUntil === "string"
      ? Date.parse(lockedUntil)
      : lockedUntil instanceof Date
        ? lockedUntil.getTime()
        : typeof lockedUntil === "object" &&
            lockedUntil !== null &&
            "toDate" in lockedUntil &&
            typeof (lockedUntil as { toDate: () => Date }).toDate === "function"
          ? (lockedUntil as { toDate: () => Date }).toDate().getTime()
          : NaN;
  return Number.isFinite(t) && t > Date.now();
}

export function useAuth(): AuthState & {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
} {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoggedIn: false,
    loading: true,
  });

  const setAccessTokenCookie = useCallback((token: string) => {
    const payload = parseJwtPayload(token);
    const exp = typeof payload?.exp === "number" ? payload.exp : null;
    const maxAge = exp ? Math.floor((exp * 1000 - Date.now()) / 1000) : 3600;
    const isSecure = window.location.protocol === "https:";
    document.cookie = `access_token=${encodeURIComponent(token)}; path=/; max-age=${Math.max(maxAge, 60)}; SameSite=Lax${isSecure ? "; Secure" : ""}`;
  }, []);

  const clearSession = useCallback(() => {
    document.cookie = "access_token=; path=/; max-age=0";
    setState({ user: null, isLoggedIn: false, loading: false });
  }, []);

  const loadFromToken = useCallback(
    async (firebaseUser: { uid: string; email: string | null; displayName: string | null } | null) => {
      if (!firebaseUser) {
        clearSession();
        return;
      }

      try {
        const token = await getIdToken(firebaseUser as never, true);
        setAccessTokenCookie(token);

        const payload = parseJwtPayload(token);
        let role: string | undefined =
          typeof payload?.role === "string" ? payload.role : undefined;
        let lockedUntil: unknown = null;
        let status: string | undefined;
        let profileName: string | null = firebaseUser.displayName;

        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (!role && data.role) role = String(data.role);
            lockedUntil = data.lockedUntil ?? null;
            status = typeof data.status === "string" ? data.status : undefined;
            if (typeof data.name === "string" && data.name.trim()) {
              profileName = data.name;
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }

        if (status === "deleted") {
          await signOut(auth).catch(() => undefined);
          clearSession();
          return;
        }

        if (isLocked(lockedUntil)) {
          await signOut(auth).catch(() => undefined);
          clearSession();
          throw new Error("অ্যাকাউন্ট সাময়িকভাবে লক করা আছে। পরে আবার চেষ্টা করুন।");
        }

        // Break-glass Super Admin only when explicitly enabled (never in production by default)
        const bootstrapOn =
          process.env.NEXT_PUBLIC_ALLOW_BOOTSTRAP_ADMIN === "true";
        const bootstrapEmail =
          process.env.NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAIL || "admin@landbd.com";
        if (
          !role &&
          bootstrapOn &&
          firebaseUser.email &&
          firebaseUser.email.toLowerCase() === bootstrapEmail.toLowerCase()
        ) {
          role = "Super Admin";
        }

        const normalized = normalizeRole(role || "User");

        setState({
          user: {
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            name: profileName,
            role: normalized,
          },
          isLoggedIn: true,
          loading: false,
        });
      } catch (e) {
        clearSession();
        if (e instanceof Error && e.message.includes("লক")) {
          throw e;
        }
      }
    },
    [setAccessTokenCookie, clearSession],
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      void loadFromToken(user);
    });
    return () => unsubscribe();
  }, [loadFromToken]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await loadFromToken(userCredential.user);
        if (!auth.currentUser) {
          throw new Error("লগিন ব্যর্থ হয়েছে অথবা অ্যাকাউন্ট লক/মুছে ফেলা হয়েছে।");
        }
      } catch (error: unknown) {
        const msg =
          error instanceof Error ? error.message : "লগিন ব্যর্থ হয়েছে";
        throw new Error(msg);
      }
    },
    [loadFromToken],
  );

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch {
      /* ignore */
    }
    clearSession();
  }, [clearSession]);

  const refresh = useCallback(async () => {
    if (!auth.currentUser) return false;
    try {
      const token = await getIdToken(auth.currentUser, true);
      setAccessTokenCookie(token);
      await loadFromToken(auth.currentUser);
      return true;
    } catch {
      return false;
    }
  }, [setAccessTokenCookie, loadFromToken]);

  return { ...state, login, logout, refresh };
}
