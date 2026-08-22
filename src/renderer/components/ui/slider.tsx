import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/libs/utils";

const sliderTrackVariants = cva(
  "relative grow overflow-hidden rounded-full select-none data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1",
  {
    variants: {
      variant: {
        default: "bg-muted",
        fused: "bg-primary/20",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

const sliderThumbVariants = cva(
  "relative block size-3 shrink-0 rounded-full border ring-ring/50 transition-[color,box-shadow] select-none after:absolute after:-inset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-ring bg-white hover:ring-3 focus-visible:ring-3 active:ring-3",
        // Thumb in the track's fill colour, so it reads as one piece with
        // the range; the larger ring is the hover / focus affordance.
        fused:
          "border-primary bg-primary hover:ring-4 focus-visible:ring-4 active:ring-4",
      },
    },
    defaultVariants: { variant: "default" },
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
          className={sliderTrackVariants({ variant })}
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
            className={sliderThumbVariants({ variant })}
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider, sliderThumbVariants, sliderTrackVariants };
