import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setAuthToken } from './api';

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = 'hrms-auth';

function loadAuthState() {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as { user: User; token: string };
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialState = loadAuthState();
  const [user, setUser] = useState<User | null>(initialState?.user ?? null);
  const [token, setToken] = useState<string | null>(initialState?.token ?? null);

  useEffect(() => {
    if (user && token) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }

    setAuthToken(token);
  }, [user, token]);

  const login = useCallback((nextUser: User, nextToken: string) => {
    setUser(nextUser);
    setToken(nextToken);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [user, token, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
