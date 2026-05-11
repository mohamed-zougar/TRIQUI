"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { ClientPostForm } from "@/components/posts/ClientPostForm";
import { authApi, postsApi } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";

export default function CreateClientPostPage() {
  const router = useRouter();
  const { user, isReady } = useRequireAuth();
  const [defaultPhone, setDefaultPhone] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;
    let cancelled = false;
    (async () => {
      try {
        const { user: profile } = await authApi.getProfile();
        if (!cancelled) setDefaultPhone(profile.phone || null);
      } catch {
        /* non-fatal — user can type the phone manually */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isReady]);

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
          title="Post a delivery request"
          description="Tell shippers what you need to send and where it&rsquo;s going."
          back={{ href: "/post" }}
        />

        <div className="mt-6">
          <ClientPostForm
            submitLabel="Publish request"
            defaultPhone={defaultPhone}
            onSubmit={async (values) => {
              await postsApi.createClient(values);
              router.replace("/my-posts?tab=client");
            }}
            onCancel={() => router.back()}
          />
        </div>
      </div>
    </AppShell>
  );
}
