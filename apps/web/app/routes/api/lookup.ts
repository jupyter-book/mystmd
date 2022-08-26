import type { LoaderFunction } from '@remix-run/node';
import { fetch, json } from '@remix-run/node';

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url).searchParams.get('url');
  if (!url) {
    return json({ status: 400, message: 'Must include a valid url in query' }, { status: 400 });
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const valid = new URL(url);
  } catch (error) {
    return json({ status: 400, message: `URL provided "${url}" is not valid.` }, { status: 400 });
  }
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    // TODO: further validation
    return json(data, { status: 200 });
  } catch (error) {
    return json(
      { status: 400, message: `Problem fetching content for ${url}: ${(error as Error).message}` },
      { status: 400 },
    );
  }
};
