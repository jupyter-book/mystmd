import fs from 'fs';
import path from 'path';
import config from '~/config.json';
import type { PageLoader as Data, SiteManifest } from '@curvenote/site-common';

// This is executed in the API directory
const contentFolder = path.join(__dirname, '..', 'app', 'content');

export async function getConfig(): Promise<SiteManifest | undefined> {
  return config as unknown as SiteManifest;
}

export async function getData(
  config?: SiteManifest,
  folder?: string,
  slug?: string,
): Promise<Data | null> {
  if (!folder || !slug) return null;
  const filename = path.join(contentFolder, folder, `${slug}.json`);
  if (!fs.existsSync(filename)) return null;
  const contents = fs.readFileSync(filename).toString();
  return JSON.parse(contents);
}
