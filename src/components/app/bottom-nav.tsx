"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CheckSquare, Plus, type LucideIcon } from "lucide-react";
import { useAddModal } from "@/components/providers/add-modal-provider";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { setOpen } = useAddModal();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-sticky flex justify-center px-4 bottom-safe">
      <nav className="pointer-events-auto flex items-center gap-2 rounded-xl border border-line bg-surface px-2 py-2 shadow-md">
        <TabLink
          href="/calendar"
          label={t("bottom_calendar")}
          icon={CalendarDays}
          selected={pathname === "/calendar"}
        />

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("bottom_add")}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-md transition hover:brightness-110 active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Plus className="h-5 w-5" />
        </button>

        <TabLink
          href="/tasks"
          label={t("bottom_tasks")}
          icon={CheckSquare}
          selected={pathname === "/tasks"}
        />
      </nav>
    </div>
  );
}

function TabLink({
  href,
  label,
  icon: Icon,
  selected,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  selected: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-w-[5rem] flex-col items-center gap-1 rounded-md px-3 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected ? "text-brand" : "text-muted hover:text-foreground",
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
}
