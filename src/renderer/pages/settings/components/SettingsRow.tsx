import type { ReactNode } from "react";
import { HStack, Spacer } from "@/components/app/stacks";

type Props = {
  /** Row label shown before the control. */
  readonly label: string;
  /** The control rendered at the row's right edge. */
  readonly children: ReactNode;
};

/** Label + control pair. */
export const SettingsRow = ({ label, children }: Props) => (
  <HStack>
    <span className="text-sm">{label}</span>
    <Spacer />
    {children}
  </HStack>
);
