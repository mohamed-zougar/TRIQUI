"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select, MultiSelect } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { DatePicker } from "@/components/ui/DatePicker";
import { PhotoUploader } from "@/components/posts/PhotoUploader";
import { ApiError, type ClientPost } from "@/lib/api";
import { WILAYAS } from "@/lib/wilayas";
import { getCommunesForWilaya } from "@/lib/communes";

const VEHICLE_TYPES = ["Motorcycle", "Small van", "Medium van", "Large van", "Truck"];

export interface ClientPostFormValues {
  origin_wilaya: string;
  origin_commune?: string;
  destination: string;
  destination_commune?: string;
  description: string;
  vehicle_type: string[];
  weight: string;
  volume: string;
  phone: string;
  delivery_date: string;
  image: string | null;
}

const EMPTY: ClientPostFormValues = {
  origin_wilaya: "",
  origin_commune: "",
  destination: "",
  destination_commune: "",
  description: "",
  vehicle_type: [],
  weight: "",
  volume: "",
  phone: "",
  delivery_date: "",
  image: null,
};

function deserializeVehicleTypes(value: string | null | string[] | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.length > 0) {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

export function clientPostToFormValues(post: ClientPost): ClientPostFormValues {
  return {
    origin_wilaya: post.origin_wilaya || "",
    origin_commune: (post as any).origin_commune || "",
    destination: post.destination || "",
    destination_commune: (post as any).destination_commune || "",
    description: post.description || "",
    vehicle_type: deserializeVehicleTypes(post.vehicle_type),
    weight: post.weight !== null ? String(post.weight) : "",
    volume: post.volume !== null ? String(post.volume) : "",
    phone: post.phone || "",
    delivery_date: post.delivery_date ? post.delivery_date.slice(0, 10) : "",
    image: post.image,
  };
}

export interface ClientPostFormProps {
  initialValues?: Partial<ClientPostFormValues>;
  defaultPhone?: string | null;
  submitLabel: string;
  onSubmit: (values: {
    origin_wilaya: string;
    destination: string;
    description: string;
    vehicle_type: string[];
    weight: number;
    volume: number;
    phone: string;
    delivery_date: string | null;
    image: string | null;
  }) => Promise<void>;
  onCancel?: () => void;
}

export function ClientPostForm({
  initialValues,
  defaultPhone,
  submitLabel,
  onSubmit,
  onCancel,
}: ClientPostFormProps) {
  const [values, setValues] = useState<ClientPostFormValues>({
    ...EMPTY,
    ...initialValues,
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const originCommunes = useMemo(() => getCommunesForWilaya(values.origin_wilaya), [values.origin_wilaya]);
  const destCommunes = useMemo(() => getCommunesForWilaya(values.destination), [values.destination]);

  useEffect(() => {
    if (defaultPhone && !values.phone) {
      setValues((prev) => ({ ...prev, phone: defaultPhone }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultPhone]);

  const set = <K extends keyof ClientPostFormValues>(key: K, value: ClientPostFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const isValid = useMemo(() => {
    return Boolean(
      values.origin_wilaya.trim() &&
        values.destination.trim() &&
        values.phone.trim()
    );
  }, [values]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!isValid) {
      setError("Please fill in the required fields: Origin, Destination, and Phone.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        origin_wilaya: values.origin_wilaya,
        origin_commune: values.origin_commune || undefined,
        destination: values.destination,
        destination_commune: values.destination_commune || undefined,
        description: values.description.trim() || "",
        vehicle_type: values.vehicle_type,
        weight: values.weight ? Number(values.weight) : 0,
        volume: values.volume ? Number(values.volume) : 0,
        phone: values.phone.trim(),
        delivery_date: values.delivery_date || null,
        image: values.image,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save the request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader title="Shipment" description="What needs to be delivered." />
        <div className="mt-5 grid gap-4">
          <MultiSelect
            label="Vehicle type needed (optional)"
            placeholder="Select preferred vehicle types"
            values={values.vehicle_type}
            onChange={(value) => set("vehicle_type", value)}
            options={VEHICLE_TYPES}
          />
          <Textarea
            label="Description (optional)"
            placeholder="Describe what you are sending (size, fragile items, etc.)."
            value={values.description}
            onChange={(event) => set("description", event.target.value)}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Weight (optional)"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.1"
              rightAddon="kg"
              value={values.weight}
              onChange={(event) => set("weight", event.target.value)}
            />
            <Input
              label="Volume (optional)"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.1"
              rightAddon="m³"
              value={values.volume}
              onChange={(event) => set("volume", event.target.value)}
            />
          </div>
          <div>
            <span className="text-sm font-medium text-[var(--color-fg-secondary)]">
              Photo (optional)
            </span>
            <div className="mt-2">
              <PhotoUploader
                value={values.image}
                onChange={(url) => set("image", url)}
                onError={setError}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Route &amp; contact" description="Where and how to reach you." />
        <div className="mt-5 grid gap-4">
          <div className="flex flex-col gap-1.5">
            <Select
              label="Origin"
              placeholder="Select pickup wilaya"
              value={values.origin_wilaya}
              onChange={(value) => {
                set("origin_wilaya", value);
                set("origin_commune", "");
              }}
              options={WILAYAS}
            />
            {values.origin_wilaya && originCommunes.length > 0 && (
              <Select
                placeholder="Select commune (Optional)"
                value={values.origin_commune || ""}
                onChange={(v) => set("origin_commune", v)}
                options={originCommunes}
                className="animate-in fade-in slide-in-from-top-1"
              />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Select
              label="Destination"
              placeholder="Select drop-off wilaya"
              value={values.destination}
              onChange={(value) => {
                set("destination", value);
                set("destination_commune", "");
              }}
              options={WILAYAS}
            />
            {values.destination && destCommunes.length > 0 && (
              <Select
                placeholder="Select commune (Optional)"
                value={values.destination_commune || ""}
                onChange={(v) => set("destination_commune", v)}
                options={destCommunes}
                className="animate-in fade-in slide-in-from-top-1"
              />
            )}
          </div>
          <DatePicker
            label="Preferred delivery date (optional)"
            value={values.delivery_date}
            onChange={(date) => set("delivery_date", date)}
          />
          <Input
            label="Phone"
            type="tel"
            inputMode="tel"
            leftAddon="+213"
            placeholder="6 12 34 56 78"
            value={values.phone}
            onChange={(event) => set("phone", event.target.value)}
          />
        </div>
      </Card>

      <div className="lg:col-span-2">
        {error ? <Alert tone="error" className="mb-3">{error}</Alert> : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" isLoading={isSubmitting} disabled={!isValid}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
