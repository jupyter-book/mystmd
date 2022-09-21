import { Link, NavLink, useTransition } from '@remix-run/react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { Menu, Transition } from '@headlessui/react';
import DotsVerticalIcon from '@heroicons/react/solid/DotsVerticalIcon';
import MenuIcon from '@heroicons/react/solid/MenuIcon';
import type { SiteManifest, SiteNavItem } from '@curvenote/site-common';
import { ThemeButton } from './ThemeButton';
import { useNavOpen, useSiteManifest } from '@curvenote/ui-providers';
import { CurvenoteLogo } from '@curvenote/icons';
import ChevronDownIcon from '@heroicons/react/solid/ChevronDownIcon';

export const DEFAULT_NAV_HEIGHT = 60;

function ExternalOrInternalLink({
  to,
  className,
  children,
  nav,
  prefetch = 'intent',
}: {
  to: string;
  className?: string | ((props: { isActive: boolean }) => string);
  children: React.ReactNode;
  nav?: boolean;
  prefetch?: 'intent' | 'render' | 'none';
}) {
  const staticClass = typeof className === 'function' ? className({ isActive: false }) : className;
  if (to.startsWith('http')) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={staticClass}>
        {children}
      </a>
    );
  }
  if (nav) {
    return (
      <NavLink prefetch={prefetch} to={to} className={className}>
        {children}
      </NavLink>
    );
  }
  return (
    <Link prefetch={prefetch} to={to} className={staticClass}>
      {children}
    </Link>
  );
}

