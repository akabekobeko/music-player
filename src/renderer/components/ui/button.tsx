import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/libs/utils";

/**
 * Hover and keyboard focus light the boxed variants up like
 * `CircleIconButton`: instead of a background change, the border takes the
 * variant's own colour and a blurred `box-shadow` glows around it, so the
 * affordance reads the same in both themes — `primary` for the filled
 * default, `foreground` for outline / secondary (whose fills sit close to
 * the page background), `destructive` for destructive. `aria-expanded`
 * keeps its background tint as the open-menu state. The unboxed `ghost` /
 * `link` keep the stock shadcn hover / ring.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:border-primary hover:shadow-[0_0_5px_1px_color-mix(in_oklch,var(--primary)_60%,transparent)] focus-visible:border-primary focus-visible:shadow-[0_0_5px_1px_color-mix(in_oklch,var(--primary)_60%,transparent)]",
        outline:
          "border-border bg-background hover:border-foreground hover:shadow-[0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)] focus-visible:border-foreground focus-visible:shadow-[0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)] aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:border-foreground dark:focus-visible:border-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:border-foreground hover:shadow-[0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)] focus-visible:border-foreground focus-visible:shadow-[0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:border-destructive hover:shadow-[0_0_5px_1px_color-mix(in_oklch,var(--destructive)_60%,transparent)] focus-visible:border-destructive focus-visible:shadow-[0_0_5px_1px_color-mix(in_oklch,var(--destructive)_60%,transparent)] dark:bg-destructive/20",
        link: "text-primary underline-offset-4 hover:underline focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
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
  },
);

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
  );
}

export { Button, buttonVariants };
