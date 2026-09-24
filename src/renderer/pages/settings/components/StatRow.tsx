type Props = {
  /** Statistic name shown in the `dt` cell. */
  readonly label: string;
  /** Preformatted value (a count or a `formatTime` duration) in `dd`. */
  readonly value: string;
};

/** One statistics line of the library section. */
export const StatRow = ({ label, value }: Props) => (
  <>
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="tabular-nums">{value}</dd>
  </>
);
