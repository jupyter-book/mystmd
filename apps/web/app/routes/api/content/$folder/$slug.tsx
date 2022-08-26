import type { LoaderFunction } from '@remix-run/node';
import { getPage } from '~/utils';

export const loader: LoaderFunction = async ({ params, request }) => {
  const { folder, slug } = params;
  return getPage(request, { folder, slug });
};
