import type { ReactNode } from "react";
import { Stack } from "@/components/app/stacks";

type Props = {
  /** Section heading. */
  readonly label: string;
  readonly children: ReactNode;
};

/** One titled settings block. */
export const SettingsSection = ({ label, children }: Props) => (
  <div className="mt-6">
    <h2 className="border-b pb-1 font-medium text-muted-foreground text-sm">
      {label}
    </h2>
    <Stack className="gap-4 pt-3">{children}</Stack>
  </div>
);
