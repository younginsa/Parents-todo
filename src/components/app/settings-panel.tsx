"use client";

import { Globe, Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/components/providers/app-state-provider";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { AppLocale } from "@/types";

export function SettingsPanel({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const { locale, setLocale } = useAppState();
  const { t } = useI18n();

  const options: Array<{ value: AppLocale; label: string }> = [
    { value: "ko", label: t("korean") },
    { value: "en", label: t("english") },
  ];

  return (
    <div className="relative z-overlay">
      <Button type="button" variant="secondary" size="icon" onClick={onToggle}>
        <Settings2 className="h-4 w-4" />
      </Button>

      {open ? (
        <div className="fixed right-4 top-20 z-overlay w-[min(320px,calc(100vw-2rem))] rounded-lg border border-line bg-surface p-4 shadow-lg sm:right-6 lg:right-8">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg font-bold">{t("settings")}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{t("workspace_note")}</p>
            </div>
            <button
              type="button"
              onClick={onToggle}
              className="rounded-full p-2 text-muted transition hover:bg-surface-strong hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Globe className="h-4 w-4 text-brand" />
              {t("language")}
            </div>

            <div className="grid gap-2">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLocale(option.value)}
                  className={cn(
                    "rounded-md border px-4 py-3 text-left text-sm font-semibold transition",
                    locale === option.value
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-line bg-surface text-foreground hover:border-brand/40",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
