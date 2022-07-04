import { Outlet } from '@remix-run/react';
import LaunchpadMessage from '~/components/LaunchpadMessage';
import { DocumentOutline, ErrorProjectNotFound } from '@curvenote/site';

export default function Folder() {
  return (
    <article className="content">
      <main className="article-content">
        <Outlet />
        <DocumentOutline />
      </main>
      {typeof document === 'undefined' ? null : <LaunchpadMessage />}
    </article>
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
