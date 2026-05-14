import { NextResponse } from "next/server";
import { parseNoticeMock } from "@/lib/mock-parser";
import { SAMPLE_NOTICE_TEXT } from "@/lib/sample-notice";
import type { ParseNoticePayload } from "@/types";

export async function POST(request: Request) {
  const body = (await request.json()) as ParseNoticePayload;

  // TODO: Replace this demo parser with real OCR + LLM extraction when backend auth and model wiring are ready.
  const parsed = parseNoticeMock(body.text?.trim() || SAMPLE_NOTICE_TEXT, body.baseDate);

  return NextResponse.json({
    mode: "demo",
    parsed,
  });
}
