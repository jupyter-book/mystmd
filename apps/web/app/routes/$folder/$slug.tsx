import type { LinksFunction, LoaderFunction, MetaFunction } from '@remix-run/node';
import { getMetaTagsForArticle, KatexCSS, ArticlePage } from '@curvenote/site';
import { getPage } from '~/utils';
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
    image: data.frontmatter.thumbnailOptimized || data.frontmatter.thumbnail,
  });
};

export const links: LinksFunction = () => [KatexCSS];

export const loader: LoaderFunction = async ({ params, request }) => {
  const { folder, slug } = params;
  return getPage(request, { folder, slug });
};

export { ArticlePageCatchBoundary as CatchBoundary } from '@curvenote/site';
export default ArticlePage;
