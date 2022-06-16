import { LoaderFunction } from '@remix-run/node';
import { responseNoSite } from '~/utils/response.server';
import { getConfig, ManifestProjectPage } from '../utils';
import { createSitemap } from '../utils/sitemap';

export const loader: LoaderFunction = async ({ request }): Promise<Response> => {
  const config = await getConfig(request);
  if (!config) throw responseNoSite(`No site found for ${request.url}`);
  const slugs = config.projects
    .map((project) => {
      const pages = project.pages
        .filter((page): page is ManifestProjectPage => 'slug' in page)
        .map((page) => `/${project.slug}/${page.slug}`);
      return [`/${project.slug}`, ...pages];
    })
    .flat();
  const url = new URL(request.url);
  const domain = `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}`;
  return new Response(createSitemap(domain, slugs), {
    status: 200,
    headers: { 'Content-Type': 'application/xml' },
  });
};
