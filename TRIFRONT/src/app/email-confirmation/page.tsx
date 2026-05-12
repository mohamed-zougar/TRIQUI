"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/ui/OtpInput";
import { AuthShell } from "@/components/layout/AuthShell";
import { authApi, ApiError } from "@/lib/api";

const RESEND_COOLDOWN_SECONDS = 60;

function EmailConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = window.setTimeout(() => setResendCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  const maskedEmail = email.replace(/(.{1,2})(.*)(@.*)/, "$1***$3");

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) {
      setError("Missing email. Restart the signup.");
      return;
    }
    if (code.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }

    setError("");
    setInfo("");
    setIsLoading(true);
    try {
      const response = await authApi.verifyEmail(email, code);
      // Store session token to auto-login user
      if (response.token) {
        window.localStorage.setItem("triqi_token", response.token);
      }
      // Store onboarding token for profile completion
      window.sessionStorage.setItem("triqi_onboarding_token", response.onboardingToken);
      router.replace("/onboarding");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendCountdown > 0 || isResending) return;
    setError("");
    setInfo("");
    setIsResending(true);
    try {
      await authApi.sendEmailOtp(email);
      setInfo("A new code has been sent.");
      setResendCountdown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to resend code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthShell
      title="Verify your email"
      subtitle={
        email
          ? `Enter the 6-digit code we sent to ${maskedEmail}.`
          : "Verify your email address to activate your account."
      }
      showBack
    >
      <form onSubmit={handleVerify} className="flex flex-col gap-5">
        <OtpInput value={code} onChange={setCode} autoFocus disabled={isLoading} />

        {info ? <Alert tone="success">{info}</Alert> : null}
        {error ? <Alert tone="error">{error}</Alert> : null}

        <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
          Verify and continue
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
              disabled={isResending}
              className="font-semibold text-[var(--color-brand-600)] hover:underline disabled:opacity-60"
            >
              {isResending ? "Sending…" : "Resend code"}
            </button>
          )}
        </div>
      </form>
    </AuthShell>
  );
}

export default function EmailConfirmationPage() {
  return (
    <Suspense fallback={null}>
      <EmailConfirmationContent />
    </Suspense>
  );
}
