"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { ShipperPostForm, shipperPostToFormValues } from "@/components/posts/ShipperPostForm";
import { ApiError, postsApi, type ShipperPost } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

export default function EditShipperPostPage({ params }: Params) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isReady } = useRequireAuth();
  const [post, setPost] = useState<ShipperPost | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isReady) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const data = await postsApi.getShipper(id);
        if (cancelled) return;
        setPost(data);
        const ownerId = data.users?.id ?? data.user;
        if (user && ownerId !== undefined && Number(ownerId) !== Number(user.id)) {
          setError("You can only edit your own trips.");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Unable to load the trip.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isReady, user]);

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

  return (
    <AppShell user={user}>
      <div className="container-app py-6 sm:py-10">
        <PageHeader
          title="Edit trip"
          description="Update the details and republish."
          back={{ href: "/my-posts?tab=shipper" }}
        />

        {error ? (
          <Alert tone="error" className="mt-4">{error}</Alert>
        ) : null}

        {post && !error ? (
          <div className="mt-6">
            <ShipperPostForm
              initialValues={shipperPostToFormValues(post)}
              submitLabel="Save changes"
              onSubmit={async (values) => {
                await postsApi.updateShipper(id, values);
                router.replace("/my-posts?tab=shipper");
              }}
              onCancel={() => router.back()}
            />
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
