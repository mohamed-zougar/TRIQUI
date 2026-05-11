import React from "react";

export interface RouteLineProps {
  origin: string;
  destination: string;
  origin_commune?: string | null;
  destination_commune?: string | null;
  passages?: string[];
}

export function RouteLine({ 
  origin, 
  destination, 
  origin_commune, 
  destination_commune, 
  passages 
}: RouteLineProps) {
  const originText = origin_commune ? `${origin} (${origin_commune})` : origin;
  const destinationText = destination_commune ? `${destination} (${destination_commune})` : destination;

  return (
    <div className="text-sm">
      <div className="flex items-start gap-3">
        <span className="mt-1.5 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-brand-500)]" />
        <span className="font-medium text-[var(--color-fg-primary)]">{originText || "—"}</span>
      </div>
      {passages && passages.length > 0 ? (
        <div className="ml-1 mt-2 mb-1 border-l-2 border-dashed border-[var(--color-border-strong)] pl-4 text-xs text-[var(--color-fg-muted)]">
          via {passages.map(p => p.replace(/[\\"[\]]/g, '')).join(" · ")}
        </div>
      ) : (
        <div className="ml-1 my-1 h-3 border-l-2 border-dashed border-[var(--color-border-strong)]" />
      )}
      <div className="flex items-start gap-3">
        <span className="mt-1.5 inline-flex h-2.5 w-2.5 shrink-0 rounded-full border-2 border-[var(--color-brand-500)]" />
        <span className="font-medium text-[var(--color-fg-primary)]">{destinationText || "—"}</span>
      </div>
    </div>
  );
}
