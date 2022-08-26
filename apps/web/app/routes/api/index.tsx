import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import version from '../../version';

export const loader: LoaderFunction = async ({ request }) => {
  const { hostname, protocol, port } = new URL(request.url);
  const host = `${protocol}//${hostname}${port ? `:${port}` : ''}`;
  return json({
    version,
    links: {
      site: `${host}/api/site`,
    },
  });
};
