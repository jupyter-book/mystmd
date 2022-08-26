import { createSitemapResponse, getSiteSlugs } from '@curvenote/site';
import { getDomainFromRequest } from '@curvenote/site-common';
import type { LoaderFunction } from '@remix-run/node';
import { getConfig } from '../utils';

export const loader: LoaderFunction = async ({ request }): Promise<Response> => {
  const config = getConfig();
  return createSitemapResponse(getDomainFromRequest(request), getSiteSlugs(config));
};
