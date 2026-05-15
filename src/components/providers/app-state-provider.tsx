"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_LOCALE, STORAGE_KEY } from "@/lib/config";
import type {
  AppLocale,
  AppStateSnapshot,
  NoticeStatus,
  ParsedNotice,
  NoticeSourceType,
  PackingItem,
  TaskItem,
} from "@/types";

interface SaveParsedNoticeInput {
  parsed: ParsedNotice;
  rawText: string;
  baseDate: string;
  sourceType: NoticeSourceType;
  status: NoticeStatus;
}

interface AppStateContextValue extends AppStateSnapshot {
  workspace: AppStateSnapshot["workspaceBundles"][number]["workspace"];
  accessibleWorkspaces: AppStateSnapshot["workspaceBundles"][number]["workspace"][];
  notices: AppStateSnapshot["workspaceBundles"][number]["notices"];
  events: AppStateSnapshot["workspaceBundles"][number]["events"];
  tasks: AppStateSnapshot["workspaceBundles"][number]["tasks"];
  packingItems: AppStateSnapshot["workspaceBundles"][number]["packingItems"];
  referenceItems: AppStateSnapshot["workspaceBundles"][number]["referenceItems"];
  setActiveWorkspaceId: (workspaceId: string) => void;
  setLocale: (locale: AppLocale) => void;
  toggleTask: (taskId: string) => Promise<void>;
  togglePackingItem: (itemId: string) => Promise<void>;
  saveParsedNotice: (input: SaveParsedNoticeInput) => Promise<void>;
  refresh: () => Promise<void>;
  hydrated: boolean;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

const emptySnapshot: AppStateSnapshot = {
  workspaceBundles: [
    {
      workspace: {
        id: "loading",
        name: "",
        childName: "",
        avatarLabel: "",
        members: [],
      },
      notices: [],
      events: [],
      tasks: [],
      packingItems: [],
      referenceItems: [],
    },
  ],
  activeWorkspaceId: "loading",
  currentUser: { id: "", name: "", email: "", avatarLabel: "", memberId: "" },
  locale: DEFAULT_LOCALE,
};

function loadStoredLocale(): AppLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return DEFAULT_LOCALE;
  try {
    const parsed = JSON.parse(stored) as { locale?: AppLocale };
    return parsed.locale ?? DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<AppStateSnapshot>(() => ({
    ...emptySnapshot,
    locale: loadStoredLocale(),
  }));
  const [hydrated, setHydrated] = useState(false);

  const fetchState = useCallback(async () => {
    const res = await fetch("/api/state", { credentials: "include" });
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    if (!res.ok) {
      console.error("Failed to load /api/state", res.status);
      return;
    }
    const json = (await res.json()) as { data: AppStateSnapshot };
    setSnapshot((current) => ({
      ...json.data,
      locale: current.locale,
    }));
    setHydrated(true);
  }, [router]);

  useEffect(() => {
    void fetchState();
  }, [fetchState]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ locale: snapshot.locale })
    );
  }, [snapshot.locale]);

  const toggleCompletion = useCallback(
    async (
      kind: "task" | "packing",
      itemId: string,
      noticeId: string,
      nextCompleted: boolean,
      memberId: string
    ) => {
      const optimisticCompletedAt = nextCompleted ? new Date().toISOString() : null;
      const optimisticMemberId = nextCompleted ? memberId : null;

      // Optimistic update
      setSnapshot((current) => ({
        ...current,
        workspaceBundles: current.workspaceBundles.map((bundle) => {
          if (bundle.workspace.id !== current.activeWorkspaceId) return bundle;
          if (kind === "task") {
            return {
              ...bundle,
              tasks: bundle.tasks.map((task) =>
                task.id === itemId
                  ? {
                      ...task,
                      completedAt: optimisticCompletedAt,
                      completedByMemberId: optimisticMemberId,
                    }
                  : task
              ),
            };
          }
          return {
            ...bundle,
            packingItems: bundle.packingItems.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    completedAt: optimisticCompletedAt,
                    completedByMemberId: optimisticMemberId,
                  }
                : item
            ),
          };
        }),
      }));

      try {
        const res = await fetch("/api/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            noticeId,
            itemId,
            itemKind: kind,
            completed: nextCompleted,
          }),
        });
        if (!res.ok) {
          throw new Error(`API ${res.status}`);
        }
      } catch (err) {
        console.error("Toggle failed, reverting", err);
        await fetchState();
      }
    },
    [fetchState]
  );

  const value = useMemo<AppStateContextValue>(() => {
    const activeBundle =
      snapshot.workspaceBundles.find(
        (bundle) => bundle.workspace.id === snapshot.activeWorkspaceId
      ) ?? snapshot.workspaceBundles[0];

    return {
      ...snapshot,
      workspace: activeBundle.workspace,
      accessibleWorkspaces: snapshot.workspaceBundles.map((bundle) => bundle.workspace),
      notices: activeBundle.notices,
      events: activeBundle.events,
      tasks: activeBundle.tasks,
      packingItems: activeBundle.packingItems,
      referenceItems: activeBundle.referenceItems,
      hydrated,
      setActiveWorkspaceId: () => {
        // Single workspace per user in v1; no-op
      },
      setLocale: (locale) =>
        setSnapshot((current) => ({
          ...current,
          locale,
        })),
      toggleTask: async (taskId: string) => {
        const task: TaskItem | undefined = activeBundle.tasks.find(
          (t) => t.id === taskId
        );
        if (!task || !task.noticeId) return;
        await toggleCompletion(
          "task",
          taskId,
          task.noticeId,
          !task.completedAt,
          snapshot.currentUser.memberId
        );
      },
      togglePackingItem: async (itemId: string) => {
        const item: PackingItem | undefined = activeBundle.packingItems.find(
          (p) => p.id === itemId
        );
        if (!item || !item.noticeId) return;
        await toggleCompletion(
          "packing",
          itemId,
          item.noticeId,
          !item.completedAt,
          snapshot.currentUser.memberId
        );
      },
      saveParsedNotice: async ({ parsed, rawText, baseDate, sourceType, status }) => {
        const res = await fetch("/api/notices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ parsed, rawText, baseDate, sourceType, status }),
        });
        if (!res.ok) {
          console.error("Failed to save notice", res.status);
          throw new Error(`Failed to save: ${res.status}`);
        }
        await fetchState();
      },
      refresh: fetchState,
    };
  }, [snapshot, hydrated, toggleCompletion, fetchState]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error("useAppState must be used inside AppStateProvider");
  }

  return context;
}
