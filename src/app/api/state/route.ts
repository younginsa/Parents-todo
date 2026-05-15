import { ensureWorkspaceForUser } from "@/lib/workspace";
import { loadAppState } from "@/lib/state-loader";
import { ok, handleAuthError, fail } from "@/lib/api";

export async function GET() {
  try {
    const ctx = await ensureWorkspaceForUser();
    const snapshot = await loadAppState(ctx);
    return ok(snapshot);
  } catch (err) {
    const authResponse = handleAuthError(err);
    if (authResponse) return authResponse;
    console.error("/api/state failed:", err);
    return fail(500, "INTERNAL", "상태를 불러오지 못했습니다");
  }
}
