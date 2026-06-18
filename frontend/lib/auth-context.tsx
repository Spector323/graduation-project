'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Establishment } from './api-client';

interface AuthContextType {
  user: (User & { establishment?: Establishment }) | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithPin: (pinCode: string, establishmentId: string) => Promise<void>;
  signUp: (data: { email: string; password: string; fullName: string; role?: string; establishmentName?: string; establishmentType?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signInWithPin: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  fetchUser: async () => {},
} as unknown as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<(User & { establishment?: Establishment }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchUser() {
    try {
      const [profileRes, establishmentRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/establishments/current`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }).catch(() => null),
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        let establishment: Establishment | undefined;

        if (establishmentRes && establishmentRes.ok) {
          establishment = await establishmentRes.json();
        }

        setUser({ ...profileData, establishment });
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка входа');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);

    const userData = {
      ...data.user,
      establishment: data.user.establishment || undefined,
    };
    setUser(userData);
  }

  async function signInWithPin(pinCode: string, establishmentId: string) {
    if (!establishmentId) {
      throw new Error('Укажите ID заведения');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinCode, establishmentId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Неверный PIN-код');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);

    const userData = {
      ...data.user,
      establishment: data.user.establishment || undefined,
    };
    setUser(userData);
  }

  async function signUp(data: { email: string; password: string; fullName: string; role?: string; establishmentName?: string; establishmentType?: string }) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка регистрации');
    }

    const result = await response.json();
    localStorage.setItem('token', result.token);
    setUser(result.user);
  }

  async function signOut() {
    localStorage.removeItem('token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInWithPin, signUp, signOut, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
