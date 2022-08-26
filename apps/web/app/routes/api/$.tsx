import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';

export const loader: LoaderFunction = async () => {
  return json(
    {
      status: 404,
      message: 'No API route found at this URL',
    },
    { status: 404 },
  );
};
