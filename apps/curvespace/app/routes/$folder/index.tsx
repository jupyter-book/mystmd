import type { LoaderFunction } from '@remix-run/node';
import Page, { loader as pageLoader, meta, links } from './$slug';

export const loader: LoaderFunction = async (data): Promise<Response | null> => {
  const { params, ...rest } = data;
  const modified = { ...params, loadIndexPage: 'true' };
  return pageLoader({ params: modified, ...rest });
};

export default Page;

export { meta, links };
