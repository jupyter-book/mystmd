import fs from 'fs';
import path from 'path';
import type { ISession } from '../session/types';
import { isDirectory } from './isDirectory';
import { shouldIgnoreFile } from './shouldIgnoreFile';

export function getAllBibTexFilesOnPath(session: ISession, dir: string) {
  let bibFiles: string[] = [];
  const content = fs.readdirSync(dir);
  content
    .map((file) => path.join(dir, file))
    .filter((file) => {
      const isDir = isDirectory(file);
      if (!isDir && path.extname(file) === '.bib') {
        // Push the bibtex file to a list!
        bibFiles.push(file);
      }
      // If it is in a list or is hidden
      if (shouldIgnoreFile(session, path.basename(file))) {
        return false;
      }
      return isDir;
    })
    .forEach((subdir) => {
      // Now recurse into each directory
      bibFiles = bibFiles.concat(getAllBibTexFilesOnPath(session, subdir));
    });
  return bibFiles;
}
