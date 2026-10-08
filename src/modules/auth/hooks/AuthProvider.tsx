"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useProvideAuth } from "./useProvideAuth";

/** One Firebase listener and one authoritative session state per application. */
const AuthContext = createContext<ReturnType<typeof useProvideAuth> | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useProvideAuth();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): ReturnType<typeof useProvideAuth> {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
