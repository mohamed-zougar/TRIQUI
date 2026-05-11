"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthShell } from "@/components/layout/AuthShell";
import { authApi, ApiError } from "@/lib/api";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const response = await authApi.login({ identifier: identifier.trim(), password });
      router.replace(response.user.onboardingCompleted ? "/client" : "/onboarding");
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        const details = err.details as { code?: string; email?: string } | null;
        if (details?.code === "EMAIL_NOT_VERIFIED" && details.email) {
          router.replace(`/email-confirmation?email=${encodeURIComponent(details.email)}`);
          return;
        }
      }
      setError(err instanceof ApiError ? err.message : "Unable to log in.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      {/* Mobile exact replica of TRIQUI-_FRONT design */}
      <div className="flex flex-col h-full min-h-screen bg-white relative sm:hidden">
        {/* 1. Header Rouge "Welcome Back" */}
        <div className="bg-[#e8172c] pt-14 pb-20 px-6 rounded-b-3xl">
          <h1 className="text-white text-3xl font-bold text-center">Welcome Back</h1>
        </div>

        {/* 2. La carte blanche qui chevauche le header rouge */}
        <div className="flex-1 bg-white mx-5 -mt-8 rounded-t-3xl rounded-b-3xl shadow-lg p-6 flex flex-col z-10 mb-8">
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 gap-4 mt-2">
            <Input
              label="Email"
              placeholder="name@email.com"
              type="email"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />

            <Input
              label="Password"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {error ? (
              <div className="text-red-500 text-sm mt-2 text-center font-semibold bg-red-50 p-2 rounded-lg">
                {error}
              </div>
            ) : null}

            <div className="mt-8">
              <Button type="submit" fullWidth size="lg" isLoading={isLoading} className="bg-[#e8172c] text-white rounded-xl h-12 font-bold">
                Log In
              </Button>
            </div>

            <div className="text-center mt-4 mb-2">
            <Link href="/forgot-password" className="text-xs font-bold text-gray-800 hover:text-[#e8172c]">
              Forgot Password?
            </Link>
            </div>

            <div className="text-center mt-auto pb-4">
              <span className="text-xs text-gray-500 font-medium">Don't have an account? </span>
              <Link href="/signup" className="text-xs font-bold text-[#e8172c] hover:underline">
                Sign Up
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Desktop design (Existing AuthShell) */}
      <div className="hidden sm:block">
        <AuthShell
          title="Welcome back"
          subtitle="Log in to manage your shipments and trips."
          showBack
          footer={
            <span className="text-[var(--color-fg-muted)]">
              Don&rsquo;t have an account?{" "}
              <Link href="/signup" className="font-semibold text-[var(--color-brand-600)] hover:underline">
                Create one
              </Link>
            </span>
          }
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email or phone"
              placeholder="you@example.com or 6 12 34 56 78"
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {error ? <Alert tone="error">{error}</Alert> : null}

            <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
              Log in
            </Button>

            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-[var(--color-fg-secondary)] hover:text-[var(--color-brand-600)]"
              >
                Forgot password?
              </Link>
            </div>
          </form>
        </AuthShell>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
