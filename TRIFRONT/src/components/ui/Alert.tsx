import React from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "info" | "success" | "warning" | "error";

const TONE: Record<Tone, { container: string; icon: React.ReactNode }> = {
  info: {
    container: "bg-[var(--color-info-soft)] text-[var(--color-info)] border-blue-200",
    icon: <Info size={18} aria-hidden />,
  },
  success: {
    container: "bg-[var(--color-success-soft)] text-[var(--color-success)] border-green-200",
    icon: <CheckCircle2 size={18} aria-hidden />,
  },
  warning: {
    container: "bg-[var(--color-warning-soft)] text-[var(--color-warning)] border-amber-200",
    icon: <AlertTriangle size={18} aria-hidden />,
  },
  error: {
    container: "bg-[var(--color-danger-soft)] text-[var(--color-danger)] border-red-200",
    icon: <XCircle size={18} aria-hidden />,
  },
};

export function Alert({
  tone = "info",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  const config = TONE[tone];
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium",
        config.container,
        className
      )}
    >
      {config.icon}
      <p className="flex-1 leading-5">{children}</p>
    </div>
  );
}
