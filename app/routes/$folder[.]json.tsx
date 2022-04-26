import { LoaderFunction } from 'remix';
import { loader as pageLoader } from './$folder/$slug';

export const loader: LoaderFunction = async (data): Promise<Response | null> => {
  const { params, ...rest } = data;
  const modified = { ...params, loadIndexPage: 'true' };
  return pageLoader({ params: modified, ...rest });
};
