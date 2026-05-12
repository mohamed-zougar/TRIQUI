"use client";

import Link from "next/link";
import React, { useState } from "react";
import { ArrowRight, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { RouteLine } from "@/components/posts/RouteLine";
import { formatDate, formatRelativeTime } from "@/lib/format";
import type { ClientPost, ShipperPost } from "@/lib/api";

function authorName(post: ClientPost | ShipperPost): string {
  const user = post.users;
  if (!user) return "TriQI+ user";
  if (user.account_type === "enterprise" && user.company_name) return user.company_name;
  return `${user.first_name} ${user.last_name}`.trim() || "TriQI+ user";
}

function joinMeta(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(" · ");
}

function AdminDeleteButton({ onDelete }: { onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={async () => {
            setLoading(true);
            await onDelete();
            setLoading(false);
            setConfirming(false);
          }}
          disabled={loading}
          className="inline-flex h-7 items-center gap-1 rounded-lg bg-red-600 px-2.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "…" : "Confirm"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="inline-flex h-7 items-center rounded-lg border border-[var(--color-border)] bg-white px-2.5 text-xs font-semibold text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-subtle)]"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      title="Admin: delete this post"
      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
    >
      <Trash2 size={13} />
    </button>
  );
}

export function ClientPostCard({
  post,
  href,
  isAdmin,
  onAdminDelete,
}: {
  post: ClientPost;
  href: string;
  isAdmin?: boolean;
  onAdminDelete?: (id: number) => void;
}) {
  const meta = joinMeta([
    post.weight ? `${post.weight} kg` : null,
    post.volume ? `${post.volume} m³` : null,
    post.delivery_date ? `By ${formatDate(post.delivery_date)}` : null,
  ]);

  return (
    <Card padding="sm" className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <Avatar src={post.users?.image} name={authorName(post)} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--color-fg-primary)]">
              {authorName(post)}
            </h3>
            <Badge tone="info">Request</Badge>
          </div>
          <p className="mt-1 text-xs text-[var(--color-fg-muted)]">
            {post.users?.account_type === "enterprise" ? "Enterprise" : "Individual"}
            {meta ? ` · ${meta}` : ""}
          </p>
        </div>
        {isAdmin && onAdminDelete && (
          <AdminDeleteButton onDelete={() => onAdminDelete(post.id)} />
        )}
      </div>

      <RouteLine
        origin={post.origin_wilaya}
        origin_commune={post.origin_commune}
        destination={post.destination}
        destination_commune={post.destination_commune}
      />

      {post.description ? (
        <p className="line-clamp-3 text-sm text-[var(--color-fg-secondary)]">{post.description}</p>
      ) : null}

      <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-fg-muted)]">
        <span>{formatRelativeTime(post.created_at) || "Just posted"}</span>
        <Link
          href={href}
          className="inline-flex h-9 items-center gap-1 rounded-lg bg-[var(--color-brand-500)] px-3.5 text-xs font-semibold text-white hover:bg-[var(--color-brand-600)]"
        >
          View details
          <ArrowRight size={14} />
        </Link>
      </div>
    </Card>
  );
}

export function ShipperPostCard({
  post,
  href,
  isAdmin,
  onAdminDelete,
}: {
  post: ShipperPost;
  href: string;
  isAdmin?: boolean;
  onAdminDelete?: (id: number) => void;
}) {
  const meta = joinMeta([
    post.type,
    post.weight ? `${post.weight} kg` : null,
    post.volume ? `${post.volume} m³` : null,
    post.availability_date ? `Departs ${formatDate(post.availability_date)}` : null,
  ]);

  return (
    <Card padding="sm" className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <Avatar src={post.users?.image} name={authorName(post)} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--color-fg-primary)]">
              {authorName(post)}
            </h3>
            <Badge tone="brand">Trip</Badge>
          </div>
          <p className="mt-1 text-xs text-[var(--color-fg-muted)]">
            {post.users?.account_type === "enterprise" ? "Enterprise" : "Individual"}
            {meta ? ` · ${meta}` : ""}
          </p>
        </div>
        {isAdmin && onAdminDelete && (
          <AdminDeleteButton onDelete={() => onAdminDelete(post.id)} />
        )}
      </div>

      <RouteLine
        origin={post.origin_wilaya}
        origin_commune={post.origin_commune}
        destination={post.destination}
        destination_commune={post.destination_commune}
        passages={post.wilaya_passage || []}
      />

      {post.description ? (
        <p className="line-clamp-3 text-sm text-[var(--color-fg-secondary)]">{post.description}</p>
      ) : null}

      <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-fg-muted)]">
        <span>{formatRelativeTime(post.created_at) || "Just posted"}</span>
        <Link
          href={href}
          className="inline-flex h-9 items-center gap-1 rounded-lg bg-[var(--color-brand-500)] px-3.5 text-xs font-semibold text-white hover:bg-[var(--color-brand-600)]"
        >
          View details
          <ArrowRight size={14} />
        </Link>
      </div>
    </Card>
  );
}
