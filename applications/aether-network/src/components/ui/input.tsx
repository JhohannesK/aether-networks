import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full rounded-full bg-white/5 px-4 text-sm text-foreground outline-none hairline placeholder:text-muted",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
