import type { ReactNode } from "react";
import { HStack, Spacer } from "@/components/app/stacks";

type Props = {
  /** Row label shown before the control. */
  readonly label: string;
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
