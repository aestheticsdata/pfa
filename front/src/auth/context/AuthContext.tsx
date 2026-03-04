"use client";

import { createContext, useContext, useState } from "react";

import type { AuthUser } from "@auth/types";

interface AuthProviderProps {
  children: React.ReactNode;
  initialUser?: AuthUser | null;
  initialCsrfToken?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  csrfToken: string | null;
  setUser: (user: AuthUser | null) => void;
  setCsrfToken: (csrfToken: string | null) => void;
  setAuthState: (user: AuthUser, csrfToken: string | null) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children, initialUser = null, initialCsrfToken = null }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [csrfToken, setCsrfToken] = useState<string | null>(initialCsrfToken);

  const setAuthState = (nextUser: AuthUser, nextCsrfToken: string | null) => {
    setUser(nextUser);
    setCsrfToken(nextCsrfToken);
  };

  const clearAuth = () => {
    setUser(null);
    setCsrfToken(null);
  };

  const value: AuthContextValue = {
    user,
    csrfToken,
    setUser,
    setCsrfToken,
    setAuthState,
    clearAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
