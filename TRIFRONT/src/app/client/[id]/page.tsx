"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Pencil, Phone, Truck } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { ShipperPostCard } from "@/components/posts/PostCard";
import { RouteLine } from "@/components/posts/RouteLine";
import { ApiError, postsApi, type ClientPost, type ShipperPost } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/format";

interface Params {
  params: Promise<{ id: string }>;
}

export default function ClientPostDetailsPage({ params }: Params) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isReady } = useRequireAuth();
  const [post, setPost] = useState<ClientPost | null>(null);
  const [matches, setMatches] = useState<ShipperPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isReady) return;
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const [data, matchData] = await Promise.all([
          postsApi.getClient(id),
          postsApi.getClientMatches(id).catch(() => []),
        ]);
        if (!cancelled) {
          setPost(data);
          setMatches(matchData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Unable to load the request.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isReady, id]);

  if (!isReady || isLoading) {
    return (
      <AppShell user={user}>
        <div className="container-app py-10">
          <div className="flex justify-center">
            <Spinner size={28} className="text-[var(--color-brand-500)]" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !post) {
    return (
      <AppShell user={user}>
        <div className="container-app py-10">
          <PageHeader title="Request" back={{ href: "/client" }} />
          <Alert tone="error" className="mt-4">{error || "Request not found."}</Alert>
        </div>
      </AppShell>
    );
  }

  const author = post.users;
  const authorName = author
    ? author.account_type === "enterprise"
      ? author.company_name || `${author.first_name} ${author.last_name}`
      : `${author.first_name} ${author.last_name}`
    : "TriQI+ user";
  const isOwn = user && author && Number(author.id) === Number(user.id);
  const otherMatches = matches.filter((trip) => trip.id !== post.id);

  return (
    <AppShell user={user}>
      <div className="container-app py-6 sm:py-10">
        <PageHeader
          title="Request details"
          description="Review the request and contact the client if you can fulfill it."
          back={{ href: "/client" }}
          trailing={
            isOwn ? (
              <Link
                href={`/post/edit/client/${post.id}`}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-semibold text-[var(--color-fg-primary)] hover:bg-[var(--color-surface-subtle)]"
              >
                <Pencil size={14} />
                Edit
              </Link>
            ) : null
          }
        />

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_2fr]">
          <Card>
            <div className="flex items-start gap-3">
              <Avatar src={author?.image} name={authorName} size={56} />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-[var(--color-fg-primary)]">
                    {authorName}
                  </h2>
                  <Badge tone="info">Request</Badge>
                  {isOwn ? <Badge tone="brand">You</Badge> : null}
                </div>
                <p className="mt-1 text-xs text-[var(--color-fg-muted)]">
                  {author?.account_type === "enterprise" ? "Enterprise" : "Individual"} ·
                  Posted {formatDateTime(post.created_at)}
                </p>
              </div>
            </div>

            <hr className="my-5 border-[var(--color-border)]" />

            <RouteLine
              origin={post.origin_wilaya}
              origin_commune={post.origin_commune}
              destination={post.destination}
              destination_commune={post.destination_commune}
            />
          </Card>

          <div className="grid gap-5">
            {post.image ? (
              <Card padding="none" className="overflow-hidden">
                <div className="relative aspect-video w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.image}
                    alt="Cargo"
                    className="h-full w-full object-cover"
                  />
                </div>
              </Card>
            ) : null}

            <Card>
              <h3 className="text-sm font-semibold text-[var(--color-fg-primary)]">
                Shipment details
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-[var(--color-fg-muted)]">
                    Weight
                  </dt>
                  <dd className="mt-1 text-base font-semibold text-[var(--color-fg-primary)]">
                    {post.weight ? `${post.weight} kg` : "Not specified"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-[var(--color-fg-muted)]">
                    Volume
                  </dt>
                  <dd className="mt-1 text-base font-semibold text-[var(--color-fg-primary)]">
                    {post.volume ? `${post.volume} m³` : "Not specified"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-[var(--color-fg-muted)]">
                    Delivery date
                  </dt>
                  <dd className="mt-1 text-base font-semibold text-[var(--color-fg-primary)]">
                    {post.delivery_date ? formatDate(post.delivery_date) : "Flexible"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-[var(--color-fg-muted)]">
                    Posted
                  </dt>
                  <dd className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-fg-primary)]">
                    <Calendar size={14} className="text-[var(--color-fg-muted)]" />
                    {formatDateTime(post.created_at)}
                  </dd>
                </div>
              </dl>

              {post.description ? (
                <div className="mt-5 rounded-xl bg-[var(--color-surface-subtle)] p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
                    Description
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-fg-secondary)]">
                    {post.description}
                  </p>
                </div>
              ) : null}
            </Card>

            <Card>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-fg-primary)]">
                    Contact the client
                  </h3>
                  <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                    {post.phone ? post.phone : "Phone not provided."}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => router.back()}>
                    Back
                  </Button>
                  {post.phone ? (
                    <a
                      href={`tel:${post.phone}`}
                      className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--color-brand-500)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-brand-600)]"
                    >
                      <Phone size={16} />
                      Call client
                    </a>
                  ) : null}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {otherMatches.length > 0 ? (
          <section className="mt-10">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-brand-600)]">
                  <span className="inline-flex items-center gap-1.5">
                    <Truck size={14} />
                    Trips on this route
                  </span>
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-[var(--color-fg-primary)]">
                  Shippers heading {post.origin_wilaya} → {post.destination}
                </h2>
              </div>
              <Link
                href={`/shipper?origin=${encodeURIComponent(post.origin_wilaya)}&destination=${encodeURIComponent(post.destination)}`}
                className="text-sm font-semibold text-[var(--color-brand-600)] hover:underline"
              >
                See all
              </Link>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {otherMatches.map((trip) => (
                <ShipperPostCard
                  key={trip.id}
                  post={trip}
                  href={`/shipper/${trip.id}`}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
