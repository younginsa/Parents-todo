"use client";

import type { ReactNode } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe,
  LogOut,
  Settings2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppState } from "@/components/providers/app-state-provider";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type ProfileView = "root" | "settings" | "language";

export function WorkspaceHeader({
  title,
  description,
  titleAction,
}: {
  title: ReactNode;
  description?: string;
  titleAction?: ReactNode;
}) {
  const {
    workspace,
    accessibleWorkspaces,
    setActiveWorkspaceId,
    currentUser,
    locale,
    setLocale,
  } = useAppState();
  const { t } = useI18n();

  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileView, setProfileView] = useState<ProfileView>("root");

  const workspaceMenuRef = useRef<HTMLDivElement | null>(null);
  const workspaceButtonRef = useRef<HTMLButtonElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const profileButtonRef = useRef<HTMLButtonElement | null>(null);

  const languageOptions = useMemo(
    () => [
      { value: "ko" as const, label: t("korean") },
      { value: "en" as const, label: t("english") },
    ],
    [t],
  );

  const currentMember = workspace.members.find(
    (member) => member.id === currentUser.memberId,
  );
  const roleLabel = currentMember
    ? t(currentMember.role === "mom" ? "role_mom" : "role_dad")
    : null;
  const userInitial =
    (currentUser.email.charAt(0) || currentUser.name.charAt(0)).toUpperCase();

  useEffect(() => {
    if (!workspaceOpen) return;

    function handlePointer(event: MouseEvent) {
      const target = event.target as Node;
      if (workspaceMenuRef.current?.contains(target)) return;
      if (workspaceButtonRef.current?.contains(target)) return;
      setWorkspaceOpen(false);
    }

    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [workspaceOpen]);

  useEffect(() => {
    if (!profileOpen) return;

    function handlePointer(event: MouseEvent) {
      const target = event.target as Node;
      if (profileMenuRef.current?.contains(target)) return;
      if (profileButtonRef.current?.contains(target)) return;
      setProfileOpen(false);
    }

    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [profileOpen]);

  useEffect(() => {
    if (!profileOpen) setProfileView("root");
  }, [profileOpen]);

  return (
    <header className="relative z-modal space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative z-dropdown">
          <button
            ref={workspaceButtonRef}
            type="button"
            onClick={() => {
              setWorkspaceOpen((current) => !current);
              setProfileOpen(false);
            }}
            className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-foreground transition hover:bg-surface-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={{ fontWeight: 500 }}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
              {workspace.avatarLabel}
            </span>
            <span className="max-w-[180px] truncate text-sm">
              {workspace.name}
            </span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-muted transition",
                workspaceOpen && "rotate-180",
              )}
            />
          </button>

          {workspaceOpen ? (
            <div
              ref={workspaceMenuRef}
              className="absolute left-0 top-full z-popover mt-[4px] w-[min(300px,calc(100vw-2rem))] rounded-lg border border-line bg-surface p-2 shadow-lg"
            >
              {accessibleWorkspaces.map((item) => {
                const selected = item.id === workspace.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveWorkspaceId(item.id);
                      setWorkspaceOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left hover:bg-surface-strong focus-visible:bg-surface-strong focus-visible:outline-none"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                      {item.avatarLabel}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {item.name}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {item.childName}
                      </p>
                    </div>
                    {selected ? (
                      <Check className="h-4 w-4 text-brand" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="relative z-dropdown">
          <button
            ref={profileButtonRef}
            type="button"
            onClick={() => {
              setProfileOpen((current) => !current);
              setWorkspaceOpen(false);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-strong text-xs font-bold text-foreground transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {userInitial}
          </button>

          {profileOpen ? (
            <div
              ref={profileMenuRef}
              className="absolute right-0 top-full z-popover mt-[4px] w-[min(300px,calc(100vw-2rem))] rounded-lg border border-line bg-surface p-2 shadow-lg"
            >
              {profileView === "root" ? (
                <>
                  <div className="flex items-center gap-3 rounded-md bg-surface-strong p-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                      {userInitial}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {currentUser.name}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {roleLabel ? `${roleLabel} · ` : ""}
                        {currentUser.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setProfileView("settings")}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-semibold text-foreground hover:bg-surface-strong focus-visible:bg-surface-strong focus-visible:outline-none"
                    >
                      <Settings2 className="h-4 w-4 text-brand" />
                      <span className="flex-1">{t("settings")}</span>
                      <ChevronRight className="h-4 w-4 text-muted" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileView("language")}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-semibold text-foreground hover:bg-surface-strong focus-visible:bg-surface-strong focus-visible:outline-none"
                    >
                      <Globe className="h-4 w-4 text-brand" />
                      <span className="flex-1">{t("language")}</span>
                      <ChevronRight className="h-4 w-4 text-muted" />
                    </button>
                  </div>
                </>
              ) : null}

              {profileView === "settings" ? (
                <>
                  <button
                    type="button"
                    onClick={() => setProfileView("root")}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-3 text-left text-sm font-semibold text-foreground hover:bg-surface-strong focus-visible:bg-surface-strong focus-visible:outline-none"
                  >
                    <ChevronLeft className="h-4 w-4 text-muted" />
                    <span>{t("settings")}</span>
                  </button>
                  <div className="mt-1 space-y-1">
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-semibold text-foreground hover:bg-surface-strong focus-visible:bg-surface-strong focus-visible:outline-none"
                    >
                      <LogOut className="h-4 w-4 text-muted" />
                      <span>{t("sign_out")}</span>
                    </button>
                    <p className="px-3 py-2 text-xs text-muted">
                      {t("settings_coming_soon")}
                    </p>
                  </div>
                </>
              ) : null}

              {profileView === "language" ? (
                <>
                  <button
                    type="button"
                    onClick={() => setProfileView("root")}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-3 text-left text-sm font-semibold text-foreground hover:bg-surface-strong focus-visible:bg-surface-strong focus-visible:outline-none"
                  >
                    <ChevronLeft className="h-4 w-4 text-muted" />
                    <span>{t("language")}</span>
                  </button>
                  <div className="mt-1 grid gap-1">
                    {languageOptions.map((option) => {
                      const selected = locale === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setLocale(option.value)}
                          className={cn(
                            "flex items-center justify-between rounded-md px-3 py-3 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:bg-surface-strong",
                            selected
                              ? "bg-brand-soft text-brand"
                              : "text-foreground hover:bg-surface-strong",
                          )}
                        >
                          <span>{option.label}</span>
                          {selected ? <Check className="h-4 w-4" /> : null}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-end justify-between gap-3">
          <h1 className="text-display">{title}</h1>
          {titleAction ? <div className="shrink-0">{titleAction}</div> : null}
        </div>
        {description ? (
          <p className="text-body-sm text-muted">{description}</p>
        ) : null}
      </div>
    </header>
  );
}
