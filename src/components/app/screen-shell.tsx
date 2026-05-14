import { cn } from "@/lib/utils";

export function ScreenShell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <main
      className={cn(
        "app-shell mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pt-4 sm:px-5 sm:pt-5 lg:px-6",
        className,
      )}
    >
      {children}
    </main>
  );
}
