// src/components/auth/login-form.tsx
"use client";

import type { FC } from 'react';
import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


const LoginForm: FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const { login, signup } = useAuth();
    const { toast } = useToast();

    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Email and Password cannot be empty.' });
            return;
        }
        setIsLoading(true);

        try {
            if (isLoginMode) {
                await login(email, password);
            } else {
                await signup(email, password);
            }
            // Navigation is handled by the auth context
        } catch (error: any) {
            // Since this is a mock, we shouldn't get errors, but this is good practice
            toast({ variant: 'destructive', title: 'Action Failed', description: 'An unexpected error occurred.' });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Card className="w-full max-w-md shadow-xl">
            <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-primary">{isLoginMode ? 'Figmatic Login' : 'Create an Account'}</CardTitle>
                <CardDescription>{isLoginMode ? 'Enter your credentials to access your diagrams.' : 'Create an account to start diagramming.'}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAuthAction} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            required
                            disabled={isLoading}
                            className="bg-input"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                            className="bg-input"
                        />
                    </div>
                    <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Please wait...
                            </>
                        ) : isLoginMode ? (
                            <>
                                <LogIn className="mr-2 h-5 w-5" /> Login
                            </>
                        ) : (
                            <>
                                <UserPlus className="mr-2 h-5 w-5" /> Sign Up
                            </>
                        )}
                    </Button>
                </form>

            </CardContent>
            <CardFooter className="flex justify-center p-4">
                <Button variant="link" onClick={() => setIsLoginMode(!isLoginMode)} className="text-sm">
                    {isLoginMode ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
                </Button>
            </CardFooter>
        </Card>
    );
};

export default LoginForm;
