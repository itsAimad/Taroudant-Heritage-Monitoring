import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MOCK_USERS, type User } from '@/data/mockData';

interface AuthUser {
  username: string;
  role: 'admin' | 'inspector' | 'viewer';
  name: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('taroudant_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { localStorage.removeItem('taroudant_user'); }
    }
  }, []);

  const login = (username: string, password: string) => {
    const found = MOCK_USERS.find(u => u.username === username && u.password === password);
    if (found) {
      const authUser: AuthUser = { username: found.username, role: found.role, name: found.name, email: found.email };
      setUser(authUser);
      localStorage.setItem('taroudant_user', JSON.stringify(authUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('taroudant_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
