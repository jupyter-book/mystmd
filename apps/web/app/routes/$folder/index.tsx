import type { LoaderFunction } from '@remix-run/node';
import { getPage } from '~/utils';
import Page from './$slug';

export const loader: LoaderFunction = async ({ request, params }) => {
  return getPage(request, { folder: params.folder, loadIndexPage: true });
};

export { meta, links } from './$slug';
export default Page;
