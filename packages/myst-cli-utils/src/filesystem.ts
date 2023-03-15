import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import type { ISession } from './types';

export function computeHash(content: string) {
  return createHash('md5').update(content).digest('hex');
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
