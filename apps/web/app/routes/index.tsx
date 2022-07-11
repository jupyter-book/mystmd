import { responseNoArticle, responseNoSite } from '@curvenote/site';
import { LoaderFunction, redirect } from '@remix-run/node';
import { Outlet } from '@remix-run/react';
import { getConfig } from '~/utils';

export const loader: LoaderFunction = async ({ request }): Promise<Response | null> => {
  const config = getConfig();
  if (!config) throw responseNoSite(request.url);
  const project = config?.projects[0];
  if (!project) throw responseNoArticle();
  return redirect(`/${project.slug}`);
};

// Note this is necessary to propagate catch boundaries, even though there is a redirect
export default function Index() {
  return <Outlet />;
}
