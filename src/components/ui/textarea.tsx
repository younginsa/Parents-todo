import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[160px] w-full rounded-md border border-line bg-surface px-4 py-3 text-sm leading-6 text-foreground transition placeholder:text-muted/80 focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/40",
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };
