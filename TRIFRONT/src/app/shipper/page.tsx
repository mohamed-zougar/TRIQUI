"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Truck } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PostCardSkeleton } from "@/components/ui/Skeleton";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { ShipperPostCard } from "@/components/posts/PostCard";
import { PostFilters, type PostFiltersValue } from "@/components/posts/PostFilters";
import { ApiError, postsApi, type ShipperPost } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";

const VEHICLE_FILTERS: Array<{ id: string; label: string }> = [
  { id: "", label: "All vehicles" },
  { id: "Motorcycle", label: "Motorcycle" },
  { id: "Small van", label: "Small van" },
  { id: "Medium van", label: "Medium van" },
  { id: "Large van", label: "Large van" },
  { id: "Truck", label: "Truck" },
];

export default function ShipperFeedPage() {
  const { user, isReady } = useRequireAuth();
  const isAdmin = user?.role === "admin";
  const [posts, setPosts] = useState<ShipperPost[]>([]);
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
  const [vehicleFilter, setVehicleFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const handleAdminDelete = useCallback(async (id: number) => {
    try {
      await postsApi.deleteShipper(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete post.");
    }
  }, []);

  const filtersKey = useMemo(
    () =>
      `${filters.query.trim()}|${filters.origin}|${filters.origin_commune}|${filters.destination}|${filters.destination_commune}|${filters.min_weight}|${filters.max_weight}|${filters.min_volume}|${filters.max_volume}|${filters.date_from}|${filters.date_to}|${vehicleFilter}`,
    [filters, vehicleFilter]
  );

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setError("");
      try {
        const data = await postsApi.listShipper({
          q: filters.query.trim() || undefined,
          origin_wilaya: filters.origin || undefined,
          origin_commune: filters.origin_commune || undefined,
          destination: filters.destination || undefined,
          destination_commune: filters.destination_commune || undefined,
          min_weight: filters.min_weight || undefined,
          max_weight: filters.max_weight || undefined,
          min_volume: filters.min_volume || undefined,
          max_volume: filters.max_volume || undefined,
          date_from: filters.date_from || undefined,
          date_to: filters.date_to || undefined,
          type: vehicleFilter || undefined,
        });
        if (!signal?.aborted) setPosts(data);
      } catch (err) {
        if (!signal?.aborted) {
          setError(err instanceof ApiError ? err.message : "Unable to load trips.");
        }
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [filters, vehicleFilter]
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
    filters.query.trim() || filters.origin || filters.origin_commune || filters.destination || filters.destination_commune || filters.min_weight || filters.min_volume || filters.date_from || filters.date_to || vehicleFilter
  );

  const vehicleSelector = (
    <div className="flex flex-wrap gap-2">
      {VEHICLE_FILTERS.map((option) => {
        const active = vehicleFilter === option.id;
        return (
          <button
            key={option.id || "all"}
            type="button"
            onClick={() => setVehicleFilter(option.id)}
            className={cn(
              "h-9 rounded-full border px-3 text-xs font-semibold transition-colors",
              active
                ? "border-[var(--color-brand-500)] bg-[var(--color-brand-500)] text-white"
                : "border-[var(--color-border)] bg-white text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-subtle)]"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <AppShell user={user}>
      <div className="container-app py-6 sm:py-10">
        <PageHeader
          title="Available trips"
          description="Find a shipper traveling your route."
        />

        <Card className="mt-6">
          <PostFilters
            value={filters}
            onChange={setFilters}
            searchPlaceholder="Search by shipper, vehicle, or wilaya"
            extra={vehicleSelector}
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
              icon={<Truck size={20} />}
              title={hasActiveFilters ? "No trips match" : "No trips yet"}
              description={
                hasActiveFilters
                  ? "Try a different route or clear the filters."
                  : "New trips are added daily — be the first to offer one."
              }
              action={
                hasActiveFilters ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
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
                      });
                      setVehicleFilter("");
                    }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  <Link
                    href="/post/shipper"
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--color-brand-500)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-brand-600)]"
                  >
                    <Plus size={16} />
                    Offer a trip
                  </Link>
                )
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => (
                <ShipperPostCard
                  key={post.id}
                  post={post}
                  href={`/shipper/${post.id}`}
                  isAdmin={isAdmin}
                  onAdminDelete={handleAdminDelete}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
