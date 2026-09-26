import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HStack } from "../stacks";

/** The header's previous / next arrows. */
export type InfoDialogNavigation = {
  /** Accessible name and tooltip of the "previous" arrow. */
  readonly previousLabel: string;
  /** Accessible name and tooltip of the "next" arrow. */
  readonly nextLabel: string;
  /** Whether there is a previous entry to move to. */
  readonly hasPrevious: boolean;
  /** Whether there is a next entry to move to. */
  readonly hasNext: boolean;
  /** Move to the previous entry. */
  readonly onPrevious: () => void;
  /** Move to the next entry. */
  readonly onNext: () => void;
};

type Props = {
  /** The dialog title. */
  readonly title: ReactNode;
  /**
   * Previous / next arrows at the header's right end; omit to show none
   * (e.g. a multi-track session).
   */
  readonly navigation?: InfoDialogNavigation;
};

/**
 * Classes of one arrow: the `outline` button (whose hover lights the border
 * up with the blurred glow, like the initial-index tiles of `InitialGrid`)
 * with its resting border and fill made transparent, so only the glow
 * appears. Disabled arrows fade and ignore the pointer (`Button`).
 */
const ARROW_CLASS_NAME =
  "border-transparent bg-transparent dark:border-transparent dark:bg-transparent";

/**
 * Header of the song / album info dialogs: the title at the left and, for a
 * single subject, the previous / next arrows (Lucide chevrons) at the right
 * end (`docs/specs/v1.1/features/music-info-dialog.md`, previous / next
 * navigation). The
 * arrows take the place of the popup's close button, which these dialogs
 * drop so a click meant for an arrow never closes them.
 */
export const InfoDialogHeader = ({ title, navigation }: Props) => (
  <DialogHeader className="flex-row items-center justify-between">
    <DialogTitle>{title}</DialogTitle>
    {navigation !== undefined && (
      <HStack className="gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          className={ARROW_CLASS_NAME}
          aria-label={navigation.previousLabel}
          title={navigation.previousLabel}
          disabled={!navigation.hasPrevious}
          onClick={navigation.onPrevious}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          className={ARROW_CLASS_NAME}
          aria-label={navigation.nextLabel}
          title={navigation.nextLabel}
          disabled={!navigation.hasNext}
          onClick={navigation.onNext}
        >
          <ChevronRight />
        </Button>
      </HStack>
    )}
  </DialogHeader>
);
