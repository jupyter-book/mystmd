import type { IFile, Options } from './types.js';
import { MIGRATIONS } from './migrations.js';

export { MIGRATIONS } from './migrations.js';

/**
 * Migrate function:
 * @param src - The page to be migrated
 * @param options - to: desired target version, log: Logger
 */
export async function migrate(src: IFile, opts?: Options): Promise<IFile> {
  if (opts?.to === undefined) {
    opts?.log?.warn(`Calling migrate with no version is deprecated and will be removed in future.`);
  }
  const to = opts?.to ?? MIGRATIONS.length;
  let currentVersion = src.version || 0;

  // If the current version is already at the target, do nothing
  if (currentVersion === to) {
    opts?.log?.debug(`Already at version ${to}. No migration needed.`);
    return src;
  }

  // If currentVersion < toVersion, apply upgrades forward
  while (currentVersion < to) {
    if (currentVersion >= MIGRATIONS.length) {
      throw new Error(
        `No migration available to go from version ${currentVersion} to ${currentVersion + 1}`,
      );
    }
    const migration = MIGRATIONS[currentVersion];
    opts?.log?.debug(`Upgrading from v${currentVersion} to v${currentVersion + 1}...`);
    await migration.upgrade(src);
    currentVersion++;
    src.version = currentVersion;
  }

  // If currentVersion > toVersion, apply downgrades backward
  while (currentVersion > to) {
    if (currentVersion - 1 >= MIGRATIONS.length) {
      throw new Error(
        `No migration available to go from version ${currentVersion} down to ${currentVersion - 1}`,
      );
    }
    const migration = MIGRATIONS[currentVersion - 1];
    opts?.log?.debug(`Downgrading from v${currentVersion} to v${currentVersion - 1}...`);
    await migration.downgrade(src);
    currentVersion--;
    src.version = currentVersion;
  }

  return src;
}
