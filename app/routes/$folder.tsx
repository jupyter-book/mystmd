import { Outlet, useCatch } from '@remix-run/react';
import { LinksFunction } from '@remix-run/react/routeModules';
import { DocumentOutline } from '~/components';
import extraStyles from '~/styles/content.css';

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: extraStyles }];
};

export default function Folder() {
  return (
    <article>
      <main className="mt-[80px] prose prose-stone dark:prose-invert break-words mx-5 p-3 max-w-none sm:pl-10 md:mr-[250px] lg:pr-[330px] lg:mr-none lg:mx-auto xl:pr-[330px] xl:pl-[390px] xl:max-w-[1475px]">
        <Outlet />
      </main>
      <DocumentOutline />
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
