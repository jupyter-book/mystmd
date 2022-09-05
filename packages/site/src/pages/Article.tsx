import type { PageLoader } from '@curvenote/site-common';
import { ReferencesProvider } from '@curvenote/ui-providers';
import { useLoaderData } from '@remix-run/react';
import { Bibliography } from 'myst-to-react';
import { ContentBlocks, FooterLinksBlock, FrontmatterBlock } from '../components';
import { ErrorDocumentNotFound } from './ErrorDocumentNotFound';

export function ArticlePage() {
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

export function ArticlePageCatchBoundary() {
  return <ErrorDocumentNotFound />;
}
