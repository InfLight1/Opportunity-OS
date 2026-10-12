import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-[var(--nr-r-input)] border border-[var(--nr-line-2)] bg-[rgba(4,12,22,.6)] px-3.5 py-2 text-[16px] text-[var(--nr-text)] transition-colors outline-none placeholder:text-[var(--nr-dim)] focus-visible:border-[var(--nr-blue)] focus-visible:ring-3 focus-visible:ring-[rgba(79,163,255,.2)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-[var(--nr-orange)] [color-scheme:dark]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
