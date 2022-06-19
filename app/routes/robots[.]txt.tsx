import { LoaderFunction } from '@remix-run/node';

function createRobotsTxt(domain: string) {
  return `# https://www.robotstxt.org/robotstxt.html

User-agent: *
Allow: /

Sitemap: ${domain}/sitemap.xml
`;
}

export const loader: LoaderFunction = async ({ request }): Promise<Response | null> => {
  const url = new URL(request.url);
  const domain = `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}`;
  return new Response(createRobotsTxt(domain), {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
};
