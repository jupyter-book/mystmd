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
import config from '~/config.json';
import React from 'react';
import { Theme, ThemeProvider, TopNav } from '~/components';
import { getThemeSession } from '~/utils/theme.server';
import tailwind from './styles/app.css';
import { getMetaTagsForSite } from './utils';

export const meta: MetaFunction = () => {
  return getMetaTagsForSite({ title: config.site.name, twitter: config.site.twitter });
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: tailwind }];
};

type DocumentData = {
  theme: Theme;
};

export const loader: LoaderFunction = async ({ request }): Promise<DocumentData> => {
  const themeSession = await getThemeSession(request);
  const data = { theme: themeSession.getTheme() };
  return data;
};

function Document({
  children,
  theme,
  title,
}: {
  children: React.ReactNode;
  theme: Theme;
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
          <TopNav />
          {children}
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === 'development' && <LiveReload />}
      </body>
    </html>
  );
}

export default function App() {
  const { theme } = useLoaderData<DocumentData>();
  return (
    <Document theme={theme}>
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
