import { Star } from "lucide-react";
import { RATING_SCALE } from "@/components/app/InfoDialog/MusicInfoDialog/formValuesOf";

/** Positions of the stars, left to right (0-based). */
const STAR_POSITIONS = Array.from(
  { length: RATING_SCALE },
  (_, position) => position,
);

type Props = {
  /** Stars to light up, from 0 to `RATING_SCALE` in half steps. */
  readonly stars: number;
};

/**
 * Read-only star rating of a table cell: a row of dimmed outline stars with
 * the rated part filled in, muted like the other cells. A half star clips the filled star to its left
 * half. Stars that do not fit a narrowed column are cut off.
 */
export const RatingStars = ({ stars }: Props) => (
  <span
    role="img"
    aria-label={`${stars} / ${RATING_SCALE}`}
    className="flex items-center overflow-hidden text-muted-foreground"
  >
    {STAR_POSITIONS.map((position) => {
      const fill = Math.min(1, Math.max(0, stars - position));
      return (
        <span key={position} className="relative size-3.5 shrink-0">
          <Star className="size-3.5 opacity-30" />
          {fill > 0 && (
            <span
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star className="size-3.5 fill-current" />
            </span>
          )}
        </span>
      );
    })}
  </span>
);
