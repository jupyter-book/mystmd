import type { LoaderFunction } from 'remix';
import Page, { loader as pageLoader, links, CatchBoundary, ErrorBoundary } from './$id';

export const loader: LoaderFunction = async (data): Promise<Response | null> => {
  const { params, ...rest } = data;
  const modified = { ...params, loadIndexPage: 'true' };
  return pageLoader({ params: modified, ...rest });
};

export default Page;

export { links, CatchBoundary, ErrorBoundary };
