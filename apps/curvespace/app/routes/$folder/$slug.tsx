import type { LinksFunction, LoaderFunction } from '@remix-run/node';
import { MetaFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import {
  ContentBlocks,
  ErrorDocumentNotFound,
  FooterLinksBlock,
  FrontmatterBlock,
  getMetaTagsForArticle,
  KatexCSS,
} from '@curvenote/site';
import { getPage } from '~/utils';
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

export const links: LinksFunction = () => [KatexCSS];

export const loader: LoaderFunction = async ({ params, request }) => {
  const { folder, slug } = params;
  return getPage(request, { folder, slug });
};

export default function Page() {
  const article = useLoaderData<PageLoader>();
  return (
    <ReferencesProvider references={{ ...article.references, article: article.mdast }}>
      <FrontmatterBlock kind={article.kind} frontmatter={article.frontmatter} />
      <ContentBlocks mdast={article.mdast} />
      <Bibliography />
      <FooterLinksBlock links={article.footer} />
    </ReferencesProvider>
  );
}

export function CatchBoundary() {
  return <ErrorDocumentNotFound />;
}
