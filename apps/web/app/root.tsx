import type { LinksFunction, MetaFunction } from '@remix-run/node';
import { LoaderFunction } from '@remix-run/node';
import tailwind from '~/styles/app.css';
import { getConfig } from '~/utils';
import type { DocumentLoader } from '@curvenote/site-common';
import { App, responseNoSite, getMetaTagsForSite, getThemeSession } from '@curvenote/site';
export {
  AppCatchBoundary as CatchBoundary,
  AppDebugErrorBoundary as ErrorBoundary,
} from '@curvenote/site';

export const meta: MetaFunction = ({ data }) => {
  return getMetaTagsForSite({
    title: data?.config?.title,
    twitter: data?.config?.twitter,
  });
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: tailwind }];
};

export const loader: LoaderFunction = async ({ request }): Promise<DocumentLoader> => {
  const [config, themeSession] = await Promise.all([getConfig(), getThemeSession(request)]);
  if (!config) throw responseNoSite();
  const data = { theme: themeSession.getTheme(), config };
  return data;
};

export default App;
