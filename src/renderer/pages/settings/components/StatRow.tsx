type Props = {
  readonly label: string;
  readonly value: string;
};

/** One statistics line of the library section. */
export const StatRow = ({ label, value }: Props) => (
  <>
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="tabular-nums">{value}</dd>
  </>
);
