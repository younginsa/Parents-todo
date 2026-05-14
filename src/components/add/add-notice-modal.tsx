"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { AddNoticeForm } from "@/components/add/add-notice-form";
import { useAddModal } from "@/components/providers/add-modal-provider";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function AddNoticeModal() {
  const { open, setOpen } = useAddModal();
  const { t } = useI18n();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-modal bg-foreground/35 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            "fixed z-modal flex flex-col bg-surface shadow-lg outline-none",
            "inset-x-0 bottom-0 max-h-[85vh] rounded-t-xl",
            "md:inset-auto md:bottom-auto md:left-1/2 md:top-1/2 md:w-[min(600px,90vw)] md:max-h-[85vh] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-lg",
          )}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
            <Dialog.Title className="text-h2">
              {t("add_modal_title")}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t("close")}
                className="rounded-full p-1 text-muted transition hover:bg-surface-strong hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <AddNoticeForm onSaved={() => setOpen(false)} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
