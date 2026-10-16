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
import { githubSignInStrategy } from "@/src/modules/auth/githubBrowser";

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

const GITHUB_REDIRECT_PENDING = "landbd.github.redirect.pending";

function githubOAuthError(error: unknown): string {
  const code = error && typeof error === "object" && "code" in error
    ? String((error as { code?: unknown }).code) : "";
  if (code === "auth/popup-closed-by-user") {
    return "GitHub লগইন পপ-আপ বন্ধ হয়েছে। অন্য অ্যাপের ভেতরের ব্রাউজার হলে মেনু থেকে Chrome-এ খুলুন এবং আবার চেষ্টা করুন।";
  }
  if (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
    return "GitHub লগইন পপ-আপ ব্লক হয়েছে। Chrome বা Safari-তে LandBD খুলে আবার চেষ্টা করুন।";
  }
  if (code === "auth/web-storage-unsupported" || code === "auth/operation-not-supported-in-this-environment") {
    return "এই ব্রাউজারে GitHub লগইনের প্রয়োজনীয় স্টোরেজ বা পপ-আপ সুবিধা নেই। Chrome বা Safari-তে খুলুন।";
  }
  if (code === "auth/operation-not-allowed") {
    return "Firebase Console-এ GitHub Sign-in provider সক্রিয় আছে কি না যাচাই করুন।";
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
  githubError: string | null;
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
    async (firebaseUser: User | null, requireGithubAdmin = false) => {
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
        if (requireGithubAdmin && remote.role !== "Super Admin") {
          throw new Error("শুধুমাত্র অনুমোদিত GitHub অ্যাডমিন প্রবেশ করতে পারবেন।");
        }

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
    // Firebase redirects return to the same /login URL. Do not expose even a
    // transient authenticated UI until the verified server role is checked.
    const pendingGithubRedirect =
      window.sessionStorage.getItem(GITHUB_REDIRECT_PENDING) === "1";

    const unsubscribe = onIdTokenChanged(auth, (user) => {
      if (pendingGithubRedirect) return;
      void loadFromToken(user).catch(() => undefined);
    });

    void (async () => {
      try {
        const result = await getRedirectResult(auth);
        if (!pendingGithubRedirect) return;

        if (!result) {
          throw new Error(
            "GitHub থেকে লগইন সম্পন্ন হয়নি। Chrome/Safari-তে পুনরায় চেষ্টা করুন এবং OAuth callback URL যাচাই করুন.",
          );
        }

        await loadFromToken(result.user, true);
      } catch (error: unknown) {
        if (pendingGithubRedirect) {
          await signOut(auth).catch(() => undefined);
          await clearServerSession().catch(() => undefined);
          clearClientState();
        }
        setGithubError(githubOAuthError(error));
      } finally {
        if (pendingGithubRedirect) {
          window.sessionStorage.removeItem(GITHUB_REDIRECT_PENDING);
        }
      }
    })();

    return () => unsubscribe();
  }, [loadFromToken, clearClientState, clearServerSession]);

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
    const strategy = githubSignInStrategy({
      userAgent: typeof navigator === "undefined" ? "" : navigator.userAgent,
      hostname: typeof window === "undefined" ? "" : window.location.hostname,
      authDomain: auth.app.options.authDomain,
    });

    try {
      if (strategy === "external-browser") {
        throw new Error(
          "আপনি অন্য অ্যাপের ভেতরের ব্রাউজার ব্যবহার করছেন। নিচের Chrome-এ খুলুন বোতাম চাপুন অথবা ⋮ মেনু থেকে Open in browser নির্বাচন করুন।",
        );
      }

      if (strategy === "redirect") {
        window.sessionStorage.setItem(GITHUB_REDIRECT_PENDING, "1");
        try {
          await signInWithRedirect(auth, provider);
        } catch (error) {
          window.sessionStorage.removeItem(GITHUB_REDIRECT_PENDING);
          throw error;
        }
        return null;
      }

      // Desktop and ordinary external browsers retain popup sign-in until
      // the GitHub callback has been switched to the same-origin helper.
      const credential = await signInWithPopup(auth, provider);
      const profile = await loadFromToken(credential.user, true);
      if (!profile) throw new Error("GitHub লগইন সম্পন্ন হয়নি।");
      return profile;
    } catch (error: unknown) {
      const code = error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code) : "";
      const sameOrigin = auth.app.options.authDomain?.toLowerCase() ===
        (typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "");

      if (sameOrigin && (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request")) {
        window.sessionStorage.setItem(GITHUB_REDIRECT_PENDING, "1");
        try {
          await signInWithRedirect(auth, provider);
          return null;
        } catch (redirectError) {
          window.sessionStorage.removeItem(GITHUB_REDIRECT_PENDING);
          throw new Error(githubOAuthError(redirectError));
        }
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
