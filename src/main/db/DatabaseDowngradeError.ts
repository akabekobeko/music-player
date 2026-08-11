/**
 * Thrown when the database's `user_version` is newer than every migration
 * this build knows about — i.e. the user downgraded the app after running a
 * newer version. Startup must abort and tell the user to update
 * (`docs/specs/v1.0/architecture/database.md`).
 */
export class DatabaseDowngradeError extends Error {
  /** `user_version` found in the database file. */
  readonly databaseVersion: number;
  /** Highest schema version this build can handle. */
  readonly supportedVersion: number;

  constructor(databaseVersion: number, supportedVersion: number) {
    super(
      `database user_version ${databaseVersion} is newer than the supported version ${supportedVersion}`,
    );
    this.name = "DatabaseDowngradeError";
    this.databaseVersion = databaseVersion;
    this.supportedVersion = supportedVersion;
  }
}
