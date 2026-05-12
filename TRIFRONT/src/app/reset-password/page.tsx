"use client";

import React, { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthShell } from "@/components/layout/AuthShell";
import { authApi, ApiError } from "@/lib/api";

const PASSWORD_MIN_LENGTH = 8;

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= PASSWORD_MIN_LENGTH) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (password.length === 0) return { score: 0, label: "" };
  if (score <= 2) return { score: 1, label: "Weak" };
  if (score === 3) return { score: 2, label: "Fair" };
  if (score === 4) return { score: 3, label: "Good" };
  return { score: 4, label: "Strong" };
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("This reset link is invalid. Please request a new one.");
      return;
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, password);
      router.replace("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password to protect your account." showBack>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={PASSWORD_MIN_LENGTH}
        />

        {password ? (
          <div>
            <div className="grid grid-cols-4 gap-1.5">
              {[0, 1, 2, 3].map((index) => (
                <span
                  key={index}
                  className={`h-1.5 rounded-full transition-colors ${
                    index < strength.score
                      ? strength.score === 1
                        ? "bg-[var(--color-danger)]"
                        : strength.score === 2
                          ? "bg-[var(--color-warning)]"
                          : strength.score === 3
                            ? "bg-[var(--color-info)]"
                            : "bg-[var(--color-success)]"
                      : "bg-[var(--color-border)]"
                  }`}
                />
              ))}
            </div>
            <p className="mt-1 text-xs font-medium text-[var(--color-fg-muted)]">
              Strength: <span className="text-[var(--color-fg-secondary)]">{strength.label}</span>
            </p>
          </div>
        ) : null}

        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          minLength={PASSWORD_MIN_LENGTH}
        />

        {error ? <Alert tone="error">{error}</Alert> : null}

        <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
          Update password
        </Button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
