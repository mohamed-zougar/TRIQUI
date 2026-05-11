"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/ui/OtpInput";
import { AuthShell } from "@/components/layout/AuthShell";
import { authApi, ApiError } from "@/lib/api";

function OtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = window.setTimeout(() => setResendCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  const maskedEmail = email.replace(/(.{1,2})(.*)(@.*)/, "$1***$3");

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) {
      setError("Missing email. Please request a new code.");
      return;
    }
    if (code.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      const response = await authApi.verifyResetOtp(email, code);
      router.push(`/reset-password?token=${encodeURIComponent(response.resetToken)}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendCountdown > 0) return;
    setError("");
    try {
      await authApi.forgotPassword(email);
      setResendCountdown(60);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to resend code.");
    }
  };

  return (
    <AuthShell
      title="Enter verification code"
      subtitle={
        email
          ? `We sent a 6-digit code to ${maskedEmail}.`
          : "Verify the code we sent to your email."
      }
      showBack
    >
      <form onSubmit={handleVerify} className="flex flex-col gap-5">
        <OtpInput value={code} onChange={setCode} autoFocus disabled={isLoading} />

        {error ? <Alert tone="error">{error}</Alert> : null}

        <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
          Verify code
        </Button>

        <div className="text-center text-sm">
          {resendCountdown > 0 ? (
            <span className="text-[var(--color-fg-muted)]">
              Resend available in <strong>{resendCountdown}s</strong>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="font-semibold text-[var(--color-brand-600)] hover:underline"
            >
              Resend code
            </button>
          )}
        </div>
      </form>
    </AuthShell>
  );
}

export default function OtpPage() {
  return (
    <Suspense fallback={null}>
      <OtpContent />
    </Suspense>
  );
}
