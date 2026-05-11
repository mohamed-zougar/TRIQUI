"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { ShipperPostForm } from "@/components/posts/ShipperPostForm";
import { authApi, postsApi } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";

export default function CreateShipperPostPage() {
  const router = useRouter();
  const { user, isReady } = useRequireAuth();
  const [defaultPhone, setDefaultPhone] = useState<string | null>(null);
  const [defaultVehicleType, setDefaultVehicleType] = useState<string | null>(null);
  const [defaultVehicleImage, setDefaultVehicleImage] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;
    let cancelled = false;
    (async () => {
      try {
        const { user: profile } = await authApi.getProfile();
        if (!cancelled) {
          setDefaultPhone(profile.phone || null);
          setDefaultVehicleType(profile.vehicleType || null);
          setDefaultVehicleImage(profile.vehicleImageUrl || null);
        }
      } catch {
        /* non-fatal */
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
          title="Offer a trip"
          description="Share your route, capacity and contact so clients can book with you."
          back={{ href: "/post" }}
        />

        <div className="mt-6">
          <ShipperPostForm
            submitLabel="Publish trip"
            defaultPhone={defaultPhone}
            defaultVehicleType={defaultVehicleType}
            defaultVehicleImage={defaultVehicleImage}
            onSubmit={async (values) => {
              await postsApi.createShipper(values);
              router.replace("/my-posts?tab=shipper");
            }}
            onCancel={() => router.back()}
          />
        </div>
      </div>
    </AppShell>
  );
}
