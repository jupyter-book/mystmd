import { createHash } from 'crypto';
import fs from 'fs';
import inquirer from 'inquirer';
import path from 'path';
import prettyHrtime from 'pretty-hrtime';
import { JsonObject, VersionId } from '@curvenote/blocks';
import { Logger } from '../logging';
import { ISession } from '../session/types';
import { selectors } from '../store';

/**
 * pkgpath - easily get package relative paths
 *
 * @param absPathSegment an absolute path from the package root level
 * @returns full absolute path
 */
export function pkgpath(absPathSegment: string) {
  return path.resolve(path.join(__dirname, '..', absPathSegment));
}

export function resolvePath(optionalPath: string | undefined, filename: string) {
  if (optionalPath) return path.join(optionalPath, filename);
  if (path.isAbsolute(filename)) return filename;
  return path.join('.', filename);
}

export function serverPath(session: ISession) {
  const config = selectors.selectLocalSiteConfig(session.store.getState());
  const buildPath = config?.buildPath || '_build';
  return `${buildPath}/web`;
}

export function publicPath(session: ISession) {
  return path.join(serverPath(session), 'public');
}

export function staticPath(session: ISession) {
  return path.join(publicPath(session), '_static');
}

export function buildPathExists(session: ISession) {
  return fs.existsSync(serverPath(session));
}

export function ensureBuildFolderExists(session: ISession) {
  if (!buildPathExists(session)) fs.mkdirSync(serverPath(session), { recursive: true });
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
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Copy an existing file to the static path and name it based on hashed filename
 *
 * If hashed file already exists, this does nothing
 */
export function hashAndCopyStaticFile(session: ISession, file: string) {
  const fileHash = `${computeHash(file)}${path.extname(file)}`;
  const destination = path.join(staticPath(session), fileHash);
  if (fs.existsSync(destination)) {
    session.log.debug(`Cached image found for: ${file}`);
  } else {
    try {
      fs.copyFileSync(file, destination);
      session.log.debug(`File successfully copied: ${file}`);
    } catch {
      session.log.error(`Error copying image: ${file}`);
    }
  }
  return fileHash;
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
