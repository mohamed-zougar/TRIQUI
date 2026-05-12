"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { ClientPostForm, clientPostToFormValues } from "@/components/posts/ClientPostForm";
import { ApiError, postsApi, type ClientPost } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

export default function EditClientPostPage({ params }: Params) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isReady } = useRequireAuth();
  const [post, setPost] = useState<ClientPost | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isReady) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const data = await postsApi.getClient(id);
        if (cancelled) return;
        setPost(data);
        const ownerId = data.users?.id ?? data.user;
        if (user && ownerId !== undefined && Number(ownerId) !== Number(user.id)) {
          setError("You can only edit your own requests.");
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
          title="Edit request"
          description="Update the details and republish."
          back={{ href: "/my-posts?tab=client" }}
        />

        {error ? (
          <Alert tone="error" className="mt-4">{error}</Alert>
        ) : null}

        {post && !error ? (
          <div className="mt-6">
            <ClientPostForm
              initialValues={clientPostToFormValues(post)}
              submitLabel="Save changes"
              onSubmit={async (values) => {
                await postsApi.updateClient(id, values);
                router.replace("/my-posts?tab=client");
              }}
              onCancel={() => router.back()}
            />
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
