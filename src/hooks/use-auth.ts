// src/hooks/use-auth.ts
"use client";

import { useContext } from 'react';
import { AuthContext } from '@/contexts/auth-context';

// This User type must match the one in AuthContext.
// It's simplified here to avoid depending on Firebase.
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context as AuthContextType;
};
