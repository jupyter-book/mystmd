import fs from 'fs';
import path from 'path';
import { PageLoader } from './types';

// This is executed in the API directory
const contentFolder = path.join(__dirname, '..', 'app', 'content');

export async function getData(
  folderName?: string,
  slug?: string,
): Promise<PageLoader | null> {
  if (!folderName || !slug) return null;
  // TODO: only import this on development
  const filename = path.join(contentFolder, folderName, `${slug}.json`);
  if (!fs.existsSync(filename)) return null;
  const contents = fs.readFileSync(filename).toString();
  return JSON.parse(contents);
}
