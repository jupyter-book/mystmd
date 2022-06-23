import { DocumentOutline } from '~/components';
import { LinksFunction } from '@remix-run/node';
import { Outlet } from '@remix-run/react';
import { ErrorProjectNotFound } from '~/components/ErrorProjectNotFound';
import extraStyles from '~/styles/content.css';
import LaunchpadMessage from '~/components/LaunchpadMessage';

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: extraStyles }];
};

export default function Folder() {
  return (
    <article suppressHydrationWarning>
      <main className="article-content">
        <Outlet />
      </main>
      <DocumentOutline />
      <LaunchpadMessage />
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
