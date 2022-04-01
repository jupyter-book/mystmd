import fs from 'fs';
import path from 'path';
import config from '~/config.json';
import { PageLoader as Data, Config } from './types';

// This is executed in the API directory
const contentFolder = path.join(__dirname, '..', 'app', 'content');

export async function getConfig(request: Request): Promise<Config> {
  return config;
}

export async function getData(
  config?: Config,
  folder?: string,
  slug?: string,
): Promise<Data | null> {
  if (!folder || !slug) return null;
  const filename = path.join(contentFolder, folder, `${slug}.json`);
  if (!fs.existsSync(filename)) return null;
  const contents = fs.readFileSync(filename).toString();
  return JSON.parse(contents);
}
