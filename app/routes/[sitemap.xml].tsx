import { createSitemapResponse, getSiteSlugs, responseNoSite } from '@curvenote/site';
import { getDomainFromRequest, ManifestProjectPage } from '@curvenote/site-common';
import { LoaderFunction } from '@remix-run/node';
import { getConfig } from '../utils';

export const loader: LoaderFunction = async ({ request }): Promise<Response> => {
  const config = await getConfig(request);
  if (!config) throw responseNoSite(`No site found for ${request.url}`);
  return createSitemapResponse(getDomainFromRequest(request), getSiteSlugs(config));
};
