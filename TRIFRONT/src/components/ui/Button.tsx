import React from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  isLoading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const VARIANT_STYLES: Record<Variant, string> = {
  primary:
    "bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)] active:bg-[var(--color-brand-700)] disabled:bg-[var(--color-brand-300)] shadow-sm",
  secondary:
    "bg-[var(--color-fg-primary)] text-white hover:bg-slate-800 active:bg-slate-900 disabled:bg-slate-400",
  outline:
    "border border-[var(--color-border)] bg-white text-[var(--color-fg-primary)] hover:bg-[var(--color-surface-subtle)] disabled:opacity-60",
  ghost:
    "bg-transparent text-[var(--color-fg-primary)] hover:bg-[var(--color-surface-subtle)] disabled:opacity-60",
  danger:
    "bg-[var(--color-danger)] text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-300",
};

const SIZE_STYLES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    fullWidth = false,
    isLoading = false,
    iconLeft,
    iconRight,
    className,
    children,
    disabled,
    type = "button",
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed",
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        fullWidth && "w-full",
        className
      )}
      {...rest}
    >
      {isLoading ? (
        <span
          aria-hidden
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        iconLeft
      )}
      <span>{children}</span>
      {!isLoading && iconRight}
    </button>
  );
});
