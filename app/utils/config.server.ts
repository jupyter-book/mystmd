import { URL } from 'url';
import config from '~/config.json';
import { Config } from './types';

export async function getConfig(request: Request): Promise<Config> {
  const url = new URL(request.url);
  console.log(url.hostname);
  return config;
}
