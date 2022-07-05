import type { LinksFunction, LoaderFunction } from '@remix-run/node';
import { MetaFunction, redirect } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import {
  ContentBlocks,
  ErrorDocumentNotFound,
  FooterLinksBlock,
  FrontmatterBlock,
  getFooterLinks,
  getMetaTagsForArticle,
  getProject,
  responseNoArticle,
  responseNoSite,
} from '@curvenote/site';
import { getData, getConfig } from '~/utils';
import { Bibliography } from 'myst-util-to-react';
import { ReferencesProvider } from '@curvenote/ui-providers';
import type { PageLoader, SiteManifest } from '@curvenote/site-common';

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
      integrity: 'sha384-MlJdn/WNKDGXveldHDdyRP1R4CTHr3FeuDNfhsLPYrq2t0UBkUdK2jyTnXPEK1NQ',
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
  return (
    <ReferencesProvider references={{ ...article.references, article: article.mdast }}>
      <div>
        <FrontmatterBlock kind={article.kind} frontmatter={article.frontmatter} />
        <ContentBlocks mdast={article.mdast} />
        {article.references.cite.order.length > 0 && <Bibliography />}
        <FooterLinksBlock links={article.footer} />
      </div>
    </ReferencesProvider>
  );
}

export function CatchBoundary() {
  return <ErrorDocumentNotFound />;
}
