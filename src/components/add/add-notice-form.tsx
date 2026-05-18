"use client";

import { CalendarDays, Loader2, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ReviewSection } from "@/components/add/review-section";
import { SegmentedControl } from "@/components/app/segmented-control";
import { useAppState } from "@/components/providers/app-state-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DEMO_TODAY } from "@/lib/config";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ParsedNotice } from "@/types";

function resolveSourceKey(
  pickerValue: string,
  noticeDistributionDate: string | null | undefined,
  today: string,
): "extracted" | "today" | "manual" {
  if (noticeDistributionDate && pickerValue === noticeDistributionDate) {
    return "extracted";
  }
  if (pickerValue === today) {
    return "today";
  }
  return "manual";
}

const PARSE_STATUSES = ["분석 중...", "일정 정리 중...", "할 일 정리 중...", "준비물 정리 중..."];

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("FileReader returned non-string"));
        return;
      }
      const [meta, base64] = result.split(",", 2);
      const mimeType = meta.match(/data:([^;]+);base64/)?.[1] ?? file.type ?? "image/png";
      resolve({ base64, mimeType });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

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
  const [pickerValue, setPickerValue] = useState(DEMO_TODAY);
  const [noteText, setNoteText] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isReparsing, setIsReparsing] = useState(false);
  const [parseStatusIndex, setParseStatusIndex] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedNotice, setParsedNotice] = useState<ParsedNotice | null>(null);

  useEffect(() => {
    if (!isParsing) return;
    setParseStatusIndex(0);
    const id = setInterval(() => {
      setParseStatusIndex((i) => (i + 1) % PARSE_STATUSES.length);
    }, 1800);
    return () => clearInterval(id);
  }, [isParsing]);

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

  async function runParse(forBaseDate: string, mode: "initial" | "reparse") {
    if (mode === "initial") {
      setIsParsing(true);
      setParsedNotice(null);
    } else {
      setIsReparsing(true);
    }
    setParseError(null);

    try {
      const payload: Record<string, unknown> = {
        baseDate: forBaseDate,
        sourceType: inputMode,
      };

      if (inputMode === "text") {
        payload.text = noteText;
      } else {
        if (uploadedFiles.length === 0) {
          throw new Error("스크린샷이 선택되지 않았습니다");
        }
        payload.images = await Promise.all(uploadedFiles.map(fileToBase64));
      }

      const response = await fetch("/api/parse-notice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        throw new Error(body?.error?.message ?? `API ${response.status}`);
      }

      const json = (await response.json()) as { data: { parsed: ParsedNotice } };
      const parsed = json.data.parsed;
      setParsedNotice(parsed);
      setBaseDate(forBaseDate);
      // Sync the picker to the resolved date so the snap-back behavior works:
      // if GPT extracted a date, pickerValue reflects that; otherwise stays at forBaseDate.
      setPickerValue(parsed.noticeDistributionDate ?? forBaseDate);
    } catch (err) {
      const message = err instanceof Error ? err.message : "알 수 없는 오류";
      setParseError(message);
      console.error("parse-notice failed:", err);
    } finally {
      if (mode === "initial") {
        setIsParsing(false);
      } else {
        setIsReparsing(false);
      }
    }
  }

  async function organizeWithAi() {
    await runParse(DEMO_TODAY, "initial");
  }

  function handlePickerBlur() {
    if (!parsedNotice) return;
    if (pickerValue === baseDate) return;
    void runParse(pickerValue, "reparse");
  }

  function save(status: "saved" | "draft") {
    if (!parsedNotice) return;

    const transcribed = parsedNotice.transcribedText?.trim() ?? "";
    const filenameLine = `📎 ${uploadedFiles.map((f) => f.name).join(", ")}`;
    saveParsedNotice({
      parsed: parsedNotice,
      rawText:
        inputMode === "text"
          ? noteText
          : transcribed.length > 0
            ? `${filenameLine}\n\n${transcribed}`
            : filenameLine,
      baseDate: pickerValue,
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

      {isParsing ? (
        <div className="flex flex-col gap-3 border-t border-line pt-5">
          <div className="rounded-lg border border-line bg-surface p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-brand" />
              <p className="text-body text-foreground" style={{ fontWeight: 500 }}>
                {PARSE_STATUSES[parseStatusIndex]}
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <div className="h-3 w-2/3 animate-pulse rounded bg-surface-strong" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-surface-strong" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-surface-strong" />
            </div>
          </div>
        </div>
      ) : null}

      {parseError ? (
        <div className="rounded-md border border-danger/40 bg-danger-soft p-3 text-body-sm text-danger">
          {parseError}
        </div>
      ) : null}

      {parsedNotice ? (
        <div className="flex flex-col gap-6 border-t border-line pt-5">
          <div className="flex items-start gap-3 rounded-lg border border-line bg-surface p-4">
            <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground" style={{ fontWeight: 500 }}>
                {t("base_date")}
              </p>
              <Input
                type="date"
                value={pickerValue}
                onChange={(event) => setPickerValue(event.target.value)}
                onBlur={handlePickerBlur}
                disabled={isReparsing}
                className="mt-1 border-line"
              />
              <p className="mt-2 text-body-sm text-muted">
                {isReparsing ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {t("reanalyzing")}
                  </span>
                ) : (
                  t(
                    `date_source_${resolveSourceKey(
                      pickerValue,
                      parsedNotice.noticeDistributionDate,
                      DEMO_TODAY,
                    )}` as
                      | "date_source_extracted"
                      | "date_source_today"
                      | "date_source_manual",
                  )
                )}
              </p>
            </div>
          </div>

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
            <Button
              type="button"
              size="lg"
              onClick={() => save("saved")}
              disabled={isReparsing}
            >
              {t("save_to_calendar")}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="secondary"
              onClick={() => save("draft")}
              disabled={isReparsing}
            >
              {t("save_as_draft")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
