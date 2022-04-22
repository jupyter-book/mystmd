import React from 'react';
import classNames from 'classnames';
import { NavLink, useParams, useLocation } from 'remix';
import { getFolderPages, Heading, Config } from '~/utils';
import { useConfig } from '../ConfigProvider';
import { CreatedInCurvenote } from '../curvenote';
import { useNavOpen } from '../UiStateProvider';

type Props = {
  folder?: string;
  headings: Heading[];
  sections?: Config['site']['sections'];
};

const HeadingLink = ({
  path,
  isIndex,
  title,
  children,
}: {
  path: string;
  isIndex?: boolean;
  title?: string;
  children: React.ReactNode;
}) => {
  const { pathname } = useLocation();
  const exact = pathname === path;
  const [, setOpen] = useNavOpen();
  return (
    <NavLink
      prefetch="intent"
      title={title}
      className={({ isActive }) =>
        classNames('block break-words', {
          'text-blue-500': !isIndex && isActive,
          'font-semibold': isActive,
          'hover:text-slate-800 dark:hover:text-slate-100': !isActive,
          'border-b pb-1': isIndex,
          'border-stone-200 dark:border-stone-700': isIndex && !exact,
          'border-blue-500': isIndex && exact,
        })
      }
      to={path}
      suppressHydrationWarning // The pathname is not defined on the server always.
      onClick={() => {
        // Close the nav panel if it is open
        setOpen(false);
      }}
    >
      {children}
    </NavLink>
  );
};

const HEADING_CLASSES = 'text-slate-900 text-lg leading-6 dark:text-slate-100';
const Headings = ({ folder, headings, sections }: Props) => {
  const secs = sections ?? [{ folder, title: 'Unknown' }];
  return (
    <ul className="text-slate-500 dark:text-slate-300 leading-6">
      {secs.map((sec) => {
        if (sec.folder === folder) {
          return headings.map((heading, index) => (
            <li
              key={heading.slug || index}
              className={classNames('p-1', {
                [HEADING_CLASSES]: heading.level === 'index',
                'font-semibold': heading.level === 'index',
                'pl-4': heading.level === 2,
                'pl-6': heading.level === 3,
                'pl-8': heading.level === 4,
                'pl-10': heading.level === 5,
                'pl-12': heading.level === 6,
              })}
            >
              {heading.path ? (
                <HeadingLink
                  title={heading.title}
                  path={heading.path}
                  isIndex={heading.level === 'index'}
                >
                  {heading.title}
                </HeadingLink>
              ) : (
                <h5 className="text-slate-900 font-semibold my-2 text-md leading-6 dark:text-slate-100 break-words">
                  {heading.title}
                </h5>
              )}
            </li>
          ));
        }
        return (
          <li
            key={sec.folder}
            className={classNames('p-1 my-2 lg:hidden', HEADING_CLASSES)}
          >
            <HeadingLink path={`/${sec.folder}`}>{sec.title}</HeadingLink>
          </li>
        );
      })}
    </ul>
  );
};

export const LeftNav = () => {
  const [open] = useNavOpen();
  const config = useConfig();
  const { folder: folderName } = useParams();
  const headings = getFolderPages(config, folderName);
  if (!headings) return null;
  return (
    <div
      className={classNames(
        'flex-col fixed z-30 top-[60px] bottom-0 left-[max(0px,calc(50%-45rem))] w-[19.5rem] border-r border-stone-200 dark:border-stone-700',
        {
          flex: open,
          'bg-white dark:bg-stone-900': open, // just apply when open, so that theme can transition
          'hidden xl:flex': !open,
        },
      )}
    >
      <nav
        aria-label="Navigation"
        className="flex-grow pt-10 pb-3 px-8 overflow-y-auto"
      >
        <Headings
          folder={folderName}
          headings={headings}
          sections={config?.site.sections}
        />
      </nav>
      <div className="flex-none py-4">
        <CreatedInCurvenote />
      </div>
    </div>
  );
};
