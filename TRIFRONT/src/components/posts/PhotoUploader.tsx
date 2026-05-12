"use client";

import React, { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { ApiError, storageApi } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";

export interface PhotoUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
  onError?: (message: string) => void;
  className?: string;
}

export function PhotoUploader({ value, onChange, onError, className }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await storageApi.upload(file);
      onChange(url);
    } catch (err) {
      onError?.(err instanceof ApiError ? err.message : "Unable to upload photo.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("flex items-start gap-3", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSelect}
        disabled={isUploading}
      />

      {value ? (
        <div className="relative h-28 w-28 overflow-hidden rounded-xl border border-[var(--color-border)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Upload preview" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remove photo"
            className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[var(--color-fg-primary)] shadow-sm hover:bg-white"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[var(--color-border-strong)] bg-white text-xs font-semibold text-[var(--color-fg-muted)] hover:border-[var(--color-brand-500)] hover:text-[var(--color-brand-600)] disabled:opacity-60"
      >
        {isUploading ? (
          <Spinner size={20} className="text-[var(--color-brand-500)]" />
        ) : (
          <>
            <Camera size={18} />
            <span>{value ? "Replace" : "Add photo"}</span>
          </>
        )}
      </button>
    </div>
  );
}
