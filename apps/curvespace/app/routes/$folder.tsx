import { Outlet } from '@remix-run/react';
import LaunchpadMessage from '~/components/LaunchpadMessage';
import {
  DocumentOutline,
  ErrorProjectNotFound,
  useNavigationHeight,
} from '@curvenote/site';

export default function Folder() {
  const { ref, height, top } = useNavigationHeight(60);
  return (
    <>
      <main ref={ref} className="article-content">
        <Outlet />
        <DocumentOutline top={top} height={height} />
      </main>
      {typeof document === 'undefined' ? null : <LaunchpadMessage />}
    </>
  );
}

export function CatchBoundary() {
  return (
    <div className="mt-16">
      <main className="error-content">
        <ErrorProjectNotFound />
      </main>
    </div>
  );
}
