"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectProps {
  label?: string;
  hint?: string;
  errorMessage?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  disabled?: boolean;
  className?: string;
  filter?: (query: string, value: string) => boolean;
}

const defaultFilter = (query: string, value: string) =>
  value.toLowerCase().includes(query.toLowerCase());

export function Select({
  label,
  hint,
  errorMessage,
  placeholder = "Select an option",
  value,
  onChange,
  options,
  disabled = false,
  className,
  filter = defaultFilter,
}: SelectProps) {
  const reactId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = useMemo(() => {
    if (!query) return options;
    return options.filter((option) => filter(query, option));
  }, [options, query, filter]);

  const handleSelect = (option: string) => {
    onChange(option);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className={cn("relative flex flex-col gap-1", className)}>
      {label ? (
        <label htmlFor={reactId} className="text-sm font-medium text-[var(--color-fg-secondary)]">
          {label}
        </label>
      ) : null}

      <div
        className={cn(
          "flex h-11 items-center gap-2 rounded-xl border bg-white px-3 text-sm transition-colors",
          errorMessage
            ? "border-[var(--color-danger)] focus-within:border-[var(--color-danger)]"
            : "border-[var(--color-border)] focus-within:border-[var(--color-brand-500)]",
          disabled && "bg-[var(--color-surface-subtle)] text-[var(--color-fg-muted)]"
        )}
      >
        <input
          id={reactId}
          ref={inputRef}
          type="text"
          autoComplete="off"
          value={open ? query : value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          className="flex-1 min-w-0 bg-transparent text-[var(--color-fg-primary)] placeholder:text-[var(--color-fg-subtle)] outline-none"
        />
        {value && !disabled ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setQuery("");
              inputRef.current?.focus();
            }}
            className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg-primary)]"
            aria-label="Clear selection"
          >
            <X size={16} />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {
            if (disabled) return;
            setOpen((v) => !v);
            inputRef.current?.focus();
          }}
          className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg-primary)]"
          aria-label="Toggle options"
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {open && !disabled ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-elevated)]">
          <div className="max-h-60 overflow-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-[var(--color-fg-muted)]">No matches.</p>
            ) : (
              filtered.map((option) => {
                const isSelected = option === value;
                return (
                  <button
                    type="button"
                    key={option}
                    onClick={() => handleSelect(option)}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors",
                      isSelected
                        ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)]"
                        : "text-[var(--color-fg-primary)] hover:bg-[var(--color-surface-subtle)]"
                    )}
                  >
                    <span>{option}</span>
                    {isSelected ? <Check size={14} /> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <p className="text-xs font-medium text-[var(--color-danger)]">{errorMessage}</p>
      ) : hint ? (
        <p className="text-xs text-[var(--color-fg-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

export interface MultiSelectProps {
  label?: string;
  hint?: string;
  placeholder?: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: readonly string[];
  className?: string;
  filter?: (query: string, value: string) => boolean;
}

export function MultiSelect({
  label,
  hint,
  placeholder = "Add",
  values,
  onChange,
  options,
  className,
  filter = defaultFilter,
}: MultiSelectProps) {
  const reactId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = useMemo(() => {
    if (!query) return options;
    return options.filter((option) => filter(query, option));
  }, [options, query, filter]);

  const toggle = (option: string) => {
    onChange(values.includes(option) ? values.filter((v) => v !== option) : [...values, option]);
  };

  const remove = (option: string) => onChange(values.filter((v) => v !== option));

  return (
    <div ref={containerRef} className={cn("relative flex flex-col gap-1", className)}>
      {label ? (
        <label htmlFor={reactId} className="text-sm font-medium text-[var(--color-fg-secondary)]">
          {label}
        </label>
      ) : null}

      <div className="rounded-xl border border-[var(--color-border)] bg-white p-2 transition-colors focus-within:border-[var(--color-brand-500)]">
        {values.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {values.map((value) => (
              <button
                type="button"
                key={value}
                onClick={() => remove(value)}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-50)] px-2.5 py-1 text-xs font-medium text-[var(--color-brand-700)]"
              >
                {value}
                <X size={12} />
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <input
            id={reactId}
            type="text"
            autoComplete="off"
            value={query}
            placeholder={placeholder}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="flex-1 min-w-0 bg-transparent text-sm text-[var(--color-fg-primary)] placeholder:text-[var(--color-fg-subtle)] outline-none"
          />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg-primary)]"
            aria-label="Toggle options"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-elevated)]">
          <div className="max-h-60 overflow-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-[var(--color-fg-muted)]">No matches.</p>
            ) : (
              filtered.map((option) => {
                const isSelected = values.includes(option);
                return (
                  <button
                    type="button"
                    key={option}
                    onClick={() => toggle(option)}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors",
                      isSelected
                        ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)]"
                        : "text-[var(--color-fg-primary)] hover:bg-[var(--color-surface-subtle)]"
                    )}
                  >
                    <span>{option}</span>
                    {isSelected ? <Check size={14} /> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}

      {hint ? <p className="text-xs text-[var(--color-fg-muted)]">{hint}</p> : null}
    </div>
  );
}
