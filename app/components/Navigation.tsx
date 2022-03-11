import classNames from 'classnames';
import React from 'react';
import { NavLink, useParams } from 'remix';
import { CreatedInCurvenote } from './curvenote';
import config from '~/config.json';

type Heading = {
  slug?: string;
  title: string;
  level: number | 'index';
};
type Props = {
  headings: Heading[];
};

const HeadingLink = ({
  slug,
  isIndex,
  children,
}: {
  slug: string;
  isIndex?: boolean;
  children: React.ReactNode;
}) => {
  return (
    <NavLink
      prefetch="intent"
      className={({ isActive }) =>
        classNames('block', {
          'text-blue-500': !isIndex && isActive,
          'font-semibold': isActive,
          'hover:text-slate-800 dark:hover:text-slate-100': !isActive,
          'border-b pb-1': isIndex,
          'border-stone-200 dark:border-stone-700': isIndex && !isActive,
          'border-blue-500': isIndex && isActive,
        })
      }
      to={slug}
      suppressHydrationWarning
    >
      {children}
    </NavLink>
  );
};

const Headings = ({ headings }: Props) => (
  <ul className="text-slate-500 dark:text-slate-300 leading-6">
    {headings.map((heading, index) => (
      <li
        key={heading.slug || index}
        className={classNames('p-1', {
          'text-slate-900 font-semibold mb-4 text-lg leading-6 dark:text-slate-100':
            heading.level === 'index',
          'pl-4': heading.level === 2,
          'pl-6': heading.level === 3,
          'pl-8': heading.level === 4,
          'pl-10': heading.level === 5,
          'pl-12': heading.level === 6,
        })}
      >
        {heading.slug ? (
          <HeadingLink slug={heading.slug} isIndex={heading.level === 'index'}>
            {heading.title}
          </HeadingLink>
        ) : (
          <h5 className="text-slate-900 font-semibold mb-4 text-md leading-6 dark:text-slate-100">
            {heading.title}
          </h5>
        )}
      </li>
    ))}
  </ul>
);

export const Navigation = () => {
  const { folder: folderName } = useParams();
  const folder = config.folders[folderName as keyof typeof config.folders];
  if (!folder) return null;
  const headings: Heading[] = [
    { title: folder.title, slug: folder.index, level: 'index' },
    ...folder.pages,
  ];
  return (
    <div className="hidden xl:flex flex-col fixed z-20 top-[58px] bottom-0 left-[max(0px,calc(50%-43rem))] w-[19.5rem] border-r border-stone-200 dark:border-stone-700">
      <nav
        aria-label="Navigation"
        className="flex-grow pt-10 pb-3 px-8 overflow-y-auto"
      >
        <Headings headings={headings} />
      </nav>
      <div className="flex-none py-4">
        <CreatedInCurvenote />
      </div>
    </div>
  );
};
