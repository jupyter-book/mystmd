import {
  Links,
  LiveReload,
  LoaderFunction,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useCatch,
  useLoaderData,
} from 'remix';
import type { MetaFunction, LinksFunction } from 'remix';
import React from 'react';
import { Theme, ThemeProvider, TopNav } from '~/components';
import { getThemeSession } from '~/utils/theme.server';
import tailwind from './styles/app.css';
import { getMetaTagsForSite, getConfig, Config } from './utils';
import { ConfigProvider } from './components/ConfigProvider';

export const meta: MetaFunction = ({ data }) => {
  return getMetaTagsForSite({
    title: data.config?.site?.name,
    twitter: data.config?.site?.twitter,
  });
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: tailwind }];
};

type DocumentData = {
  theme: Theme;
  config: Config;
};

export const loader: LoaderFunction = async ({ request }): Promise<DocumentData> => {
  const [config, themeSession] = await Promise.all([
    getConfig(request),
    getThemeSession(request),
  ]);
  const data = { theme: themeSession.getTheme(), config };
  return data;
};

function Document({
  children,
  theme,
  config,
  title,
}: {
  children: React.ReactNode;
  theme: Theme;
  config?: Config;
  title?: string;
}) {
  return (
    <html lang="en" className={theme}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {title && <title>{title}</title>}
        <Meta />
        <Links />
      </head>
      <body className="m-0 transition-colors duration-500 bg-white dark:bg-stone-900">
        <ThemeProvider theme={theme}>
          <ConfigProvider config={config}>
            <TopNav />
            {children}
          </ConfigProvider>
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === 'development' && <LiveReload />}
      </body>
    </html>
  );
}

export default function App() {
  const { theme, config } = useLoaderData<DocumentData>();
  return (
    <Document theme={theme} config={config}>
      <Outlet />
    </Document>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  return (
    <Document theme={Theme.light} title="Page Not Found">
      <article>
        <h1>
          {caught.status} {caught.statusText}
        </h1>
      </article>
    </Document>
  );
}

export function ErrorBoundary() {
  return (
    <Document theme={Theme.light} title="Page Not Found">
      <h1></h1>
    </Document>
  );
}
