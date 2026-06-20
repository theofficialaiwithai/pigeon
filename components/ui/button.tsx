import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding font-sans text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Primary CTA — ink pill, lifts on hover
        default:
          "bg-[var(--ink)] text-[var(--cream)] rounded-full px-[22px] py-[11px] text-[13px] font-bold tracking-[0.02em] transition-all duration-[180ms] ease-out hover:bg-[var(--sienna)] hover:-translate-y-px",
        // Bordered pill — ghost fill, ink border
        secondary:
          "bg-transparent text-[var(--ink)] rounded-full px-5 py-[10px] text-[13px] border-[1.5px] border-[var(--ink)] tracking-[0.02em] transition-colors hover:border-[var(--sienna)] hover:text-[var(--sienna)]",
        // Text link — sienna underline, no background
        ghost:
          "bg-transparent text-[var(--sienna)] text-[13px] tracking-[0.02em] underline underline-offset-[3px] p-0 h-auto hover:text-[var(--sienna)] hover:opacity-80",
        // Utility / icon-label — parchment chip
        outline:
          "bg-[var(--parchment)] text-[var(--ink)] text-[12px] font-medium rounded-lg px-4 py-[9px] border border-[var(--warm-rule)] hover:bg-[var(--warm-rule)]",
        // Destructive — warm red tint
        destructive:
          "bg-[#FDF0EE] text-[#B03010] text-[12px] font-semibold rounded-lg px-4 py-[9px] border border-[#EECCC4] hover:bg-[#FBE4E0]",
        // Inline hyperlink — sienna, no fill
        link: "text-[var(--sienna)] underline-offset-4 hover:underline bg-transparent p-0 h-auto",
      },
      size: {
        // Padding is owned by the variant; sizes only add gap / SVG tweaks
        default: "gap-1.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "gap-1 rounded-[min(var(--radius-md),10px)] text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "gap-1 rounded-[min(var(--radius-md),12px)] text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "gap-1.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        // Icon-only — fixed square; keep size-* dimensions intact
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
