"use client";

import type { ReactNode } from "react";
import React, { createContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  _id: string;
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

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
        router.replace("/diagram");
      }
    }
    setIsLoading(false);
  }, [router]);

  const normalizeUser = (data: any): User => {
    return {
      _id: data._id || data.id|| data.uid, // ✅ handles both
      email: data.email,
      displayName: data.email ? data.email.split("@")[0] : null,
      photoURL: null,
    };
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass }),
    });

    const data = await res.json();
    if (!res.ok) {
      setIsLoading(false);
      throw new Error(data.error || "Login failed");
    }

    const user = normalizeUser(data);
    localStorage.setItem("user", JSON.stringify(user));
    setCurrentUser(user);
    setIsLoading(false);
    router.replace("/diagram");
  };

  const signup = async (email: string, pass: string) => {
    setIsLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass }),
    });

    const data = await res.json();
    if (!res.ok) {
      setIsLoading(false);
      throw new Error(data.error || "Signup failed");
    }

    const user = normalizeUser(data);
    localStorage.setItem("user", JSON.stringify(user));
    setCurrentUser(user);
    setIsLoading(false);
    router.replace("/diagram");
  };

  const logout = async () => {
    setIsLoading(true);
    localStorage.removeItem("user");
    setCurrentUser(null);
    setIsLoading(false);
    router.replace("/login");
  };

  return (
    <AuthContext.Provider
      value={{ currentUser, login, signup, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
