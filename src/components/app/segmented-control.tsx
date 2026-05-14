"use client";

import { cn } from "@/lib/utils";

type Variant = "pill" | "line";

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ label: string; value: T }>;
  className?: string;
  variant?: Variant;
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
  variant = "pill",
}: SegmentedControlProps<T>) {
  if (variant === "line") {
    return (
      <div
        className={cn(
          "flex w-full border-b border-line",
          className,
        )}
      >
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              style={{ fontWeight: selected ? 700 : 400 }}
              className={cn(
                "flex-1 border-b-2 px-4 py-3 text-sm transition -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                selected
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex rounded-full border border-line bg-surface p-1 shadow-sm",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            style={{ fontWeight: selected ? 700 : 400 }}
            className={cn(
              "rounded-full px-4 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              selected ? "bg-brand-soft text-brand" : "text-muted",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
