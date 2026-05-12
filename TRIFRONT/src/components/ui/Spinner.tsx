import React from "react";
import { cn } from "@/lib/cn";

export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      style={{ width: size, height: size }}
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-current border-t-transparent",
        className
      )}
    />
  );
}

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-muted)]">
      <Spinner size={28} className="text-[var(--color-brand-500)]" />
    </div>
  );
}
