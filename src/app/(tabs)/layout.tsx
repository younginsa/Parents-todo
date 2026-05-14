import { AddNoticeModal } from "@/components/add/add-notice-modal";
import { AppStateProvider } from "@/components/providers/app-state-provider";
import { AddModalProvider } from "@/components/providers/add-modal-provider";
import { BottomNav } from "@/components/app/bottom-nav";

export default function TabsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppStateProvider>
      <AddModalProvider>
        <div className="relative min-h-screen overflow-x-hidden">
          {children}
          <BottomNav />
        </div>
        <AddNoticeModal />
      </AddModalProvider>
    </AppStateProvider>
  );
}
