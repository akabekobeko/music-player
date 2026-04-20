import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/libs/utils";

type Props = ComponentProps<"div"> & {
  /** Child elements. */
  children: ReactNode;
  /** Tailwind CSS classes. Specify if want to add or override appearance specifications. */
  className?: string;
};

/**
 * Arrange child elements vertically.
 */
export const Stack = ({ children, className, ...props }: Props) => (
  <div className={cn("flex flex-col gap-2", className)} {...props}>
    {children}
  </div>
);

/**
 * Align child elements horizontally and vertically centered.
 */
export const HStack = ({ children, className, ...props }: Props) => (
  <div className={cn("flex flex-row gap-2 items-center", className)} {...props}>
    {children}
  </div>
);

/**
 * Align child elements vertically and horizontally centered.
 */
export const VStack = ({ children, className, ...props }: Props) => (
  <div
    className={cn("flex flex-col gap-2 items-center justify-center", className)}
    {...props}
  >
    {children}
  </div>
);

/**
 * Fills the space between flexbox elements.
 */
export const Spacer = () => (
  <div className="shrink grow basis self-stretch justify-self-stretch" />
);
