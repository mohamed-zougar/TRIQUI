"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Package, Truck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { useRequireAuth } from "@/lib/auth";
import { Spinner } from "@/components/ui/Spinner";

export default function PostHubPage() {
  const { user, isReady } = useRequireAuth();

  if (!isReady) {
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

  return (
    <AppShell user={user}>
      <div className="container-app py-6 sm:py-10">
        <PageHeader
          title="Create a new post"
          description="Choose what you would like to publish."
          back={{ href: "/client" }}
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link href="/post/client" className="group">
            <Card className="h-full transition-shadow group-hover:shadow-[var(--shadow-elevated)]">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-brand-50)] text-[var(--color-brand-600)]">
                  <Package size={22} />
                </span>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-[var(--color-fg-primary)]">
                        Send a package
                      </h3>
                      <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                        Post a delivery request for shippers traveling your route.
                      </p>
                    </div>
                    <ArrowRight size={16} className="text-[var(--color-fg-muted)]" />
                  </div>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/post/shipper" className="group">
            <Card className="h-full transition-shadow group-hover:shadow-[var(--shadow-elevated)]">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-brand-50)] text-[var(--color-brand-600)]">
                  <Truck size={22} />
                </span>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-[var(--color-fg-primary)]">
                        Offer a trip
                      </h3>
                      <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                        Share your trip and earn from packages along the way.
                      </p>
                    </div>
                    <ArrowRight size={16} className="text-[var(--color-fg-muted)]" />
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
