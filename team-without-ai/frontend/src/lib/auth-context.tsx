import React, { createContext, useContext, useState, ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Expert" | "Authority";
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const mockUsers: Record<string, User> = {
  "admin@heritage.ma": { id: "u4", name: "Fatima Zahra El Idrissi", email: "admin@heritage.ma", role: "Admin" },
  "expert@heritage.ma": { id: "u1", name: "Dr. Amina Benali", email: "expert@heritage.ma", role: "Expert" },
  "authority@heritage.ma": { id: "u3", name: "Mohammed Alaoui", email: "authority@heritage.ma", role: "Authority" },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("ths_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = (email: string, _password: string) => {
    const found = mockUsers[email];
    if (found) {
      setUser(found);
      localStorage.setItem("ths_user", JSON.stringify(found));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("ths_user");
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
