import React from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "brand" | "success" | "info" | "warning" | "danger";

const TONE_STYLES: Record<Tone, string> = {
  neutral: "bg-[var(--color-surface-subtle)] text-[var(--color-fg-secondary)]",
  brand: "bg-[var(--color-brand-50)] text-[var(--color-brand-700)]",
  success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  info: "bg-[var(--color-info-soft)] text-[var(--color-info)]",
  warning: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase",
        TONE_STYLES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
