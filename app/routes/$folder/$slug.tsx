import type { LinksFunction, LoaderFunction } from '@remix-run/node';
import { MetaFunction, redirect } from '@remix-run/node';
import { useCatch, useLoaderData } from '@remix-run/react';
import type { GenericParent } from 'mystjs';
import { ReferencesProvider, ContentBlock, Frontmatter } from '~/components';
import {
  getData,
  getConfig,
  getMetaTagsForArticle,
  getProject,
  PageLoader,
  getFooterLinks,
  SiteManifest,
} from '~/utils';
import { Footer } from '~/components/FooterLinks';
import { Bibliography } from '~/myst-to-react/cite';
import { responseNoArticle, responseNoSite } from '~/utils/response.server';
import { ErrorDocumentNotFound } from '~/components/ErrorDocumentNotFound';

export const meta: MetaFunction = (args) => {
  const config = args.parentsData?.root?.config as SiteManifest | undefined;
  const data = args.data as PageLoader | undefined;
  if (!config || !data || !data.frontmatter) return {};
  return getMetaTagsForArticle({
    origin: '',
    url: args.location.pathname,
    title: `${data.frontmatter.title} - ${config?.title}`,
    description: data.frontmatter.description,
  });
};

export const links: LinksFunction = () => {
  return [
    {
      rel: 'stylesheet',
      href: 'https://cdn.jsdelivr.net/npm/katex@0.15.2/dist/katex.min.css',
      integrity:
        'sha384-MlJdn/WNKDGXveldHDdyRP1R4CTHr3FeuDNfhsLPYrq2t0UBkUdK2jyTnXPEK1NQ',
      crossOrigin: 'anonymous',
    },
  ];
};

export const loader: LoaderFunction = async ({
  params,
  request,
}): Promise<PageLoader | Response> => {
  const folderName = params.folder;
  const config = await getConfig(request);
  if (!config) throw responseNoSite(request.url);
  const folder = getProject(config, folderName);
  if (!folder) throw responseNoArticle();
  if (params.slug === folder.index) {
    return redirect(`/${folderName}`);
  }
  const slug = params.loadIndexPage ? folder.index : params.slug;
  const loader = await getData(config, folderName, slug).catch((e) => {
    console.error(e);
    return null;
  });
  if (!loader) throw responseNoArticle();
  const footer = getFooterLinks(config, folderName, slug);
  return { ...loader, footer };
};

export default function Page() {
  const article = useLoaderData<PageLoader>();
  const blocks = article.mdast.children as GenericParent[];
  return (
    <ReferencesProvider references={{ ...article.references, article: article.mdast }}>
      <div>
        <Frontmatter kind={article.kind} frontmatter={article.frontmatter} />
        {blocks.map((node, index) => {
          return <ContentBlock key={node.key} id={`${index}`} node={node} />;
        })}
        {article.references.cite.order.length > 0 && <Bibliography />}
        <Footer links={article.footer} />
      </div>
    </ReferencesProvider>
  );
}

export function CatchBoundary() {
  const { data, statusText } = useCatch();
  if (statusText === 'Site not found') throw responseNoSite(data);
  return <ErrorDocumentNotFound />;
}
