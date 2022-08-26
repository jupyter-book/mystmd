import { responseNoArticle, responseNoSite } from '@curvenote/site';
import type { LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { Outlet } from '@remix-run/react';
import { getConfig } from '~/utils';

export const loader: LoaderFunction = async (): Promise<Response | null> => {
  const config = getConfig();
  if (!config) throw responseNoSite();
  const project = config?.projects[0];
  if (!project) throw responseNoArticle();
  return redirect(`/${project.slug}`);
};

// Note this is necessary to propagate catch boundaries, even though there is a redirect
export default function Index() {
  return <Outlet />;
}
