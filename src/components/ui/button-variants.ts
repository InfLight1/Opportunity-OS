import { cva, type VariantProps } from "class-variance-authority"

export const buttonVariants = cva(
  // Night Route: pill buttons, sentence case, one line. Colors come from src/night-route.css tokens.
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent font-medium whitespace-nowrap transition-[transform,background-color,border-color,box-shadow,color] duration-200 outline-none select-none focus-visible:ring-3 focus-visible:ring-[rgba(79,163,255,.35)] active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-[var(--nr-blue)] text-[var(--nr-on-blue)] hover:bg-[#79b9ff] hover:shadow-[0_8px_30px_rgba(79,163,255,.35)]",
        outline:
          "border-[var(--nr-line-2)] bg-[rgba(11,42,74,.6)] text-[var(--nr-text-soft)] hover:border-[var(--nr-blue)] aria-pressed:border-[rgba(79,163,255,.6)] aria-pressed:bg-[var(--nr-blue-soft)]",
        secondary:
          "bg-[var(--nr-navy)] text-[var(--nr-text)] hover:border-[var(--nr-line-2)]",
        ghost:
          "text-[var(--nr-muted)] hover:text-[var(--nr-text)] hover:bg-[rgba(11,42,74,.6)]",
        destructive:
          "border-[rgba(255,122,61,.5)] text-[var(--nr-orange-hi)] hover:border-[var(--nr-orange)]",
        link: "text-[var(--nr-blue-hi)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 gap-2 px-6 text-[16px]",
        xs: "h-7 gap-1 px-3 text-[13px] [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-[18px] text-[15px] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-6 text-[16px]",
        icon: "size-10",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 border-[var(--nr-line-2)] text-[var(--nr-muted)] hover:border-[var(--nr-blue)] hover:text-[var(--nr-text)]",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export type ButtonVariantProps = VariantProps<typeof buttonVariants>
