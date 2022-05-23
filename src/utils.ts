import { JsonObject, VersionId } from '@curvenote/blocks';
import fs from 'fs';
import inquirer from 'inquirer';
import path from 'path';
import { Logger } from './logging';

export function resolvePath(optionalPath: string | undefined, filename: string) {
  if (optionalPath) return path.join(optionalPath, filename);
  if (path.isAbsolute(filename)) return filename;
  return path.join('.', filename);
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
