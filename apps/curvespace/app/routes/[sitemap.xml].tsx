import { createSitemapResponse, getSiteSlugs } from '@curvenote/site';
import { getDomainFromRequest } from '@curvenote/site-common';
import { LoaderFunction } from '@remix-run/node';
import { getConfig } from '../utils';

export const loader: LoaderFunction = async ({ request }): Promise<Response> => {
  const config = await getConfig(request);
  return createSitemapResponse(getDomainFromRequest(request), getSiteSlugs(config));
};
