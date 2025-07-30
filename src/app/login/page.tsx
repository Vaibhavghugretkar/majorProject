// src/app/login/page.tsx
"use client";

import type { NextPage } from 'next';
import LoginForm from '@/components/auth/login-form';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react'; // For loading state

const LoginPage: NextPage = () => {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && currentUser) {
      router.replace('/diagram');
    }
  }, [currentUser, isLoading, router]);

  if (isLoading || (!isLoading && currentUser)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-foreground">Loading...</p>
      </div>
    );
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <LoginForm />
    </main>
  );
};

export default LoginPage;
