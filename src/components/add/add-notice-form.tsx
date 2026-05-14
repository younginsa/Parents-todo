"use client";

import { Loader2, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { ReviewSection } from "@/components/add/review-section";
import { SegmentedControl } from "@/components/app/segmented-control";
import { useAppState } from "@/components/providers/app-state-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DEMO_TODAY } from "@/lib/config";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ParseNoticePayload, ParsedNotice } from "@/types";

type ReviewSectionKey =
  | "events"
  | "tasks"
  | "packingItems"
  | "referenceItems"
  | "uncertainItems";

export function AddNoticeForm({ onSaved }: { onSaved: () => void }) {
  const { saveParsedNotice } = useAppState();
  const { t } = useI18n();
  const [inputMode, setInputMode] = useState<"text" | "image">("text");
  const [baseDate, setBaseDate] = useState(DEMO_TODAY);
  const [noteText, setNoteText] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedNotice, setParsedNotice] = useState<ParsedNotice | null>(null);

  function updateSection(
    section: ReviewSectionKey,
    itemId: string,
    patch: Record<string, string | null>,
  ) {
    setParsedNotice((current) => {
      if (!current) return current;

      return {
        ...current,
        [section]: current[section].map((item) =>
          item.id === itemId ? { ...item, ...patch } : item,
        ),
      } as ParsedNotice;
    });
  }

  function removeFromSection(section: ReviewSectionKey, itemId: string) {
    setParsedNotice((current) => {
      if (!current) return current;

      return {
        ...current,
        [section]: current[section].filter((item) => item.id !== itemId),
      } as ParsedNotice;
    });
  }

  function removeUploadedFile(index: number) {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function organizeWithAi() {
    setIsParsing(true);

    try {
      const payload: ParseNoticePayload = {
        baseDate,
        sourceType: inputMode,
        text: inputMode === "text" ? noteText : undefined,
        fileName:
          inputMode === "image" && uploadedFiles.length > 0
            ? uploadedFiles[0].name
            : undefined,
      };

      const response = await fetch("/api/parse-notice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { parsed: ParsedNotice };
      setParsedNotice(data.parsed);
    } finally {
      setIsParsing(false);
    }
  }

  function save(status: "saved" | "draft") {
    if (!parsedNotice) return;

    saveParsedNotice({
      parsed: parsedNotice,
      rawText:
        inputMode === "text"
          ? noteText
          : uploadedFiles.length > 0
            ? `Screenshot upload: ${uploadedFiles.map((f) => f.name).join(", ")}`
            : "Screenshot upload (demo mode)",
      baseDate,
      sourceType: inputMode,
      status,
    });

    onSaved();
  }

  const inputReady =
    inputMode === "text"
      ? noteText.trim().length > 0
      : uploadedFiles.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <SegmentedControl
        variant="line"
        value={inputMode}
        onChange={setInputMode}
        options={[
          { label: t("paste_text"), value: "text" },
          { label: t("upload_screenshot"), value: "image" },
        ]}
      />

      <div className="flex w-full flex-col gap-2">
        <p
          className="text-sm text-foreground"
          style={{ fontWeight: 500 }}
        >
          {t("base_date")}
        </p>
        <Input
          type="date"
          value={baseDate}
          onChange={(event) => setBaseDate(event.target.value)}
          className="border-[#E8E8E8]"
        />
      </div>

      {inputMode === "text" ? (
        <Textarea
          value={noteText}
          onChange={(event) => setNoteText(event.target.value)}
          placeholder={t("paste_placeholder")}
          className="w-full"
        />
      ) : (
        <div className="flex w-full flex-col gap-3">
          <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line bg-[#FCFAF4] px-4 py-10 text-center">
            <div>
              <p className="font-semibold">{t("upload_title")}</p>
              <p className="mt-1 text-body-sm text-muted">
                {t("upload_desc")}
              </p>
            </div>
            <Input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length > 0) {
                  setUploadedFiles((prev) => [...prev, ...files]);
                }
                event.target.value = "";
              }}
            />
            <span className="rounded border border-line bg-surface px-4 py-2 text-sm font-semibold text-brand hover:bg-surface-strong">
              {t("choose_screenshot")}
            </span>
          </label>

          {uploadedFiles.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {uploadedFiles.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between gap-2 rounded-full bg-surface px-4 py-1.5 text-body-sm"
                >
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeUploadedFile(index)}
                    aria-label={`Remove ${file.name}`}
                    className={cn(
                      "shrink-0 rounded-full p-1 text-muted transition hover:bg-surface-strong hover:text-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    )}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      <Button
        type="button"
        size="lg"
        className="w-full"
        onClick={organizeWithAi}
        disabled={isParsing || !inputReady}
      >
        {isParsing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        {isParsing ? t("organizing") : t("organize_ai")}
      </Button>

      {parsedNotice ? (
        <div className="flex flex-col gap-6 border-t border-line pt-5">
          <div className="rounded-lg border border-line bg-brand-soft p-4">
            <p className="font-semibold">{parsedNotice.title}</p>
            <p className="mt-1 text-body-sm text-muted">
              {parsedNotice.summary}
            </p>
          </div>

          <ReviewSection
            title={t("events")}
            description={t("events_desc")}
            items={parsedNotice.events}
            categoryKey="kind"
            categoryOptions={[
              { label: t("activity"), value: "activity" },
              { label: t("important"), value: "important" },
              { label: t("submission"), value: "submission" },
            ]}
            extraField={{
              key: "description",
              label: t("description"),
              placeholder: t("description"),
            }}
            onUpdate={(id, patch) => updateSection("events", id, patch)}
            onRemove={(id) => removeFromSection("events", id)}
          />

          <ReviewSection
            title={t("tasks")}
            description={t("review_tasks_desc")}
            items={parsedNotice.tasks}
            categoryKey="category"
            categoryOptions={[
              { label: t("general"), value: "general" },
              { label: t("packing"), value: "packing" },
              { label: t("homework"), value: "homework" },
              { label: t("submission"), value: "submission" },
            ]}
            onUpdate={(id, patch) => updateSection("tasks", id, patch)}
            onRemove={(id) => removeFromSection("tasks", id)}
          />

          <ReviewSection
            title={t("packing_preparation")}
            description={t("review_packing_desc")}
            items={parsedNotice.packingItems}
            categoryKey="category"
            categoryOptions={[
              { label: t("bring"), value: "bring" },
              { label: t("wear"), value: "wear" },
              { label: t("prepare"), value: "prepare" },
              { label: t("health"), value: "health" },
            ]}
            extraField={{
              key: "note",
              label: t("note"),
              placeholder: t("note"),
            }}
            onUpdate={(id, patch) => updateSection("packingItems", id, patch)}
            onRemove={(id) => removeFromSection("packingItems", id)}
          />

          <ReviewSection
            title={t("notices_references")}
            description={t("review_references_desc")}
            items={parsedNotice.referenceItems}
            categoryKey="category"
            categoryOptions={[
              { label: t("notice"), value: "notice" },
              { label: t("policy"), value: "policy" },
              { label: t("learning"), value: "learning" },
            ]}
            extraField={{
              key: "content",
              label: t("details"),
              placeholder: t("details"),
            }}
            onUpdate={(id, patch) => updateSection("referenceItems", id, patch)}
            onRemove={(id) => removeFromSection("referenceItems", id)}
          />

          <ReviewSection
            title={t("uncertain_items")}
            description={t("review_uncertain_desc")}
            items={parsedNotice.uncertainItems}
            categoryKey="category"
            categoryOptions={[
              { label: t("event"), value: "event" },
              { label: t("tasks"), value: "task" },
              { label: t("packing"), value: "packing" },
              { label: t("reference"), value: "reference" },
            ]}
            extraField={{
              key: "note",
              label: t("why_uncertain"),
              placeholder: t("why_uncertain"),
            }}
            onUpdate={(id, patch) => updateSection("uncertainItems", id, patch)}
            onRemove={(id) => removeFromSection("uncertainItems", id)}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Button type="button" size="lg" onClick={() => save("saved")}>
              {t("save_to_calendar")}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="secondary"
              onClick={() => save("draft")}
            >
              {t("save_as_draft")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
