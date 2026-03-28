import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Expert" | "Authority";
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("ths_user");
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem("ths_token"));

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

  useEffect(() => {
    if (!token) return;

    const run = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          localStorage.removeItem("ths_token");
          localStorage.removeItem("ths_user");
          setToken(null);
          setUser(null);
          return;
        }
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem("ths_user", JSON.stringify(data.user));
      } catch {
        // If offline or backend not ready, keep current user from localStorage.
      }
    };

    run();
  }, [token, API_BASE]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("ths_user", JSON.stringify(data.user));
      localStorage.setItem("ths_token", data.token);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("ths_user");
    localStorage.removeItem("ths_token");
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
