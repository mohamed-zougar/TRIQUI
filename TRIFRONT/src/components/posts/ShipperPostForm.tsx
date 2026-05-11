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
import { ApiError, type ShipperPost } from "@/lib/api";
import { WILAYAS } from "@/lib/wilayas";
import { getCommunesForWilaya } from "@/lib/communes";

const VEHICLE_TYPES = ["Motorcycle", "Small van", "Medium van", "Large van", "Truck"];

export interface ShipperPostFormValues {
  origin_wilaya: string;
  origin_commune?: string;
  destination: string;
  destination_commune?: string;
  wilaya_passage: string[];
  type: string;
  weight: string;
  volume: string;
  phone: string;
  description: string;
  availability_date: string;
  image: string | null;
}

const EMPTY: ShipperPostFormValues = {
  origin_wilaya: "",
  origin_commune: "",
  destination: "",
  destination_commune: "",
  wilaya_passage: [],
  type: "",
  weight: "",
  volume: "",
  phone: "",
  description: "",
  availability_date: "",
  image: null,
};

export function shipperPostToFormValues(post: ShipperPost): ShipperPostFormValues {
  return {
    origin_wilaya: post.origin_wilaya || "",
    origin_commune: (post as any).origin_commune || "",
    destination: post.destination || "",
    destination_commune: (post as any).destination_commune || "",
    wilaya_passage: post.wilaya_passage || [],
    type: post.type || "",
    weight: post.weight !== null ? String(post.weight) : "",
    volume: post.volume !== null ? String(post.volume) : "",
    phone: post.phone || "",
    description: post.description || "",
    availability_date: post.availability_date ? post.availability_date.slice(0, 10) : "",
    image: post.image,
  };
}

export interface ShipperPostFormProps {
  initialValues?: Partial<ShipperPostFormValues>;
  defaultPhone?: string | null;
  defaultVehicleType?: string | null;
  defaultVehicleImage?: string | null;
  submitLabel: string;
  onSubmit: (values: {
    origin_wilaya: string;
    origin_commune?: string;
    destination: string;
    destination_commune?: string;
    wilaya_passage: string[];
    type: string;
    weight: number;
    volume: number;
    phone: string;
    description: string | null;
    availability_date: string | null;
    image: string | null;
  }) => Promise<void>;
  onCancel?: () => void;
}

export function ShipperPostForm({
  initialValues,
  defaultPhone,
  defaultVehicleType,
  defaultVehicleImage,
  submitLabel,
  onSubmit,
  onCancel,
}: ShipperPostFormProps) {
  const [values, setValues] = useState<ShipperPostFormValues>({
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

  useEffect(() => {
    if (defaultVehicleType && !values.type) {
      setValues((prev) => ({ ...prev, type: defaultVehicleType }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultVehicleType]);

  const set = <K extends keyof ShipperPostFormValues>(key: K, value: ShipperPostFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const passageOptions = useMemo(
    () =>
      WILAYAS.filter(
        (wilaya) => wilaya !== values.origin_wilaya && wilaya !== values.destination
      ),
    [values.origin_wilaya, values.destination]
  );

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
        wilaya_passage: values.wilaya_passage.filter(
          (entry) => entry !== values.origin_wilaya && entry !== values.destination
        ),
        type: values.type || "Other",
        weight: values.weight ? Number(values.weight) : 0,
        volume: values.volume ? Number(values.volume) : 0,
        phone: values.phone.trim(),
        description: values.description.trim() || null,
        availability_date: values.availability_date || null,
        image: values.image,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save the trip.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader title="Route" description="Where the trip starts, passes through and ends." />
        <div className="mt-5 grid gap-4">
          <div className="flex flex-col gap-1.5">
            <Select
              label="Origin"
              placeholder="Select origin wilaya"
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
              placeholder="Select destination wilaya"
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
          <MultiSelect
            label="Pass-through wilayas (optional)"
            placeholder="Add a stop"
            values={values.wilaya_passage}
            onChange={(next) => set("wilaya_passage", next)}
            options={passageOptions}
          />
          <DatePicker
            label="Departure date (optional)"
            value={values.availability_date}
            onChange={(date) => set("availability_date", date)}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Vehicle" description="Tell clients how much you can carry." />
        <div className="mt-5 grid gap-4">
          {defaultVehicleImage && (
            <div className="flex flex-col items-center gap-2 rounded-lg bg-[var(--color-bg-secondary)] p-3">
              <img
                src={defaultVehicleImage}
                alt="Your vehicle"
                className="h-24 w-24 rounded-lg object-cover"
              />
              <p className="text-xs text-[var(--color-fg-tertiary)]">Vehicle photo on file</p>
            </div>
          )}
          <Select
            label="Vehicle type (optional)"
            placeholder="Choose a vehicle"
            value={values.type}
            onChange={(value) => set("type", value)}
            options={VEHICLE_TYPES}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Available weight (optional)"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.1"
              rightAddon="kg"
              value={values.weight}
              onChange={(event) => set("weight", event.target.value)}
            />
            <Input
              label="Available volume (optional)"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.1"
              rightAddon="m³"
              value={values.volume}
              onChange={(event) => set("volume", event.target.value)}
            />
          </div>
          <Textarea
            label="Notes (optional)"
            placeholder="Anything clients should know (e.g. fragile-friendly, refrigerated)."
            value={values.description}
            onChange={(event) => set("description", event.target.value)}
          />
          <div>
            <span className="text-sm font-medium text-[var(--color-fg-secondary)]">
              Vehicle photo (optional)
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

      <Card className="lg:col-span-2">
        <CardHeader title="Contact" description="How clients can reach you." />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
