import config from '~/config.json';
import { PageLoader as Data, Config } from './types';

const CACHE: {
  isLoaded: boolean;
  data: Record<string, Record<string, Data>>;
} = {
  isLoaded: false,
  data: {},
};

export async function getConfig(): Promise<Config> {
  return config;
}

async function getAllData(): Promise<Record<string, Record<string, Data>>> {
  if (CACHE.isLoaded) return CACHE.data;
  // Load all content into memory 🤷‍♂️
  // START LOAD
  CACHE.data['demo'] = {};
  CACHE.data['demo']['index'] = await import('~/content/demo/index.json');
  CACHE.data['demo']['admonitions'] = await import('~/content/demo/admonitions.json');
  CACHE.data['demo']['interactive'] = await import('~/content/demo/interactive.json');
  // END LOAD
  CACHE.isLoaded = true;
  return CACHE.data;
}

export async function getData(
  config?: Config,
  folder?: string,
  slug?: string,
): Promise<Data | null> {
  if (!folder || !slug) return null;
  const allData = await getAllData();
  const data = allData[folder]?.[slug] ?? null;
  return data;
}
