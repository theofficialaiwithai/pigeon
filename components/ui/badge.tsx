import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        // ── Status / label pills ──────────────────────────────────────────────
        "tag-sienna":
          "bg-[var(--sienna-lt)] text-[var(--sienna)] text-[9.5px] font-bold uppercase tracking-[0.1em] px-2 py-[3px]",
        "tag-sage":
          "bg-[var(--sage-lt)] text-[var(--sage)] text-[9.5px] font-bold uppercase tracking-[0.1em] px-2 py-[3px]",
        "tag-ink":
          "bg-[var(--parchment)] text-[var(--ink-muted)] text-[9.5px] font-bold uppercase tracking-[0.1em] px-2 py-[3px]",
        "tag-white":
          "bg-white/20 text-[rgba(250,247,242,0.9)] text-[9.5px] font-bold uppercase tracking-[0.1em] px-2 py-[3px]",
        "tag-gold":
          "bg-[#FFF7E0] text-[#6B4E00] text-[9.5px] font-bold uppercase tracking-[0.1em] px-2 py-[3px]",
        "tag-red":
          "bg-[#FDF0EE] text-[#8B2010] text-[9.5px] font-bold uppercase tracking-[0.1em] px-2 py-[3px]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
