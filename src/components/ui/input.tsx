import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-foreground transition placeholder:text-muted/80 focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/40",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export { Input };
