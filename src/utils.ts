import { JsonObject, VersionId } from '@curvenote/blocks';
import fs from 'fs';
import path from 'path';
import { Logger } from './logging';

export function resolvePath(optionalPath: string | undefined, filename: string) {
  if (optionalPath) return path.join(optionalPath, filename);
  if (path.isAbsolute(filename)) return filename;
  return path.join('.', filename);
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
