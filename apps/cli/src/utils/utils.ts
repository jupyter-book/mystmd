import fs from 'fs';
import inquirer from 'inquirer';
import path from 'path';
import type { Logger } from 'myst-cli-utils';
import type { JsonObject, VersionId } from '@curvenote/blocks';
import type { ISession } from '../session/types';

export const BUILD_FOLDER = '_build';
export const THUMBNAILS_FOLDER = 'thumbnails';

export function resolvePath(optionalPath: string | undefined, filename: string) {
  if (optionalPath) return path.join(optionalPath, filename);
  if (path.isAbsolute(filename)) return filename;
  return path.join('.', filename);
}

export function repoPath(): string {
  return path.resolve(path.join('.', BUILD_FOLDER, 'curvenote'));
}

export function webPackageJsonPath(session: ISession): string {
  return path.join(repoPath(), 'apps', 'web', 'package.json');
}

export function serverPath(session: ISession): string {
  return path.join(repoPath(), 'apps', 'web');
}

export function publicPath(session: ISession): string {
  return path.join(serverPath(session), 'public');
}

export function staticPath(session: ISession): string {
  return path.join(publicPath(session), '_static');
}

export function buildPathExists(session: ISession): boolean {
  return fs.existsSync(repoPath());
}

export function ensureBuildFolderExists(session: ISession): void {
  if (!buildPathExists(session)) fs.mkdirSync(repoPath(), { recursive: true });
}

export function warnOnHostEnvironmentVariable(session: ISession, opts?: { keepHost?: boolean }) {
  if (process.env.HOST && process.env.HOST !== 'localhost') {
    if (opts?.keepHost) {
      session.log.warn(
        `\nThe HOST environment variable is set to "${process.env.HOST}", this may cause issues for the web server.\n`,
      );
    } else {
      session.log.warn(
        `\nThe HOST environment variable is set to "${process.env.HOST}", we are overwriting this to "localhost".\nTo keep this value use the \`--keep-host\` flag.\n`,
      );
      process.env.HOST = 'localhost';
    }
  }
}

/**
 * Writes a file ensuring that the directory exists
 *
 * Use:
 * ```typescript
 * import { writeFileToFolder } from 'myst-cli-utils';
 *
 * const path = resolvePath(opts.path, opts.filename);
 * writeFileToFolder(resolvePath(opts.path, opts.filename), data)
 * ```
 * @deprecated
 */
export function writeFileToFolder(
  filename: string | { path?: string; filename: string },
  data: string | NodeJS.ArrayBufferView,
  opts?: fs.WriteFileOptions,
) {
  if (typeof filename === 'string') {
    if (!fs.existsSync(filename)) fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, data, opts);
  } else {
    writeFileToFolder(resolvePath(filename.path, filename.filename), data, opts);
  }
}

export function versionIdToURL(versionId: VersionId) {
  return `/blocks/${versionId.project}/${versionId.block}/versions/${versionId.version}`;
}

export function checkForClientVersionRejection(log: Logger, status: number, body: JsonObject) {
  if (status === 400 && body.errors[0].code === 'outdated_client') {
    log.error('Please run `npm i curvenote@latest` to update your client.');
  }
}

export async function confirmOrExit(message: string, opts?: { yes?: boolean }) {
  if (opts?.yes) return;
  const question = await inquirer.prompt([
    {
      name: 'confirm',
      message,
      type: 'confirm',
      default: false,
    },
  ]);
  if (!question.confirm) {
    throw new Error('Exiting');
  }
}
