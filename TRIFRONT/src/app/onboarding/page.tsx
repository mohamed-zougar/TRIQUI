"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AuthShell } from "@/components/layout/AuthShell";
import { authApi, ApiError, storageApi, type AccountType } from "@/lib/api";
import { WILAYAS } from "@/lib/wilayas";

const VEHICLE_TYPES = ["Motorcycle", "Small van", "Medium van", "Large van", "Truck"] as const;
const COMPANY_SIZES = [
  "1-5 employees",
  "6-20 employees",
  "21-50 employees",
  "51-200 employees",
  "200+ employees",
] as const;
const DELIVERY_FOCUS = [
  "Documents and small parcels",
  "Furniture and home goods",
  "Electronics",
  "E-commerce orders",
  "Food and groceries",
  "Bulk freight",
] as const;

function decodeJwtPayload<T>(token: string): T | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const json =
      typeof atob === "function"
        ? atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
        : Buffer.from(parts[1], "base64").toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

function OnboardingContent() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const vehicleFileInputRef = useRef<HTMLInputElement | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<AccountType>("individual");

  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [vehicleImageUrl, setVehicleImageUrl] = useState<string | null>(null);
  const [operatingCity, setOperatingCity] = useState("");
  const [deliveryFocus, setDeliveryFocus] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [averageDailyOrders, setAverageDailyOrders] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const stored = window.sessionStorage.getItem("triqi_onboarding_token");
    if (!stored) {
      router.replace("/login");
      return;
    }
    setToken(stored);
    const payload = decodeJwtPayload<{ accountType?: AccountType }>(stored);
    if (payload?.accountType === "enterprise") setAccountType("enterprise");
  }, [router]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError("");
    try {
      const url = await storageApi.upload(file);
      setProfilePictureUrl(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to upload picture.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleVehicleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError("");
    try {
      const url = await storageApi.upload(file);
      setVehicleImageUrl(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to upload vehicle photo.");
    } finally {
      setIsUploading(false);
      if (vehicleFileInputRef.current) vehicleFileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setError("");

    if (!operatingCity || !deliveryFocus) {
      setError("Operating city and delivery focus are required.");
      return;
    }
    if (accountType === "individual" && !vehicleType) {
      setError("Vehicle type is required.");
      return;
    }
    if (accountType === "enterprise" && !companySize) {
      setError("Company size is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.completeProfile({
        token,
        profilePictureUrl,
        operatingCity,
        deliveryFocus,
        vehicleType: accountType === "individual" ? vehicleType : null,
        vehicleImageUrl: accountType === "individual" ? vehicleImageUrl : null,
        companySize: accountType === "enterprise" ? companySize : null,
        averageDailyOrders:
          accountType === "enterprise" && averageDailyOrders ? Number(averageDailyOrders) : null,
        notificationsEnabled,
      });
      window.sessionStorage.removeItem("triqi_onboarding_token");
      router.replace("/client");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save your profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Set up your profile"
      subtitle="A few details so the right shipments and trips reach you."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3">
          <Avatar src={profilePictureUrl} name="You" size={88} />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            iconLeft={<Camera size={14} />}
            onClick={() => fileInputRef.current?.click()}
            isLoading={isUploading}
          >
            {profilePictureUrl ? "Change photo" : "Add photo"}
          </Button>
        </div>

        <Select
          label="Operating city"
          placeholder="Select a wilaya"
          value={operatingCity}
          onChange={setOperatingCity}
          options={WILAYAS}
        />

        <Select
          label="Delivery focus"
          placeholder="What do you mainly handle?"
          value={deliveryFocus}
          onChange={setDeliveryFocus}
          options={DELIVERY_FOCUS}
        />

        {accountType === "individual" ? (
          <>
            <Select
              label="Vehicle type"
              placeholder="Choose a vehicle"
              value={vehicleType}
              onChange={setVehicleType}
              options={VEHICLE_TYPES}
            />
            <div className="flex flex-col items-center gap-3">
              <Avatar src={vehicleImageUrl} name="Vehicle" size={88} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={vehicleFileInputRef}
                onChange={handleVehicleFileChange}
                disabled={isUploading}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                iconLeft={<Camera size={14} />}
                onClick={() => vehicleFileInputRef.current?.click()}
                isLoading={isUploading}
              >
                {vehicleImageUrl ? "Change vehicle photo" : "Add vehicle photo (optional)"}
              </Button>
            </div>
          </>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Company size"
              placeholder="Number of employees"
              value={companySize}
              onChange={setCompanySize}
              options={COMPANY_SIZES}
            />
            <Input
              label="Average orders per day (optional)"
              type="number"
              min={0}
              value={averageDailyOrders}
              onChange={(event) => setAverageDailyOrders(event.target.value)}
            />
          </div>
        )}

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(event) => setNotificationsEnabled(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-[var(--color-border-strong)] text-[var(--color-brand-500)] focus:ring-[var(--color-brand-500)]"
          />
          <span className="text-[var(--color-fg-secondary)]">
            Send me email notifications when matching trips or requests are posted.
          </span>
        </label>

        {error ? <Alert tone="error">{error}</Alert> : null}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            fullWidth
            size="lg"
            onClick={() => {
              window.sessionStorage.removeItem("triqi_onboarding_token");
              router.replace("/client");
            }}
          >
            Skip
          </Button>
          <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
            Finish setup
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingContent />
    </Suspense>
  );
}
