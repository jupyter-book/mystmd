import type { LoaderFunction } from '@remix-run/node';
import { getPage } from '~/utils';

export const loader: LoaderFunction = async ({ request, params }) => {
  return getPage(request, { folder: params.folder, loadIndexPage: true });
};
