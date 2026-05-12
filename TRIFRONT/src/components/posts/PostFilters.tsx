"use client";

import React, { useMemo, useState } from "react";
import { Search, ChevronDown, ChevronUp, SlidersHorizontal, X } from "lucide-react";
import { Select, MultiSelect } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DatePicker } from "@/components/ui/DatePicker";
import { WILAYAS } from "@/lib/wilayas";
import { getCommunesForWilaya } from "@/lib/communes";

const VEHICLE_TYPES = ["Motorcycle", "Small van", "Medium van", "Large van", "Truck"];

export interface PostFiltersValue {
  query: string;
  origin: string; // Comma separated for multi wilayas
  origin_commune?: string; // Comma separated for multi communes
  destination: string; // Comma separated for multi wilayas
  destination_commune?: string; // Comma separated for multi communes
  vehicle_type?: string; // Comma separated for multi vehicle types
  min_weight?: string;
  max_weight?: string;
  min_volume?: string;
  max_volume?: string;
  date_from?: string;
  date_to?: string;
}

export interface PostFiltersProps {
  value: PostFiltersValue;
  onChange: (value: PostFiltersValue) => void;
  searchPlaceholder?: string;
  extra?: React.ReactNode;
}

export function PostFilters({ value, onChange, searchPlaceholder, extra }: PostFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const origins = useMemo(() => value.origin ? value.origin.split(",").filter(Boolean) : [], [value.origin]);
  const originCommunes = useMemo(() => value.origin_commune ? value.origin_commune.split(",").filter(Boolean) : [], [value.origin_commune]);
  const destinations = useMemo(() => value.destination ? value.destination.split(",").filter(Boolean) : [], [value.destination]);
  const destinationCommunes = useMemo(() => value.destination_commune ? value.destination_commune.split(",").filter(Boolean) : [], [value.destination_commune]);
  const vehicleTypes = useMemo(() => value.vehicle_type ? value.vehicle_type.split(",").filter(Boolean) : [], [value.vehicle_type]);

  // Options for communes based on selected wilayas
  const availableOriginCommunes = useMemo(() => {
    return origins.flatMap(wilaya => getCommunesForWilaya(wilaya));
  }, [origins]);

  const availableDestinationCommunes = useMemo(() => {
    return destinations.flatMap(wilaya => getCommunesForWilaya(wilaya));
  }, [destinations]);

  const addOrigin = (val: string) => {
    if (!val || origins.includes(val)) return;
    onChange({ ...value, origin: [...origins, val].join(",") });
  };

  const removeOrigin = (val: string) => {
    const nextOrigins = origins.filter(o => o !== val);
    // Also remove communes that belong to this wilaya
    const wilayaCommunes = getCommunesForWilaya(val).map(c => c.label);
    const nextCommunes = originCommunes.filter(c => !wilayaCommunes.includes(c));
    onChange({ 
      ...value, 
      origin: nextOrigins.join(","),
      origin_commune: nextCommunes.join(",")
    });
  };

  const addOriginCommune = (val: string) => {
    if (!val || originCommunes.includes(val)) return;
    onChange({ ...value, origin_commune: [...originCommunes, val].join(",") });
  };

  const removeOriginCommune = (val: string) => {
    onChange({ ...value, origin_commune: originCommunes.filter(c => c !== val).join(",") });
  };

  const addDestination = (val: string) => {
    if (!val || destinations.includes(val)) return;
    onChange({ ...value, destination: [...destinations, val].join(",") });
  };

  const removeDestination = (val: string) => {
    const nextDestinations = destinations.filter(d => d !== val);
    const wilayaCommunes = getCommunesForWilaya(val).map(c => c.label);
    const nextCommunes = destinationCommunes.filter(c => !wilayaCommunes.includes(c));
    onChange({ 
      ...value, 
      destination: nextDestinations.join(","),
      destination_commune: nextCommunes.join(",")
    });
  };

  const addDestinationCommune = (val: string) => {
    if (!val || destinationCommunes.includes(val)) return;
    onChange({ ...value, destination_commune: [...destinationCommunes, val].join(",") });
  };

  const removeDestinationCommune = (val: string) => {
    onChange({ ...value, destination_commune: destinationCommunes.filter(c => c !== val).join(",") });
  };

  const setDateFrom = (dateFrom: string) => {
    onChange({
      ...value,
      date_from: dateFrom,
      date_to: value.date_to && dateFrom && value.date_to < dateFrom ? "" : value.date_to,
    });
  };

  const setDateTo = (dateTo: string) => {
    onChange({ ...value, date_to: dateTo });
  };

  const updateVehicleTypes = (types: string[]) => {
    onChange({ ...value, vehicle_type: types.join(",") });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Main Toggle */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium text-[var(--color-fg-secondary)]">Search</span>
          <span className="flex h-11 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-3 transition-colors focus-within:border-[var(--color-brand-500)]">
            <Search size={16} className="text-[var(--color-fg-muted)]" />
            <input
              type="search"
              placeholder={searchPlaceholder || "Search..."}
              value={value.query}
              onChange={(e) => onChange({ ...value, query: e.target.value })}
              className="flex-1 bg-transparent text-sm text-[var(--color-fg-primary)] outline-none"
            />
          </span>
        </label>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1 w-full sm:w-[160px]">
            <DatePicker
              label="Date from"
              value={value.date_from || ""}
              onChange={setDateFrom}
            />
          </div>

          <div className="flex flex-col gap-1 w-full sm:w-[160px]">
            <DatePicker
              label="Date max"
              value={value.date_to || ""}
              onChange={setDateTo}
              minDate={value.date_from ? new Date(value.date_from) : undefined}
            />
          </div>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="h-11 gap-2 rounded-xl px-4 w-full sm:w-auto"
          >
            <SlidersHorizontal size={16} />
            {showFilters ? "Hide Filters" : "Filters"}
          </Button>
        </div>
      </div>

      {/* Collapsible Location Filters */}
      {showFilters && (
        <div className="animate-in fade-in slide-in-from-top-2 flex flex-col gap-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {/* Origin Section */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Select
                  label="Origin Wilayas"
                  placeholder="Add origin wilaya"
                  value=""
                  onChange={addOrigin}
                  options={WILAYAS.filter(w => !origins.includes(w.label))}
                />
                <div className="flex flex-wrap gap-1">
                  {origins.map(o => (
                    <Badge key={o} tone="brand" className="gap-1 px-2 py-1">
                      {o}
                      <button onClick={() => removeOrigin(o)} className="hover:text-white/80">
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {origins.length > 0 && availableOriginCommunes.length > 0 && (
                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1">
                  <Select
                    label="Origin Communes (Optional)"
                    placeholder="Add origin commune"
                    value=""
                    onChange={addOriginCommune}
                    options={availableOriginCommunes.filter(c => !originCommunes.includes(c.label))}
                  />
                  <div className="flex flex-wrap gap-1">
                    {originCommunes.map(c => (
                      <Badge key={c} variant="outline" className="gap-1 px-2 py-1 bg-white">
                        {c}
                        <button onClick={() => removeOriginCommune(c)} className="text-[var(--color-fg-muted)] hover:text-[var(--color-brand-500)]">
                          <X size={12} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Destination Section */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Select
                  label="Destination Wilayas"
                  placeholder="Add destination wilaya"
                  value=""
                  onChange={addDestination}
                  options={WILAYAS.filter(w => !destinations.includes(w.label))}
                />
                <div className="flex flex-wrap gap-1">
                  {destinations.map(d => (
                    <Badge key={d} tone="brand" className="gap-1 px-2 py-1">
                      {d}
                      <button onClick={() => removeDestination(d)} className="hover:text-white/80">
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {destinations.length > 0 && availableDestinationCommunes.length > 0 && (
                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1">
                  <Select
                    label="Destination Communes (Optional)"
                    placeholder="Add destination commune"
                    value=""
                    onChange={addDestinationCommune}
                    options={availableDestinationCommunes.filter(c => !destinationCommunes.includes(c.label))}
                  />
                  <div className="flex flex-wrap gap-1">
                    {destinationCommunes.map(c => (
                      <Badge key={c} variant="outline" className="gap-1 px-2 py-1 bg-white">
                        {c}
                        <button onClick={() => removeDestinationCommune(c)} className="text-[var(--color-fg-muted)] hover:text-[var(--color-brand-500)]">
                          <X size={12} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-500)] hover:underline"
            >
              {showAdvanced ? "Hide Advanced" : "Show Advanced"}
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showAdvanced && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="flex flex-col gap-2">
                  <MultiSelect
                    label="Vehicle Types"
                    placeholder="Add vehicle type"
                    values={vehicleTypes}
                    onChange={updateVehicleTypes}
                    options={VEHICLE_TYPES}
                  />
                </div>
                <Input
                  label="Min Weight (kg)"
                  type="number"
                  placeholder="0"
                  value={value.min_weight || ""}
                  onChange={(e) => onChange({ ...value, min_weight: e.target.value })}
                />
                <Input
                  label="Max Weight (kg)"
                  type="number"
                  placeholder="Any"
                  value={value.max_weight || ""}
                  onChange={(e) => onChange({ ...value, max_weight: e.target.value })}
                />
                <Input
                  label="Min Volume (m³)"
                  type="number"
                  placeholder="0"
                  value={value.min_volume || ""}
                  onChange={(e) => onChange({ ...value, min_volume: e.target.value })}
                />
                <Input
                  label="Max Volume (m³)"
                  type="number"
                  placeholder="Any"
                  value={value.max_volume || ""}
                  onChange={(e) => onChange({ ...value, max_volume: e.target.value })}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {extra ? <div className="mt-2">{extra}</div> : null}
    </div>
  );
}
