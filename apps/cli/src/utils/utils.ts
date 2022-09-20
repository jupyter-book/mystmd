import { createHash } from 'crypto';
import fs from 'fs';
import os from 'os';
import type { VFile } from 'vfile';
import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import prettyHrtime from 'pretty-hrtime';
import type { JsonObject, VersionId } from '@curvenote/blocks';
import { configFileExists, loadConfigOrThrow, readConfig } from '../config';
import type { Logger } from '../logging';
import type { ISession } from '../session/types';
import { selectors } from '../store';
import type { WarningKind } from '../store/build';
import { warnings } from '../store/build';

export const BUILD_FOLDER = '_build';
export const THUMBNAILS_FOLDER = 'thumbnails';

export function shouldIgnoreFile(file: string) {
  const ignore = ['node_modules', BUILD_FOLDER];
  return file.startsWith('.') || ignore.includes(file);
}

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

/**
 * Log a message if there are extra keys in an object that are not expected.
 *
 * @param log Logging object
 * @param object object with maybe extra keys
 * @param start string for the logging message
 * @param allowed optional allowed keys
 * @returns void
 */
export function warnOnUnrecognizedKeys(
  log: Logger,
  object: Record<string, any>,
  start: string,
  allowed?: Set<string>,
) {
  const extraKeys = allowed
    ? Object.keys(object).filter((k) => !allowed.has(k))
    : Object.keys(object);
  if (extraKeys.length === 0) return;
  const plural = extraKeys.length > 1 ? 's' : '';
  log.warn(`${start} Did not recognize key${plural}: "${extraKeys.join('", "')}".`);
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

export function logMessagesFromVFile(session: ISession, file?: VFile): void {
  if (!file) return;
  file.messages.forEach((message) => {
    const kind: WarningKind =
      message.fatal === null ? 'info' : message.fatal === false ? 'warn' : 'error';
    const note = message.note ? `\n\n${chalk.dim(message.note)}` : '';
    const url = message.url ? `\n\nSee also: ${chalk.bold(message.url)}` : '';
    addWarningForFile(session, file.path, `${message.message}${note}${url}`, kind);
  });
  file.messages = [];
}

export function addWarningForFile(
  session: ISession,
  file: string | undefined | null,
  message: string,
  kind: WarningKind = 'warn',
) {
  switch (kind) {
    case 'info':
      session.log.info(`ℹ️ ${file}: ${message}`);
      break;
    case 'error':
      session.log.error(`⛔️ ${file}: ${message}`);
      break;
    case 'warn':
    default:
      session.log.warn(`⚠️  ${file}: ${message}`);
      break;
  }
  if (file) {
    session.store.dispatch(warnings.actions.addWarning({ file, message, kind }));
  }
}

export function createTempFolder() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'curvenote'));
}

/** Writes a file ensuring that the directory exists */
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

export function computeHash(content: string) {
  return createHash('md5').update(content).digest('hex');
}

/**
 * Copy an existing file to writeFolder and name it based on hashed filename
 *
 * If hashed file already exists, this does nothing
 */
export function hashAndCopyStaticFile(session: ISession, file: string, writeFolder: string) {
  const { name, ext } = path.parse(file);
  const fd = fs.openSync(file, 'r');
  const { mtime, size } = fs.fstatSync(fd);
  fs.closeSync(fd);
  const hash = computeHash(`${mtime.toString()}${size.toString()}`);
  const fileHash = `${name.slice(0, 20)}-${hash}${ext}`;
  const destination = path.join(writeFolder, fileHash);
  if (fs.existsSync(destination)) {
    session.log.debug(`Cached file found for: ${file}`);
  } else {
    try {
      if (!fs.existsSync(writeFolder)) fs.mkdirSync(writeFolder, { recursive: true });
      fs.copyFileSync(file, destination);
      session.log.debug(`File successfully copied: ${file}`);
    } catch {
      session.log.error(`Error copying file: ${file}`);
      return undefined;
    }
  }
  return fileHash;
}

export function isUrl(url: string): boolean {
  return !!url.toLowerCase().match(/^https?:\/\//);
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

export function tic() {
  let start = process.hrtime();
  function toc(f = '') {
    const time = prettyHrtime(process.hrtime(start));
    start = process.hrtime();
    return f ? f.replace('%s', time) : time;
  }
  return toc;
}

export function findProject(session: ISession, dir: string): string | undefined {
  dir = path.resolve(dir);
  if (configFileExists(dir)) {
    const { project } = readConfig(session, dir);
    if (project) {
      loadConfigOrThrow(session, dir);
      return dir;
    }
  }
  if (path.dirname(dir) === dir) {
    return undefined;
  }
  return findProject(session, path.dirname(dir));
}
