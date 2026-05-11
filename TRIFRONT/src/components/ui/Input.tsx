"use client";

import React, { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  errorMessage?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, errorMessage, leftAddon, rightAddon, className, type = "text", id, ...rest },
  ref
) {
  const reactId = useId();
  const inputId = id || reactId;
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (visible ? "text" : "password") : type;

  // Force placeholder for date inputs to show format hint
  const placeholder = rest.placeholder || (type === "date" ? "DD/MM/YYYY" : undefined);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-fg-secondary)]">
          {label}
        </label>
      ) : null}

      <div
        className={cn(
          "flex h-11 items-center gap-2 rounded-xl border bg-white px-3 text-sm transition-colors",
          errorMessage
            ? "border-[var(--color-danger)] focus-within:border-[var(--color-danger)]"
            : "border-[var(--color-border)] focus-within:border-[var(--color-brand-500)]",
          rest.disabled && "bg-[var(--color-surface-subtle)] text-[var(--color-fg-muted)]"
        )}
      >
        {leftAddon ? (
          <span className="text-sm text-[var(--color-fg-muted)] shrink-0">{leftAddon}</span>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          type={inputType}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent text-[var(--color-fg-primary)] placeholder:text-[var(--color-fg-subtle)] outline-none [color-scheme:light] [&::-webkit-calendar-picker-indicator]:invert-[0.2] [&::-webkit-calendar-picker-indicator]:hue-rotate-[320deg] [&::-webkit-calendar-picker-indicator]:brightness-[0.8]"
          {...rest}
        />

        {isPassword ? (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg-primary)]"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        ) : null}

        {!isPassword && rightAddon ? (
          <span className="text-sm text-[var(--color-fg-muted)] shrink-0">{rightAddon}</span>
        ) : null}
      </div>

      {errorMessage ? (
        <p className="text-xs font-medium text-[var(--color-danger)]">{errorMessage}</p>
      ) : hint ? (
        <p className="text-xs text-[var(--color-fg-muted)]">{hint}</p>
      ) : null}
    </div>
  );
});
