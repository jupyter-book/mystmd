import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import type { ISession } from './types.js';

export function computeHash(content: string) {
  return createHash('md5').update(content).digest('hex');
}

export function isDirectory(file: string): boolean {
  return fs.lstatSync(file).isDirectory();
}

/** Writes a file ensuring that the directory exists */
export function writeFileToFolder(
  filename: string,
  data: string | NodeJS.ArrayBufferView,
  opts?: fs.WriteFileOptions,
) {
  if (!fs.existsSync(filename)) fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, data, opts);
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
  const hash = computeHash(`${file}${mtime.toString()}${size.toString()}`);
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

/**
 * Copy "file" maintaining original relative path to "from" directory with final "to" directory
 *
 * If "file" is not inside "from" folder, the file is not copied.
 */
export function copyFileMaintainPath(session: ISession, file: string, from: string, to: string) {
  // File must be inside "from" folder
  if (!path.resolve(file).startsWith(path.resolve(from))) {
    session.log.error(`Cannot include files outside of 'from' directory: ${file}\n\n`);
    return undefined;
  }
  const destination = path.resolve(to, path.relative(from, file));
  const destinationFolder = path.dirname(destination);
  try {
    if (!fs.existsSync(destinationFolder)) fs.mkdirSync(destinationFolder, { recursive: true });
    fs.copyFileSync(file, destination);
    session.log.debug(`File successfully copied: ${file}`);
    return destination;
  } catch {
    session.log.error(`Error copying file: ${file}`);
    return undefined;
  }
}

/**
 * Copy "file" to "to" directory.
 *
 * If a file already exists with the basename of "file" inside "to" directory, it is not copied.
 */
export function copyFileToFolder(session: ISession, file: string, to: string) {
  const destination = path.join(to, path.basename(file));
  if (fs.existsSync(destination)) {
    session.log.error(`File already exists with name: ${path.basename(file)}`);
  }
  const destinationFolder = path.dirname(destination);
  try {
    if (!fs.existsSync(destinationFolder)) fs.mkdirSync(destinationFolder, { recursive: true });
    fs.copyFileSync(file, destination);
    session.log.debug(`File successfully copied: ${file}`);
    return destination;
  } catch {
    session.log.error(`Error copying file: ${file}`);
    return undefined;
  }
}
