import { NextResponse } from "next/server";
import { AuthError } from "@/lib/workspace";

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ data }, init);
}

export function fail(
  status: number,
  code: string,
  message: string
): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function handleAuthError(err: unknown): NextResponse | null {
  if (err instanceof AuthError) {
    const code =
      err.status === 401
        ? "UNAUTHORIZED"
        : err.status === 403
          ? "FORBIDDEN"
          : "NOT_FOUND";
    return fail(err.status, code, err.message);
  }
  return null;
}
