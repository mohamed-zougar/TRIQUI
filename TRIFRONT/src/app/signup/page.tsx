"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { AuthShell } from "@/components/layout/AuthShell";
import { authApi, ApiError, type AccountType } from "@/lib/api";
import { cn } from "@/lib/cn";

const PASSWORD_MIN_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormState {
  accountType: AccountType;
  firstName: string;
  lastName: string;
  contactFirstName: string;
  contactLastName: string;
  companyName: string;
  companyAddress: string;
  companyWebsite: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const EMPTY_STATE: FormState = {
  accountType: "individual",
  firstName: "",
  lastName: "",
  contactFirstName: "",
  contactLastName: "",
  companyName: "",
  companyAddress: "",
  companyWebsite: "",
  dateOfBirth: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_STATE);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isEnterprise = form.accountType === "enterprise";
  const phoneDigits = useMemo(() => digitsOnly(form.phone), [form.phone]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!EMAIL_PATTERN.test(form.email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (phoneDigits.length < 9) {
      setError("Enter a valid phone number.");
      return;
    }
    if (form.password.length < PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const email = form.email.trim().toLowerCase();
      
      // Normalize dateOfBirth from DD/MM/YYYY to YYYY-MM-DD
      let normalizedDate = null;
      if (form.dateOfBirth && form.dateOfBirth.includes("/")) {
        const [d, m, y] = form.dateOfBirth.split("/");
        if (d && m && y && y.length === 4) {
          normalizedDate = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        }
      }

      await authApi.register({
        accountType: form.accountType,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        contactFirstName: form.contactFirstName.trim(),
        contactLastName: form.contactLastName.trim(),
        companyName: form.companyName.trim(),
        companyAddress: form.companyAddress.trim(),
        companyWebsite: form.companyWebsite.trim(),
        dateOfBirth: normalizedDate || form.dateOfBirth,
        email,
        phone: form.phone.trim(),
        password: form.password,
      });

      router.push(`/email-confirmation?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Post requests, offer trips, and grow your network across Algeria."
      showBack
      footer={
        <span className="text-[var(--color-fg-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[var(--color-brand-600)] hover:underline">
            Log in
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <fieldset>
          <legend className="text-sm font-medium text-[var(--color-fg-secondary)]">
            Account type
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-[var(--color-surface-subtle)] p-1">
            {(["individual", "enterprise"] as AccountType[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setField("accountType", option)}
                className={cn(
                  "h-10 rounded-lg text-sm font-semibold capitalize transition-colors",
                  form.accountType === option
                    ? "bg-white text-[var(--color-fg-primary)] shadow-sm"
                    : "text-[var(--color-fg-muted)]"
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>

        {isEnterprise ? (
          <>
            <Input
              label="Company name"
              value={form.companyName}
              onChange={(e) => setField("companyName", e.target.value)}
              required
            />
            <Textarea
              label="Company address"
              rows={2}
              value={form.companyAddress}
              onChange={(e) => setField("companyAddress", e.target.value)}
              required
            />
            <Input
              label="Company website (optional)"
              type="url"
              placeholder="https://"
              value={form.companyWebsite}
              onChange={(e) => setField("companyWebsite", e.target.value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Contact first name"
                value={form.contactFirstName}
                onChange={(e) => setField("contactFirstName", e.target.value)}
                required
              />
              <Input
                label="Contact last name"
                value={form.contactLastName}
                onChange={(e) => setField("contactLastName", e.target.value)}
                required
              />
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="First name"
                value={form.firstName}
                onChange={(e) => setField("firstName", e.target.value)}
                required
              />
              <Input
                label="Last name"
                value={form.lastName}
                onChange={(e) => setField("lastName", e.target.value)}
                required
              />
            </div>
            <Input
              label="Date of birth (optional)"
              type="text"
              placeholder="DD/MM/YYYY"
              value={form.dateOfBirth}
              onChange={(e) => {
                let val = e.target.value.replace(/\D/g, "");
                if (val.length > 8) val = val.slice(0, 8);
                if (val.length > 4) {
                  val = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`;
                } else if (val.length > 2) {
                  val = `${val.slice(0, 2)}/${val.slice(2)}`;
                }
                setField("dateOfBirth", val);
              }}
            />
          </>
        )}

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setField("email", e.target.value)}
          required
        />

        <Input
          label="Phone"
          type="tel"
          inputMode="tel"
          leftAddon="+213"
          placeholder="6 12 34 56 78"
          value={form.phone}
          onChange={(e) => setField("phone", e.target.value)}
          required
        />

        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          hint={`At least ${PASSWORD_MIN_LENGTH} characters`}
          value={form.password}
          onChange={(e) => setField("password", e.target.value)}
          required
          minLength={PASSWORD_MIN_LENGTH}
        />

        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={(e) => setField("confirmPassword", e.target.value)}
          required
          minLength={PASSWORD_MIN_LENGTH}
        />

        {error ? <Alert tone="error">{error}</Alert> : null}

        <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
          Create account
        </Button>

        <p className="text-center text-xs text-[var(--color-fg-muted)]">
          By signing up you agree to TriQI+&rsquo;s Terms of Service and Privacy Policy.
        </p>
      </form>
    </AuthShell>
  );
}
