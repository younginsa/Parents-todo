"use client";

import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

type EditableReviewItem = {
  id: string;
  title: string;
  date: string | null;
  category?: string;
  kind?: string;
  note?: string;
  content?: string;
  description?: string;
};

export function ReviewSection({
  title,
  description,
  items,
  categoryKey,
  categoryOptions,
  onUpdate,
  onRemove,
  extraField,
}: {
  title: string;
  description: string;
  items: EditableReviewItem[];
  categoryKey: "category" | "kind";
  categoryOptions: Array<{ label: string; value: string }>;
  onUpdate: (itemId: string, patch: Record<string, string | null>) => void;
  onRemove: (itemId: string) => void;
  extraField?: {
    key: "note" | "content" | "description";
    label: string;
    placeholder: string;
  };
}) {
  const { t } = useI18n();

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-h2">{title}</h3>
        <p className="mt-1 text-body-sm text-muted">{description}</p>
      </div>

      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-line bg-surface p-4"
            >
              <div className="grid gap-3">
                <Input
                  value={item.title}
                  onChange={(event) =>
                    onUpdate(item.id, { title: event.target.value })
                  }
                  placeholder="Title"
                />

                <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                  <Input
                    type="date"
                    value={item.date ?? ""}
                    onChange={(event) =>
                      onUpdate(item.id, { date: event.target.value || null })
                    }
                  />

                  <select
                    value={(item[categoryKey] as string | undefined) ?? ""}
                    onChange={(event) =>
                      onUpdate(item.id, { [categoryKey]: event.target.value })
                    }
                    className="h-11 w-full rounded-md border border-line bg-surface px-3 text-sm transition focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {extraField ? (
                  <div className="space-y-2">
                    <p className="text-caption text-muted">
                      {extraField.label}
                    </p>
                    <Textarea
                      className="min-h-[92px]"
                      value={(item[extraField.key] as string | undefined) ?? ""}
                      onChange={(event) =>
                        onUpdate(item.id, { [extraField.key]: event.target.value })
                      }
                      placeholder={extraField.placeholder}
                    />
                  </div>
                ) : null}

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(item.id)}
                    className="text-danger hover:bg-danger/8 hover:text-danger"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("remove")}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-line bg-surface px-4 py-5 text-body-sm text-muted">
          {t("nothing_extracted")}
        </div>
      )}
    </section>
  );
}
