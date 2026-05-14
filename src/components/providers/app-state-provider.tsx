"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { STORAGE_KEY } from "@/lib/config";
import { createDemoState } from "@/lib/mock-data";
import { materializeNotice } from "@/lib/notices";
import type {
  AppLocale,
  AppStateSnapshot,
  NoticeStatus,
  ParsedNotice,
  NoticeSourceType,
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
  toggleTask: (taskId: string) => void;
  togglePackingItem: (itemId: string) => void;
  saveParsedNotice: (input: SaveParsedNoticeInput) => void;
  hydrated: boolean;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppStateSnapshot>(() => {
    if (typeof window === "undefined") {
      return createDemoState();
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return createDemoState();
    }

    try {
      const parsed = JSON.parse(stored) as Partial<AppStateSnapshot>;
      const base = createDemoState();

      return {
        ...base,
        ...parsed,
        locale: parsed.locale ?? base.locale,
      } as AppStateSnapshot;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return createDemoState();
    }
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo<AppStateContextValue>(
    () => {
      const activeBundle =
        state.workspaceBundles.find((bundle) => bundle.workspace.id === state.activeWorkspaceId) ??
        state.workspaceBundles[0];

      return {
        ...state,
        workspace: activeBundle.workspace,
        accessibleWorkspaces: state.workspaceBundles.map((bundle) => bundle.workspace),
        notices: activeBundle.notices,
        events: activeBundle.events,
        tasks: activeBundle.tasks,
        packingItems: activeBundle.packingItems,
        referenceItems: activeBundle.referenceItems,
        hydrated: true,
        setActiveWorkspaceId: (workspaceId) =>
          setState((current) => ({
            ...current,
            activeWorkspaceId: workspaceId,
          })),
        setLocale: (locale) =>
          setState((current) => ({
            ...current,
            locale,
          })),
        toggleTask: (taskId) =>
          setState((current) => ({
            ...current,
            workspaceBundles: current.workspaceBundles.map((bundle) =>
              bundle.workspace.id !== current.activeWorkspaceId
                ? bundle
                : {
                    ...bundle,
                    tasks: bundle.tasks.map((task) =>
                      task.id !== taskId
                        ? task
                        : task.completedAt
                          ? { ...task, completedAt: null, completedByMemberId: null }
                          : {
                              ...task,
                              completedAt: new Date().toISOString(),
                              completedByMemberId: current.currentUser.memberId,
                            },
                    ),
                  },
            ),
          })),
        togglePackingItem: (itemId) =>
          setState((current) => ({
            ...current,
            workspaceBundles: current.workspaceBundles.map((bundle) =>
              bundle.workspace.id !== current.activeWorkspaceId
                ? bundle
                : {
                    ...bundle,
                    packingItems: bundle.packingItems.map((item) =>
                      item.id !== itemId
                        ? item
                        : item.completedAt
                          ? { ...item, completedAt: null, completedByMemberId: null }
                          : {
                              ...item,
                              completedAt: new Date().toISOString(),
                              completedByMemberId: current.currentUser.memberId,
                            },
                    ),
                  },
            ),
          })),
        saveParsedNotice: ({ parsed, rawText, baseDate, sourceType, status }) =>
          setState((current) => {
            const materialized = materializeNotice({
              parsed,
              rawText,
              baseDate,
              sourceType,
              status,
              createdAt: new Date().toISOString(),
            });

            return {
              ...current,
              workspaceBundles: current.workspaceBundles.map((bundle) => {
                if (bundle.workspace.id !== current.activeWorkspaceId) {
                  return bundle;
                }

                if (status === "draft") {
                  return {
                    ...bundle,
                    notices: [materialized.notice, ...bundle.notices],
                  };
                }

                return {
                  ...bundle,
                  notices: [materialized.notice, ...bundle.notices],
                  events: [...materialized.events, ...bundle.events],
                  tasks: [...materialized.tasks, ...bundle.tasks],
                  packingItems: [...materialized.packingItems, ...bundle.packingItems],
                  referenceItems: [...materialized.referenceItems, ...bundle.referenceItems],
                };
              }),
            };
          }),
      };
    },
    [state],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error("useAppState must be used inside AppStateProvider");
  }

  return context;
}
