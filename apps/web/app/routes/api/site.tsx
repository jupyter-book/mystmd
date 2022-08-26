import type { LoaderFunction } from '@remix-run/node';
import { getConfig } from '~/utils';

export const loader: LoaderFunction = async () => {
  const config = getConfig();
  return config;
};
