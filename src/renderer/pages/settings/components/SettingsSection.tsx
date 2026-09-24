import type { ReactNode } from "react";
import { Stack } from "@/components/app/stacks";

type Props = {
  /** Section heading. */
  readonly label: string;
  /** The section's rows, stacked under the heading. */
  readonly children: ReactNode;
};

/** One titled settings block. */
export const SettingsSection = ({ label, children }: Props) => (
  <Stack className="gap-3">
    <h2 className="border-b pb-1 font-medium text-muted-foreground text-sm">
      {label}
    </h2>
    <Stack className="gap-4">{children}</Stack>
  </Stack>
);
