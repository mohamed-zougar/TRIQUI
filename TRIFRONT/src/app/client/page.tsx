"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Package, Plus } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PostCardSkeleton } from "@/components/ui/Skeleton";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { ClientPostCard } from "@/components/posts/PostCard";
import { PostFilters, type PostFiltersValue } from "@/components/posts/PostFilters";
import { ApiError, postsApi, type ClientPost } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";

export default function ClientFeedPage() {
  const { user, isReady } = useRequireAuth();
  const [posts, setPosts] = useState<ClientPost[]>([]);
  const [filters, setFilters] = useState<PostFiltersValue>({
    query: "",
    origin: "",
    origin_commune: "",
    destination: "",
    destination_commune: "",
    min_weight: "",
    max_weight: "",
    min_volume: "",
    max_volume: "",
    date_from: "",
    date_to: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const filtersKey = useMemo(
    () => `${filters.query.trim()}|${filters.origin}|${filters.origin_commune}|${filters.destination}|${filters.destination_commune}|${filters.min_weight}|${filters.max_weight}|${filters.min_volume}|${filters.max_volume}|${filters.date_from}|${filters.date_to}|${filters.vehicle_type}`,
    [filters]
  );

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setError("");
      try {
        const data = await postsApi.listClient({
          q: filters.query.trim() || undefined,
          origin_wilaya: filters.origin || undefined,
          origin_commune: filters.origin_commune || undefined,
          destination: filters.destination || undefined,
          destination_commune: filters.destination_commune || undefined,
          vehicle_type: filters.vehicle_type || undefined,
          min_weight: filters.min_weight || undefined,
          max_weight: filters.max_weight || undefined,
          min_volume: filters.min_volume || undefined,
          max_volume: filters.max_volume || undefined,
          date_from: filters.date_from || undefined,
          date_to: filters.date_to || undefined,
        });
        if (!signal?.aborted) setPosts(data);
      } catch (err) {
        if (!signal?.aborted) {
          setError(err instanceof ApiError ? err.message : "Unable to load requests.");
        }
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    if (!isReady) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      load(controller.signal);
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [filtersKey, isReady, load]);

  const hasActiveFilters = Boolean(
    filters.query.trim() || filters.origin || filters.origin_commune || filters.destination || filters.destination_commune || filters.min_weight || filters.min_volume || filters.date_from || filters.date_to || filters.vehicle_type
  );

  return (
    <AppShell user={user}>
      <div className="container-app py-6 sm:py-10">
        <PageHeader
          title="Delivery requests"
          description="Browse what clients across Algeria are sending."
        />

        <Card className="mt-6">
          <PostFilters
            value={filters}
            onChange={setFilters}
            searchPlaceholder="Search by description or wilaya"
          />
        </Card>

        <section className="mt-6">
          {error ? <Alert tone="error" className="mb-4">{error}</Alert> : null}

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <PostCardSkeleton key={index} />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <EmptyState
              icon={<Package size={20} />}
              title={hasActiveFilters ? "No requests match" : "No requests yet"}
              description={
                hasActiveFilters
                  ? "Try widening your search — clear filters or change the route."
                  : "Once clients post deliveries, they will appear here."
              }
              action={
                hasActiveFilters ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFilters({
                        query: "",
                        origin: "",
                        origin_commune: "",
                        destination: "",
                        destination_commune: "",
                        min_weight: "",
                        min_volume: "",
                        date_from: "",
                        date_to: "",
                      })
                    }
                  >
                    Clear filters
                  </Button>
                ) : (
                  <Link
                    href="/post/client"
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--color-brand-500)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-brand-600)]"
                  >
                    <Plus size={16} />
                    Post the first request
                  </Link>
                )
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => (
                <ClientPostCard key={post.id} post={post} href={`/client/${post.id}`} />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
