import type { LoaderFunction } from 'remix';
import { getFolder } from '../../utils/params';
import Page, { loader as pageLoader, CatchBoundary, ErrorBoundary } from './$id';

export const loader: LoaderFunction = async (data): Promise<Response | null> => {
  const { params, ...rest } = data;
  const folderName = params.folder;
  const folder = getFolder(folderName);
  if (!folder) {
    throw new Response('Article was not found', { status: 404 });
  }
  const modified = { ...params, id: folder?.index };
  return pageLoader({ params: modified, ...rest });
};

export default Page;

export { CatchBoundary, ErrorBoundary };
