import { redirect, useCatch } from 'remix';
import type { LoaderFunction } from 'remix';
import { getFolder } from '../../utils/params';

export let loader: LoaderFunction = async ({ params }): Promise<Response | null> => {
  const folderName = params.folder;
  const folder = getFolder(folderName);
  if (!folder) {
    throw new Response('Article we not found', { status: 404 });
  }
  return redirect(`/${folderName}/${folder?.index}`);
};

export default function NotFound() {
  return (
    <div>
      <h1 className="title">Could not find that!</h1>
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  // TODO: This can give a pointer to other pages in the space
  return (
    <div>
      {caught.status} {caught.statusText}
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <>
      <h1>Test</h1>
      <div>Something went wrong.</div>
    </>
  );
}
