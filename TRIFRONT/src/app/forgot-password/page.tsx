"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthShell } from "@/components/layout/AuthShell";
import { authApi, ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      router.push(`/otp?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to send code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We will email a 6-digit code to verify it’s you."
      showBack
      footer={
        <Link href="/login" className="font-semibold text-[var(--color-brand-600)] hover:underline">
          Back to login
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
          Send verification code
        </Button>
      </form>
    </AuthShell>
  );
}
