import { LinksFunction, Outlet, useCatch } from 'remix';
import { TableOfContents } from '~/components';
import extraStyles from '~/styles/content.css';

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: extraStyles }];
};

export default function Folder() {
  return (
    <article>
      <main className="mt-[80px] prose prose-stone dark:prose-invert mx-auto p-3 break-words">
        <Outlet />
      </main>
      <TableOfContents />
    </article>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  return (
    <>
      <div>
        {caught.status} {caught.statusText}
      </div>
    </>
  );
}
