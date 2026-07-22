'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (body: any) => Promise<void>;
  register: (body: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  // Load user from token on mount
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      const token = localStorage.getItem('event_manager_token');
      if (token) {
        try {
          const res = await api.getMe();
          if (isMounted) {
            setUser(res.user);
          }
        } catch (err) {
          console.error('Failed to authenticate token on load:', err);
          if (isMounted) {
            localStorage.removeItem('event_manager_token');
            setUser(null);
          }
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    };
    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (body: any) => {
    setLoading(true);
    try {
      const res = await api.login(body);
      localStorage.setItem('event_manager_token', res.token);
      setUser(res.user);
      router.push('/');
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const register = async (body: any) => {
    setLoading(true);
    try {
      const res = await api.register(body);
      localStorage.setItem('event_manager_token', res.token);
      setUser(res.user);
      router.push('/');
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('event_manager_token');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
