'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, getUser, getToken, logout as apiLogout } from '@/lib/api';

interface User {
  id: string;
  email: string;
  nom: string;
  role: string;
  statut: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state from localStorage, then validate token via /profil
    const storedToken = getToken();

    if (!storedToken) {
      setLoading(false);
      return;
    }

    setToken(storedToken);

    // Optimistic load from localStorage to reduce UI flicker
    const storedUser = getUser();
    if (storedUser) setUser(storedUser);

    // Validate token with backend (prevents stale localStorage causing wrong redirects)
    (async () => {
      try {
        await refreshUser();
      } catch {
        apiLogout();
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const login = async (email: string, password: string) => {
    const { token, utilisateur } = await authApi.connexion({ email, password });
    setToken(token);
    setUser(utilisateur);
    return utilisateur;
  };

  const logout = async () => {
    try {
      await authApi.deconnexion();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiLogout();
      setToken(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await authApi.profil() as User;
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error; // Relancer l'erreur pour permettre la gestion par l'appelant
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