function NavItem({ item }: { item: SiteNavItem }) {
  if (!('children' in item)) {
    return (
      <div className="relative grow-0 inline-block mx-2">
        <ExternalOrInternalLink
          nav
          to={item.url}
          className={({ isActive }) =>
            classNames(
              'inline-flex items-center justify-center w-full mx-2 py-1 text-md font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75',
              {
                'border-b border-stone-200': isActive,
              },
            )
          }
        >
          {item.title}
        </ExternalOrInternalLink>
      </div>
    );
  }
  return (
    <Menu as="div" className="relative grow-0 inline-block mx-2">
      <div className="inline-block">
        <Menu.Button className="inline-flex items-center justify-center w-full mx-2 py-1 text-md font-medium text-white rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
          <span>{item.title}</span>
          <ChevronDownIcon
            className="w-5 h-5 ml-2 -mr-1 text-violet-200 hover:text-violet-100"
            aria-hidden="true"
          />
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="origin-top-left absolute left-4 mt-2 w-48 rounded-sm shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
          {item.children?.map((action) => (
            <Menu.Item key={action.url}>
              {/* This is really ugly, BUT, the action needs to be defined HERE or the click away doesn't work for some reason */}
              {action.url?.startsWith('http') ? (
                <a
                  href={action.url || ''}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-black"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {action.title}
                </a>
              ) : (
                <NavLink
                  to={action.url || ''}
                  className={({ isActive }) =>
                    classNames(
                      'block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-black',
                      {
                        'text-black font-bold': isActive,
                      },
                    )
                  }
                >
                  {action.title}
                </NavLink>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

function NavItems({ nav }: { nav?: SiteManifest['nav'] }) {
  if (!nav) return null;
  return (
    <div className="text-md flex-grow hidden lg:block">
      {nav.map((item) => {
        return <NavItem key={'url' in item ? item.url : item.title} item={item} />;
      })}
    </div>
  );
}

function ActionMenu({ actions }: { actions?: SiteManifest['actions'] }) {
  if (!actions || actions.length === 0) return null;
  return (
    <Menu as="div" className="relative">
      <div>
        <Menu.Button className="bg-transparent flex text-sm rounded-full focus:outline-none">
          <span className="sr-only">Open Menu</span>
          <div className="flex items-center text-stone-200 hover:text-white">
            <DotsVerticalIcon className="h-8 w-8 p-1" />
          </div>
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-sm shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
          {actions?.map((action) => (
            <Menu.Item key={action.url}>
              {({ active }) => (
                <a
                  href={action.url}
                  className={classNames(
                    active ? 'bg-gray-100' : '',
                    'block px-4 py-2 text-sm text-gray-700',
                  )}
                >
                  {action.title}
                </a>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

/**
 * Show a loading progess bad if the load takes more than 150ms
 */
function useLoading() {
  const transitionState = useTransition().state;
  const ref = useMemo<{ start?: NodeJS.Timeout; finish?: NodeJS.Timeout }>(() => ({}), []);
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (transitionState === 'loading') {
      ref.start = setTimeout(() => {
        setShowLoading(true);
      }, 150);
    } else {
      if (ref.start) {
        // We have stoped loading in <150ms
        clearTimeout(ref.start);
        delete ref.start;
        setShowLoading(false);
        return;
      }
      ref.finish = setTimeout(() => {
        setShowLoading(false);
      }, 150);
    }
    return () => {
      if (ref.start) {
        clearTimeout(ref.start);
        delete ref.start;
      }
      if (ref.finish) {
        clearTimeout(ref.finish);
        delete ref.finish;
      }
    };
  }, [transitionState]);

  return { showLoading, isLoading: transitionState === 'loading' };
}

function HomeLink({ logo, logoText, name }: { logo?: string; logoText?: string; name?: string }) {
  const nothingSet = !logo && !logoText;
  return (
    <Link
      className="flex items-center text-white w-fit ml-3 md:ml-5 xl:ml-7"
      to="/"
      prefetch="intent"
    >
      {logo && <img src={logo} className="h-9 mr-3" alt={logoText || name} height="2.25rem"></img>}
      {nothingSet && <CurvenoteLogo className="mr-3" fill="#FFF" size={30} />}
      <span
        className={classNames('text-md sm:text-xl tracking-tight sm:mr-5', {
          'sr-only': !(logoText || nothingSet),
        })}
      >
        {logoText || 'Curvenote'}
      </span>
    </Link>
  );
}

export function TopNav() {
  const [open, setOpen] = useNavOpen();
  const config = useSiteManifest();
  const { logo, logo_text, logoText, actions, title, nav } = config ?? {};
  const { isLoading, showLoading } = useLoading();
  return (
    <div className="bg-stone-700 p-3 md:px-8 fixed w-screen top-0 z-30 h-[60px]">
      <nav className="flex items-center justify-between flex-wrap max-w-[1440px] mx-auto">
        <div className="flex flex-row xl:min-w-[19.5rem] mr-2 sm:mr-7 justify-start items-center">
          <div className="block xl:hidden">
            <button
              className="flex items-center text-stone-200 border-stone-400 hover:text-white"
              onClick={() => {
                setOpen(!open);
              }}
            >
              <span className="sr-only">Open Menu</span>
              <MenuIcon className="fill-current h-8 w-8 p-1" />
            </button>
          </div>
          <HomeLink name={title} logo={logo} logoText={logo_text || logoText} />
        </div>
        <div className="flex-grow flex items-center w-auto">
          <NavItems nav={nav} />
          <div className="block flex-grow"></div>
          <ThemeButton />
          <div className="block sm:hidden">
            <ActionMenu actions={actions} />
          </div>
          <div className="hidden sm:block">
            {actions?.map((action, index) => (
              <ExternalOrInternalLink
                key={action.url || index}
                className="inline-block text-md px-4 py-2 mx-1 leading-none border rounded text-white border-white hover:border-transparent hover:text-stone-500 hover:bg-white mt-0"
                to={action.url}
              >
                {action.title}
              </ExternalOrInternalLink>
            ))}
          </div>
        </div>
      </nav>
      {showLoading && (
        <div
          className={classNames(
            'w-screen h-[2px] bg-blue-500 absolute left-0 bottom-0 transition-transform',
            {
              'animate-load scale-x-40': isLoading,
              'scale-x-100': !isLoading,
            },
          )}
        />
      )}
    </div>
  );
}
