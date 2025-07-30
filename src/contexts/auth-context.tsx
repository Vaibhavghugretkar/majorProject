// src/contexts/auth-context.tsx
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Replace Firebase User type with a simple interface for our mock user
interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Simple in-memory flag to simulate a logged-in user session
let isAuthenticated = false;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simulate checking auth state on initial load
    setTimeout(() => {
      // In a real app with localStorage, you'd check a token here.
      // For this mock, we just start logged out unless a session was started.
      if (typeof window !== 'undefined') {
        const sessionEmail = sessionStorage.getItem('mockUserEmail');
        if (sessionEmail) {
          isAuthenticated = true;
          setCurrentUser({
            uid: 'mock-user-123',
            email: sessionEmail,
            displayName: sessionEmail.split('@')[0],
            photoURL: null
          });
          router.replace('/diagram');
        }
      }
      setIsLoading(false);
    }, 500);
  }, [router]);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    // Any email/password is valid in this mock.
    const user: User = {
      uid: 'mock-user-123',
      email: email,
      displayName: email.split('@')[0],
      photoURL: null,
    };
    isAuthenticated = true;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('mockUserEmail', email); // Persist email across refresh
    }
    setCurrentUser(user);
    setIsLoading(false);
    router.replace('/diagram');
  };

  const signup = async (email: string, pass: string) => {
    // Signup and login have the same effect in this mock implementation.
    await login(email, pass);
  };
  
  const logout = async () => {
    setIsLoading(true);
    isAuthenticated = false;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('mockUserEmail');
    }
    setCurrentUser(null);
    setIsLoading(false);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
