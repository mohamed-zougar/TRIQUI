"use client";

import React, { useEffect, useRef } from "react";

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
}

export function OtpInput({ length = 6, value, onChange, autoFocus = false, disabled = false }: OtpInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (autoFocus) {
      inputs.current[0]?.focus();
    }
  }, [autoFocus]);

  const digits = value.padEnd(length, " ").split("").slice(0, length);

  const setDigit = (index: number, char: string) => {
    const sanitized = char.replace(/\D/g, "");
    const next = (value.padEnd(length, " ").split("").slice(0, length));
    next[index] = sanitized || " ";
    const nextValue = next.join("").trimEnd();
    onChange(nextValue.replace(/\s/g, ""));
    if (sanitized && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index].trim() && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      inputs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, length - 1);
    inputs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex justify-between gap-2" onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            inputs.current[index] = node;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          value={digit.trim()}
          onChange={(event) => setDigit(index, event.target.value.slice(-1))}
          onKeyDown={(event) => handleKeyDown(index, event)}
          className="h-14 w-12 rounded-xl border border-[var(--color-border)] bg-white text-center text-xl font-semibold text-[var(--color-fg-primary)] outline-none transition-colors focus:border-[var(--color-brand-500)] sm:w-14"
        />
      ))}
    </div>
  );
}
