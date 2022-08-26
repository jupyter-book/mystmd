import { createRobotsTxtResponse } from '@curvenote/site';
import { getDomainFromRequest } from '@curvenote/site-common';
import type { LoaderFunction } from '@remix-run/node';

export const loader: LoaderFunction = async ({ request }): Promise<Response | null> => {
  return createRobotsTxtResponse(getDomainFromRequest(request));
};
