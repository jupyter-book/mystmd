import { ThemeButton } from './ThemeButton';
import config from '~/config.json';
import { getFolder } from '../utils/params';
import { Link } from 'remix';

export function TopNav() {
  const { logo, logoText, sections, actions } = config.site;
  return (
    <nav className="flex items-center justify-between flex-wrap bg-stone-700 p-3 px-8 fixed w-screen top-0 z-20">
      <Link
        className="flex items-center flex-shrink-0 text-white mr-6"
        to="/"
        prefetch="intent"
      >
        <img src={logo} className="h-8 mr-3"></img>
        {logoText && <span className="text-xl tracking-tight">{logoText}</span>}
      </Link>
      <div className="block md:hidden">
        <button className="flex items-center px-3 py-2 border rounded text-stone-200 border-stone-400 hover:text-white hover:border-white">
          <svg
            className="fill-current h-3 w-3"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Menu</title>
            <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
          </svg>
        </button>
      </div>
      <div className="hidden flex-grow md:flex items-center w-auto">
        <div className="text-sm flex-grow">
          {sections.map((sec) => {
            const folder = getFolder(sec.folder);
            if (!folder)
              return <div key={sec.folder}>Didn't find folder: {sec.folder}</div>;
            return (
              <Link
                key={sec.folder}
                prefetch="intent"
                to={`/${sec.folder}/${folder?.index}`}
                className="inline-block mt-0 text-stone-200 hover:text-white mr-4"
              >
                {sec.title}
              </Link>
            );
          })}
        </div>
        <ThemeButton />
        <div>
          {actions.map((action) => (
            <a
              key={action.url}
              className="inline-block text-sm px-4 py-2 mx-1 leading-none border rounded text-white border-white hover:border-transparent hover:text-stone-500 hover:bg-white mt-4 lg:mt-0"
              href={action.url}
              target={action.url?.startsWith('http') ? '_blank' : undefined}
            >
              {action.title}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
