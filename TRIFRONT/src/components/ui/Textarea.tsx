import React, { useId } from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  errorMessage?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, errorMessage, className, id, rows = 4, ...rest },
  ref
) {
  const reactId = useId();
  const textareaId = id || reactId;
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label ? (
        <label htmlFor={textareaId} className="text-sm font-medium text-[var(--color-fg-secondary)]">
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={cn(
          "min-h-24 w-full resize-y rounded-xl border bg-white px-3 py-2.5 text-sm leading-6 text-[var(--color-fg-primary)] placeholder:text-[var(--color-fg-subtle)] outline-none transition-colors",
          errorMessage
            ? "border-[var(--color-danger)] focus:border-[var(--color-danger)]"
            : "border-[var(--color-border)] focus:border-[var(--color-brand-500)]"
        )}
        {...rest}
      />
      {errorMessage ? (
        <p className="text-xs font-medium text-[var(--color-danger)]">{errorMessage}</p>
      ) : hint ? (
        <p className="text-xs text-[var(--color-fg-muted)]">{hint}</p>
      ) : null}
    </div>
  );
});
