"use client";

import { useState, useEffect, useCallback } from "react";
import {
  signInWithEmailAndPassword,
  GithubAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onIdTokenChanged,
  getIdToken,
  type User,
} from "firebase/auth";
import { auth } from "@/src/modules/database/firebaseClient";
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

export type SessionUser = {
  id?: string;
  email?: string;
  name?: string | null;
  role?: string;
};

function sameOriginRedirectConfigured(): boolean {
  return typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.toLowerCase() === window.location.hostname.toLowerCase();
}

function githubOAuthError(error: unknown): string {
  const code = error && typeof error === "object" && "code" in error
    ? String((error as { code?: unknown }).code) : "";
  if (code === "auth/popup-closed-by-user") {
    return "GitHub লগইন পপ-আপটি বন্ধ হয়েছে অথবা ব্রাউজার বন্ধ করেছে। আবার চেষ্টা করুন। মোবাইলে হলে সরাসরি ব্রাউজারে পেজটি খুলুন।";
  }
  if (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
    return "ব্রাউজার GitHub লগইন পপ-আপ খুলতে পারেনি। পপ-আপ অনুমতি দিন অথবা অন্য ব্রাউজারে চেষ্টা করুন।";
  }
  if (code === "auth/unauthorized-domain") {
    return "Firebase Authorized domains-এ landbd.pincodeit.com যোগ করতে হবে।";
  }
  if (code === "auth/account-exists-with-different-credential") {
    return "এই ইমেইলে অন্য লগইন পদ্ধতির অ্যাকাউন্ট আছে। আগে সেটিতে প্রবেশ করে GitHub সংযুক্ত করুন।";
  }
  return error instanceof Error ? error.message : "GitHub লগইন সম্পন্ন করা যায়নি।";
}

export function useProvideAuth(): AuthState & {
  login: (email: string, password: string) => Promise<SessionUser>;
  loginWithGithub: () => Promise<SessionUser | null>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
} {
  const [githubError, setGithubError] = useState<string | null>(null);
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoggedIn: false,
    loading: true,
  });

  const clearClientState = useCallback(() => {
    setState({ user: null, isLoggedIn: false, loading: false });
  }, []);

  const clearServerSession = useCallback(async () => {
    await fetch("/api/auth/session", {
      method: "DELETE",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  }, []);

  const establishServerSession = useCallback(
    async (token: string): Promise<SessionUser> => {
      const response = await fetch("/api/auth/session", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (response.status === 401) {
        throw new Error("Unauthorized");
      }

      if (response.status === 403) {
        throw new Error("অ্যাকাউন্ট সাময়িকভাবে লক করা আছে। পরে আবার চেষ্টা করুন।");
      }

      if (!response.ok) {
        throw new Error("সার্ভার সেশন তৈরি করা যায়নি।");
      }

      const body = (await response.json()) as { user?: SessionUser };
      if (!body.user?.id) {
        throw new Error("ব্যবহারকারীর তথ্য যাচাই করা যায়নি।");
      }

      return body.user;
    },
    [],
  );

  const loadFromToken = useCallback(
    async (firebaseUser: User | null) => {
      if (!firebaseUser) {
        await clearServerSession().catch(() => undefined);
        clearClientState();
        return;
      }

      try {
        // Firebase refreshes ID tokens automatically. onIdTokenChanged runs
        // again after a refresh so the HttpOnly server cookie stays in sync.
        const token = await getIdToken(firebaseUser, false);
        const remote = await establishServerSession(token);

        setState({
          user: {
            id: remote.id || firebaseUser.uid,
            email: remote.email || firebaseUser.email || "",
            name:
              typeof remote.name === "string" && remote.name.trim()
                ? remote.name
                : firebaseUser.displayName,
            role: normalizeRole(remote.role || "User"),
          },
          isLoggedIn: true,
          loading: false,
        });
        return remote;
      } catch (error) {
        await signOut(auth).catch(() => undefined);
        await clearServerSession().catch(() => undefined);
        clearClientState();

        if (error instanceof Error) {
          throw error;
        }
      }
    },
    [clearClientState, clearServerSession, establishServerSession],
  );

  useEffect(() => {
    // Redirect authentication is used on mobile browsers where popups can be blocked.
    // Surface OAuth errors instead of silently swallowing redirect failures.
    void getRedirectResult(auth).catch((error: unknown) => {
      setGithubError(githubOAuthError(error));
    });
    const unsubscribe = onIdTokenChanged(auth, (user) => {
      void loadFromToken(user).catch(() => undefined);
    });
    return () => unsubscribe();
  }, [loadFromToken]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const profile = await loadFromToken(userCredential.user);
        if (!auth.currentUser || !profile) {
          throw new Error(
            "লগিন ব্যর্থ হয়েছে অথবা অ্যাকাউন্ট লক/মুছে ফেলা হয়েছে।",
          );
        }
        return profile;
      } catch (error: unknown) {
        const msg =
          error instanceof Error ? error.message : "লগিন ব্যর্থ হয়েছে";
        throw new Error(msg);
      }
    },
    [loadFromToken],
  );

  const loginWithGithub = useCallback(async (): Promise<SessionUser | null> => {
    setGithubError(null);
    const provider = new GithubAuthProvider();
    provider.setCustomParameters({ allow_signup: "false" });
    const redirectReady = sameOriginRedirectConfigured();
    const mobile = typeof navigator !== "undefined" &&
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    try {
      // Use redirect on mobile only when same-origin OAuth helpers have been
      // deployed AND NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN points to this host.
      if (mobile && redirectReady) {
        await signInWithRedirect(auth, provider);
        return null;
      }

      const credential = await signInWithPopup(auth, provider);
      const profile = await loadFromToken(credential.user);
      if (profile?.role !== "Super Admin") {
        await signOut(auth).catch(() => undefined);
        await clearServerSession().catch(() => undefined);
        clearClientState();
        throw new Error("শুধুমাত্র অনুমোদিত GitHub অ্যাডমিন প্রবেশ করতে পারবেন।");
      }
      return profile;
    } catch (error: unknown) {
      const code = error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code) : "";

      // Do not start an unexpected second OAuth login when a popup is closed;
      // users can intentionally cancel authentication.
      if (redirectReady &&
          (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request")) {
        await signInWithRedirect(auth, provider);
        return null;
      }
      throw new Error(githubOAuthError(error));
    }
  }, [loadFromToken, clearClientState, clearServerSession]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch {
      /* ignore */
    }

    await clearServerSession().catch(() => undefined);
    clearClientState();
  }, [clearClientState, clearServerSession]);

  const refresh = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;

    try {
      const token = await getIdToken(currentUser, true);
      const remote = await establishServerSession(token);

      setState({
        user: {
          id: remote.id || currentUser.uid,
          email: remote.email || currentUser.email || "",
          name:
            typeof remote.name === "string" && remote.name.trim()
              ? remote.name
              : currentUser.displayName,
          role: normalizeRole(remote.role || "User"),
        },
        isLoggedIn: true,
        loading: false,
      });

      return true;
    } catch {
      return false;
    }
  }, [establishServerSession]);

  return { ...state, login, loginWithGithub, logout, refresh, githubError };
}
