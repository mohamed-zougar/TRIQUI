import React from "react";
import { cn } from "@/lib/cn";

export function Card({
  children,
  className,
  padding = "md",
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { padding?: "none" | "sm" | "md" | "lg" }) {
  const padMap = {
    none: "",
    sm: "p-4",
    md: "p-5",
    lg: "p-6 sm:p-8",
  } as const;

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]",
        padMap[padding],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div>
        <h2 className="text-base font-semibold text-[var(--color-fg-primary)]">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
