import React from "react";
import { cn } from "@/lib/cn";

export interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  alt?: string;
}

function initials(name?: string | null): string {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function Avatar({ src, name, size = 40, className, alt }: AvatarProps) {
  const dimension = `${size}px`;
  const fontSize = `${Math.max(11, Math.round(size * 0.38))}px`;
  return src ? (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt || name || "Profile picture"}
      style={{ width: dimension, height: dimension }}
      className={cn(
        "shrink-0 rounded-full border border-[var(--color-border)] object-cover",
        className
      )}
    />
  ) : (
    <span
      style={{ width: dimension, height: dimension, fontSize }}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-subtle)] font-semibold text-[var(--color-fg-secondary)]",
        className
      )}
      aria-label={name || "User initials"}
    >
      {initials(name) || "U"}
    </span>
  );
}
