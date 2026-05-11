"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, LogOut, Pencil } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { Textarea } from "@/components/ui/Textarea";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { authApi, ApiError, storageApi, type UserProfile } from "@/lib/api";
import { logout, useRequireAuth } from "@/lib/auth";
import { WILAYAS } from "@/lib/wilayas";

const VEHICLE_TYPES = ["Motorcycle", "Small van", "Medium van", "Large van", "Truck"];
const COMPANY_SIZES = ["1-5 employees", "6-20 employees", "21-50 employees", "51-200 employees", "200+ employees"];
const DELIVERY_FOCUS = [
  "Documents and small parcels",
  "Furniture and home goods",
  "Electronics",
  "E-commerce orders",
  "Food and groceries",
  "Bulk freight",
];

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  profilePictureUrl: string;
  operatingCity: string;
  deliveryFocus: string;
  vehicleType: string;
  companyName: string;
  companyAddress: string;
  companyWebsite: string;
  companySize: string;
  averageDailyOrders: string;
  notificationsEnabled: boolean;
}

function toFormState(profile: UserProfile): FormState {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName ?? "",
    email: profile.email,
    phone: profile.phone,
    dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : "",
    profilePictureUrl: profile.profilePictureUrl ?? "",
    operatingCity: profile.operatingCity,
    deliveryFocus: profile.deliveryFocus,
    vehicleType: profile.vehicleType,
    companyName: profile.companyName,
    companyAddress: profile.companyAddress,
    companyWebsite: profile.companyWebsite,
    companySize: profile.companySize,
    averageDailyOrders:
      profile.averageDailyOrders === null || profile.averageDailyOrders === undefined
        ? ""
        : String(profile.averageDailyOrders),
    notificationsEnabled: profile.notificationsEnabled,
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isReady, setUser } = useRequireAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isEnterprise = profile?.accountType === "enterprise";

  const displayName = useMemo(() => {
    if (!profile) return "";
    if (profile.accountType === "enterprise" && profile.companyName) return profile.companyName;
    return `${profile.firstName} ${profile.lastName}`.trim() || profile.email || "Your profile";
  }, [profile]);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const { user: fetchedUser } = await authApi.getProfile();
      setProfile(fetchedUser);
      setForm(toFormState(fetchedUser));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load profile.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isReady) loadProfile();
  }, [isReady, loadProfile]);

  if (!isReady || isLoading || !form || !profile) {
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

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !form) return;
    setIsUploading(true);
    setError("");
    try {
      const url = await storageApi.upload(file);
      updateField("profilePictureUrl", url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to upload picture.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form || !profile) return;

    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload: Partial<UserProfile> = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        dateOfBirth: form.dateOfBirth || null,
        profilePictureUrl: form.profilePictureUrl || null,
        operatingCity: form.operatingCity.trim(),
        deliveryFocus: form.deliveryFocus.trim(),
        notificationsEnabled: form.notificationsEnabled,
      };
      if (isEnterprise) {
        payload.companyName = form.companyName.trim();
        payload.companyAddress = form.companyAddress.trim();
        payload.companyWebsite = form.companyWebsite.trim();
        payload.companySize = form.companySize.trim();
        payload.averageDailyOrders = form.averageDailyOrders ? Number(form.averageDailyOrders) : null;
      } else {
        payload.vehicleType = form.vehicleType.trim();
      }

      const { user: updatedProfile } = await authApi.updateProfile(payload);
      setProfile(updatedProfile);
      setForm(toFormState(updatedProfile));
      setUser({
        id: updatedProfile.id,
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
        role: updatedProfile.role,
        accountType: updatedProfile.accountType,
        profilePictureUrl: updatedProfile.profilePictureUrl,
        onboardingCompleted: updatedProfile.onboardingCompleted,
      });
      setSuccess("Profile updated successfully.");
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(toFormState(profile));
    setIsEditing(false);
    setError("");
  };

  const handleSignOut = () => {
    logout();
    router.replace("/");
  };

  return (
    <AppShell user={user}>
      <div className="container-app py-6 sm:py-10">
        <PageHeader
          title="My profile"
          description="Manage your personal information and preferences."
          trailing={
            isEditing ? (
              <>
                <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button form="profile-form" size="sm" type="submit" isLoading={isSaving}>
                  Save changes
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                iconLeft={<Pencil size={14} />}
                onClick={() => {
                  setIsEditing(true);
                  setSuccess("");
                }}
              >
                Edit
              </Button>
            )
          }
        />

        <form id="profile-form" onSubmit={handleSubmit} className="mt-6 grid gap-5 lg:grid-cols-[1fr_2fr]">
          <Card>
            <div className="flex flex-col items-center gap-3">
              <Avatar src={form.profilePictureUrl} name={displayName} size={96} />
              {isEditing ? (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleUpload}
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
                    {form.profilePictureUrl ? "Change photo" : "Upload photo"}
                  </Button>
                </>
              ) : null}

              <div className="text-center">
                <h2 className="text-lg font-semibold text-[var(--color-fg-primary)]">{displayName}</h2>
                <div className="mt-1 flex flex-wrap justify-center gap-1.5">
                  <Badge tone="brand">{profile.accountType}</Badge>
                  {profile.emailVerified ? (
                    <Badge tone="success">Email verified</Badge>
                  ) : null}
                </div>
              </div>
            </div>

            <hr className="my-5 border-[var(--color-border)]" />

            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-[var(--color-fg-muted)]">Email</span>
                <span className="font-medium text-[var(--color-fg-primary)]">
                  {profile.email || "—"}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[var(--color-fg-muted)]">Phone</span>
                <span className="font-medium text-[var(--color-fg-primary)]">
                  {profile.phone || "—"}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[var(--color-fg-muted)]">Operating area</span>
                <span className="font-medium text-[var(--color-fg-primary)]">
                  {profile.operatingCity || "—"}
                </span>
              </li>
            </ul>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              fullWidth
              className="mt-4 justify-center text-[var(--color-fg-muted)]"
              iconLeft={<LogOut size={14} />}
              onClick={handleSignOut}
            >
              Sign out
            </Button>
          </Card>

          <div className="grid gap-5">
            {error ? <Alert tone="error">{error}</Alert> : null}
            {success ? <Alert tone="success">{success}</Alert> : null}

            <Card>
              <CardHeader title="Account information" />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Input
                  label={isEnterprise ? "Contact first name" : "First name"}
                  value={form.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label={isEnterprise ? "Contact last name" : "Last name"}
                  value={form.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="Phone"
                  type="tel"
                  leftAddon="+213"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  disabled={!isEditing}
                />
                {!isEnterprise ? (
                  <Input
                    label="Date of birth"
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={form.dateOfBirth}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "");
                      if (val.length > 8) val = val.slice(0, 8);
                      if (val.length > 4) {
                        val = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`;
                      } else if (val.length > 2) {
                        val = `${val.slice(0, 2)}/${val.slice(2)}`;
                      }
                      updateField("dateOfBirth", val);
                    }}
                    disabled={!isEditing}
                  />
                ) : null}
              </div>
            </Card>

            {isEnterprise ? (
              <Card>
                <CardHeader title="Company details" />
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Company name"
                    value={form.companyName}
                    onChange={(e) => updateField("companyName", e.target.value)}
                    disabled={!isEditing}
                    className="sm:col-span-2"
                  />
                  <Textarea
                    label="Company address"
                    value={form.companyAddress}
                    onChange={(e) => updateField("companyAddress", e.target.value)}
                    disabled={!isEditing}
                    className="sm:col-span-2"
                  />
                  <Input
                    label="Company website"
                    type="url"
                    value={form.companyWebsite}
                    onChange={(e) => updateField("companyWebsite", e.target.value)}
                    disabled={!isEditing}
                  />
                  <Select
                    label="Company size"
                    value={form.companySize}
                    onChange={(value) => updateField("companySize", value)}
                    options={COMPANY_SIZES}
                    disabled={!isEditing}
                  />
                  <Input
                    label="Average daily orders"
                    type="number"
                    min={0}
                    value={form.averageDailyOrders}
                    onChange={(e) => updateField("averageDailyOrders", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </Card>
            ) : (
              <Card>
                <CardHeader title="Driver details" />
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Select
                    label="Vehicle type"
                    value={form.vehicleType}
                    onChange={(value) => updateField("vehicleType", value)}
                    options={VEHICLE_TYPES}
                    disabled={!isEditing}
                  />
                </div>
              </Card>
            )}

            <Card>
              <CardHeader title="Preferences" />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Select
                  label="Operating city"
                  value={form.operatingCity}
                  onChange={(value) => updateField("operatingCity", value)}
                  options={WILAYAS}
                  disabled={!isEditing}
                />
                <Select
                  label="Delivery focus"
                  value={form.deliveryFocus}
                  onChange={(value) => updateField("deliveryFocus", value)}
                  options={DELIVERY_FOCUS}
                  disabled={!isEditing}
                />
              </div>
              <label className="mt-4 flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.notificationsEnabled}
                  onChange={(e) => updateField("notificationsEnabled", e.target.checked)}
                  disabled={!isEditing}
                  className="h-4 w-4 rounded border-[var(--color-border-strong)] text-[var(--color-brand-500)] focus:ring-[var(--color-brand-500)]"
                />
                <span className="text-[var(--color-fg-secondary)]">Enable notifications</span>
              </label>
            </Card>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
