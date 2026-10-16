"use client";

import { useState, useEffect, useCallback } from "react";
import {
  signInWithEmailAndPassword,
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

export function useProvideAuth(): AuthState & {
  login: (email: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
} {
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

  return { ...state, login, logout, refresh };
}
