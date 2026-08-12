"use client";

import { useState, useEffect, useCallback } from "react";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, getIdToken } from "firebase/auth";
import { auth } from "@/src/modules/database/firebaseClient";

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

function parseJwtPayload(token: string): any {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
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
    const maxAge = payload ? Math.floor((payload.exp * 1000 - Date.now()) / 1000) : 3600;
    const isSecure = window.location.protocol === 'https:';
    document.cookie = `access_token=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
  }, []);

  const loadFromToken = useCallback(async (firebaseUser: any) => {
    if (!firebaseUser) {
      setState({ user: null, isLoggedIn: false, loading: false });
      document.cookie = "access_token=; path=/; max-age=0";
      return;
    }

    try {
      const token = await getIdToken(firebaseUser, true);
      setAccessTokenCookie(token);

      const payload = parseJwtPayload(token);
      
      // We assume role based on email or custom claims for now
      const role = payload?.role || (firebaseUser.email?.includes('admin') ? 'Admin' : 'User');

      setState({
        user: { 
          id: firebaseUser.uid, 
          email: firebaseUser.email || "", 
          name: firebaseUser.displayName || null, 
          role 
        },
        isLoggedIn: true,
        loading: false,
      });
    } catch (e) {
      setState({ user: null, isLoggedIn: false, loading: false });
    }
  }, [setAccessTokenCookie]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      loadFromToken(user);
    });

    return () => unsubscribe();
  }, [loadFromToken]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await getIdToken(userCredential.user, true);
      setAccessTokenCookie(token);
      await loadFromToken(userCredential.user);
    } catch (error: any) {
      throw new Error(error.message || "লগিন ব্যর্থ হয়েছে");
    }
  }, [setAccessTokenCookie, loadFromToken]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    document.cookie = "access_token=; path=/; max-age=0";
    setState({ user: null, isLoggedIn: false, loading: false });
  }, []);

  const refresh = useCallback(async () => {
    if (!auth.currentUser) return false;
    try {
      const token = await getIdToken(auth.currentUser, true);
      setAccessTokenCookie(token);
      return true;
    } catch {
      return false;
    }
  }, [setAccessTokenCookie]);

  return { ...state, login, logout, refresh };
}
