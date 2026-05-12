"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Package, Pencil, Plus, Trash2, Truck } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PostCardSkeleton } from "@/components/ui/Skeleton";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { RouteLine } from "@/components/posts/RouteLine";
import { ApiError, postsApi, type ClientPost, type ShipperPost } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";

type Tab = "client" | "shipper";

function joinMeta(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(" · ");
}

function MyPostsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const initialTab = params.get("tab") === "shipper" ? "shipper" : "client";
  const [tab, setTab] = useState<Tab>(initialTab);
  const { user, isReady } = useRequireAuth();

  const [clientPosts, setClientPosts] = useState<ClientPost[]>([]);
  const [shipperPosts, setShipperPosts] = useState<ShipperPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; type: Tab } | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await postsApi.listMine();
      setClientPosts(data.clientPosts);
      setShipperPosts(data.shipperPosts);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load your posts.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isReady) load();
  }, [isReady, load]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { id, type } = confirmDelete;
    setDeletingId(id);
    setConfirmDelete(null);
    try {
      if (type === "client") {
        await postsApi.deleteClient(id);
        setClientPosts((posts) => posts.filter((p) => p.id !== id));
      } else {
        await postsApi.deleteShipper(id);
        setShipperPosts((posts) => posts.filter((p) => p.id !== id));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete the post.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteClient = (id: number) => {
    setConfirmDelete({ id, type: "client" });
  };

  const handleDeleteShipper = (id: number) => {
    setConfirmDelete({ id, type: "shipper" });
  };

  const counts = useMemo(
    () => ({ client: clientPosts.length, shipper: shipperPosts.length }),
    [clientPosts.length, shipperPosts.length]
  );

  return (
    <AppShell user={user}>
      <div className="container-app py-6 sm:py-10">
        <PageHeader
          title="My posts"
          description="Manage the requests and trips you have published."
        />

        <div className="mt-6 inline-flex rounded-xl bg-[var(--color-surface-subtle)] p-1 text-sm font-semibold">
          {(
            [
              { id: "client", label: `Requests (${counts.client})` },
              { id: "shipper", label: `Trips (${counts.shipper})` },
            ] as Array<{ id: Tab; label: string }>
          ).map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setTab(entry.id)}
              className={cn(
                "h-9 rounded-lg px-4 transition-colors",
                tab === entry.id
                  ? "bg-white text-[var(--color-fg-primary)] shadow-sm"
                  : "text-[var(--color-fg-muted)]"
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>

        {error ? <Alert tone="error" className="mt-4">{error}</Alert> : null}

        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm animate-in zoom-in-95 duration-200">
              <Card padding="lg" className="shadow-xl">
                <div className="flex flex-col gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-[var(--color-danger)]">
                    <Trash2 size={24} />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-[var(--color-fg-primary)]">Confirm Deletion</h3>
                    <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                      Are you sure you want to delete this {confirmDelete.type === "client" ? "request" : "trip"}? 
                      This action cannot be undone.
                    </p>
                  </div>

                  <div className="mt-2 flex flex-col gap-2">
                    <Button
                      className="w-full bg-[var(--color-danger)] text-white border-none"
                      onClick={handleDelete}
                    >
                      Delete Forever
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-fg-primary)]"
                      onClick={() => setConfirmDelete(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        <div className="mt-6">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <PostCardSkeleton key={index} />
              ))}
            </div>
          ) : tab === "client" ? (
            <ClientList
              posts={clientPosts}
              deletingId={deletingId}
              onDelete={handleDeleteClient}
              onView={(id) => router.push(`/client/${id}`)}
              onEdit={(id) => router.push(`/post/edit/client/${id}`)}
            />
          ) : (
            <ShipperList
              posts={shipperPosts}
              deletingId={deletingId}
              onDelete={handleDeleteShipper}
              onView={(id) => router.push(`/shipper/${id}`)}
              onEdit={(id) => router.push(`/post/edit/shipper/${id}`)}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}

function ClientList({
  posts,
  deletingId,
  onDelete,
  onView,
  onEdit,
}: {
  posts: ClientPost[];
  deletingId: number | null;
  onDelete: (id: number) => void;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
}) {
  if (posts.length === 0) {
    return (
      <EmptyState
        icon={<Package size={20} />}
        title="No requests yet"
        description="Create your first request and shippers traveling your route will see it."
        action={
          <Link
            href="/post/client"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--color-brand-500)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-brand-600)]"
          >
            <Plus size={16} />
            Post a request
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {posts.map((post) => {
        const meta = joinMeta([
          post.weight ? `${post.weight} kg` : null,
          post.volume ? `${post.volume} m³` : null,
        ]);
        return (
          <Card key={post.id} padding="sm" className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-2">
              <Badge tone="info">Request</Badge>
              <span className="text-xs text-[var(--color-fg-muted)]">
                {formatRelativeTime(post.created_at) || "Recently"}
              </span>
            </div>
            <RouteLine origin={post.origin_wilaya} destination={post.destination} />
            {meta ? (
              <p className="text-sm text-[var(--color-fg-secondary)]">{meta}</p>
            ) : null}
            {post.description ? (
              <p className="line-clamp-2 text-sm text-[var(--color-fg-muted)]">{post.description}</p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] pt-3">
              <Button variant="ghost" size="sm" onClick={() => onView(post.id)}>
                View
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  iconLeft={<Pencil size={14} />}
                  onClick={() => onEdit(post.id)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  iconLeft={<Trash2 size={14} />}
                  onClick={() => onDelete(post.id)}
                  isLoading={deletingId === post.id}
                  className="text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function ShipperList({
  posts,
  deletingId,
  onDelete,
  onView,
  onEdit,
}: {
  posts: ShipperPost[];
  deletingId: number | null;
  onDelete: (id: number) => void;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
}) {
  if (posts.length === 0) {
    return (
      <EmptyState
        icon={<Truck size={20} />}
        title="No trips yet"
        description="Publish a trip to fill unused space along your route."
        action={
          <Link
            href="/post/shipper"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--color-brand-500)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-brand-600)]"
          >
            <Plus size={16} />
            Offer a trip
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {posts.map((post) => {
        const meta = joinMeta([
          post.type,
          post.weight ? `${post.weight} kg` : null,
          post.volume ? `${post.volume} m³` : null,
        ]);
        return (
          <Card key={post.id} padding="sm" className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-2">
              <Badge tone="brand">Trip</Badge>
              <span className="text-xs text-[var(--color-fg-muted)]">
                {formatRelativeTime(post.created_at) || "Recently"}
              </span>
            </div>
            <RouteLine
              origin={post.origin_wilaya}
              destination={post.destination}
              passages={post.wilaya_passage || []}
            />
            {meta ? (
              <p className="text-sm text-[var(--color-fg-secondary)]">{meta}</p>
            ) : null}
            {post.description ? (
              <p className="line-clamp-2 text-sm text-[var(--color-fg-muted)]">{post.description}</p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] pt-3">
              <Button variant="ghost" size="sm" onClick={() => onView(post.id)}>
                View
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  iconLeft={<Pencil size={14} />}
                  onClick={() => onEdit(post.id)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  iconLeft={<Trash2 size={14} />}
                  onClick={() => onDelete(post.id)}
                  isLoading={deletingId === post.id}
                  className="text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export default function MyPostsPage() {
  return (
    <Suspense fallback={null}>
      <MyPostsContent />
    </Suspense>
  );
}

