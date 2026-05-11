"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";

export interface AuthShellProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthShell({
  title,
  subtitle,
  showBack = false,
  children,
  footer,
  className,
}: AuthShellProps) {
  const router = useRouter();
  return (
    <main className="min-h-screen bg-[var(--color-surface-muted)]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-8 pt-6 sm:max-w-lg sm:px-6 lg:max-w-xl">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[var(--color-fg-primary)]">
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-[var(--color-brand-500)]">Tri</span>QI+
            </span>
          </Link>
          {showBack ? (
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-subtle)]"
            >
              <ArrowLeft size={14} />
              Back
            </button>
          ) : null}
        </header>

        <section className="mt-8 sm:mt-10">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-fg-primary)] sm:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 text-sm leading-6 text-[var(--color-fg-muted)] sm:text-base">
              {subtitle}
            </p>
          ) : null}
        </section>

        <section
          className={cn(
            "mt-6 flex-1 rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-7",
            className
          )}
        >
          {children}
        </section>

        {footer ? <footer className="mt-6 text-center text-sm">{footer}</footer> : null}
      </div>
    </main>
  );
}
