import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/libs/utils";
import type { FieldVariant } from "./field-variant";

/**
 * Track / thumb colouring. "default" is the stock shadcn look (muted track,
 * white thumb); "fused" paints the thumb in the range's fill colour so it
 * reads as one piece with the range.
 */
const sliderTrackVariants = cva(
  "relative grow overflow-hidden rounded-full select-none data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1",
  {
    variants: {
      appearance: {
        default: "bg-muted",
        fused: "bg-primary/20",
      },
    },
    defaultVariants: { appearance: "default" },
  },
);

/**
 * The thumb's hover / focus / drag affordance follows `variant`
 * ({@link FieldVariant}): "normal" lights the thumb up with a blurred glow
 * (`box-shadow`) in the thumb's own colour — `foreground` for the white
 * "default" thumb, `primary` for the "fused" one — the same treatment as
 * `CircleIconButton`; "basic" keeps the stock translucent ring, which is
 * larger for the "fused" thumb.
 */
const sliderThumbVariants = cva(
  "relative block size-3 shrink-0 rounded-full border transition-[color,border-color,box-shadow] duration-200 select-none after:absolute after:-inset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      appearance: {
        default: "border-ring bg-white",
        fused: "border-primary bg-primary",
      },
      variant: {
        normal: "",
        basic: "ring-ring/50",
      },
    },
    compoundVariants: [
      {
        appearance: "default",
        variant: "normal",
        className:
          "hover:border-foreground hover:shadow-[0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)] focus-visible:border-foreground focus-visible:shadow-[0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)] active:border-foreground active:shadow-[0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)]",
      },
      {
        appearance: "fused",
        variant: "normal",
        className:
          "hover:shadow-[0_0_5px_1px_color-mix(in_oklch,var(--primary)_60%,transparent)] focus-visible:shadow-[0_0_5px_1px_color-mix(in_oklch,var(--primary)_60%,transparent)] active:shadow-[0_0_5px_1px_color-mix(in_oklch,var(--primary)_60%,transparent)]",
      },
      {
        appearance: "default",
        variant: "basic",
        className: "hover:ring-3 focus-visible:ring-3 active:ring-3",
      },
      {
        appearance: "fused",
        variant: "basic",
        className: "hover:ring-4 focus-visible:ring-4 active:ring-4",
      },
    ],
    defaultVariants: { appearance: "default", variant: "normal" },
  },
);

type Props = SliderPrimitive.Root.Props &
  VariantProps<typeof sliderThumbVariants>;

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  appearance,
  variant,
  ...props
}: Props) {
  // One thumb per value. A scalar (or absent) value must map to a single
  // thumb: rendering extras breaks Base UI's track clicks, because the
  // closest-thumb search can resolve to an index outside the value array.
  const currentValue = value ?? defaultValue ?? min;
  const _values = Array.isArray(currentValue) ? currentValue : [currentValue];

  return (
    <SliderPrimitive.Root
      className={cn("data-horizontal:w-full data-vertical:h-full", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      {/* Thumbs are absolutely positioned (thumbAlignment="edge"), so without an
          explicit cross-axis size the Control collapses to the 4px track and
          clicks barely register — keep it as tall as the thumb circle. */}
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-horizontal:h-4 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-4 data-vertical:flex-col">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className={sliderTrackVariants({ appearance })}
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-primary select-none data-horizontal:h-full data-vertical:w-full"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            // biome-ignore lint/suspicious/noArrayIndexKey: thumbs are positional and stable per index
            key={index}
            className={sliderThumbVariants({ appearance, variant })}
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider, sliderThumbVariants, sliderTrackVariants };
