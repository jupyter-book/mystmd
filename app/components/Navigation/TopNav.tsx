import { Link, NavLink } from 'remix';
import { Fragment } from 'react';
import classNames from 'classnames';
import { Menu, Transition } from '@headlessui/react';
import DotsVerticalIcon from '@heroicons/react/solid/DotsVerticalIcon';
import MenuIcon from '@heroicons/react/solid/MenuIcon';
import { Config, getFolder } from '~/utils';
import { ThemeButton } from '../ThemeButton';
import { useConfig } from '../ConfigProvider';
import { useNavOpen } from '../UiStateProvider';

function ActionMenu({ actions }: { actions?: Config['site']['actions'] }) {
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

export function TopNav() {
  const [open, setOpen] = useNavOpen();
  const config = useConfig();
  const { logo, logoText, sections, actions, name } = config?.site ?? {};
  return (
    <div className="bg-stone-700 p-3 md:px-8 fixed w-screen top-0 z-30">
      <nav className="flex items-center justify-between flex-wrap max-w-[1440px] mx-auto">
        <div className="flex flex-row xl:min-w-[19.5rem] mr-7 justify-start items-center">
          <div className="block xl:hidden">
            <button
              className="flex items-center text-stone-200 border-stone-400 hover:text-white"
              onClick={() => {
                setOpen(!open);
              }}
            >
              <MenuIcon className="fill-current h-8 w-8 p-1" />
            </button>
          </div>
          <Link
            className="flex items-center text-white w-fit ml-3 md:ml-5 xl:ml-7"
            to="/"
            prefetch="intent"
          >
            <img
              src={logo}
              className="h-9 mr-3"
              alt={logoText || name}
              height="2.25rem"
            ></img>
            {logoText && (
              <span className="text-xl tracking-tight mr-5">{logoText}</span>
            )}
          </Link>
        </div>
        <div className="flex-grow flex items-center w-auto">
          <div className="text-md flex-grow hidden md:block">
            {sections?.map((sec) => {
              const folder = getFolder(config, sec.folder);
              if (!folder)
                return <div key={sec.folder}>Didn't find folder: {sec.folder}</div>;
              return (
                <NavLink
                  key={sec.folder}
                  prefetch="intent"
                  to={`/${sec.folder}`}
                  className={({ isActive }) =>
                    classNames(
                      'inline-block mt-0 text-stone-200 hover:text-white mr-4 py-1',
                      {
                        'border-b border-stone-200': isActive,
                      },
                    )
                  }
                >
                  {sec.title}
                </NavLink>
              );
            })}
          </div>
          <div className="block flex-grow"></div>
          <ThemeButton />
          <div className="block sm:hidden">
            <ActionMenu actions={actions} />
          </div>
          <div className="hidden sm:block">
            {actions?.map((action, index) => (
              <a
                key={action.url || index}
                className="inline-block text-md px-4 py-2 mx-1 leading-none border rounded text-white border-white hover:border-transparent hover:text-stone-500 hover:bg-white mt-0"
                href={action.url}
                target={action.url?.startsWith('http') ? '_blank' : undefined}
              >
                {action.title}
              </a>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
